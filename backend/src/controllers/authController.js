const AuthService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.register(req.body);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    res.status(201)
      .cookie('token', token, cookieOptions)
      .json({ 
        success: true, 
        user 
      });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('token', token, cookieOptions).json({ 
      success: true, 
      user 
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is guaranteed to be set — the authenticate middleware runs first
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, logout };
