const { z } = require('zod');

/**
 * Razorpay order creation — client only sends course_id.
 * UUID v4 or a plain positive integer (Postgres serial) are both accepted.
 */
const createRazorpayOrderSchema = z.object({
  course_id: z.union([
    z.string().uuid('course_id must be a valid UUID'),
    z.number().int().positive('course_id must be a positive integer'),
  ]),
});

/**
 * Razorpay payment verification — all three IDs are issued by Razorpay
 * and returned to the client via the checkout handler callback.
 * Format rules come from Razorpay's own documentation.
 */
const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z
    .string()
    .trim()
    .min(1, 'razorpay_order_id is required')
    .regex(/^order_[A-Za-z0-9]+$/, 'Invalid razorpay_order_id format'),

  razorpay_payment_id: z
    .string()
    .trim()
    .min(1, 'razorpay_payment_id is required')
    .regex(/^pay_[A-Za-z0-9]+$/, 'Invalid razorpay_payment_id format'),

  razorpay_signature: z
    .string()
    .trim()
    .min(1, 'razorpay_signature is required')
    .regex(/^[a-f0-9]{64}$/, 'razorpay_signature must be a 64-char hex string'),
});

/**
 * Stripe payment-intent creation — client sends course_id only.
 */
const createStripeIntentSchema = z.object({
  course_id: z.union([
    z.string().uuid('course_id must be a valid UUID'),
    z.number().int().positive('course_id must be a positive integer'),
  ]),
});

/**
 * Stripe payment confirmation — client sends the gateway-issued intent ID only.
 * Pattern: pi_ followed by alphanumeric chars.
 */
const confirmStripePaymentSchema = z.object({
  payment_intent_id: z
    .string()
    .trim()
    .min(1, 'payment_intent_id is required')
    .regex(/^pi_[A-Za-z0-9_]+$/, 'Invalid payment_intent_id format'),
});

module.exports = {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  createStripeIntentSchema,
  confirmStripePaymentSchema,
};
