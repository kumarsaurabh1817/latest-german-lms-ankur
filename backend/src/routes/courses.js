const router = require('express').Router();
const { authenticate, requireRole, requireApprovedTeacher } = require('../middleware/auth');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseModules,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/courseController');

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.get('/:id/modules', getCourseModules);
router.post('/:id/modules', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, createModule);
router.put('/:id/modules/:moduleId', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, updateModule);
router.delete('/:id/modules/:moduleId', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, deleteModule);
router.post('/', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, createCourse);
router.put('/:id', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, updateCourse);
router.delete('/:id', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, deleteCourse);

module.exports = router;
