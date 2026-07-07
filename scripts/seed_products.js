const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

const mockProducts = [
  { name: 'Banarasi Silk Zari Saree', price: 8499, cost: 5950, stock: 45, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
  { name: 'Bridal Velvet Lehenga', price: 14999, cost: 10500, stock: 12, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800' },
  { name: 'Cotton Anarkali Suit', price: 3299, cost: 2310, stock: 80, image: 'https://images.unsplash.com/photo-1629851610486-ff34d5dc9f3b?auto=format&fit=crop&q=80&w=800' },
  { name: 'Georgette Ruffle Saree', price: 5499, cost: 3850, stock: 25, image: 'https://images.unsplash.com/photo-1613852348851-df1739db8201?auto=format&fit=crop&q=80&w=800' },
  { name: 'Handloom Cotton Kurta', price: 2799, cost: 1960, stock: 120, image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800' },
  { name: 'Kanjeevaram Silk Saree', price: 18999, cost: 13300, stock: 15, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
  { name: 'Festive Sharara Set', price: 7999, cost: 5600, stock: 30, image: 'https://images.unsplash.com/photo-1583391733958-d15a07ca070d?auto=format&fit=crop&q=80&w=800' },
  { name: 'Everyday Chiffon Kurti', price: 1499, cost: 1050, stock: 200, image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800' }
];

async function seedProducts() {
  try {
    for (const p of mockProducts) {
      // Check if product already exists
      const check = await pool.query('SELECT id FROM products WHERE name = $1', [p.name]);
      if (check.rows.length === 0) {
        await pool.query(
          'INSERT INTO products (name, description, price, cost_price, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.name, 'Premium ethnic wear from Vasudha Couture', p.price, p.cost, p.stock, p.image]
        );
        console.log('Seeded:', p.name);
      }
    }
    console.log('Finished seeding products.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seedProducts();
