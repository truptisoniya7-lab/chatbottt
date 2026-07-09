require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

const products = [
  { name: 'Banarasi Silk Zari Saree', price: 8499, imgUrl: 'assets/saree_model_1782371974758.png' },
  { name: 'Embroidered Bridal Lehenga', price: 14999, imgUrl: 'assets/lehenga_model_1782371986363.png' },
  { name: 'Floral Maxi Dress', price: 3299, imgUrl: 'assets/categories/dress.png' },
  { name: 'Georgette Anarkali Suit', price: 5499, imgUrl: 'assets/palazzo.png' }, // from style.css .img-anarkali
  { name: 'Chikankari Kurta Set', price: 2799, imgUrl: 'assets/categories/kurta.png' },
  { name: 'Oxford Cotton Shirt', price: 1899, imgUrl: 'assets/mens_shirt_distinct.png' },
  { name: 'Linen Mandarin Kurta', price: 1499, imgUrl: 'assets/kurta_model_1782372108155.png' },
  { name: 'Royal Gold-Work Sherwani Set', price: 18999, imgUrl: 'assets/mens_sherwani_distinct.png' },
  { name: 'Slim Fit Dark Jeans', price: 2299, imgUrl: 'assets/mens_jeans_distinct.png' },
  { name: 'Heritage Tweed Blazer', price: 7999, imgUrl: 'assets/nehru.png' },
  { name: 'Kanjivaram Silk Dupatta', price: 2199, imgUrl: 'assets/dupatta.png' },
  { name: 'Brocade Nehru Jacket', price: 3499, imgUrl: 'assets/nehru.png' },
  { name: 'Printed Palazzo Set', price: 1899, imgUrl: 'assets/palazzo.png' },
  { name: 'Linen Dhoti Pants', price: 2699, imgUrl: 'assets/dhoti.png' }
];

async function seed() {
  try {
    await pool.query('DELETE FROM products');
    console.log('Cleared existing products');

    for (let p of products) {
      const cost = Math.floor(p.price * 0.7); // 30% margin
      const stock = Math.floor(Math.random() * 100) + 10;
      
      await pool.query(
        'INSERT INTO products (name, description, price, cost_price, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.name, 'Vasudha Couture Collection', p.price, cost, stock, p.imgUrl]
      );
    }
    console.log(`Successfully seeded ${products.length} exact products with perfect images.`);
  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    process.exit(0);
  }
}

seed();

seed();
