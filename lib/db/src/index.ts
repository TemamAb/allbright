import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;

// Load root .env as fallback if DATABASE_URL not in process.env
const databaseCandidates = [
  { key: "DATABASE_URL", value: process.env.DATABASE_URL },
  { key: "DATABASE_CONNECTION_STRING", value: process.env.DATABASE_CONNECTION_STRING },
  { key: "DATABASE_URL_FALLBACK", value: process.env.DATABASE_URL_FALLBACK },
  {
    key: "DATABASE_CONNECTION_STRING_FALLBACK",
    value: process.env.DATABASE_CONNECTION_STRING_FALLBACK,
  },
];

const selectedDatabase = databaseCandidates.find((candidate) => {
  return typeof candidate.value === "string" && candidate.value.trim().length > 0;
});

let databaseUrl = selectedDatabase?.value ?? null;

// Fallback: load root .env if no DATABASE_URL found
if (!databaseUrl) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Project root is 3 levels up from lib/db/src/index.ts
    const projectRoot = join(__dirname, '..', '..', '..');
    const envPath = join(projectRoot, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key === 'DATABASE_URL' && value) {
          databaseUrl = value;
          process.env.DATABASE_URL = value;
          console.log(`[DB] Loaded DATABASE_URL from ${envPath}`);
          break;
        }
      }
    }
  } catch (err) {
    // Silently continue — db will stay null
  }
}

let pool: pg.Pool | null = null;
let db: any = null;

if (databaseUrl) {
  try {
    if (databaseUrl.startsWith("sqlite://")) {
      console.warn("[DB] SQLite not supported for drizzle - using mock DB");
      db = null;
    } else {
      pool = new Pool({ connectionString: databaseUrl });
      db = drizzle(pool, { schema });
      console.log(`[DB] PostgreSQL connected via ${selectedDatabase?.key ?? "unknown"}`);
    }
  } catch (err) {
    console.error("Failed to connect to database:", err);
    pool = null;
    db = null;
  }
} else {
  console.warn(
    "DATABASE_URL not set - database features disabled (checked DATABASE_URL, DATABASE_CONNECTION_STRING, DATABASE_URL_FALLBACK, DATABASE_CONNECTION_STRING_FALLBACK)",
  );
}

export { db, pool };
export default db;

export * from "./schema";
