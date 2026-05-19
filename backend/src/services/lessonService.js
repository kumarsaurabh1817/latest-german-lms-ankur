const LessonModel = require("../models/lessonModel");
const CourseModel = require("../models/courseModel");

const getUpcomingLessons = async (userId, role) => {
  if (role === "student") {
    return await LessonModel.findUpcomingForStudent(userId);
  } else if (role === "teacher") {
    return await LessonModel.findUpcomingForTeacher(userId);
  } else {
    return await LessonModel.findUpcomingForAdmin();
  }
};

const createLesson = async (data, user) => {
  if (!data.course_id || !data.title || !data.scheduled_at) {
    const err = new Error(
      "Missing required fields: course_id, title, and scheduled_at are required",
    );
    err.statusCode = 400;
    throw err;
  }

  // Ownership/active check: verify course exists, is active, and belongs to the teacher
  if (user && user.role === "teacher") {
    const course = await CourseModel.findById(data.course_id);
    if (!course) {
      const err = new Error("Course not found");
      err.statusCode = 404;
      throw err;
    }
    if (!course.is_active) {
      const err = new Error("Cannot add lessons to a deactivated course");
      err.statusCode = 403;
      throw err;
    }
    if (String(course.teacher_id) !== String(user.id)) {
      const err = new Error("Forbidden: you do not own this course");
      err.statusCode = 403;
      throw err;
    }
  } else {
    // Admin path: still verify the course exists and is active
    const course = await CourseModel.findById(data.course_id);
    if (!course) {
      const err = new Error("Course not found");
      err.statusCode = 404;
      throw err;
    }
    if (!course.is_active) {
      const err = new Error("Cannot add lessons to a deactivated course");
      err.statusCode = 403;
      throw err;
    }
  }

  return await LessonModel.create(data);
};

const updateLesson = async (id, data, user) => {
  // Always check existence first — admin path previously skipped this
  const lesson = await LessonModel.findById(id);
  if (!lesson) {
    const err = new Error("Lesson not found");
    err.statusCode = 404;
    throw err;
  }

  // Ownership check: teachers may only edit lessons on their own courses
  if (user && user.role === "teacher") {
    const course = await CourseModel.findById(lesson.course_id);
    if (!course || String(course.teacher_id) !== String(user.id)) {
      const err = new Error("Forbidden: you do not own this lesson's course");
      err.statusCode = 403;
      throw err;
    }
  }

  const updatedLesson = await LessonModel.update(id, data);
  if (!updatedLesson) {
    const err = new Error("Lesson not found");
    err.statusCode = 404;
    throw err;
  }
  return updatedLesson;
};

const deleteLesson = async (id, user) => {
  // Always check existence first — admin path previously had no existence guard
  const lesson = await LessonModel.findById(id);
  if (!lesson) {
    const err = new Error("Lesson not found");
    err.statusCode = 404;
    throw err;
  }

  // Ownership check: teachers may only delete lessons on their own courses
  if (user && user.role === "teacher") {
    const course = await CourseModel.findById(lesson.course_id);
    if (!course || String(course.teacher_id) !== String(user.id)) {
      const err = new Error("Forbidden: you do not own this lesson's course");
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
  deleteLesson,
};
