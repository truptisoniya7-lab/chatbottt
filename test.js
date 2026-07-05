require('dotenv').config();
const db = require('./src/config/database');
async function test() {
  try {
    const usersRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'seller'");
    console.log("Users query OK:", usersRes.rows);
    const ordersRes = await db.query("SELECT COUNT(*) as count FROM orders");
    console.log("Orders query OK:", ordersRes.rows);
    const revRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'");
    console.log("Revenue query OK:", revRes.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
test();
