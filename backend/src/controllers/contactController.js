const { sendContactAdminNotification } = require('../services/emailService');

/**
 * POST /api/contact
 * Public endpoint — saves to nothing (no DB table for generic contact),
 * but sends the message directly to the admin's email inbox.
 */
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      const err = new Error('Name, email, subject and message are all required');
      err.statusCode = 400;
      throw err;
    }

    // Basic email format sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const err = new Error('Please provide a valid email address');
      err.statusCode = 400;
      throw err;
    }

    // Send email to admin — non-blocking
    await sendContactAdminNotification({ name, email, subject, message });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent. We will get back to you within 24 hours.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitContact };
