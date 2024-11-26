// const express = require('express');
// const PostController = require('../controllers/post.controller');

// const router = express.Router();

// router.post('/posts', PostController.createPost);
// router.get('/posts/:slug', PostController.getPost);
// router.put('/posts/:id', PostController.updatePost);
// router.delete('/posts/:id', PostController.deletePost);
// router.get('/posts', PostController.getAllPosts);

// module.exports = router;

const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const upload = require('../../config/multer');

// Admin routes (all posts, including drafts)
router.post('/posts', upload.single('featuredImage'), postController.create);
router.get('/posts', postController.getAll);
router.get('/posts/:slug', postController.getOne);
router.put('/posts/:slug', upload.single('featuredImage'), postController.update);
router.patch('/posts/:slug/status', postController.updateStatus); // New endpoint for status updates
router.delete('/posts/:slug', postController.delete);
router.post('/posts/:slug/restore', postController.restore);

// Public routes (only published posts)
router.get('/public/all', (req, res, next) => {
  req.query.public = 'true';
  next();
}, postController.getAll);

router.get('/public/:slug', (req, res, next) => {
  req.query.public = 'true';
  next();
}, postController.getOne);

module.exports = router;