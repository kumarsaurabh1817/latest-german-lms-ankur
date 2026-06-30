const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getMyEnrollments,
  enrollStudent,
  getEnrolledStudents,
  getAllEnrollments,
  adminEnrollStudent,
  unenrollStudent,
} = require('../controllers/enrollmentController');

// ─── Student / teacher routes ─────────────────────────────────────────────────
// GET  /api/enrollments/my           — student's own enrollments
router.get('/my', authenticate, requireRole('student'), getMyEnrollments);

// POST /api/enrollments              — student enroll (requires completed payment)
router.post('/', authenticate, requireRole('student', 'admin'), enrollStudent);

// GET  /api/enrollments/course/:id   — per-course list (teacher + admin)
router.get('/course/:courseId', authenticate, requireRole('teacher', 'admin'), getEnrolledStudents);

// ─── Admin-only routes ────────────────────────────────────────────────────────
// GET    /api/enrollments            — all enrollments platform-wide
router.get('/', authenticate, requireRole('admin'), getAllEnrollments);

// POST   /api/enrollments/admin      — manually enroll any student (no payment)
router.post('/admin', authenticate, requireRole('admin'), adminEnrollStudent);

// DELETE /api/enrollments/admin      — unenroll a student from a course
router.delete('/admin', authenticate, requireRole('admin'), unenrollStudent);

module.exports = router;
