const router = require('express').Router();
const { authenticate, requireRole, requireApprovedTeacher } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { uploadThumbnail } = require('../controllers/uploadController');

router.post(
  '/thumbnail',
  authenticate,
  requireRole('teacher', 'admin'),
  requireApprovedTeacher,
  uploadImage.single('file'),
  uploadThumbnail
);

module.exports = router;
