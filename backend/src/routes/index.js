const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/courses', require('./courses'));
router.use('/lessons', require('./lessons'));
router.use('/enrollments', require('./enrollments'));
router.use('/consultations', require('./consultations'));
router.use('/contact', require('./contact'));
router.use('/payments', require('./payments'));
router.use('/users', require('./users'));
router.use('/uploads', require('./uploads'));
router.use('/admin', require('./admin'));

module.exports = router;
