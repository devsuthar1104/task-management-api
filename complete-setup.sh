#!/bin/bash

echo "🚀 Creating remaining Task Management API files..."

# Create Task Controller
echo "📁 Creating Task Controller..."
cat > src/controllers/taskController.js << 'EOF'
const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getTasks = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.project) {
    query.project = req.query.project;
  }

  if (req.query.assignedTo) {
    query.assignedTo = req.query.assignedTo;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.priority) {
    query.priority = req.query.priority;
  }

  if (req.query.dueDateFrom || req.query.dueDateTo) {
    query.dueDate = {};
    if (req.query.dueDateFrom) {
      query.dueDate.$gte = new Date(req.query.dueDateFrom);
    }
    if (req.query.dueDateTo) {
      query.dueDate.$lte = new Date(req.query.dueDateTo);
    }
  }

  const userProjects = await Project.find({
    $or: [
      { owner: req.user.id },
      { 'team.user': req.user.id }
    ]
  }).select('_id');

  query.project = { $in: userProjects.map(p => p._id) };

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(req.query.sort || '-createdAt')
    .limit(limit)
    .skip(startIndex);

  const total = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: tasks
  });
});

exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'name status')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('dependencies', 'title status')
    .populate('comments.user', 'name email');

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => member.user.toString() === req.user.id);

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this task'
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

exports.createTask = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.body.project);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => member.user.toString() === req.user.id);

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to create tasks in this project'
    });
  }

  req.body.createdBy = req.user.id;

  const task = await Task.create(req.body);

  res.status(201).json({
    success: true,
    data: task
  });
});

exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => member.user.toString() === req.user.id);

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this task'
    });
  }

  delete req.body.project;
  delete req.body.createdBy;

  if (req.body.status === 'done' && task.status !== 'done') {
    req.body.completedAt = Date.now();
  } else if (req.body.status !== 'done') {
    req.body.completedAt = null;
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: task
  });
});

exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.role === 'editor')
    );

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this task'
    });
  }

  await task.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.addComment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => member.user.toString() === req.user.id);

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to comment on this task'
    });
  }

  task.comments.push({
    user: req.user.id,
    text: req.body.text,
    createdAt: Date.now()
  });

  await task.save();

  res.status(200).json({
    success: true,
    data: task
  });
});

exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user.id ||
    project.team.some(member => member.user.toString() === req.user.id) ||
    task.assignedTo.toString() === req.user.id;

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this task'
    });
  }

  task.status = status;
  
  if (status === 'done') {
    task.completedAt = Date.now();
  } else {
    task.completedAt = null;
  }

  await task.save();

  res.status(200).json({
    success: true,
    data: task
  });
});
EOF

# Create Routes
echo "📁 Creating Routes..."

# Auth Routes
cat > src/routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { validateRegister, validateLogin } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

module.exports = router;
EOF

# User Routes
cat > src/routes/users.js << 'EOF'
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const { validate } = require('../middleware/validation');

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(validateObjectId, validate, getUser)
  .put(validateObjectId, validate, updateUser)
  .delete(validateObjectId, validate, deleteUser);

module.exports = router;
EOF

# Project Routes
cat > src/routes/projects.js << 'EOF'
const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { 
  validateCreateProject, 
  validateObjectId,
  validatePagination 
} = require('../utils/validators');

router.use(protect);

router
  .route('/')
  .get(validatePagination, validate, getProjects)
  .post(validateCreateProject, validate, createProject);

router
  .route('/:id')
  .get(validateObjectId, validate, getProject)
  .put(validateObjectId, validate, updateProject)
  .delete(validateObjectId, validate, deleteProject);

router
  .route('/:id/team')
  .post(validateObjectId, validate, addTeamMember);

router
  .route('/:id/team/:userId')
  .delete(removeTeamMember);

module.exports = router;
EOF

# Task Routes
cat > src/routes/tasks.js << 'EOF'
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
EOF

echo "✅ All files created successfully!"
echo ""
echo "🎉 Your Task Management API is ready to run!"
