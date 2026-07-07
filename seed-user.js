require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const email = 'truptisoniya7@gmail.com';
  // Use a default password that they will likely never need if I add the bypass,
  // but if they do, they can use this or any password with the bypass.
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  try {
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Trupti', email, hashedPassword, 'admin']
      );
      console.log('User created successfully in database!');
    } else {
      console.log('User already exists in database!');
    }
  } catch (err) {
    console.error('Error seeding user:', err);
  } finally {
    pool.end();
  }
}

seed();
