const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const firstError = err.errors[0]?.message || 'Validation failed';
      return res.status(400).json({ 
        success: false, 
        message: firstError,
        errors: err.errors 
      });
    }
    next(err);
  }
};

module.exports = { validate };
