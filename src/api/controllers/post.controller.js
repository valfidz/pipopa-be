// const { db } = require('../../config/database');
// const slugify = require('slugify');
// const { v4: uuidv4 } = require('uuid');
// const { post } = require('../routes/sendmail.routes');

// class PostController {
//   async create(req, res) {
//     const {
//       title,
//       category,
//       content,
//       author,
//       metaTitle,
//       metaDescription,
//       keywords,
//       status = 'draft', // Default to draft if not specified
//     } = req.body;

//     const slugBase = slugify(title, { lower: true });
//     let slug = slugBase;

//     try {
//       const generateUniqueSlug = async () => {
//         const [rows] = await db.promise().execute(
//           "SELECT COUNT(*) AS count FROM posts WHERE slug = ? AND deleted_at IS NULL",
//           [slug]
//         );

//         if (rows[0].count > 0) {
//           slug = `${slugBase}-${uuidv4()}`;
//           return generateUniqueSlug();
//         }
//         return slug;
//       };

//       const finalSlug = await generateUniqueSlug();
//       const featuredImage = req.file ? req.file.filename : null;

//       await db.promise().execute(
//         `INSERT INTO posts (title, slug, category, featured_image, content, author, 
//           meta_title, meta_description, keywords, status) 
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [title, finalSlug, category, featuredImage, content, author, metaTitle, 
//          metaDescription, keywords, status]
//       );

//       res.status(201).json({ message: "Post created successfully", slug: finalSlug });
//     } catch (error) {
//       console.error("Error creating post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   // Get all posts - with option to filter by status
//   async getAllAdmin(req, res) {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const offset = (page - 1) * limit;
//       const status = req.query.status; // Optional status filter

//       let whereClause = `deleted_at IS NULL AND status = '${status}'`;

//       const [countResults] = await db.promise().query(
//         `SELECT COUNT(*) as total FROM posts WHERE ${whereClause}`
//       );

//       const total = countResults[0].total;

//       const [posts] = await db.promise().execute(
//         `SELECT id, title, slug, category, featured_image, content, author, 
//                 meta_title, meta_description, keywords, status, created_at, updated_at 
//          FROM posts 
//          WHERE ${whereClause}
//          ORDER BY created_at DESC 
//          LIMIT ${limit} OFFSET ${offset}`
//       );

//       res.json({
//         posts,
//         pagination: {
//           total,
//           pages: Math.ceil(total / limit),
//           currentPage: page,
//           limit
//         }
//       });
//     } catch (error) {
//       console.error("Error fetching posts:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   // Get all posts for public viewer
//   async getAllPublic(req, res) {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const offset = (page - 1) * limit;

//       const [countResults] = await db.promise().query(
//         `SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL AND status = 'published'`
//       );

//       const total = countResults[0].total;

//       const [posts] = await db.promise().execute(
//         `SELECT id, title, slug, category, featured_image, content, author, 
//                 meta_title, meta_description, keywords, status, created_at, updated_at 
//          FROM posts 
//          WHERE deleted_at IS NULL AND status = 'published'
//          ORDER BY created_at DESC 
//          LIMIT ${limit} OFFSET ${offset}`
//       );

//       res.json({
//         posts,
//         pagination: {
//           total,
//           pages: Math.ceil(total / limit),
//           currentPage: page,
//           limit
//         }
//       });
//     } catch (error) {
//       console.error("Error fetching posts:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   // Get single post - with public/private handling
//   async getOneAdmin(req, res) {
//     try {
//       const postId = parseInt(req.params.id)
//     //   let whereClause = "id = ? AND deleted_at IS NULL";

//       const [results] = await db.promise().execute(
//         `SELECT id, title, slug, category, featured_image, content, author, 
//                 meta_title, meta_description, keywords, status, created_at, updated_at 
//          FROM posts 
//          WHERE id = ? AND deleted_at IS NULL`,
//         [postId]
//       );

//       if (results.length === 0) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       res.json(results[0]);
//     } catch (error) {
//       console.error("Error fetching post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   // Get one post for public viewer
//   async getOnePublic(req, res) {
//     try {
//     //   let whereClause = "slug = ? AND deleted_at IS NULL AND status = 'published'";

//       const [results] = await db.promise().execute(
//         `SELECT id, title, slug, category, featured_image, content, author, 
//                 meta_title, meta_description, keywords, status, created_at, updated_at 
//          FROM posts 
//          WHERE slug = ?
//          AND deleted_at IS NULL
//          AND status = 'published'`,
//         [req.params.slug]
//       );

//       if (results.length === 0) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       res.json(results[0]);
//     } catch (error) {
//       console.error("Error fetching post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   async update(req, res) {
//     try {
//       const {
//         title,
//         category,
//         content,
//         author,
//         metaTitle,
//         metaDescription,
//         keywords,
//         status,
//       } = req.body;

//       let updateFields = [
//         title,
//         category,
//         content,
//         author,
//         metaTitle,
//         metaDescription,
//         keywords,
//         status,
//       ];

//       const postId = parseInt(req.params.id);

//       let updateQuery = `
//         UPDATE posts 
//         SET title = ?, category = ?, content = ?, author = ?, 
//             meta_title = ?, meta_description = ?, keywords = ?, status = ?
//       `;

//       if (req.file) {
//         updateQuery += ", featured_image = ?";
//         updateFields.push(req.file.filename);
//       }

//       updateQuery += " WHERE id = ? AND deleted_at IS NULL";
//       updateFields.push(postId);

//       const [results] = await db.promise().execute(updateQuery, updateFields);

//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       res.json({ message: "Post updated successfully" });
//     } catch (error) {
//       console.error("Error updating post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   // Update post status only
//   async updateStatus(req, res) {
//     try {
//       const { status } = req.body;
//       const postId = parseInt(req.params.id)

//       if (!['draft', 'published'].includes(status)) {
//         return res.status(400).json({ message: "Invalid status value" });
//       }

//       const [results] = await db.promise().execute(
//         "UPDATE posts SET status = ? WHERE id = ? AND deleted_at IS NULL",
//         [status, postId]
//       );

//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       res.json({ message: "Post status updated successfully" });
//     } catch (error) {
//       console.error("Error updating post status:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   async delete(req, res) {
//     try {
//       const postId = parseInt(req.params.id)
//       const [results] = await db.promise().execute(
//         "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE slug = ? AND deleted_at IS NULL",
//         [postId]
//       );

//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       res.json({ message: "Post deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }

//   async restore(req, res) {
//     try {
//       const postId = parseInt(req.params.id)
//       const [results] = await db.promise().execute(
//         "UPDATE posts SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
//         [postId]
//       );

//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: "Post not found or already restored" });
//       }

//       res.json({ message: "Post restored successfully" });
//     } catch (error) {
//       console.error("Error restoring post:", error);
//       res.status(500).json({ message: "Database error" });
//     }
//   }
// }

const PostModel = require('../../models/post.model');
const ViewCountModel = require('../../models/viewCount.model');
const dotenv = require('dotenv');

dotenv.config();

class PostController {
  async create(req, res) {
    try {
      const title = req.body.title ? req.body.title : "";
      const categoryId = req.body.category ? parseInt(req.body.category) : null;
      const userId = req.user.id ? req.user.id : "";
      const content = req.body.content ? req.body.content : "";
      const author = req.body.author ? req.body.author : "";
      const metaTitle = req.body.meta_title ? req.body.meta_title : "";
      const metaDescription = req.body.meta_description ? req.body.meta_description : "";
      const keywords = req.body.keywords ? req.body.keywords : "";
      const status = req.body.status ? req.body.status : "draft";
      const featuredImage = req.file ? req.file.filename : null;

      if (!title) {
        return res.status(400).json({
          message: 'Title is required'
        })
      }

      if (!categoryId) {
        return res.status(400).json({
          message: 'Category is required'
        })
      }

      if (!userId) {
        return res.status(400).json({
          message: 'User ID is required'
        })
      }

      if (!content) {
        return res.status(400).json({
          message: 'Content is required'
        })
      }

      if (!author) {
        return res.status(400).json({
          message: 'Author is required'
        })
      }

      const postData = {
        title,
        categoryId,
        userId,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        status,
        featuredImage
      };

      const slug = await PostModel.createPost(postData);
      
      const postId = slug.postId;

      const viewCount = await ViewCountModel.createCount(postId);

      res.status(201).json({
        message: 'Post created successfully',
        slug,
        viewCount
      });
    } catch (error) {
      console.error("Error creating post: ", error);
      res.status(500).json({ message: "Error create post" });
    }
  }

  async getAllAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const role = req.user.role ? req.user.role : "";
      const userId = req.user.id ? req.user.id : "";

      if (!role) {
        return res.status(400).json({
          message: 'User role is required'
        })
      }

      if (!userId) {
        return res.status(400).json({
          message: 'User ID is required'
        })
      }

      const result = await PostModel.getAllAdminPosts(page, limit, status, role, userId);

      res.json(result);
    } catch (error) {
      console.error("Error fetching post: ", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  }

  async getAllPublic(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await PostModel.getAllPublicPosts(page, limit);

      res.json(result);
    } catch (error) {
      console.error("Error fetching post: ", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  }

  async getOneAdmin(req, res) {
    try {
      const postId = parseInt(req.params.id);

      if (!postId) {
        return res.status(400).json({
          message: 'Post ID is required'
        })
      }

      const post = await PostModel.getAdminPostById(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error fetching post: ", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  }

  async getOnePublic(req, res) {
    try {
      if (!req.params.slug) {
        return res.status(400).json({
          message: "Post's slug is required"
        });
      }

      const post = await PostModel.getPublicPostBySlug(req.params.slug);
      let viewCount;

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const postId = post.id;
      const getCount = await ViewCountModel.getCount(postId);

      if (!getCount) {
        return res.status(404).json({ message: 'Post count not found' })
      }

      viewCount = parseInt(getCount.view_count);
      viewCount += 1;

      const updateCount = await ViewCountModel.updateCount(postId, viewCount);

      return res.status(200).json({
        post,
        viewCount
      });
    } catch (error) {
      console.error("Error fetching post: ", error);
      return res.status(500).json({ message: "Error fetching post" });
    }
  }

  async update(req, res) {
    try {
      const postId = req.params.id ? parseInt(req.params.id) : null;

      if (!postId) {
        return res.status(400).json({
          message: 'Post ID is required'
        })
      }

      const title = req.body.title ? req.body.title : "";
      const categoryId = req.body.category ? parseInt(req.body.category) : null;
      const userId = req.user.id ? req.user.id : "";
      const content = req.body.content ? req.body.content : "";
      const author = req.body.author ? req.body.author : "";
      const metaTitle = req.body.meta_title ? req.body.meta_title : "";
      const metaDescription = req.body.meta_description ? req.body.meta_description : "";
      const keywords = req.body.keywords ? req.body.keywords : "";
      const status = req.body.status ? req.body.status : "draft";
      const featuredImage = req.file ? req.file.filename : null;

      if (!title) {
        return res.status(400).json({
          message: 'Title is required'
        })
      }

      if (!categoryId) {
        return res.status(400).json({
          message: 'Category is required'
        })
      }

      if (!userId) {
        return res.status(400).json({
          message: 'User ID is required'
        })
      }

      if (!content) {
        return res.status(400).json({
          message: 'Content is required'
        })
      }

      if (!author) {
        return res.status(400).json({
          message: 'Author is required'
        })
      }

      const postData = {
        title,
        categoryId,
        userId,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        status,
        featuredImage
      };

      const updated = await PostModel.updatePost(postId, postData);

      if (!updated) {
        return res.status(404).json({ message: "Post update failed" });
      }

      res.json({ message: "Post updated successfully" });
    } catch (error) {
      console.error("Error update post: ", error);
      return res.status(500).json({ message: "Error update post" });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const postId = parseInt(req.params.id);

      if (!postId) {
        return res.status(400).json({
          message: 'Post ID is required'
        })
      }

      const updated = await PostModel.updatePostStatus(postId, status);

      if (!updated) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post status updated successfully" });
    } catch (error) {
      if (error.message === "Invalid status value") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  async delete(req, res) {
    try {
      const postId = parseInt(req.params.id);

      if (!postId) {
        return res.status(400).json({
          message: 'Post ID is required'
        })
      }

      const deleted = await PostModel.deletePost(postId);

      if (!deleted) {
        return res.status(404).json({ message: "Post not found" });
      }

      const deleteCount = await ViewCountModel.deleteCount(postId);
      if (!deleteCount) {
        return res.status(404).json({ message: 'View count not found' })
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }

  async restore(req, res) {
    try {
      const postId = parseInt(req.params.id);

      if (!postId) {
        return res.status(400).json({
          message: 'Post ID is required'
        })
      }

      const restored = await PostModel.restorePost(postId);

      if (!restored) {
        return res.status(404).json({ message: "Post not found or already restored" });
      }

      const restoreCount = await ViewCountModel.restoreCount(postId);
      if (!restoreCount) {
        return res.status(404).json({ message: 'View count not found or already resotred' });
      }

      res.json({ message: "Post restored successfully" });
    } catch (error) {
      console.error("Error restoring post:", error);
      res.status(500).json({ message: "Database error" });
    }
  }
}

module.exports = new PostController();