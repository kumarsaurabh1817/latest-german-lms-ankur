const router = require('express').Router();
const { submitContact } = require('../controllers/contactController');

// Public — no auth needed
// Rate-limited by the spamLimiter in app.js (10 req / 15 min)
router.post('/', submitContact);

module.exports = router;
