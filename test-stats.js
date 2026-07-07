require('dotenv').config();
const { pool } = require('./src/config/database');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const res = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    const id = res.rows[0]?.id;
    if (!id) {
      console.log('No admin found');
      process.exit(1);
    }
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET);
    const fetched = await fetch('http://localhost:3001/api/dashboard/stats', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await fetched.text();
    console.log('STATUS:', fetched.status);
    console.log('RESPONSE:', text);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
test();
