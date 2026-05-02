const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
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
    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, country, role, is_teacher_approved)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false))
       RETURNING id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at`,
      [name, email, password, phone, country, role, is_teacher_approved]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at FROM users';
    const params = [];
    const conditions = [];

    if (filters.role) {
      params.push(filters.role);
      conditions.push(`role = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key]);

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, name, email, role, phone, country, avatar_url, is_active, is_teacher_approved, created_at
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }
}

module.exports = UserModel;