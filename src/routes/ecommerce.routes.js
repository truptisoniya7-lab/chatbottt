const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const { authenticate } = require('../middleware/auth');

router.post('/orders', authenticate(true), ecommerceController.placeOrder);
router.get('/dashboard/stats', authenticate(true), ecommerceController.getDashboardStats);
router.get('/products', ecommerceController.getProducts);

module.exports = router;
