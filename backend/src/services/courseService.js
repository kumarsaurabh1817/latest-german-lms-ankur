const CourseModel = require('../models/courseModel');

class CourseService {
  static async listCourses(filters = {}) {
    return await CourseModel.findAll(filters);
  }

  static async getCourseDetails(id) {
    const course = await CourseModel.findById(id);
    if (!course || !course.is_active) {
      const error = new Error('Course not found or has been removed');
      error.statusCode = 404;
      throw error;
    }
    return course;
  }

  static async getCourseContent(id) {
    // Check if course exists first
    await this.getCourseDetails(id);

    const [modules, lessons] = await Promise.all([
      CourseModel.findModules(id),
      CourseModel.findLessons(id)
    ]);

    // Group content by module
    return modules.map(mod => ({
      ...mod,
      lessons: lessons.filter(l => l.module_id === mod.id)
    }));
  }

  static async createCourse(data, user) {
    // Guard against unapproved teachers even if middleware is bypassed
    if (user && user.role === 'teacher' && !user.is_teacher_approved) {
      const error = new Error('Teacher account pending admin approval');
      error.statusCode = 403;
      throw error;
    }

    return await CourseModel.create({ ...data, teacher_id: user.id });
  }

  /**
   * Ownership check: teachers may only update their own courses; admins bypass.
   */
  static async updateCourse(id, data, user) {
    const course = await CourseModel.findById(id);
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'teacher' && String(course.teacher_id) !== String(user.id)) {
      const error = new Error('Forbidden: you do not own this course');
      error.statusCode = 403;
      throw error;
    }

    const updated = await CourseModel.update(id, data);
    if (!updated) {
      const error = new Error('Course update failed');
      error.statusCode = 500;
      throw error;
    }
    return updated;
  }

  /**
   * Ownership check: teachers may only delete their own courses; admins bypass.
   */
  static async deleteCourse(id, user) {
    if (!id) {
      const error = new Error('Course ID required');
      error.statusCode = 400;
      throw error;
    }

    const course = await CourseModel.findById(id);
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'teacher' && String(course.teacher_id) !== String(user.id)) {
      const error = new Error('Forbidden: you do not own this course');
      error.statusCode = 403;
      throw error;
    }

    await CourseModel.delete(id);
    return true;
  }

  /**
   * Ownership check: only the course owner (or admin) may add modules.
   */
  static async createModule(courseId, data, user) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'teacher' && String(course.teacher_id) !== String(user.id)) {
      const error = new Error('Forbidden: you do not own this course');
      error.statusCode = 403;
      throw error;
    }

    return await CourseModel.createModule(courseId, data);
  }

  /**
   * Ownership check: teachers may only modify modules of their own courses.
   */
  static async updateModule(moduleId, data, user) {
    const module = await CourseModel.findModuleById(moduleId);
    if (!module) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (user && user.role === 'teacher') {
      const course = await CourseModel.findById(module.course_id);
      if (!course || String(course.teacher_id) !== String(user.id)) {
        const error = new Error('Forbidden: you do not own this module\'s course');
        error.statusCode = 403;
        throw error;
      }
    }

    return await CourseModel.updateModule(moduleId, data);
  }

  /**
   * Ownership check: teachers may only delete modules in their own courses.
   */
  static async deleteModule(moduleId, user) {
    const module = await CourseModel.findModuleById(moduleId);
    if (!module) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (user && user.role === 'teacher') {
      const course = await CourseModel.findById(module.course_id);
      if (!course || String(course.teacher_id) !== String(user.id)) {
        const error = new Error('Forbidden: you do not own this module\'s course');
        error.statusCode = 403;
        throw error;
      }
    }

    return await CourseModel.deleteModule(moduleId);
  }
}

module.exports = CourseService;