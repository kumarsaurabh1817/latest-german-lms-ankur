const userService = require('../services/userService');

const getAllUsers = async (req, res, next) => {
  const { role } = req.query;
  try {
    const users = await userService.getAllUsers({ role });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  const { role } = req.body;
  try {
    const user = await userService.updateUserRole(req.params.id, role);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const approveTeacher = async (req, res, next) => {
  const { approved } = req.body;
  try {
    const user = await userService.setTeacherApproval(req.params.id, approved);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateProfile, updateUserRole, approveTeacher };
