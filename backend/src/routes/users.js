const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllUsers, updateProfile, updateUserRole, approveTeacher } = require('../controllers/userController');

router.get('/', authenticate, requireRole('admin'), getAllUsers);
router.put('/profile', authenticate, updateProfile);
router.put('/:id/role', authenticate, requireRole('admin'), updateUserRole);
router.put('/:id/approve-teacher', authenticate, requireRole('admin'), approveTeacher);

module.exports = router;
