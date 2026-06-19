const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/tasks?search=&status=&priority=&category=&page=1&limit=10&sort=createdAt
router.get('/', protect, asyncHandler(async (req, res) => {
  const {
    search, status, priority, category,
    page = 1, limit = 10,
    sort = '-createdAt',
    dueBefore, dueAfter
  } = req.query;

  // Build query
  const query = { user: req.user._id };

  // Text search
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { tags: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  // Filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  // Date range filters
  if (dueBefore || dueAfter) {
    query.dueDate = {};
    if (dueAfter) query.dueDate.$gte = new Date(dueAfter);
    if (dueBefore) query.dueDate.$lte = new Date(dueBefore);
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Allowed sort fields
  const allowedSorts = ['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority', '-priority', 'title', '-title'];
  const sortField = allowedSorts.includes(sort) ? sort : '-createdAt';

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('category', 'name color icon')
      .sort(sortField)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    }
  });
}));

// GET /api/tasks/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    .populate('category', 'name color icon');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, data: task });
}));

// POST /api/tasks
router.post('/', protect, validate('task'), asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user._id });
  await task.populate('category', 'name color icon');

  res.status(201).json({ success: true, message: 'Task created', data: task });
}));

// PUT /api/tasks/:id
router.put('/:id', protect, validate('taskUpdate'), asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  ).populate('category', 'name color icon');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, message: 'Task updated', data: task });
}));

// DELETE /api/tasks/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, message: 'Task deleted' });
}));

// PATCH /api/tasks/:id/status  (quick status toggle)
router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status, completedAt: status === 'completed' ? new Date() : null },
    { new: true }
  ).populate('category', 'name color icon');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, message: 'Status updated', data: task });
}));

module.exports = router;
