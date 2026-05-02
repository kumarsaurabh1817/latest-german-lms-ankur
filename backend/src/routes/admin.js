const router = require('express').Router();
const { createAdmin } = require('../controllers/adminController');

// POST /api/admin/create
// Protected by x-admin-secret header — call only from Postman, not from frontend
router.post('/create', createAdmin);

module.exports = router;
