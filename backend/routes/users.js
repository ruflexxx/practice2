const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/users/profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Get task stats
  const totalTasks = await Task.countDocuments({ user: req.user._id });
  const completedTasks = await Task.countDocuments({ user: req.user._id, status: 'completed' });
  const pendingTasks = await Task.countDocuments({ user: req.user._id, status: 'pending' });
  const inProgressTasks = await Task.countDocuments({ user: req.user._id, status: 'in-progress' });

  // Overdue tasks
  const overdueTasks = await Task.countDocuments({
    user: req.user._id,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  });

  res.json({
    success: true,
    user,
    stats: { totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks }
  });
}));

// PUT /api/users/profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'preferences'];
  const updates = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true
  });

  res.json({ success: true, message: 'Profile updated', user });
}));

// PUT /api/users/change-password
router.put('/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
}));

module.exports = router;
