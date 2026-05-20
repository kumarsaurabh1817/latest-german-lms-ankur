const db = require('../config/db');

class EnrollmentModel {
  static async create({ student_id, course_id, payment_id }) {
    const result = await db.query(
      `INSERT INTO enrollments (student_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
      [student_id, course_id, payment_id || null]
    );
    return result.rows[0];
  }

  static async findByStudent(student_id) {
    const result = await db.query(
      `SELECT e.*, c.title, c.level, c.thumbnail_url, c.duration_weeks,
        u.name as teacher_name,
        COUNT(DISTINCT l.id) as total_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN lessons l ON l.course_id = c.id
       WHERE e.student_id = $1 AND e.is_active = true AND c.is_active = true
       GROUP BY e.id, c.title, c.level, c.thumbnail_url, c.duration_weeks, u.name`,
      [student_id]
    );
    return result.rows;
  }

  static async findByStudentAndCourse(student_id, course_id) {
    const result = await db.query(
      `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND is_active = true LIMIT 1`,
      [student_id, course_id]
    );
    return result.rows[0]; // undefined if not enrolled
  }

  static async getEnrolledStudents(course_id) {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.country, e.enrolled_at
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1 AND e.is_active = true
       ORDER BY e.enrolled_at DESC`,
      [course_id]
    );
    return result.rows;
  }
}

module.exports = EnrollmentModel;
