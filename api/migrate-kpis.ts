import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join('..', '..', 'db', 'migrations', '20250427_kpi_snapshots.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migration applied: kpi_snapshots table created.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
