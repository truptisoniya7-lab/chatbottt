require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function fixImages() {
  try {
    await pool.query("UPDATE products SET image_url = 'assets/uploads/nehru_jacket.png' WHERE name = 'Brocade Nehru Jacket'");
    await pool.query("UPDATE products SET image_url = 'assets/uploads/dhoti_pants.png' WHERE name = 'Linen Dhoti Pants'");
    await pool.query("UPDATE products SET image_url = 'assets/uploads/wedding_kurta.png' WHERE name = 'Embroidered Wedding Kurta'");
    await pool.query("UPDATE products SET image_url = 'assets/uploads/bandhgala_suit.png' WHERE name = 'Bandhgala Suit Set'");
    await pool.query("UPDATE products SET image_url = 'assets/uploads/kurta_pyjama.png' WHERE name = 'Cotton Kurta Pyjama Set'");
    console.log('Images updated successfully');
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
fixImages();
