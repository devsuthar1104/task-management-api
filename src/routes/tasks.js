const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { 
  validateCreateTask, 
  validateObjectId,
  validatePagination 
} = require('../utils/validators');

router.use(protect);

router
  .route('/')
  .get(validatePagination, validate, getTasks)
  .post(validateCreateTask, validate, createTask);

router
  .route('/:id')
  .get(validateObjectId, validate, getTask)
  .put(validateObjectId, validate, updateTask)
  .delete(validateObjectId, validate, deleteTask);

router
  .route('/:id/comments')
  .post(validateObjectId, validate, addComment);

router
  .route('/:id/status')
  .patch(validateObjectId, validate, updateTaskStatus);

module.exports = router;
