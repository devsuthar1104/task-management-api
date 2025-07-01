const { body, param, query } = require('express-validator');

exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
];

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

exports.validateCreateProject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

exports.validateCreateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('project')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),
  
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

exports.validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .matches(/^-?\w+$/).withMessage('Invalid sort format')
];
