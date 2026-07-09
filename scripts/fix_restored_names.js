require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function fix() {
  try {
    // Check if the corrupted ones are still there
    const res = await pool.query("SELECT id, name FROM products WHERE image_url LIKE '%product_1783424346212.jpg' OR image_url LIKE '%test_local.jpg'");
    console.log('Corrupted found:', res.rows.length);
    if (res.rows.length > 0) {
      await pool.query("DELETE FROM products WHERE image_url LIKE '%product_1783424346212.jpg' OR image_url LIKE '%test_local.jpg'");
    }

    // Rename Restored Custom Saree / Restored Local Saree to Saree
    const res2 = await pool.query("SELECT id, name FROM products WHERE name LIKE 'Restored % Saree%'");
    let count = 1;
    for (const row of res2.rows) {
      await pool.query("UPDATE products SET name = $1 WHERE id = $2", [`Saree ${count}`, row.id]);
      count++;
    }
    console.log(`Renamed ${count - 1} products to Saree X`);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
fix();
