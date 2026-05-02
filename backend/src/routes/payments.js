const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  confirmStripePayment,
  getMyPayments,
} = require('../controllers/paymentController');

router.post('/razorpay/order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyRazorpayPayment);
router.post('/stripe/intent', authenticate, createStripeIntent);
router.post('/stripe/confirm', authenticate, confirmStripePayment);
router.get('/my', authenticate, getMyPayments);

module.exports = router;
