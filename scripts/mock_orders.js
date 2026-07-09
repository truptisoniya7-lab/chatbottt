require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');

async function seedOrders() {
  try {
    // Check if mock user exists
    let res = await pool.query("SELECT id FROM users WHERE email = 'customer@example.com'");
    let userId;
    if (res.rows.length === 0) {
      const insertUser = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ('Mock Customer', 'customer@example.com', 'hash', 'customer') RETURNING id"
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = res.rows[0].id;
    }

    // Insert 2 mock orders
    await pool.query(
      "INSERT INTO orders (customer_id, total_amount, status) VALUES ($1, 4500.00, 'pending')",
      [userId]
    );
    await pool.query(
      "INSERT INTO orders (customer_id, total_amount, status) VALUES ($1, 12500.00, 'shipped')",
      [userId]
    );

    console.log('Mock orders created successfully!');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

seedOrders();
