require('dotenv').config({ path: '../.env' });
const db = require('../src/config/database');

async function test() {
  try {
    const start_date = '2026-07-01';
    const end_date = '2026-07-09';
    
    console.log('Testing query 1...');
    const orderRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as total_orders
       FROM orders 
       WHERE created_at >= $1 AND created_at <= $2 AND status != 'cancelled'`,
      [start_date, end_date]
    );
    console.log('OrderRes:', orderRes.rows);

    console.log('Testing query 2...');
    const costRes = await db.query(
      `SELECT COALESCE(SUM(oi.cost_at_purchase * oi.quantity), 0) as cost_of_goods
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status != 'cancelled'`,
      [start_date, end_date]
    );
    console.log('CostRes:', costRes.rows);

    console.log('Testing query 3...');
    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM platform_expenses
       WHERE created_at >= $1 AND created_at <= $2`,
      [start_date, end_date]
    );
    console.log('ExpenseRes:', expenseRes.rows);

    console.log('Testing query 4...');
    const usersRes = await db.query(
      `SELECT COUNT(id) as new_users
       FROM users
       WHERE created_at >= $1 AND created_at <= $2`,
      [start_date, end_date]
    );
    console.log('UsersRes:', usersRes.rows);
    
    console.log('Testing Insert...');
    const insertRes = await db.query(
      `INSERT INTO reports (name, start_date, end_date, report_data)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ['Test', start_date, end_date, JSON.stringify({ test: 123 })]
    );
    console.log('InsertRes:', insertRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

test();
