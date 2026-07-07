const db = require('../config/database');

// Place an order (from Cart)
async function placeOrder(req, res) {
  try {
    const { cart } = req.body;
    const customerId = req.user.id; // from authenticate middleware

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let totalAmount = 0;
    cart.forEach(item => { totalAmount += item.price * item.quantity; });

    // Begin transaction
    await db.query('BEGIN');

    // 1. Insert Order
    const orderResult = await db.query(
      'INSERT INTO orders (customer_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [customerId, totalAmount, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    // 2. Insert Order Items
    for (const item of cart) {
      await db.query(
        'INSERT INTO order_items (order_id, quantity, price_at_purchase) VALUES ($1, $2, $3)',
        [orderId, item.quantity, item.price]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Order placement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fetch dashboard statistics based on role
async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'admin') {
      const financeRes = await db.query(`
        SELECT 
          COALESCE(SUM(o.total_amount), 0) as revenue,
          COALESCE(SUM((oi.price_at_purchase - oi.cost_at_purchase) * oi.quantity), 0) as profit
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status != 'cancelled'
      `);
      const usersRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'seller'");
      const ordersRes = await db.query("SELECT COUNT(*) as count FROM orders");
      const totalUsersRes = await db.query("SELECT COUNT(*) as count FROM users");
      const productsRes = await db.query("SELECT COUNT(*) as count FROM products");
      
      const recentOrders = await db.query(`
        SELECT o.id as order_id, o.total_amount, o.status, o.created_at, u.name as customer_name
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        ORDER BY o.created_at DESC LIMIT 5
      `);

      return res.json({
        revenue: financeRes.rows[0].revenue,
        profit: financeRes.rows[0].profit,
        activeSellers: usersRes.rows[0].count,
        totalOrders: ordersRes.rows[0].count,
        totalUsers: totalUsersRes.rows[0].count,
        totalProducts: productsRes.rows[0].count,
        recentOrders: recentOrders.rows
      });
    } 
    
    else if (role === 'seller') {
      const productsRes = await db.query("SELECT COUNT(*) as count FROM products WHERE seller_id = $1", [userId]);
      
      return res.json({
        revenue: 0,
        productsListed: productsRes.rows[0].count,
        pendingOrders: 0,
        recentOrders: []
      });
    } 
    
    else {
      // Customer
      const ordersRes = await db.query("SELECT COUNT(*) as count FROM orders WHERE customer_id = $1", [userId]);
      const historyRes = await db.query("SELECT id, total_amount, status, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC", [userId]);
      
      return res.json({
        ordersPlaced: ordersRes.rows[0].count,
        wishlistItems: 0,
        orderHistory: historyRes.rows
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fetch products for catalog
async function getProducts(req, res) {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (category) {
      query += ' WHERE name ILIKE $1 OR description ILIKE $1';
      params.push(`%${category}%`);
    }
    
    query += ' ORDER BY id ASC LIMIT 50';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─────────────────────────────────────────────────────────────
   ADMIN: Get all users with search + pagination
   GET /api/admin/users?page=1&limit=20&search=name&role=customer
───────────────────────────────────────────────────────────── */
async function getAllUsers(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const roleFilter = req.query.role || null;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(search);
      idx++;
    }
    if (roleFilter) {
      conditions.push(`u.role = $${idx}`);
      params.push(roleFilter);
      idx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total count
    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM users u ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].total);

    // Paginated users with order count
    const usersRes = await db.query(
      `SELECT
         u.id, u.name, u.email, u.role, u.is_active,
         u.avatar_url, u.email_verified,
         u.created_at, u.last_login_at,
         COUNT(o.id) AS order_count,
         COALESCE(SUM(o.total_amount), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.customer_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      users: usersRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─────────────────────────────────────────────────────────────
   ADMIN: Get single user detail
   GET /api/admin/users/:id
───────────────────────────────────────────────────────────── */
async function getUserDetail(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const userRes = await db.query(
      `SELECT id, name, email, role, is_active, avatar_url,
              email_verified, created_at, last_login_at, language_pref
       FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Recent orders
    const ordersRes = await db.query(
      `SELECT id, total_amount, status, created_at
       FROM orders WHERE customer_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    // Uploaded images count
    const imagesRes = await db.query(
      `SELECT COUNT(*) as count FROM user_images WHERE user_id = $1`,
      [id]
    ).catch(() => ({ rows: [{ count: 0 }] }));

    res.json({
      user: userRes.rows[0],
      recentOrders: ordersRes.rows,
      uploadedImages: parseInt(imagesRes.rows[0].count)
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─────────────────────────────────────────────────────────────
   ADMIN: Update user role or active status
   PATCH /api/admin/users/:id
   Body: { role?, is_active? }
───────────────────────────────────────────────────────────── */
async function updateUser(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { role, is_active } = req.body;

    const allowed = ['customer', 'seller', 'admin'];
    if (role && !allowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be customer, seller, or admin.' });
    }

    const updates = [];
    const params = [];
    let idx = 1;

    if (role !== undefined) {
      updates.push(`role = $${idx}`);
      params.push(role);
      idx++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx}`);
      params.push(Boolean(is_active));
      idx++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING id, name, email, role, is_active`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Admin Product Management ─────────────────────────────────────
async function getAllProductsAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let countQuery = 'SELECT COUNT(*) FROM products';
    let dataQuery = `
      SELECT p.*, u.name as seller_name 
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id
    `;
    let params = [];

    if (search) {
      countQuery += ' WHERE name ILIKE $1';
      dataQuery += ' WHERE p.name ILIKE $1';
      params.push(`%${search}%`);
    }

    dataQuery += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const countRes = await db.query(countQuery, params);
    const dataRes = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      total: parseInt(countRes.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
      products: dataRes.rows
    });
  } catch (error) {
    console.error('Fetch admin products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function createProductAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, description, price, cost_price, stock, image_url, seller_id } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const result = await db.query(`
      INSERT INTO products (name, description, price, cost_price, stock, image_url, seller_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, price, cost_price || 0, stock || 0, image_url, seller_id || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function updateProductAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const { name, description, price, cost_price, stock, image_url, seller_id } = req.body;

    const result = await db.query(`
      UPDATE products 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          cost_price = COALESCE($4, cost_price),
          stock = COALESCE($5, stock),
          image_url = COALESCE($6, image_url),
          seller_id = COALESCE($7, seller_id),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, description, price, cost_price, stock, image_url, seller_id, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function deleteProductAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

module.exports = {
  placeOrder,
  getDashboardStats,
  getProducts,
  getAllUsers,
  getUserDetail,
  updateUser,
  getAllProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin
};
