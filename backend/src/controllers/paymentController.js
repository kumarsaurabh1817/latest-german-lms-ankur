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
  getMyPayments
};
