const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.post('/users', UserController.createUser);
router.get('/users/email/:email', UserController.getUserByEmail);
router.get('/users/username/:username', UserController.getUserByUsername);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

module.exports = router;