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
          COALESCE(SUM((oi.price_at_purchase - oi.cost_at_purchase) * oi.quantity), 0) as gross_profit
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status != 'cancelled'
      `);
      
      const expensesRes = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total_expenses,
               category
        FROM platform_expenses
        GROUP BY category
      `);
      
      let totalExpenses = 0;
      const expenseBreakdown = {};
      expensesRes.rows.forEach(row => {
        const amt = parseFloat(row.total_expenses);
        totalExpenses += amt;
        expenseBreakdown[row.category] = amt;
      });

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
        revenue: parseFloat(financeRes.rows[0].revenue),
        profit: parseFloat(financeRes.rows[0].gross_profit) - totalExpenses,
        grossProfit: parseFloat(financeRes.rows[0].gross_profit),
        totalExpenses,
        expenseBreakdown,
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
    `, [
      name !== undefined ? name : null,
      description !== undefined ? description : null,
      price !== undefined ? price : null,
      cost_price !== undefined ? cost_price : 0,
      stock !== undefined ? stock : 0,
      image_url !== undefined ? image_url : null,
      (seller_id && seller_id.trim() !== '') ? seller_id : null
    ]);
    
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
    `, [
      name !== undefined ? name : null,
      description !== undefined ? description : null,
      price !== undefined ? price : null,
      cost_price !== undefined ? cost_price : null,
      stock !== undefined ? stock : null,
      image_url !== undefined ? image_url : null,
      (seller_id && seller_id.trim() !== '') ? seller_id : null,
      id
    ]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
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

async function createUserAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, email, role, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
    
    const authService = require('../services/authService');
    const hash = await authService.hashPassword(password);
    
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, name, email, role',
      [name, email, hash, role || 'customer']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUserAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Admin Global Orders ──────────────────────────────────────────
async function createOrderAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const { customer_id, items, status } = req.body;
    
    if (!customer_id) return res.status(400).json({ error: 'Customer ID is required' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
    });

    await db.query('BEGIN');

    const orderResult = await db.query(
      'INSERT INTO orders (customer_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [customer_id, totalAmount, status || 'pending']
    );
    const newOrder = orderResult.rows[0];

    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_at_purchase, seller_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          newOrder.id, 
          item.product_id || null, 
          parseInt(item.quantity, 10) || 1, 
          parseFloat(item.price) || 0,
          parseFloat(item.cost_price) || 0,
          item.seller_id || null
        ]
      );
    }

    await db.query('COMMIT');
    res.status(201).json(newOrder);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Create order admin error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function getAllOrdersAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const result = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOrderDetailAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const orderRes = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email 
      FROM orders o LEFT JOIN users u ON o.customer_id = u.id WHERE o.id = $1
    `, [id]);
    
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const itemsRes = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url 
      FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1
    `, [id]);
    
    res.json({ order: orderRes.rows[0], items: itemsRes.rows });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateOrderStatusAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteOrderAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Admin Expenses ───────────────────────────────────────────────
async function getExpensesAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const result = await db.query('SELECT * FROM platform_expenses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createExpenseAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { category, amount, description } = req.body;
    const result = await db.query(
      'INSERT INTO platform_expenses (category, amount, description) VALUES ($1, $2, $3) RETURNING *',
      [category, amount, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateExpenseAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const { category, amount, description } = req.body;
    const result = await db.query(
      'UPDATE platform_expenses SET category = COALESCE($1, category), amount = COALESCE($2, amount), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
      [category, amount, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteExpenseAdmin(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const result = await db.query('DELETE FROM platform_expenses WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  placeOrder,
  getDashboardStats,
  getProducts,
  getAllUsers,
  getUserDetail,
  updateUser,
  createUserAdmin,
  deleteUserAdmin,
  getAllProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getAllOrdersAdmin,
  createOrderAdmin,
  getOrderDetailAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
  getExpensesAdmin,
  createExpenseAdmin,
  updateExpenseAdmin,
  deleteExpenseAdmin
};
