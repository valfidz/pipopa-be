// const PostModel = require('../../models/post.model');
// const generateSlug = require('../../utils/slugGenerator');

// class PostController {
//   static async createPost(req, res) {
//     try {
//       const {
//         title, category, featuredImage, author, date, contentBlocks,
//         metaTitle, metaDescription, canonical, keywords,
//         ogTitle, ogDescription, ogImage
//       } = req.body;

//       const slug = await generateSlug(title);

//       const postData = { title, slug, category, featuredImage, author, date };
//       const seoData = {
//         metaTitle, metaDescription, canonical, keywords,
//         ogTitle, ogDescription, ogImage
//       };

//       const result = await PostModel.create(postData, contentBlocks, seoData);
//       res.status(201).json(result);
//     } catch (error) {
//       console.error('Error creating post:', error);
//       res.status(500).json({ error: 'Failed to create post' });
//     }
//   }

//   static async getPost(req, res) {
//     try {
//       const post = await PostModel.getBySlug(req.params.slug);
//       if (!post) {
//         return res.status(404).json({ error: 'Post not found' });
//       }
//       res.json(post);
//     } catch (error) {
//       console.error('Error fetching post:', error);
//       res.status(500).json({ error: 'Failed to fetch post' });
//     }
//   }

//   static async updatePost(req, res) {
//     try {
//       const {
//         title, category, featuredImage, author, date, contentBlocks,
//         metaTitle, metaDescription, canonical, keywords,
//         ogTitle, ogDescription, ogImage
//       } = req.body;

//       const postData = { title, category, featuredImage, author, date };
//       const seoData = {
//         metaTitle, metaDescription, canonical, keywords,
//         ogTitle, ogDescription, ogImage
//       };

//       await PostModel.update(req.params.id, postData, contentBlocks, seoData);
//       res.json({ message: 'Post updated successfully' });
//     } catch (error) {
//       console.error('Error updating post:', error);
//       res.status(500).json({ error: 'Failed to update post' });
//     }
//   }

//   static async deletePost(req, res) {
//     try {
//       await PostModel.softDelete(req.params.id);
//       res.json({ message: 'Post deleted successfully' });
//     } catch (error) {
//       console.error('Error deleting post:', error);
//       res.status(500).json({ error: 'Failed to delete post' });
//     }
//   }

//   static async getAllPosts(req, res) {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
      
//       const result = await PostModel.getAll(page, limit);
//       res.json(result);
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       res.status(500).json({ error: 'Failed to fetch posts' });
//     }
//   }
// }

// module.exports = PostController;

const { db } = require('../../config/database');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const { post } = require('../routes/sendmail.routes');

class PostController {
  async create(req, res) {
    const {
      title,
      category,
      content,
      author,
      metaTitle,
      metaDescription,
      keywords,
      status = 'draft', // Default to draft if not specified
    } = req.body;

    const slugBase = slugify(title, { lower: true });
    let slug = slugBase;

    try {
      const generateUniqueSlug = async () => {
        const [rows] = await db.promise().execute(
          "SELECT COUNT(*) AS count FROM posts WHERE slug = ? AND deleted_at IS NULL",
          [slug]
        );

        if (rows[0].count > 0) {
          slug = `${slugBase}-${uuidv4()}`;
          return generateUniqueSlug();
        }
        return slug;
      };

      const finalSlug = await generateUniqueSlug();
      const featuredImage = req.file ? req.file.filename : null;

      await db.promise().execute(
        `INSERT INTO posts (title, slug, category, featured_image, content, author, 
          meta_title, meta_description, keywords, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, finalSlug, category, featuredImage, content, author, metaTitle, 
         metaDescription, keywords, status]
      );

      res.status(201).json({ message: "Post created successfully", slug: finalSlug });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  // Get all posts - with option to filter by status
  async getAllAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status; // Optional status filter

      let whereClause = `deleted_at IS NULL AND status = '${status}'`;

      const [countResults] = await db.promise().query(
        `SELECT COUNT(*) as total FROM posts WHERE ${whereClause}`
      );

      const total = countResults[0].total;

      const [posts] = await db.promise().execute(
        `SELECT id, title, slug, category, featured_image, content, author, 
                meta_title, meta_description, keywords, status, created_at, updated_at 
         FROM posts 
         WHERE ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ${limit} OFFSET ${offset}`
      );

      res.json({
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  // Get all posts for public viewer
  async getAllPublic(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const [countResults] = await db.promise().query(
        `SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL AND status = 'published'`
      );

      const total = countResults[0].total;

      const [posts] = await db.promise().execute(
        `SELECT id, title, slug, category, featured_image, content, author, 
                meta_title, meta_description, keywords, status, created_at, updated_at 
         FROM posts 
         WHERE deleted_at IS NULL AND status = 'published'
         ORDER BY created_at DESC 
         LIMIT ${limit} OFFSET ${offset}`
      );

      res.json({
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  // Get single post - with public/private handling
  async getOneAdmin(req, res) {
    try {
      const postId = parseInt(req.params.id)
    //   let whereClause = "id = ? AND deleted_at IS NULL";

      const [results] = await db.promise().execute(
        `SELECT id, title, slug, category, featured_image, content, author, 
                meta_title, meta_description, keywords, status, created_at, updated_at 
         FROM posts 
         WHERE id = ? AND deleted_at IS NULL`,
        [postId]
      );

      if (results.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(results[0]);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  // Get one post for public viewer
  async getOnePublic(req, res) {
    try {
    //   let whereClause = "slug = ? AND deleted_at IS NULL AND status = 'published'";

      const [results] = await db.promise().execute(
        `SELECT id, title, slug, category, featured_image, content, author, 
                meta_title, meta_description, keywords, status, created_at, updated_at 
         FROM posts 
         WHERE slug = ?
         AND deleted_at IS NULL
         AND status = 'published'`,
        [req.params.slug]
      );

      if (results.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(results[0]);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  async update(req, res) {
    try {
      const {
        title,
        category,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        status,
      } = req.body;

      let updateFields = [
        title,
        category,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        status,
      ];

      const postId = parseInt(req.params.id);

      let updateQuery = `
        UPDATE posts 
        SET title = ?, category = ?, content = ?, author = ?, 
            meta_title = ?, meta_description = ?, keywords = ?, status = ?
      `;

      if (req.file) {
        updateQuery += ", featured_image = ?";
        updateFields.push(req.file.filename);
      }

      updateQuery += " WHERE id = ? AND deleted_at IS NULL";
      updateFields.push(postId);

      const [results] = await db.promise().execute(updateQuery, updateFields);

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post updated successfully" });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  // Update post status only
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const postId = parseInt(req.params.id)

      if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const [results] = await db.promise().execute(
        "UPDATE posts SET status = ? WHERE id = ? AND deleted_at IS NULL",
        [status, postId]
      );

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post status updated successfully" });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  async delete(req, res) {
    try {
      const postId = parseInt(req.params.id)
      const [results] = await db.promise().execute(
        "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE slug = ? AND deleted_at IS NULL",
        [postId]
      );

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  async restore(req, res) {
    try {
      const postId = parseInt(req.params.id)
      const [results] = await db.promise().execute(
        "UPDATE posts SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
        [postId]
      );

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Post not found or already restored" });
      }

      res.json({ message: "Post restored successfully" });
    } catch (error) {
      console.error("Error restoring post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }
}

module.exports = new PostController();