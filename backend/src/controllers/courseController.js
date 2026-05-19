const CourseService = require('../services/courseService');

exports.getAllCourses = async (req, res, next) => {
  try {
    const { level } = req.query;
    const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2'];
    if (level && !VALID_LEVELS.includes(level)) {
      return res.status(400).json({ success: false, message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
    }
    const courses = await CourseService.listCourses(req.query);
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await CourseService.getCourseDetails(req.params.id);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

exports.getCourseModules = async (req, res, next) => {
  try {
    const content = await CourseService.getCourseContent(req.params.id);
    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await CourseService.createCourse(req.body, req.user);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    // Pass req.user so service can enforce ownership
    const course = await CourseService.updateCourse(req.params.id, req.body, req.user);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await CourseService.deleteCourse(req.params.id, req.user);
    res.json({ success: true, message: 'Course deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// Module methods
exports.createModule = async (req, res, next) => {
  try {
    const module = await CourseService.createModule(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, data: module });
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const { title, description, order_index } = req.body;
    const module = await CourseService.updateModule(req.params.moduleId, { title, description, order_index }, req.user);
    res.json({ success: true, data: module });
  } catch(err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    await CourseService.deleteModule(req.params.moduleId, req.user);
    res.json({ success: true, message: 'Module deleted successfully' });
  } catch(err) {
    next(err);
  }
};
