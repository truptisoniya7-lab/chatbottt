require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function restoreLocal() {
  try {
    const uploadDir = path.join(__dirname, '../website/assets/uploads');
    if (!fs.existsSync(uploadDir)) {
      console.log('No uploads dir');
      return;
    }
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    
    let count = 4; // Start from 4 since we did 1-3 from Cloudinary
    let inserted = 0;
    
    for (const file of files) {
      // Check if already in DB (just to be safe)
      const url = `assets/uploads/${file}`;
      const existing = await pool.query('SELECT id FROM products WHERE image_url = $1', [url]);
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO products (name, description, price, cost_price, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [`Restored Local Product ${count}`, 'Custom uploaded item (needs update)', 4500, 3100, 5, 'saree', url]
        );
        count++;
        inserted++;
      }
    }
    console.log(`Restored ${inserted} local products`);
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
restoreLocal();
