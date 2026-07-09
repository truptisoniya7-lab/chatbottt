require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function test() {
  try {
    const res = await pool.query("SELECT name, image_url FROM products WHERE name IN ('Bandhgala Suit Set', 'Linen Dhoti Pants', 'Embroidered Wedding Kurta')");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
test();
