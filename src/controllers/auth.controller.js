const authService = require('../services/authService');
const db = require('../config/database');

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('vaani_refresh_token', refreshToken, {
    httpOnly:  true,          // JavaScript cannot read this
    secure:    process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite:  'strict',      // CSRF protection
    maxAge:    7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    path:      '/auth',       // Only sent to /auth/* routes
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const hash = await authService.hashPassword(password);
    
    await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [name, email, hash]
    );

    res.status(201).json({ message: 'User registered successfully. Please verify your email.' });
  } catch (error) {
    if (error.code === '23505') { // Unique violation in Postgres
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const accessToken = authService.generateAccessToken(user);
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const refreshToken = await authService.generateRefreshToken(user.id, deviceInfo);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function refreshToken(req, res) {
  try {
    // Note: Assuming cookie parser is used in server.js
    const token = req.cookies?.vaani_refresh_token;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // In a real scenario, we'd extract userId from the token or keep a map
    // Because we just stored the hash, let's decode the user from token if it was a JWT,
    // but here it's a random hex string. We need to find the user via token hash.
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const result = await db.query(
      'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userId = result.rows[0].user_id;
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    const deviceInfo = req.headers['user-agent'] || 'unknown';
    
    try {
      const newRefreshToken = await authService.rotateRefreshToken(token, userId, deviceInfo);
      const accessToken = authService.generateAccessToken(user);
      
      setRefreshTokenCookie(res, newRefreshToken);
      
      res.json({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      if (err.message === 'REFRESH_TOKEN_REUSE_DETECTED') {
        res.clearCookie('vaani_refresh_token');
        return res.status(401).json({ error: 'Security alert: Token reuse detected. Please login again.' });
      }
      throw err;
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies?.vaani_refresh_token;
    if (token) {
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
    }
    
    res.clearCookie('vaani_refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMe(req, res) {
  // Uses authenticate middleware
  res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};
