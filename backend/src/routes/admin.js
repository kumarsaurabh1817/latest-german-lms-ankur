const router = require('express').Router();
const { createAdmin } = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllCoursesAdmin } = require('../controllers/courseController');

// POST /api/admin/create
// Protected by x-admin-secret header — call only from Postman, not from frontend
router.post('/create', createAdmin);

// GET /api/admin/courses — all courses (published + unpublished), admin-only
router.get('/courses', authenticate, requireRole('admin'), getAllCoursesAdmin);

module.exports = router;
