# Security and Authentication Playbook

Core directives for implementing cryptographic safeguards, credential checks, and server-side headers.

## 1. Password Hashing & Hashing Standards

Never store plaintext credentials. Always hash incoming user passwords using standard salting frameworks (`bcryptjs` or native Argon2):

```typescript
import bcrypt from "bcryptjs";

// Hashing on intake (Registration)
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verifying on login
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 2. Secure Cookies & CSRF Protection

When transmitting session tokens, always enforce strict cookie parameters:

```typescript
response.headers.set(
  "Set-Cookie",
  `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
);
```

*   `HttpOnly`: Prevents client-side scripts from reading the cookie, mitigating Cross-Site Scripting (XSS) risks.
*   `Secure`: Ensures the cookie is only transmitted over HTTPS connections.
*   `SameSite=Lax`: Restricts cookie forwarding on cross-site requests, mitigating Cross-Site Request Forgery (CSRF).

---

## 3. Mandatory Security Headers

Enforce security constraints by setting headers on every public dynamic response:

```typescript
const headers = new Headers();
headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;");
headers.set("X-Content-Type-Options", "nosniff");
headers.set("X-Frame-Options", "DENY");
headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
```
