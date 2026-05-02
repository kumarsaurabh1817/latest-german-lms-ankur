const UserModel = require('../models/userModel');

const makeError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getAllUsers = async (filters) => {
  return await UserModel.findAll(filters);
};

const getUserById = async (id) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw makeError('User not found', 404);
  }
  return user;
};

const updateProfile = async (userId, data) => {
  // Filter out undefined values
  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.country !== undefined) updates.country = data.country;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

  if (Object.keys(updates).length === 0) {
    return await UserModel.findById(userId);
  }

  const updatedUser = await UserModel.update(userId, updates);
  if (!updatedUser) {
    throw makeError('User not found', 404);
  }
  return updatedUser;
};

const updateUserRole = async (userId, role) => {
  const validRoles = ['student', 'teacher', 'admin'];
  if (!validRoles.includes(role)) {
    throw makeError('Invalid role', 400);
  }

  const updatedUser = await UserModel.update(userId, { role });
  if (!updatedUser) {
    throw makeError('User not found', 404);
  }
  return updatedUser;
};

const setTeacherApproval = async (userId, approved) => {
  const target = await UserModel.findById(userId);
  if (!target) {
    throw makeError('User not found', 404);
  }

  if (target.role !== 'teacher') {
    throw makeError('Only teacher accounts can be approved', 400);
  }

  const updatedUser = await UserModel.update(userId, { is_teacher_approved: Boolean(approved) });
  return updatedUser;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUserRole,
  setTeacherApproval
};
