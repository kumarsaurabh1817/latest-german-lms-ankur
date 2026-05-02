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

module.exports = { getMyEnrollments, enrollStudent, getEnrolledStudents };
