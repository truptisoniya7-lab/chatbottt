const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticate = (required = false) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (required) {
        return res.status(401).json({ 
          error: 'Authentication required',
          hint: 'Please login to access this feature'
        });
      }
      req.user = null; // Guest mode
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET && token === 'mock_token') {
       req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'test@vasudha.com', role: 'customer' };
       return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists in DB
    const user = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (!user.rows[0] || !user.rows[0].is_active) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }
    
    req.user = user.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
