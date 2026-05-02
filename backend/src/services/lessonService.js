const LessonModel = require('../models/lessonModel');
const CourseModel = require('../models/courseModel');

const getUpcomingLessons = async (userId, role) => {
  if (role === 'student') {
    return await LessonModel.findUpcomingForStudent(userId);
  } else if (role === 'teacher') {
    return await LessonModel.findUpcomingForTeacher(userId);
  } else {
    return await LessonModel.findUpcomingForAdmin();
  }
};

const createLesson = async (data, user) => {
  if (!data.course_id || !data.title || !data.scheduled_at) {
    const err = new Error('Missing required fields: course_id, title, and scheduled_at are required');
    err.statusCode = 400;
    throw err;
  }

  // Ownership check: teachers may only schedule lessons on their own courses
  if (user && user.role === 'teacher') {
    const course = await CourseModel.findById(data.course_id);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    if (String(course.teacher_id) !== String(user.id)) {
      const err = new Error('Forbidden: you do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  return await LessonModel.create(data);
};

const updateLesson = async (id, data, user) => {
  // Ownership check: fetch the lesson and verify the teacher owns its course
  if (user && user.role === 'teacher') {
    const lesson = await LessonModel.findById(id);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    const course = await CourseModel.findById(lesson.course_id);
    if (!course || String(course.teacher_id) !== String(user.id)) {
      const err = new Error('Forbidden: you do not own this lesson\'s course');
      err.statusCode = 403;
      throw err;
    }
  }

  const updatedLesson = await LessonModel.update(id, data);
  if (!updatedLesson) {
    const err = new Error('Lesson not found');
    err.statusCode = 404;
    throw err;
  }
  return updatedLesson;
};

const deleteLesson = async (id, user) => {
  // Ownership check
  if (user && user.role === 'teacher') {
    const lesson = await LessonModel.findById(id);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    const course = await CourseModel.findById(lesson.course_id);
    if (!course || String(course.teacher_id) !== String(user.id)) {
      const err = new Error('Forbidden: you do not own this lesson\'s course');
      err.statusCode = 403;
      throw err;
    }
  }
  await LessonModel.delete(id);
};

module.exports = {
  getUpcomingLessons,
  createLesson,
  updateLesson,
  deleteLesson
};
