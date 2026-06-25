const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const SALT_ROUNDS = 12;

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email:  user.email,
      role:   user.role,
      type:   'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn:  '15m',                  // Short-lived
      algorithm:  'HS256',
      issuer:     'vasudha-couture',
      audience:   'vaani-widget',
    }
  );
}

async function generateRefreshToken(userId, deviceInfo = '') {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Store HASH in DB (not raw token)
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
     VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
    [userId, tokenHash, deviceInfo]
  );
  
  return rawToken; // Send raw token to client via HttpOnly cookie
}

async function rotateRefreshToken(oldRawToken, userId, deviceInfo) {
  const oldHash = crypto.createHash('sha256').update(oldRawToken).digest('hex');
  
  // Verify token exists and is valid
  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens 
     WHERE token_hash = $1 AND user_id = $2 AND revoked = FALSE AND expires_at > NOW()`,
    [oldHash, userId]
  );
  
  if (!rows[0]) {
    // Token reuse detected! Revoke all sessions for this user
    await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
    throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
  }
  
  // Revoke old token
  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [oldHash]);
  
  // Issue new token
  return generateRefreshToken(userId, deviceInfo);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken
};
