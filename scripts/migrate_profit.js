require('dotenv').config();
const { pool } = require('../src/config/database');

async function migrateProfit() {
  try {
    console.log('Starting profit migration...');

    // 1. Add cost_price to products
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0;
    `);
    console.log('Added cost_price to products');

    // 2. Add cost_at_purchase to order_items
    await pool.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS cost_at_purchase NUMERIC(10, 2) DEFAULT 0;
    `);
    console.log('Added cost_at_purchase to order_items');

    // 3. Mock data for existing products (30% margin => cost is 70% of price)
    await pool.query(`
      UPDATE products 
      SET cost_price = ROUND(price * 0.7, 2) 
      WHERE cost_price = 0 OR cost_price IS NULL;
    `);
    console.log('Updated existing products cost_price');

    // 4. Mock data for existing order_items
    await pool.query(`
      UPDATE order_items 
      SET cost_at_purchase = ROUND(price_at_purchase * 0.7, 2) 
      WHERE cost_at_purchase = 0 OR cost_at_purchase IS NULL;
    `);
    console.log('Updated existing order_items cost_at_purchase');

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pool.end();
  }
}

migrateProfit();
