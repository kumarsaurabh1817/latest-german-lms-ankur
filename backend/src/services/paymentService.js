const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const PaymentModel = require('../models/paymentModel');
const CourseModel = require('../models/courseModel');
const EnrollmentModel = require('../models/enrollmentModel');
const db = require('../config/db');

/**
 * Returns a short receipt ID that fits within Razorpay's 40-character limit.
 * Format: "rcpt_<first8charsOfUUID>" = 13 chars total — well within limit.
 */
const generateReceipt = () => `rcpt_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes('TEMP_REPLACE_ME') || keySecret.includes('TEMP_REPLACE_ME')) {
        const err = new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
        err.statusCode = 503;
        throw err;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey.includes('TEMP_REPLACE_ME')) {
        const err = new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.');
        err.statusCode = 503;
        throw err;
    }
    return Stripe(secretKey);
};

/**
 * Normalize errors thrown by the Razorpay SDK.
 * The SDK throws plain objects like: { statusCode: 401, error: { code, description } }
 * — these are NOT standard Error instances and have no .message property.
 * We convert them to proper Error objects and always use HTTP 502 (Bad Gateway)
 * so the frontend's auth:unauthorized interceptor (which only watches 401) is never triggered.
 */
const normalizeRazorpayError = (rzpErr) => {
    const description =
        rzpErr?.error?.description ||
        rzpErr?.message ||
        'Unknown Razorpay error. Please check your API keys and try again.';
    const normalized = new Error(`Payment gateway error: ${description}`);
    normalized.statusCode = 502; // Bad Gateway — never 401
    return normalized;
};

const createRazorpayOrder = async (userId, courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }
    if (!course.is_active) {
        const err = new Error('This course is no longer available for enrollment');
        err.statusCode = 403;
        throw err;
    }

    // Enrollment pre-check — block duplicate orders for already-enrolled students
    const existingEnrollment = await EnrollmentModel.findByStudentAndCourse(userId, courseId);
    if (existingEnrollment) {
        const err = new Error('You are already enrolled in this course');
        err.statusCode = 409;
        throw err;
    }

    // getRazorpay() throws 503 if credentials are missing/placeholder
    const razorpay = getRazorpay();
    const amount = Math.round(course.price_inr * 100);

    let order;
    try {
        order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            // receipt must be ≤ 40 chars — generateReceipt() produces 17 chars
            receipt: generateReceipt(),
            notes: {
                course_id: String(courseId),
                student_id: String(userId),
                course_title: course.title,
            },
        });
    } catch (rzpErr) {
        throw normalizeRazorpayError(rzpErr);
    }

    const payment = await PaymentModel.create({
        student_id: userId,
        course_id: courseId,
        amount: course.price_inr,
        currency: 'INR',
        payment_method: 'razorpay',
        external_order_id: order.id,
        status: 'pending'
    });

    return {
        orderId: order.id,
        amount,
        currency: 'INR',
        paymentId: payment.id,
        key: process.env.RAZORPAY_KEY_ID,
    };
};

/**
 * Server-side Razorpay verification:
 * 1. Verify the HMAC signature using our secret — rejects any tampered data.
 * 2. Look up the payment record by razorpay_order_id (server-owned value, never from client).
 * 3. Assert payment belongs to the authenticated user.
 * 4. Assert payment is still pending (idempotency guard).
 * 5. Update payment + create enrollment in a single DB transaction.
 */
const verifyRazorpayPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    // Guard: secret must be present before we attempt HMAC
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.includes('TEMP_REPLACE_ME')) {
        const err = new Error('Razorpay is not configured. Please add RAZORPAY_KEY_SECRET to your .env file.');
        err.statusCode = 503;
        throw err;
    }

    // Step 1: Verify HMAC-SHA256 signature
    // Use timingSafeEqual to prevent timing-attack signature guessing.
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
    );
    if (!signaturesMatch) {
        const err = new Error('Payment signature verification failed');
        err.statusCode = 400;
        throw err;
    }

    // Step 2: Fetch payment record by the server-created order ID
    const payment = await PaymentModel.findByOrderId(razorpay_order_id);
    if (!payment) {
        const err = new Error('Payment record not found for this order');
        err.statusCode = 404;
        throw err;
    }

    // Step 3: Ownership check — must belong to the authenticated user
    if (String(payment.student_id) !== String(userId)) {
        const err = new Error('Forbidden: payment does not belong to you');
        err.statusCode = 403;
        throw err;
    }

    // Step 4: Idempotency — reject already-processed payments
    if (payment.status !== 'pending') {
        const err = new Error('Payment has already been processed');
        err.statusCode = 409;
        throw err;
    }

    // Step 5: Atomic update + enrollment in a transaction
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE payments SET status = 'completed', external_payment_id = $1, updated_at = NOW() WHERE id = $2`,
            [razorpay_payment_id, payment.id]
        );
        await client.query(
            `INSERT INTO enrollments (student_id, course_id, payment_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (student_id, course_id) DO NOTHING`,
            [payment.student_id, payment.course_id, payment.id]
        );
        await client.query('COMMIT');
    } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
    } finally {
        client.release();
    }

    return { success: true, message: 'Payment verified and enrollment confirmed' };
};

