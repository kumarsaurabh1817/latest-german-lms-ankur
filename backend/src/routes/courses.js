const router = require('express').Router();
const { authenticate, requireRole, requireApprovedTeacher } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { courseSchema, courseUpdateSchema } = require('../validators/courseValidator');
const {
  getAllCourses,
  getMyCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getCourseModules,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/courseController');

router.get('/', getAllCourses);
// Teacher-only: returns ALL of the teacher's courses (published + unpublished)
router.get('/mine', authenticate, requireRole('teacher', 'admin'), getMyCourses);
router.get('/:id', getCourseById);
router.get('/:id/modules', getCourseModules);
router.post('/:id/modules', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, createModule);
router.put('/:id/modules/:moduleId', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, updateModule);
router.delete('/:id/modules/:moduleId', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, deleteModule);
router.post('/', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, validate(courseSchema), createCourse);
router.put('/:id', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, validate(courseUpdateSchema), updateCourse);
router.patch('/:id/publish', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, togglePublish);
router.delete('/:id', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, deleteCourse);

module.exports = router;
