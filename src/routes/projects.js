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
