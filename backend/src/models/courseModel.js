const db = require('../config/db');

class CourseModel {
  static async findAll({ level }) {
    let query = `
      SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = true
      WHERE c.is_active = true
    `;
    const params = [];
    if (level) {
      params.push(level);
      query += ` AND c.level = $${params.length}`;
    }
    query += ' GROUP BY c.id, u.name, u.avatar_url, c.created_at ORDER BY c.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = true
      WHERE c.id = $1
      GROUP BY c.id, u.name, u.avatar_url
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      title, level, description, short_description, price_inr, price_usd,
      duration_weeks, max_students, teacher_id, thumbnail_url
    } = data;
    
    const query = `
      INSERT INTO courses (
        title, level, description, short_description, price_inr, price_usd,
        duration_weeks, max_students, teacher_id, thumbnail_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      title, 
      level, 
      description || null, 
      short_description || null, 
      price_inr || 0, 
      price_usd || 0,
      duration_weeks || 8, 
      max_students || 20, 
      teacher_id, 
      thumbnail_url || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      title, description, short_description, price_inr, price_usd,
      duration_weeks, max_students, thumbnail_url, is_active
    } = data;

    const result = await db.query(
      `UPDATE courses SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        short_description = COALESCE($3, short_description),
        price_inr = COALESCE($4, price_inr),
        price_usd = COALESCE($5, price_usd),
        duration_weeks = COALESCE($6, duration_weeks),
        max_students = COALESCE($7, max_students),
        thumbnail_url = COALESCE($8, thumbnail_url),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [title, description, short_description, price_inr, price_usd, 
       duration_weeks, max_students, thumbnail_url, is_active, id]
    );
    return result.rows[0];
  }

  // Related data methods
  static async findModules(courseId) {
    const result = await db.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index',
      [courseId]
    );
    return result.rows;
  }

  static async findLessons(courseId) {
    const result = await db.query(
      'SELECT * FROM lessons WHERE course_id = $1 ORDER BY scheduled_at',
      [courseId]
    );
    return result.rows;
  }

  static async findModuleById(moduleId) {
    const result = await db.query('SELECT * FROM modules WHERE id = $1', [moduleId]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('UPDATE courses SET is_active = false WHERE id = $1', [id]);
  }

  // Module Methods
  static async createModule(courseId, { title, description, order_index }) {
    const result = await db.query(
      `INSERT INTO modules (course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [courseId, title, description, order_index || 0]
    );
    return result.rows[0];
  }

  static async updateModule(moduleId, { title, description, order_index }) {
    const result = await db.query(
      'UPDATE modules SET title = COALESCE($1, title), description = COALESCE($2, description), order_index = COALESCE($3, order_index) WHERE id = $4 RETURNING *',
      [title, description, order_index, moduleId]
    );
    return result.rows[0];
  }

  static async deleteModule(moduleId) {
    await db.query('DELETE FROM modules WHERE id = $1', [moduleId]);
  }
}


module.exports = CourseModel;