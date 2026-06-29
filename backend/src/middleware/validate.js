const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Zod v4 uses `issues`; v3 used `errors` — support both for safety
      const issueList = err.issues ?? err.errors ?? [];
      const firstError = issueList[0]?.message || 'Validation failed';
      return res.status(400).json({ 
        success: false, 
        message: firstError,
        errors: issueList 
      });
    }
    next(err);
  }
};

module.exports = { validate };
