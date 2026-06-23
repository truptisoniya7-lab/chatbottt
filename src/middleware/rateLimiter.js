const rateLimit = require('express-rate-limit');
const redisClient = require('../config/redis');

// For simplicity in development, we will rely on express-rate-limit's default memory store 
// if a proper Redis implementation is not fully configured.
// In production, you would attach RedisStore from 'rate-limit-redis'

const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
});

const loginRateLimiter = createLimiter(15 * 60 * 1000, 5, 'Too many login attempts. Please try again later.');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: req => req.user ? 30 : 10, // 30 for auth, 10 for guest
  message: { error: 'Too many messages. Please slow down.', code: 'RATE_LIMITED' },
  validate: { xForwardedForHeader: false, default: true },
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
});

module.exports = { createLimiter, loginRateLimiter, chatLimiter };
