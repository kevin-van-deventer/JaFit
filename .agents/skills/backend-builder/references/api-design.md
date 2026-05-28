# API Design & Input Validation Playbook

Guidelines for implementing secure, typed, and predictable server interfaces.

## 1. Strict Schema Enforcement (Zod Example)

Always validate request bodies, query parameters, or route variables on intake:

```typescript
import { z } from "zod";

// 1. Declare explicit runtime validation schema
export const ContactFormSchema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters"),
  email: z.string().email("Invalid email address format"),
  phone: z.string().regex(/^\+?[0-9\s\-]{7,15}$/, "Invalid contact number"),
  marketingConsent: z.boolean().default(false)
});

// 2. Derive TypeScript static types automatically
export type ContactFormInput = z.infer<typeof ContactFormSchema>;
```

---

## 2. Standardized HTTP Response Structure

Always structure JSON payloads with unified properties to simplify client-side integration:

```json
{
  "success": true,
  "data": {
    "userId": "usr_902183",
    "email": "user@example.com"
  }
}
```

On validation failure or system exception:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input fields failed runtime verification checks.",
    "details": [
      { "field": "email", "issue": "Invalid email address format" }
    ]
  }
}
```

---

## 3. Edge-Compatible API Implementations

When writing APIs intended to compile on global edge functions:
- Do not make blocking loops.
- Use `fetch` instead of third-party HTTP client libraries that rely on Node's native `http` module.
- Keep payloads within reasonable memory parameters to prevent execution limits from terminating workers.
