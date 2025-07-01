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
