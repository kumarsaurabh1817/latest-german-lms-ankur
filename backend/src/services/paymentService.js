const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
const PaymentModel = require('../models/paymentModel');
const CourseModel = require('../models/courseModel');
const EnrollmentModel = require('../models/enrollmentModel');
const db = require('../config/db');

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay is not configured');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe is not configured');
    }
    return Stripe(process.env.STRIPE_SECRET_KEY);
};

const createRazorpayOrder = async (userId, courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    const amount = Math.round(course.price_inr * 100);
    const razorpay = getRazorpay();

    if (process.env.RAZORPAY_KEY_ID.includes('your_')) {
        const err = new Error('Razorpay is currently not configured.');
        err.statusCode = 503;
        throw err;
    }

    const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
    });

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
    // Step 1: Verify HMAC signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
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

    const amount = Math.round(course.price_usd * 100);
    const stripe = getStripe();

    if (process.env.STRIPE_SECRET_KEY.includes('your_')) {
        const err = new Error('Stripe payments are currently not configured.');
        err.statusCode = 503;
        throw err;
    }

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

const getMyPayments = async (userId) => {
    return await PaymentModel.findByUser(userId);
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createStripeIntent,
    confirmStripePayment,
    getMyPayments
};
