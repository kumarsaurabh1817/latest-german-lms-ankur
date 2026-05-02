const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getUpcomingLessons, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');

router.get('/upcoming', authenticate, getUpcomingLessons);
router.post('/', authenticate, requireRole('teacher', 'admin'), createLesson);
router.put('/:id', authenticate, requireRole('teacher', 'admin'), updateLesson);
router.delete('/:id', authenticate, requireRole('teacher', 'admin'), deleteLesson);

module.exports = router;
