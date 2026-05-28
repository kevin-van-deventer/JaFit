# Premium Backend Builder Skill

A comprehensive playbook, standard, and instruction set for designing secure-by-default, scalable, and edge-safe server ecosystems. Use this skill whenever constructing RESTful/RPC APIs, setting up authentication gates, configuring databases (local SQLite, Postgres, Cloudflare D1), performing payload validations, or tuning server-side security.

## Core Directives

### 1. Robust API Architecture & Validation
- **Strict Schema Enforcement**: Never trust client inputs. Utilize robust validation libraries like **Zod** to assert types, formats, lengths, and constraints before executing database writes or processing core logic.
- **Unified Error Handling**: Format consistent, non-disclosing JSON error payloads for public routes. Return semantic HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`).
- **Edge Compatibility**: Design server logic to conform to runtime limits. Avoid native Node.js libraries (`fs`, `path`, `child_process`) in production endpoints intended to run on Cloudflare Workers or Vercel Edge.

### 2. Polymorphic Database & Storage Models
- **Database & Drizzle ORM**: Set up secure edge-ready database connections (e.g., Drizzle ORM with Turso / LibSQL client or Cloudflare D1). Define SQL table schemas using Drizzle ORM to record contact inquiries, dynamic leads, user registrations, and dashboard actions.
- **Environment Parity**: Expose unified database interfaces that can seamlessly resolve to native serverless engines in production (e.g., Cloudflare D1) while auto-falling back to local engines in offline development (e.g., standard SQLite using `better-sqlite3`).
- **Zero Static Leakage**: Hide Node-only modules from Webpack static compilation analysis during production edge builds by leveraging dynamic loading utilities (e.g., `eval('require')`).

### 3. Routing, Sitemaps & Search Engine Compliance
- **Protected Administrative Routing**: Build `/admin` routes protected by basic auth middleware or Auth.js. Render dynamic submissions in premium, styled tables featuring state-aware skeleton loading and empty indicators.
- **Dynamic Sitemaps & Robots.txt**:
  - Configure compilation tools to auto-generate valid XML `sitemap.xml` files, excluding admin and API dynamic pathways.
  - Implement a highly strategic `robots.txt` endpoint that:
    - Allows citation-equity search crawlers (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`).
    - Disallows scraping/bulk models (`GPTBot`, `Claude-Web`, `Google-Extended`).
    - Excludes `/admin`, `/keystatic`, and `/api/` dynamic pathways.
    - Points directly to the absolute XML sitemap URL.

### 4. Comprehensive Security Gateways
- **Next-Generation Authentication**: Configure standardized authentication frameworks (e.g., NextAuth.js v5 / Auth.js) with secure session store architectures.
- **Cryptographic Security**: Hashing of secrets (like user passwords) must occur using high-factor encryption standard frameworks (e.g., `bcryptjs` with salt factors >= 10).
- **Protection Measures**: Implement standard CORS filters, CSRF tokens, secure cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`), and standard rate-limiting controls.

---

## References & Architecture Playbooks
See the following comprehensive guides in the `references/` directory to design state-of-the-art backend systems:
1. [api-design.md](file:///c:/Users/Kevin%20v%20Dev/Downloads/WEB%20Projects/WebDev%20AgentSkillsMD/.agents/skills/backend-builder/references/api-design.md) - Standard RESTful APIs, routing structures, validation triggers.
2. [database-patterns.md](file:///c:/Users/Kevin%20v%20Dev/Downloads/WEB%20Projects/WebDev%20AgentSkillsMD/.agents/skills/backend-builder/references/database-patterns.md) - SQLite/D1 edge architecture, polymorphic drivers, schema indexes.
3. [security-practices.md](file:///c:/Users/Kevin%20v%20Dev/Downloads/WEB%20Projects/WebDev%20AgentSkillsMD/.agents/skills/backend-builder/references/security-practices.md) - Session rules, cookies, hashing, CORS setups, headers.
