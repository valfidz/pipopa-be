const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');
const { isAuthenticated, isAuthorized } = require('../../middlewares/auth.middleware');

router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategory);
router.post('/categories', isAuthenticated, isAuthorized(['admin']), CategoryController.create);
router.put('/categories/:id', isAuthenticated, isAuthorized(['admin']), CategoryController.updateCategory);
router.delete('/categories/:id', isAuthenticated, isAuthorized(['admin']), CategoryController.deleteCategory);

module.exports = router;