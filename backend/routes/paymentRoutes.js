const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Public payment routes (authenticated users)
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify-payment', protect, paymentController.verifyPayment);
router.get('/check-status', protect, paymentController.checkPaymentStatus);
router.get('/history', protect, paymentController.getHistory);

// Admin payment routes
router.get('/admin/all', protect, checkRole(['admin']), paymentController.getAdminPayments);
router.get('/admin/export-csv', protect, checkRole(['admin']), paymentController.exportPaymentsCSV);
router.post('/admin/store', protect, checkRole(['admin']), paymentController.storePayment);

module.exports = router;
