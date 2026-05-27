const SESSION_DAYS = 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message || "Unexpected server error" }, error.status || 500);
    }
  },
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  if (url.pathname === "/api/health") {
    return json({ ok: true });
  }

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    return signup(request, env);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    return login(request, env);
  }

  if (url.pathname === "/api/sync" && request.method === "GET") {
    const user = await requireUser(request, env);
    const row = await env.DB.prepare("SELECT data_json, updated_at FROM user_data WHERE user_id = ?").bind(user.id).first();
    return json({ data: row?.data_json ? JSON.parse(row.data_json) : null, updatedAt: row?.updated_at || null });
  }

  if (url.pathname === "/api/sync" && request.method === "PUT") {
    const user = await requireUser(request, env);
    const body = await readJson(request);
    if (!body.data || typeof body.data !== "object") return json({ error: "Missing data object" }, 400);
    const serialized = JSON.stringify(body.data);
    await env.DB.prepare(
      "INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')"
    ).bind(user.id, serialized).run();
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

async function signup(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const name = String(body.name || "Athlete").trim().slice(0, 80);
  if (!email || password.length < 6) return json({ error: "Use a valid email and at least 6 password characters." }, 400);

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return json({ error: "An account already exists for this email." }, 409);

  const userId = crypto.randomUUID();
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  await env.DB.prepare("INSERT INTO users (id, email, name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
    .bind(userId, email, name, passwordHash, salt)
    .run();

  return createSession(env, { id: userId, email, name });
}

async function login(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const user = await env.DB.prepare("SELECT id, email, name, password_hash, password_salt FROM users WHERE email = ?").bind(email).first();
  if (!user) return json({ error: "Invalid email or password." }, 401);

  const passwordHash = await hashPassword(password, user.password_salt);
  if (passwordHash !== user.password_hash) return json({ error: "Invalid email or password." }, 401);

  return createSession(env, user);
}

async function createSession(env, user) {
  const token = crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))")
    .bind(tokenHash, user.id, expiresAt)
    .run();
  return json({ token, user: { id: user.id, email: user.email, name: user.name }, expiresAt });
}

async function requireUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new HttpError("Missing session token", 401);
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT users.id, users.email, users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')"
  ).bind(tokenHash).first();
  if (!row) throw new HttpError("Session expired. Please log in again.", 401);
  return row;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function hashPassword(password, salt) {
  return sha256(`${salt}:${password}`);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
