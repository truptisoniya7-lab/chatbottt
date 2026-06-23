const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/message', authenticate(false), chatLimiter, chatController.handleMessage);

module.exports = router;
