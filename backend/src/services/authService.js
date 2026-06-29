const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

class AuthService {
  static async register(userData) {
    const { email, password, role } = userData;
    const normalizedEmail = email.trim().toLowerCase();

    // Check existing
    const existingUser = await UserModel.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const normalizedRole = role === 'teacher' ? 'teacher' : 'student';
    const isTeacherApproved = normalizedRole === 'teacher' ? false : true;
    // Create new user
    const newUser = await UserModel.create({
      ...userData,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      is_teacher_approved: isTeacherApproved,
    });

    // Generate token
    const token = generateToken(newUser.id);
    return { user: newUser, token };
  }

  static async login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      const error = new Error('Please create an account first');
      error.statusCode = 404;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Block unapproved teachers from signing in.
    // A dedicated errorCode lets the frontend show a distinct "pending" banner
    // instead of a generic red error message.
    if (user.role === 'teacher' && !user.is_teacher_approved) {
      const error = new Error(
        'Your teacher account is pending admin approval. You will be able to sign in once an admin reviews your account.'
      );
      error.statusCode = 403;
      error.errorCode = 'TEACHER_PENDING_APPROVAL';
      throw error;
    }

    const token = generateToken(user.id);
    
    // Remove password from response
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  }
}

module.exports = AuthService;