require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table platform_expenses created');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
