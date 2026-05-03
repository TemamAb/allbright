// Quick database connectivity test
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();
