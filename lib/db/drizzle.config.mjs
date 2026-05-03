import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load root .env as fallback if DATABASE_URL not set
if (!process.env.DATABASE_URL) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Project root is 3 levels up from lib/db/drizzle.config.mjs
    const envPath = join(__dirname, '..', '..', '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key === 'DATABASE_URL' && value) {
          process.env.DATABASE_URL = value;
          break;
        }
      }
    }
  } catch (e) {
    // continue — will throw below if still missing
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const isSqlite = process.env.DATABASE_URL.startsWith("sqlite://");

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: isSqlite ? "sqlite" : "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
