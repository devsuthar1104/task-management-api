const asyncHandler = require('express-async-handler');
const User = require('../models/User');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find()
    .select('-password')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('projects', 'name status');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  delete req.body.password;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete yourself'
    });
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
