require('dotenv').config();
const db = require('./src/config/database');
(async () => {
  try {
    const result = await db.query(`
      INSERT INTO products (name, description, price, cost_price, stock, image_url, seller_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, ['Saree test', null, 4500, 3100, 5, '', null]);
    console.log('Success:', result.rows[0]);
  } catch(e) {
    console.error('Error details:', e.message);
  } finally {
    process.exit(0);
  }
})();
