const AuthService = require('../services/authService');

const buildCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
};

const buildClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax'
  };
};

const register = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.register(req.body);

    // Unapproved teachers must not receive an auth cookie.
    // If we set one here they would be silently re-logged-in on every
    // page refresh (getMe() validates the cookie regardless of approval status).
    const isPendingTeacher = user.role === 'teacher' && !user.is_teacher_approved;

    const response = res.status(201);
    if (!isPendingTeacher) {
      response.cookie('token', token, buildCookieOptions());
    }

    response.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);
    
    const cookieOptions = buildCookieOptions();

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
  res.clearCookie('token', buildClearCookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, logout };
