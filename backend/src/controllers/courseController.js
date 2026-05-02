const CourseService = require('../services/courseService');
const { courseSchema } = require('../validators/courseValidator');
const { ZodError } = require('zod');

exports.getAllCourses = async (req, res, next) => {
  try {
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
    const validatedData = courseSchema.parse(req.body);
    const course = await CourseService.createCourse(validatedData, req.user);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
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
