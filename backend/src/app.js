const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Rate Limiters ---

// General API limiter: 200 req / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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