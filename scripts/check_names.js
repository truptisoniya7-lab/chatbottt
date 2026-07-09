require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function test() {
  try {
    const res = await pool.query("SELECT name FROM products WHERE name LIKE 'Saree%'");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
test();
