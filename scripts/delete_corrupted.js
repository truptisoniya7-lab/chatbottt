require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function del() {
  try {
    await pool.query("DELETE FROM products WHERE image_url LIKE '%product_1783424346212.jpg' OR image_url LIKE '%test_local.jpg'");
    console.log('Deleted corrupted image products');
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
del();
