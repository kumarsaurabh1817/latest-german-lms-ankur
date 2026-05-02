const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getMyEnrollments, enrollStudent, getEnrolledStudents } = require('../controllers/enrollmentController');

router.get('/my', authenticate, requireRole('student'), getMyEnrollments);
router.post('/', authenticate, requireRole('student', 'admin'), enrollStudent);
router.get('/course/:courseId', authenticate, requireRole('teacher', 'admin'), getEnrolledStudents);

module.exports = router;
