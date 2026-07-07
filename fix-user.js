require('dotenv').config();
const { pool } = require('./src/config/database');

async function fixUser() {
  try {
    const r = await pool.query("UPDATE users SET role='admin' WHERE email='truptisoniya7@gmail.com' RETURNING *");
    console.log('Updated users:', r.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
fixUser();
