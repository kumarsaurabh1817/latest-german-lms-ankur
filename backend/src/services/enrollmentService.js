const EnrollmentModel = require('../models/enrollmentModel');
const CourseModel = require('../models/courseModel');
const PaymentModel = require('../models/paymentModel');

const getMyEnrollments = async (studentId) => {
  return await EnrollmentModel.findByStudent(studentId);
};

const enrollStudent = async ({ student_id, course_id, payment_id }) => {
  // Guard 1: Course must exist and be active
  const course = await CourseModel.findById(course_id);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }
  if (!course.is_active) {
    const err = new Error('This course is no longer available for enrollment');
    err.statusCode = 403;
    throw err;
  }

  // Guard 2: A payment_id must be provided and it must be a completed payment owned by this student
  if (!payment_id) {
    const err = new Error('A valid completed payment is required to enroll');
    err.statusCode = 403;
    throw err;
  }
  const payment = await PaymentModel.findByIdAndUser(payment_id, student_id);
  if (!payment || payment.status !== 'completed') {
    const err = new Error('Payment not found or not yet completed');
    err.statusCode = 403;
    throw err;
  }

  const enrollment = await EnrollmentModel.create({ student_id, course_id, payment_id });
  return enrollment;
};

const getEnrolledStudents = async (courseId) => {
  return await EnrollmentModel.getEnrolledStudents(courseId);
};

module.exports = {
  getMyEnrollments,
  enrollStudent,
  getEnrolledStudents
};
