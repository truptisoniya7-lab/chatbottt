require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function test() {
  try {
    const res = await pool.query("SELECT id, name FROM products WHERE image_url = '' OR image_url IS NULL");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
test();
