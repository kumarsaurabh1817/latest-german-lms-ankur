const AuthService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { ZodError } = require('zod');

const register = async (req, res, next) => {
  try {
    // Validate request body against Zod schema
    const validatedData = registerSchema.parse(req.body);
    
    // Call service
    const { user, token } = await AuthService.register(validatedData);
    
    res.status(201).json({ 
      success: true, 
      token, 
      user 
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        errors: err.errors.map(e => e.message) 
      });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, token } = await AuthService.login(validatedData.email, validatedData.password);
    
    res.json({ 
      success: true, 
      token, 
      user 
    });
  } catch (err) {
    if (err instanceof ZodError) {
       return res.status(400).json({ 
        success: false, 
        errors: err.errors.map(e => e.message) 
      });
    }
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
