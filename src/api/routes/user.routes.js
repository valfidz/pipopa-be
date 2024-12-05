const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.post('/users', UserController.createUser);
router.get('/users', UserController.getUser);
// router.get('/users/email', UserController.getUserByEmail);
// router.get('/users/username', UserController.getUserByUsername);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

module.exports = router;