const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-()]{7,15}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  task: Joi.object({
    title: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    dueDate: Joi.date().optional().allow(null),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    category: Joi.string().hex().length(24).optional().allow(null)
  }),

  taskUpdate: Joi.object({
    title: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    dueDate: Joi.date().optional().allow(null),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    category: Joi.string().hex().length(24).optional().allow(null)
  }),

  category: Joi.object({
    name: Joi.string().min(1).max(30).required().messages({
      'any.required': 'Category name is required'
    }),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().messages({
      'string.pattern.base': 'Please provide a valid hex color (e.g. #6366f1)'
    }),
    icon: Joi.string().optional(),
    description: Joi.string().max(100).optional().allow('')
  })
};

// Middleware factory
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next();

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

module.exports = { validate };
