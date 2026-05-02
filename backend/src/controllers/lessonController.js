const lessonService = require('../services/lessonService');

const getUpcomingLessons = async (req, res, next) => {
  try {
    const lessons = await lessonService.getUpcomingLessons(req.user.id, req.user.role);
    res.json({ success: true, data: lessons });
  } catch (err) {
    next(err);
  }
};

const createLesson = async (req, res, next) => {
  try {
    // Pass req.user so service can enforce ownership for teachers
    const lesson = await lessonService.createLesson(req.body, req.user);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body, req.user);
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    await lessonService.deleteLesson(req.params.id, req.user);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUpcomingLessons, createLesson, updateLesson, deleteLesson };
