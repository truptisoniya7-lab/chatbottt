require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
const urls = [
  'https://res.cloudinary.com/jqscyccf/image/upload/v1783577003/vasudha/products/product_1783577002904.jpg',
  'https://res.cloudinary.com/jqscyccf/image/upload/v1783576027/vasudha/products/product_1783576027454.jpg',
  'https://res.cloudinary.com/jqscyccf/image/upload/v1783428638/vasudha/products/product_1783428638567.jpg'
];
async function restoreOrphaned() {
  try {
    let count = 1;
    for (const url of urls) {
      await pool.query(
        'INSERT INTO products (name, description, price, cost_price, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [`Restored Custom Product ${count}`, 'Custom uploaded item (name/price needs update)', 5000, 3500, 10, 'saree', url]
      );
      count++;
    }
    console.log('Restored 3 custom products');
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
restoreOrphaned();