const createStripeIntent = async (userId, courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }
    if (!course.is_active) {
        const err = new Error('This course is no longer available for enrollment');
        err.statusCode = 403;
        throw err;
    }

    const amount = Math.round(course.price_usd * 100);
    // getStripe() throws 503 if not configured
    const stripe = getStripe();

    const intent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: { course_id: courseId, student_id: userId },
    });

    const payment = await PaymentModel.create({
        student_id: userId,
        course_id: courseId,
        amount: course.price_usd,
        currency: 'USD',
        payment_method: 'stripe',
        external_order_id: intent.id,
        status: 'pending'
    });

    return {
        clientSecret: intent.client_secret,
        paymentId: payment.id,
    };
};

/**
 * Server-side Stripe confirmation:
 * 1. Retrieve the PaymentIntent from Stripe — never trust client status.
 * 2. Look up our payment record via the PaymentIntent ID (server-owned).
 * 3. Assert ownership, pending status, and complete in one transaction.
 */
const confirmStripePayment = async (userId, { payment_intent_id }) => {
    const stripe = getStripe();

    // Step 1: Fetch from Stripe — ground truth
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status !== 'succeeded') {
        const err = new Error('Stripe payment has not succeeded');
        err.statusCode = 400;
        throw err;
    }

    // Step 2: Fetch payment record by intent ID
    const payment = await PaymentModel.findByOrderId(payment_intent_id);
    if (!payment) {
        const err = new Error('Payment record not found for this intent');
        err.statusCode = 404;
        throw err;
    }

    // Step 3: Ownership + idempotency
    if (String(payment.student_id) !== String(userId)) {
        const err = new Error('Forbidden: payment does not belong to you');
        err.statusCode = 403;
        throw err;
    }
    if (payment.status !== 'pending') {
        const err = new Error('Payment has already been processed');
        err.statusCode = 409;
        throw err;
    }

    // Step 4: Atomic transaction
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE payments SET status = 'completed', external_payment_id = $1, updated_at = NOW() WHERE id = $2`,
            [payment_intent_id, payment.id]
        );
        await client.query(
            `INSERT INTO enrollments (student_id, course_id, payment_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (student_id, course_id) DO NOTHING`,
            [payment.student_id, payment.course_id, payment.id]
        );
        await client.query('COMMIT');
    } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
    } finally {
        client.release();
    }

    return { success: true, message: 'Payment confirmed and enrollment completed' };
};

/**
 * Stripe Webhook handler:
 * Verifies the Stripe-Signature header, processes payment_intent.succeeded events,
 * and enrolls the student atomically.
 *
 * This is an async safety net — if the client-side confirm call fails or the
 * user closes the tab, the webhook will still complete the enrollment.
 */
const handleStripeWebhook = async (rawBody, signature) => {
    // Respect the ENABLE_STRIPE_WEBHOOK toggle from .env
    if (process.env.ENABLE_STRIPE_WEBHOOK !== 'true') {
        // Should never reach here because app.js guards the route,
        // but defensive check in case the handler is called directly.
        const err = new Error('Stripe webhook is disabled. Set ENABLE_STRIPE_WEBHOOK=true in .env to enable.');
        err.statusCode = 503;
        throw err;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.includes('TEMP_REPLACE_ME')) {
        const err = new Error('Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET in .env.');
        err.statusCode = 503;
        throw err;
    }

    const stripe = getStripe();
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
        );
    } catch (err) {
        const e = new Error(`Stripe webhook signature verification failed: ${err.message}`);
        e.statusCode = 400;
        throw e;
    }

    if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;

        // Fetch payment record by intent ID
        const payment = await PaymentModel.findByOrderId(intent.id);
        if (!payment) {
            // Payment might not exist yet (edge case) — log and return OK so Stripe stops retrying
            console.warn(`[StripeWebhook] No payment record found for intent ${intent.id}`);
            return { received: true };
        }

        // Skip if already processed (idempotency)
        if (payment.status === 'completed') {
            return { received: true };
        }

        // Atomic update + enrollment
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE payments SET status = 'completed', external_payment_id = $1, updated_at = NOW() WHERE id = $2`,
                [intent.id, payment.id]
            );
            await client.query(
                `INSERT INTO enrollments (student_id, course_id, payment_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (student_id, course_id) DO NOTHING`,
                [payment.student_id, payment.course_id, payment.id]
            );
            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
    }

    return { received: true };
};

