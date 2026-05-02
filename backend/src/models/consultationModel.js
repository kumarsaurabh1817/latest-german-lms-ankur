const db = require('../config/db');

class ConsultationModel {
  static async create({ name, email, phone, country, preferred_time, message }) {
    const result = await db.query(
      `INSERT INTO consultations (name, email, phone, country, preferred_time, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, country, preferred_time, message]
    );
    return result.rows[0];
  }

  static async findAll({ status }) {
    let query = 'SELECT * FROM consultations';
    const params = [];
    if (status) {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  static async updateStatus(id, { status, admin_notes }) {
    const result = await db.query(
      `UPDATE consultations 
       SET status = $1, admin_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes, id]
    );
    return result.rows[0];
  }
}

module.exports = ConsultationModel;
