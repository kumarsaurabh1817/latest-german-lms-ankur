const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { submitConsultation, getAllConsultations, updateConsultationStatus } = require('../controllers/consultationController');

router.post('/', submitConsultation);
router.get('/', authenticate, requireRole('admin', 'teacher'), getAllConsultations);
router.put('/:id', authenticate, requireRole('admin'), updateConsultationStatus);

module.exports = router;
