const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * POST /api/admin/create
 *
 * Creates an admin user directly in the database.
 * This endpoint is NOT meant to be called from the frontend.
 * Use Postman with the correct x-admin-secret header.
 *
 * Request headers:
 *   x-admin-secret: <value from ADMIN_SECRET_KEY in .env>
 *
 * Request body (JSON):
 *   {
 *     "name":     "Saurabh Kumar",
 *     "email":    "admin@example.com",
 *     "password": "yourStrongPassword",
 *     "phone":    "+91XXXXXXXXXX"   (optional)
 *   }
 */
const createAdmin = async (req, res) => {
  try {
    // --- Secret key guard ---
    const providedSecret = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        error: 'ADMIN_SECRET_KEY is not set in environment variables.',
      });
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid or missing x-admin-secret header.',
      });
    }

    // --- Input validation ---
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters.',
      });
    }

    // --- Check for existing user ---
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `A user with email "${email}" already exists.`,
      });
    }

    // --- Hash password & insert ---
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, role, is_teacher_approved, is_active)
       VALUES ($1, $2, $3, $4, 'admin', true, true)
       RETURNING id, name, email, role, phone, is_active, is_teacher_approved, created_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        phone || null,
      ]
    );

    const adminUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: `Admin user "${adminUser.name}" created successfully.`,
      admin: adminUser,
    });
  } catch (err) {
    console.error('[createAdmin] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error.',
    });
  }
};

module.exports = { createAdmin };
