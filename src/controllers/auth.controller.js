const authService = require('../services/authService');
const { pool } = require('../config/database');

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('vaani_refresh_token', refreshToken, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'strict',
    maxAge:    7 * 24 * 60 * 60 * 1000,
    path:      '/auth',
  });
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hash = await authService.hashPassword(password);
    
    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [name, email, hash]
    );

    res.status(201).json({ message: 'Registration successful. Check your email to verify your account.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    const user = rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = await authService.generateRefreshToken(user.id, req.headers['user-agent']);

    setRefreshTokenCookie(res, refreshToken);

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    let token = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/vaani_refresh_token=([^;]+)/);
      if (match) token = match[1];
    }
    
    if (!token) return res.status(401).json({ error: 'No refresh token provided' });

    const crypto = require('crypto');
    const oldHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query('SELECT user_id, revoked FROM refresh_tokens WHERE token_hash = $1', [oldHash]);
    
    if (!rows[0] || rows[0].revoked) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const userId = rows[0].user_id;

    const newRefreshToken = await authService.rotateRefreshToken(token, userId, req.headers['user-agent']);
    
    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRows[0];
    
    const accessToken = authService.generateAccessToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.message === 'REFRESH_TOKEN_REUSE_DETECTED') {
      return res.status(401).json({ error: 'Token reuse detected, please login again' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refreshToken, getMe };
