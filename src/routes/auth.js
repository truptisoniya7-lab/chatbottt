const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate(true), authController.getMe);

module.exports = router;
