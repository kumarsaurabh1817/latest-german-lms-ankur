const db = require('../config/db');

// Columns permitted in the generic update() call.
const ALLOWED_LESSON_COLUMNS = new Set(['title', 'description', 'zoom_link', 'scheduled_at', 'duration_minutes', 'is_completed', 'module_id']);

class LessonModel {
  static async findUpcomingForStudent(student_id) {
    const query = `
      SELECT l.*, c.title as course_title, c.level, m.title as module_title
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN modules m ON l.module_id = m.id
      JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1 AND e.is_active = true
      WHERE l.scheduled_at >= NOW() AND c.is_active = true
      ORDER BY l.scheduled_at ASC
      LIMIT 10
    `;
    const result = await db.query(query, [student_id]);
    return result.rows;
  }

  static async findUpcomingForTeacher(teacher_id) {
    const query = `
      SELECT l.*, c.title as course_title, c.level, m.title as module_title,
        COUNT(e.id) as enrolled_count
      FROM lessons l
      JOIN courses c ON l.course_id = c.id AND c.teacher_id = $1
      JOIN modules m ON l.module_id = m.id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.is_active = true
      WHERE l.scheduled_at >= NOW() AND c.is_active = true
      GROUP BY l.id, c.title, c.level, m.title
      ORDER BY l.scheduled_at ASC
    `;
    const result = await db.query(query, [teacher_id]);
    return result.rows;
  }

  static async findUpcomingForAdmin() {
    const query = `
      SELECT l.*, c.title as course_title, c.level, m.title as module_title,
        u.name as teacher_name
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN modules m ON l.module_id = m.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE l.scheduled_at >= NOW() AND c.is_active = true
      ORDER BY l.scheduled_at ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ module_id, course_id, title, description, zoom_link, scheduled_at, duration_minutes }) {
    const result = await db.query(
      `INSERT INTO lessons (module_id, course_id, title, description, zoom_link, scheduled_at, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [module_id || null, course_id, title, description, zoom_link, scheduled_at, duration_minutes || 60]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    // Whitelist columns — prevents SQL injection via crafted key names
    const keys = Object.keys(data).filter(k => ALLOWED_LESSON_COLUMNS.has(k));
    if (keys.length === 0) return null;

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key]);

    const query = `
      UPDATE lessons 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM lessons WHERE id = $1', [id]);
  }
}

module.exports = LessonModel;
