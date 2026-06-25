const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_rFvzSfl51tdR@ep-still-mouse-aohrv15s-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: true },
});

async function test() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables in database:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    pool.end();
  }
}

test();
