require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const { pool } = require('../src/config/database');

async function restoreCatalog() {
  try {
    const data = JSON.parse(fs.readFileSync('website/catalog.json', 'utf8'));
    const allProducts = [
      ...(data.products_women || []),
      ...(data.products_men || []),
      ...(data.ethnic_heritage || [])
    ];
    
    // Clear existing products
    await pool.query('DELETE FROM products');
    console.log(`Cleared existing products. Ready to insert ${allProducts.length} items from catalog.json.`);
    
    let inserted = 0;
    for (const p of allProducts) {
      if (!p.name || !p.price) continue;
      
      const cost = Math.floor(p.price * 0.7);
      const stock = Math.floor(Math.random() * 100) + 10;
      const desc = p.fabric ? `${p.fabric} · ${p.occasion || ''}` : 'Vasudha Couture Collection';
      
      await pool.query(
        'INSERT INTO products (name, description, price, cost_price, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [p.name, desc, p.price, cost, stock, p.category || 'Collection', p.image_url || '']
      );
      inserted++;
    }
    
    console.log(`Successfully restored ${inserted} products to the database!`);
  } catch (err) {
    console.error('Failed to restore catalog:', err);
  } finally {
    process.exit(0);
  }
}

restoreCatalog();
