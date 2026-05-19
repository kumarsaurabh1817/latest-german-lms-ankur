const paymentService = require('../services/paymentService');

const createRazorpayOrder = async (req, res, next) => {
  const { course_id } = req.body;
  try {
    const orderData = await paymentService.createRazorpayOrder(req.user.id, course_id);
    res.json({ success: true, data: orderData });
  } catch (err) {
    next(err);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    // Only pass gateway-issued IDs — never trust client's payment_db_id or course_id
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await paymentService.verifyRazorpayPayment(req.user.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const createStripeIntent = async (req, res, next) => {
  const { course_id } = req.body;
  try {
    const intentData = await paymentService.createStripeIntent(req.user.id, course_id);
    res.json({ success: true, data: intentData });
  } catch (err) {
    next(err);
  }
};

const confirmStripePayment = async (req, res, next) => {
  try {
    // Only pass the gateway-issued intent ID — never trust client's payment_db_id or course_id
    const { payment_intent_id } = req.body;
    const result = await paymentService.confirmStripePayment(req.user.id, { payment_intent_id });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * Stripe Webhook endpoint — called by Stripe's servers asynchronously.
 * Receives a raw Buffer body (registered BEFORE express.json() in app.js).
 * Validates the Stripe-Signature header to prevent spoofed events.
 */
const stripeWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe-Signature header' });
  }
  try {
    // req.body is a raw Buffer here (express.raw middleware applied in app.js)
    const result = await paymentService.handleStripeWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Razorpay Webhook endpoint — called by Razorpay's servers asynchronously.
 * Receives a raw Buffer/string body (registered BEFORE express.json() in app.js).
 * Validates the X-Razorpay-Signature header using HMAC-SHA256 to prevent spoofed events.
 *
 * Register this URL in your Razorpay Dashboard:
 *   Webhooks → Add New Webhook → https://yourdomain.com/api/payments/razorpay/webhook
 *   Events to subscribe: payment.captured
 */
const razorpayWebhook = async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing X-Razorpay-Signature header' });
  }
  try {
    // req.body is a raw Buffer here (express.raw middleware applied in app.js)
    const result = await paymentService.handleRazorpayWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getMyPayments(req.user.id);
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
  razorpayWebhook,
  getMyPayments
};