/**
 * Razorpay Webhook handler:
 * Verifies the Razorpay-Signature header using HMAC-SHA256,
 * processes payment.captured events, and enrolls the student atomically.
 *
 * This is an async safety net — if the client-side verify call fails or the
 * user closes the tab before verification, the webhook will still complete enrollment.
 *
 * Register this webhook in the Razorpay Dashboard:
 *   URL: https://yourdomain.com/api/payments/razorpay/webhook
 *   Events: payment.captured
 */
const handleRazorpayWebhook = async (rawBody, signature) => {
    // Respect the ENABLE_RAZORPAY_WEBHOOK toggle from .env
    if (process.env.ENABLE_RAZORPAY_WEBHOOK !== 'true') {
        // Should never reach here because app.js guards the route,
        // but defensive check in case the handler is called directly.
        const err = new Error('Razorpay webhook is disabled. Set ENABLE_RAZORPAY_WEBHOOK=true in .env to enable.');
        err.statusCode = 503;
        throw err;
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.includes('TEMP_REPLACE_ME')) {
        const err = new Error('Razorpay webhook secret is not configured. Set RAZORPAY_WEBHOOK_SECRET in .env.');
        err.statusCode = 503;
        throw err;
    }

    // Verify HMAC-SHA256 signature
    // Use timingSafeEqual to prevent timing-attack signature guessing.
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    const webhookSigMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
    );
    if (!webhookSigMatch) {
        const err = new Error('Razorpay webhook signature verification failed');
        err.statusCode = 400;
        throw err;
    }

    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        const err = new Error('Invalid Razorpay webhook payload');
        err.statusCode = 400;
        throw err;
    }

    if (event.event === 'payment.captured') {
        const rzpPayment = event.payload?.payment?.entity;
        if (!rzpPayment) return { received: true };

        const rzpOrderId = rzpPayment.order_id;
        if (!rzpOrderId) return { received: true };

        // Fetch payment record by the order ID
        const payment = await PaymentModel.findByOrderId(rzpOrderId);
        if (!payment) {
            console.warn(`[RazorpayWebhook] No payment record found for order ${rzpOrderId}`);
            return { received: true };
        }

        // Skip if already processed (idempotency)
        if (payment.status === 'completed') {
            return { received: true };
        }

        // Atomic update + enrollment
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE payments SET status = 'completed', external_payment_id = $1, updated_at = NOW() WHERE id = $2`,
                [rzpPayment.id, payment.id]
            );
            await client.query(
                `INSERT INTO enrollments (student_id, course_id, payment_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (student_id, course_id) DO NOTHING`,
                [payment.student_id, payment.course_id, payment.id]
            );
            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
    }

    return { received: true };
};

const getMyPayments = async (userId) => {
    return await PaymentModel.findByUser(userId);
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createStripeIntent,
    confirmStripePayment,
    handleStripeWebhook,
    handleRazorpayWebhook,
    getMyPayments
};
