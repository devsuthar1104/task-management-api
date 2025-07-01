const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const User = require('../models/User');

exports.getProjects = asyncHandler(async (req, res, next) => {
  const query = {
    $or: [
      { owner: req.user.id },
      { 'team.user': req.user.id }
    ]
  };

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.priority) {
    query.priority = req.query.priority;
  }

  if (!req.query.includeArchived) {
    query.isArchived = false;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('owner', 'name email')
    .populate('team.user', 'name email')
    .sort(req.query.sort || '-createdAt')
    .limit(limit)
    .skip(startIndex);

  const total = await Project.countDocuments(query);

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: projects
  });
});

exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('team.user', 'name email')
    .populate({
      path: 'tasks',
      select: 'title status priority assignedTo',
      populate: {
        path: 'assignedTo',
        select: 'name email'
      }
    });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  const hasAccess = project.owner._id.toString() === req.user.id ||
    project.team.some(member => member.user._id.toString() === req.user.id);

  if (!hasAccess && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this project'
    });
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.createProject = asyncHandler(async (req, res, next) => {
  req.body.owner = req.user.id;

  const project = await Project.create(req.body);

  await User.findByIdAndUpdate(req.user.id, {
    $push: { projects: project._id }
  });

  res.status(201).json({
    success: true,
    data: project
  });
});

exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this project'
    });
  }

  delete req.body.owner;

  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this project'
    });
  }

  await project.remove();

  await User.findByIdAndUpdate(project.owner, {
    $pull: { projects: project._id }
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.addTeamMember = asyncHandler(async (req, res, next) => {
  const { userId, role = 'viewer' } = req.body;

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to add team members'
    });
  }

  const userToAdd = await User.findById(userId);
  if (!userToAdd) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const isAlreadyMember = project.team.some(
    member => member.user.toString() === userId
  );

  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      error: 'User is already a team member'
    });
  }

  project.team.push({
    user: userId,
    role,
    joinedAt: Date.now()
  });

  await project.save();

  await User.findByIdAndUpdate(userId, {
    $addToSet: { projects: project._id }
  });

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.removeTeamMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to remove team members'
    });
  }

  project.team = project.team.filter(
    member => member.user.toString() !== req.params.userId
  );

  await project.save();

  await User.findByIdAndUpdate(req.params.userId, {
    $pull: { projects: project._id }
  });

  res.status(200).json({
    success: true,
    data: project
  });
});
