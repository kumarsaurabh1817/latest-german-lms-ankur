const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Payment Webhooks (MUST be registered BEFORE express.json()) ─────────────
// Both Stripe and Razorpay require the raw, unparsed request body to verify
// the HMAC signature. express.json() would parse the body into an object and
// break signature verification for both gateways.
//
// ENABLE_STRIPE_WEBHOOK / ENABLE_RAZORPAY_WEBHOOK (set in .env):
//   true  → webhook route is live and will process incoming events
//   false → route returns 503 with a descriptive message (safe for local dev)
//
// When disabled, we still register the path so that a misconfigured Razorpay
// dashboard hitting the URL gets a proper HTTP response instead of a 404.
// ─────────────────────────────────────────────────────────────────────────────
const { stripeWebhook, razorpayWebhook } = require('./controllers/paymentController');

const webhookDisabled = (gatewayName) => (_req, res) => {
  res.status(503).json({
    success: false,
    message: `${gatewayName} webhook is disabled. Set ENABLE_${gatewayName.toUpperCase().replace(' ', '_')}_WEBHOOK=true in .env to enable.`,
  });
};

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// Register at: https://dashboard.stripe.com/webhooks
// Events: payment_intent.succeeded
// Secret: run `stripe listen --forward-to localhost:5010/api/payments/stripe/webhook`
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  process.env.ENABLE_STRIPE_WEBHOOK === 'true' ? stripeWebhook : webhookDisabled('Stripe')
);

// ─── Razorpay Webhook ─────────────────────────────────────────────────────────
// Register at: https://dashboard.razorpay.com/app/webhooks
// Events: payment.captured
// URL: https://yourdomain.com/api/payments/razorpay/webhook
app.post(
  '/api/payments/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  process.env.ENABLE_RAZORPAY_WEBHOOK === 'true' ? razorpayWebhook : webhookDisabled('Razorpay')
);

// Body parsing (all other routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// --- Rate Limiters ---

// General API limiter: 200 req / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 100000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limiter for auth endpoints: 100 req / 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased to 100 to prevent locking out during local development / testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Strict limiter for public forms (consultations):  10 req / 15 min
const spamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions, please slow down.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/consultations', spamLimiter);
app.use('/api/contact', spamLimiter);
app.use('/api/admin/create', authLimiter);

// Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'German LMS API is running' });
});

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;