const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const { authenticate } = require('../middleware/auth');

router.post('/orders', authenticate(true), ecommerceController.placeOrder);
router.get('/dashboard/stats', authenticate(true), ecommerceController.getDashboardStats);
router.get('/products', ecommerceController.getProducts);

// ── Admin: User Management ────────────────────────────────────
router.get('/admin/users',      authenticate(true), ecommerceController.getAllUsers);
router.post('/admin/users',     authenticate(true), ecommerceController.createUserAdmin);
router.get('/admin/users/:id',  authenticate(true), ecommerceController.getUserDetail);
router.patch('/admin/users/:id', authenticate(true), ecommerceController.updateUser);
router.delete('/admin/users/:id', authenticate(true), ecommerceController.deleteUserAdmin);

// ── Admin: Product Management ────────────────────────────────────
router.get('/admin/products',     authenticate(true), ecommerceController.getAllProductsAdmin);
router.post('/admin/products',    authenticate(true), ecommerceController.createProductAdmin);
router.put('/admin/products/:id', authenticate(true), ecommerceController.updateProductAdmin);
router.delete('/admin/products/:id', authenticate(true), ecommerceController.deleteProductAdmin);

// ── Admin: Global Order Management ──────────────────────────────
router.get('/admin/orders',       authenticate(true), ecommerceController.getAllOrdersAdmin);
router.get('/admin/orders/:id',   authenticate(true), ecommerceController.getOrderDetailAdmin);
router.patch('/admin/orders/:id', authenticate(true), ecommerceController.updateOrderStatusAdmin);
router.delete('/admin/orders/:id', authenticate(true), ecommerceController.deleteOrderAdmin);

// ── Admin: Expense Management ───────────────────────────────────
router.get('/admin/expenses',     authenticate(true), ecommerceController.getExpensesAdmin);
router.post('/admin/expenses',    authenticate(true), ecommerceController.createExpenseAdmin);
router.put('/admin/expenses/:id', authenticate(true), ecommerceController.updateExpenseAdmin);
router.delete('/admin/expenses/:id', authenticate(true), ecommerceController.deleteExpenseAdmin);

// ── Admin: Report Management ────────────────────────────────────
const reportController = require('../controllers/report.controller');
router.get('/admin/reports',      authenticate(true), reportController.getReports);
router.post('/admin/reports',     authenticate(true), reportController.createReport);
router.delete('/admin/reports/:id', authenticate(true), reportController.deleteReport);
router.get('/admin/reports/:id/pdf', authenticate(true), reportController.downloadReportPdf);

module.exports = router;

