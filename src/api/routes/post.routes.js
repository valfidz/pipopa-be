const express = require('express');
const PostController = require('../controllers/post.controller');

const router = express.Router();

router.post('/posts', PostController.createPost);
router.get('/posts/:slug', PostController.getPost);
router.put('/posts/:id', PostController.updatePost);
router.delete('/posts/:id', PostController.deletePost);
router.get('/posts', PostController.getAllPosts);

module.exports = router;