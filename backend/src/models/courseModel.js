const db = require('../config/db');

class CourseModel {
  static async findAll({ level } = {}) {
    let query = `
      SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = true
      WHERE c.is_active = true AND c.is_published = true
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

  static async findByTeacher(teacherId) {
    const query = `
      SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = true
      WHERE c.is_active = true AND c.teacher_id = $1
      GROUP BY c.id, u.name, u.avatar_url, c.created_at
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  static async findAllAdmin() {
    const query = `
      SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, u.name, u.avatar_url, c.created_at
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query);
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
      duration_weeks, max_students, teacher_id, thumbnail_url, features
    } = data;
    
    const query = `
      INSERT INTO courses (
        title, level, description, short_description, price_inr, price_usd,
        duration_weeks, max_students, teacher_id, thumbnail_url, features
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      thumbnail_url || null,
      features ?? []
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    // Build a partial SET clause using only the keys present in data.
    // We do NOT use COALESCE because it silently ignores null/0/false,
    // making it impossible to set price_inr=0 or thumbnail_url=null intentionally.
    const ALLOWED_COURSE_COLUMNS = new Set([
      'title', 'description', 'short_description', 'price_inr', 'price_usd',
      'duration_weeks', 'max_students', 'thumbnail_url', 'features', 'is_active',
      'is_published'
    ]);

    const keys = Object.keys(data).filter(k => ALLOWED_COURSE_COLUMNS.has(k));
    if (keys.length === 0) return null;

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key]);

    const result = await db.query(
      `UPDATE courses SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
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