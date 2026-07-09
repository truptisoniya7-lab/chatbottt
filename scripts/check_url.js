require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function test() {
  try {
    const res = await pool.query("SELECT id, name, image_url FROM products WHERE name = 'Restored Local Saree 11'");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
test();
