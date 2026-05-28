# Polymorphic Database & Edge Query Playbook

Design and architecture instructions for establishing database layers that support offline local development while executing on global edge architectures.

## 1. Unified Interface Wrapper

Expose database operations using a standard driver contract to isolate specific client dependencies:

```typescript
export interface DbClient {
  execute(sql: string, params?: any[]): Promise<DbResult>;
}

export interface DbResult {
  rows: any[];
  rowsAffected: number;
}
```

---

## 2. Polymorphic SQLite/D1 Edge Driver

Resolve the active execution framework dynamically on initialization. Webpack's static analyzer parses direct imports, which causes compilation errors during Edge builds if Node-specific libraries (`better-sqlite3`, `fs`, `path`) are present. Bypass this check by loading the libraries dynamically via `eval('require')`:

```typescript
let localDbConnection: any = null;

export async function getDatabase(): Promise<DbClient> {
  // Production Edge Target (Cloudflare D1 binding)
  if (process.env.DB) {
    const d1 = process.env.DB as any;
    return {
      execute: async (sql, params = []) => {
        const stmt = d1.prepare(sql).bind(...params);
        const res = await stmt.all();
        return { rows: res.results || [], rowsAffected: res.meta?.changes || 0 };
      }
    };
  }

  // Development Fallback Target (Local SQLite)
  if (localDbConnection) return localDbConnection;
  
  try {
    const Database = eval("require")("better-sqlite3");
    const path = eval("require")("path");
    const fs = eval("require")("fs");

    const dbPath = path.join(process.cwd(), "db", "local.db");
    const db = new Database(dbPath);
    
    localDbConnection = {
      execute: async (sql, params = []) => {
        const stmt = db.prepare(sql);
        const isQuery = sql.trim().toLowerCase().startsWith("select");
        if (isQuery) {
          const rows = stmt.all(...params);
          return { rows, rowsAffected: 0 };
        } else {
          const info = stmt.run(...params);
          return { rows: [], rowsAffected: info.changes };
        }
      }
    };
    return localDbConnection;
  } catch (err: any) {
    throw new Error(`Failed to initialize local SQLite driver: ${err.message}`);
  }
}
```
