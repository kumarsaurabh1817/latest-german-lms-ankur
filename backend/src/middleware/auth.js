const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    void err;
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const requireApprovedTeacher = (req, res, next) => {
  if (req.user.role === 'teacher' && !req.user.is_teacher_approved) {
    return res.status(403).json({ success: false, message: 'Teacher account pending admin approval' });
  }
  next();
};

module.exports = { authenticate, requireRole, requireApprovedTeacher };