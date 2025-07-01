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
