const PostModel = require('../../models/post.model');
const generateSlug = require('../../utils/slugGenerator');

class PostController {
  static async createPost(req, res) {
    try {
      const {
        title, category, featuredImage, author, date, contentBlocks,
        metaTitle, metaDescription, canonical, keywords,
        ogTitle, ogDescription, ogImage
      } = req.body;

      const slug = await generateSlug(title);

      const postData = { title, slug, category, featuredImage, author, date };
      const seoData = {
        metaTitle, metaDescription, canonical, keywords,
        ogTitle, ogDescription, ogImage
      };

      const result = await PostModel.create(postData, contentBlocks, seoData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }

  static async getPost(req, res) {
    try {
      const post = await PostModel.getBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  static async updatePost(req, res) {
    try {
      const {
        title, category, featuredImage, author, date, contentBlocks,
        metaTitle, metaDescription, canonical, keywords,
        ogTitle, ogDescription, ogImage
      } = req.body;

      const postData = { title, category, featuredImage, author, date };
      const seoData = {
        metaTitle, metaDescription, canonical, keywords,
        ogTitle, ogDescription, ogImage
      };

      await PostModel.update(req.params.id, postData, contentBlocks, seoData);
      res.json({ message: 'Post updated successfully' });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  }

  static async deletePost(req, res) {
    try {
      await PostModel.softDelete(req.params.id);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  static async getAllPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await PostModel.getAll(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
}

module.exports = PostController;