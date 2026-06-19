const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/categories
router.get('/', protect, asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort('name');

  // Add task count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const taskCount = await Task.countDocuments({ category: cat._id, user: req.user._id });
      return { ...cat.toObject(), taskCount };
    })
  );

  res.json({ success: true, data: categoriesWithCount });
}));

// POST /api/categories
router.post('/', protect, validate('category'), asyncHandler(async (req, res) => {
  const category = await Category.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, message: 'Category created', data: category });
}));

// PUT /api/categories/:id
router.put('/:id', protect, validate('category'), asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({ success: true, message: 'Category updated', data: category });
}));

// DELETE /api/categories/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  // Unlink tasks from this category before deleting
  await Task.updateMany({ category: category._id }, { category: null });
  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
