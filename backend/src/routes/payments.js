const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  createStripeIntentSchema,
  confirmStripePaymentSchema,
} = require('../validators/paymentValidator');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  confirmStripePayment,
  getMyPayments,
} = require('../controllers/paymentController');

/**
 * Payment-specific rate limiter:
 *   - 20 order/verify requests per IP per 15 minutes
 *   - Prevents brute-force order creation and signature-guessing attacks
 */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Please wait before trying again.' },
});

// ─── Razorpay ────────────────────────────────────────────────────────────────
// POST /api/payments/razorpay/order — create Razorpay order & DB record
router.post(
  '/razorpay/order',
  paymentLimiter,
  authenticate,
  validate(createRazorpayOrderSchema),
  createRazorpayOrder
);

// POST /api/payments/razorpay/verify — verify HMAC signature & enroll student
router.post(
  '/razorpay/verify',
  paymentLimiter,
  authenticate,
  validate(verifyRazorpayPaymentSchema),
  verifyRazorpayPayment
);

// ─── Stripe ──────────────────────────────────────────────────────────────────
// POST /api/payments/stripe/intent — create Stripe PaymentIntent & DB record
router.post(
  '/stripe/intent',
  paymentLimiter,
  authenticate,
  validate(createStripeIntentSchema),
  createStripeIntent
);

// POST /api/payments/stripe/confirm — confirm Stripe payment & enroll student
router.post(
  '/stripe/confirm',
  paymentLimiter,
  authenticate,
  validate(confirmStripePaymentSchema),
  confirmStripePayment
);

// ─── History ─────────────────────────────────────────────────────────────────
// GET /api/payments/my — list authenticated user's payments
router.get('/my', authenticate, getMyPayments);

module.exports = router;
