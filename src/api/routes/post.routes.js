const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const upload = require('../../config/multer');
const { isAuthenticated, isAuthorized, isPostOwner } = require('../../middlewares/auth.middleware');

// Admin routes (all posts, including drafts)
router.post('/posts', isAuthenticated, isAuthorized(['admin', 'author']), upload.single('featuredImage'), postController.create);
router.get('/posts', isAuthenticated, isAuthorized(['admin', 'author']), postController.getAllAdmin);
router.get('/posts/:id', isAuthenticated, isAuthorized(['admin', 'author']), isPostOwner, postController.getOneAdmin);
router.put('/posts/:id', isAuthenticated, isAuthorized(['admin', 'author']), isPostOwner, upload.single('featuredImage'), postController.update);
router.patch('/posts/:id/status', isAuthenticated, isAuthorized(['admin', 'author']), isPostOwner, postController.updateStatus); // New endpoint for status updates
router.delete('/posts/:id', isAuthenticated, isAuthorized(['admin', 'author']), isPostOwner, postController.delete);
router.post('/posts/:id/restore', isAuthenticated, isAuthorized(['admin', 'author']), isPostOwner, postController.restore);

// Public routes (only published posts)
router.get('/public/all', (req, res, next) => {
  req.query.public = 'true';
  next();
}, postController.getAllPublic);

router.get('/public/:slug', (req, res, next) => {
  req.query.public = 'true';
  next();
}, postController.getOnePublic);

module.exports = router;