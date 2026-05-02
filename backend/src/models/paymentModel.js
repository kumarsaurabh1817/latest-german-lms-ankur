const db = require('../config/db');

class PaymentModel {
  static async create({ student_id, course_id, amount, currency, payment_method, external_order_id, status }) {
    const result = await db.query(
      `INSERT INTO payments (student_id, course_id, amount, currency, payment_method, external_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [student_id, course_id, amount, currency, payment_method, external_order_id, status]
    );
    return result.rows[0];
  }

  static async updateStatus(id, { status, external_payment_id }) {
    const result = await db.query(
      `UPDATE payments 
       SET status = $1, external_payment_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, external_payment_id, id]
    );
    return result.rows[0];
  }

  static async findByOrderId(externalOrderId) {
    const result = await db.query(
      'SELECT * FROM payments WHERE external_order_id = $1',
      [externalOrderId]
    );
    return result.rows[0];
  }

  static async findByIdAndUser(id, student_id) {
    const result = await db.query(
      'SELECT * FROM payments WHERE id = $1 AND student_id = $2',
      [id, student_id]
    );
    return result.rows[0];
  }

  static async findByUser(student_id) {
    const result = await db.query(
      `SELECT p.*, c.title as course_title, c.level
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [student_id]
    );
    return result.rows;
  }
}

module.exports = PaymentModel;
