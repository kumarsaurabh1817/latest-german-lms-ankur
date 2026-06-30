const enrollmentService = require('../services/enrollmentService');

const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getMyEnrollments(req.user.id);
    res.json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};

const enrollStudent = async (req, res, next) => {
  try {
    const { course_id, payment_id } = req.body;
    // Always use the server-authenticated user ID — never trust body.student_id
    const result = await enrollmentService.enrollStudent({
      student_id: req.user.id,
      course_id,
      payment_id,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getEnrolledStudents = async (req, res, next) => {
  try {
    const students = await enrollmentService.getEnrolledStudents(req.params.courseId);
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/enrollments  (admin-only)
 * Returns all active enrollments platform-wide.
 */
const getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/enrollments/admin  (admin-only)
 * Manually enroll any student in any active course without a payment.
 * Body: { student_id, course_id }
 */
const adminEnrollStudent = async (req, res, next) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'student_id and course_id are required' });
    }
    const result = await enrollmentService.adminEnrollStudent({ student_id, course_id });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/enrollments/admin  (admin-only)
 * Unenroll (soft-delete) a student from a course.
 * Body: { student_id, course_id }
 */
const unenrollStudent = async (req, res, next) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'student_id and course_id are required' });
    }
    const result = await enrollmentService.unenrollStudent({ student_id, course_id });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyEnrollments, enrollStudent, getEnrolledStudents, getAllEnrollments, adminEnrollStudent, unenrollStudent };
