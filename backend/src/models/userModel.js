const db = require('../config/db');

// Columns that may be updated via the generic update() method.
// Sensitive fields (email, password, role) must NEVER appear here.
const ALLOWED_UPDATE_COLUMNS = new Set(['name', 'phone', 'country', 'avatar_url', 'is_active', 'is_teacher_approved']);

// Shared role enum — used by findAll, updateRole, and create validation
const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

class UserModel {
  static async findByEmail(email) {
    // password is intentionally included — authService.login() needs it for bcrypt.compare()
    // All other callers must strip it before sending to the client
    const result = await db.query(
      'SELECT id, name, email, password, role, phone, country, avatar_url, created_at, is_active, is_teacher_approved FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, role, phone, country, avatar_url, created_at, is_active, is_teacher_approved FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create({ name, email, password, phone, country, role, is_teacher_approved = null }) {
    // Guard required fields — DB constraints would catch these too, but a clear
    // 400 here is more helpful than a cryptic constraint violation error
    if (!name || !email || !password || !role) {
      const err = new Error('name, email, password, and role are required to create a user');
      err.statusCode = 400;
      throw err;
    }

    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, country, role, is_teacher_approved)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false))
       RETURNING id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at`,
      [name, email, password, phone || null, country || null, role, is_teacher_approved]
    );
    return result.rows[0];
  }

  // filters.role is optional; if provided it must be a known role — unknown values → 400
  static async findAll(filters = {}) {
    if (filters.role && !VALID_ROLES.has(filters.role)) {
      const err = new Error(`Invalid role filter. Must be one of: ${[...VALID_ROLES].join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    let query = 'SELECT id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at FROM users';
    const params = [];

    if (filters.role) {
      params.push(filters.role);
      query += ` WHERE role = $1`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, data) {
    // Whitelist columns — prevents SQL injection and protects sensitive fields
    // (email, password, role must never be updated through this generic method)
    const keys = Object.keys(data).filter(k => ALLOWED_UPDATE_COLUMNS.has(k));
    if (keys.length === 0) {
      // Do NOT return null — callers interpret null as "user not found" (→ 404).
      // A no-op from unrecognised keys is a caller mistake → 400.
      const err = new Error('No valid fields provided for update');
      err.statusCode = 400;
      throw err;
    }

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key]);

    const result = await db.query(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at`,
      [id, ...values]
    );
    return result.rows[0];
  }

  // Dedicated method for role changes — admin-only; kept out of the generic update() allowlist
  static async updateRole(id, role) {
    if (!role || !VALID_ROLES.has(role)) {
      const err = new Error(`Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const result = await db.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at`,
      [role, id]
    );
    return result.rows[0];
  }
}

module.exports = UserModel;