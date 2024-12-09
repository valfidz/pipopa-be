const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { isAuthenticated, isAuthorized } = require('../../middlewares/auth.middleware');

// create new user
router.post('/users', isAuthenticated, isAuthorized(['admin']), UserController.createUser);

//get all user
router.get('/users/all', isAuthenticated, isAuthorized(['admin']), UserController.getAllUser);

// get user by email or username
router.get('/users', isAuthenticated, UserController.getUser);

// get user by ID
router.get('/users/:id', isAuthenticated, UserController.getUserById);
// router.get('/users/email', UserController.getUserByEmail);
// router.get('/users/username', UserController.getUserByUsername);

// update existing user
router.put('/users/:id', isAuthenticated, UserController.updateUser);

// update password
router.put('/users/updatepass/:id', isAuthenticated, UserController.updatePassword);

// delete existing user
router.delete('/users/:id', isAuthenticated, isAuthorized(['admin']), UserController.deleteUser);

module.exports = router;