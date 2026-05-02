const EnrollmentModel = require('../models/enrollmentModel');

const getMyEnrollments = async (studentId) => {
  return await EnrollmentModel.findByStudent(studentId);
};

const enrollStudent = async ({ student_id, course_id, payment_id }) => {
  // Check if already enrolled? The model has ON CONFLICT DO NOTHING.
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
