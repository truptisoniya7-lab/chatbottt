const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const { authenticate } = require('../middleware/auth');

router.post('/orders', authenticate(true), ecommerceController.placeOrder);
router.get('/dashboard/stats', authenticate(true), ecommerceController.getDashboardStats);
router.get('/products', ecommerceController.getProducts);

// ── Admin: User Management ────────────────────────────────────
router.get('/admin/users',      authenticate(true), ecommerceController.getAllUsers);
router.get('/admin/users/:id',  authenticate(true), ecommerceController.getUserDetail);
router.patch('/admin/users/:id', authenticate(true), ecommerceController.updateUser);

// ── Admin: Product Management ────────────────────────────────────
router.get('/admin/products',     authenticate(true), ecommerceController.getAllProductsAdmin);
router.post('/admin/products',    authenticate(true), ecommerceController.createProductAdmin);
router.put('/admin/products/:id', authenticate(true), ecommerceController.updateProductAdmin);
router.delete('/admin/products/:id', authenticate(true), ecommerceController.deleteProductAdmin);

module.exports = router;

