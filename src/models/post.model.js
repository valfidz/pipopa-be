const { db } = require('../config/database');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

class PostModel {
  // Create a new post
  static async createPost(postData) {
    try {
      const {
        title,
        categoryId,
        userId,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        tags,
        status,
        featuredImage
      } = postData;
  
      const slugBase = slugify(title, { lower: true });
      let slug = slugBase;
  
      const generateUniqueSlug = async () => {
        const [rows] = await db.execute(
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
  
      const keywordsJson = JSON.stringify(keywords || []);
      const tagsJson = JSON.stringify(tags || []);
  
      const [result] = await db.execute(
        `INSERT INTO posts (title, slug, category_id, user_id, featured_image, content, author, meta_title, meta_description, keywords, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, categoryId, userId, featuredImage, content, author, metaTitle, metaDescription, keywordsJson, tagsJson, status]
      );
  
      const postId = result.insertId;
  
      return {
        postId,
        slug: finalSlug
      };
    } catch (error) {
      console.error("Failed to create post:", error.message)
      throw new Error("Failed to create post");
    }
  }

  // Get all posts for admin (with status filter)
  static async getAllAdminPosts(page = 1, limit = 10, status, role, userId, search, searchField) {
    try {
      const offset = (page - 1) * limit;
      const numericPage  = parseInt(page);
      const numericLimit = parseInt(limit);
      
      let whereClause = 'p.deleted_at IS NULL';
      let whereClauseCount = 'deleted_at IS NULL';
      let whereParams = [];
      let countParams = [];
  
      if (status) {
        whereClause += ` AND p.status = ?`;
        whereClauseCount += ` AND status = ?`;
        whereParams.push(status);
        countParams.push(status);
      }
  
      if ((role && role == 'author') && userId) {
        whereClause += ` AND p.user_id = ?`;
        whereClauseCount += ` AND user_id = ?`;
        whereParams.push(userId);
        countParams.push(userId);
      }

      // search condition
      if (search && search.trim() !== '') {
        const searchValue = `%${search.trim()}%`;

        if (searchField == 'all') {
          whereClause += ` AND (
            p.title LIKE ? OR
            p.author LIKE ? OR
            c.name LIKE ? OR
            p.status LIKE ? OR
            DATE_FORMAT(p.created_at, '%d/%m/%Y') LIKE ?
          )`;
          whereParams.push(searchValue, searchValue, searchValue, searchValue, searchValue);

          whereClauseCount += ` AND id IN (
            SELECT p.id
            FROM posts p
            JOIN categories c ON p.category_id = c.id
            WHERE p.deleted_at IS NULL
            AND (
              p.title LIKE ? OR 
              p.author LIKE ? OR
              c.name LIKE ? OR 
              p.status LIKE ? OR 
              DATE_FORMAT(p.created_at, '%d/%m/%Y') LIKE ?
            )
          )`;
          countParams.push(searchValue, searchValue, searchValue, searchValue, searchValue);
        } else {
          switch (searchField) {
            case 'title':
              whereClause += ` AND p.title LIKE ?`;
              whereClauseCount += ` AND title LIKE ?`;
              whereParams.push(searchValue);
              countParams.push(searchValue);
              break;
            case 'category':
              whereClause += ` AND c.name LIKE ?`;
              whereClauseCount = `${whereClauseCount} AND id IN (
                SELECT p.id FROM posts p
                JOIN categories c ON p.category_id = c.id
                WHERE c.name LIKE ? AND p.deleted_at IS NULL
              )`;
              whereParams.push(searchValue);
              countParams.push(searchValue);
              break;
            case 'status':
              whereClause += ` AND p.status LIKE ?`;
              whereClauseCount += ` AND status LIKE ?`;
              whereParams.push(searchValue);
              countParams.push(searchValue);
              break;
            case 'author':
              whereClause += ` AND p.author LIKE ?`;
              whereClauseCount += ` AND author LIKE ?`;
              whereParams.push(searchValue);
              countParams.push(searchValue);
              break;
            case 'date':
              whereClause += ` AND DATE_FORMAT(p.created_at, '%d/%m/%Y') LIKE ?`;
              whereClauseCount += ` AND DATE_FORMAT(created_at, '%d/%m/%Y') LIKE ?`;
              whereParams.push(searchValue);
              countParams.push(searchValue);
              break;
          }
        }
      }
  
      const [countResults] = await db.query(
        `SELECT COUNT(*) as total FROM posts WHERE ${whereClauseCount}`,
        countParams
      );
  
      const total = countResults[0].total;

      const query = `
        SELECT p.id, p.title, p.slug, p.category_id, p.user_id, p.featured_image, 
              p.content, p.author, p.meta_title, p.meta_description, p.keywords, 
              p.status, c.name AS category_name, p.created_at, p.updated_at
        FROM posts p
        JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${numericLimit} OFFSET ${offset}
      `;

      const [posts] = await db.query(query, whereParams);
  
      return {
        posts,
        pagination: {
          total,
          pages: Math.ceil(total/limit),
          currentPage: numericPage,
          limit: numericLimit
        }
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
      });
      throw new Error('Failed to fetch all posts')
    }
  };

  // Get all published posts for public
  static async getAllPublicPosts(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
  
      const [countResults] = await db.query(
        `SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL AND status = 'published'`
      );
  
      const total = countResults[0].total;
  
      const [posts] = await db.execute(
        `SELECT p.id,
                p.title,
                p.slug,
                p.category_id, 
                p.featured_image,
                p.content,
                p.author, 
                p.meta_title, 
                p.meta_description,
                p.keywords,
                p.status,
                p.created_at,
                p.updated_at,
                c.name as category_name 
         FROM posts p
         JOIN categories c ON p.category_id = c.id
         WHERE p.deleted_at IS NULL AND p.status = 'published'
         ORDER BY p.created_at DESC 
         LIMIT ${limit} OFFSET ${offset}`
      );
  
      return {
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      console.error('Failed to fetch all post:', error.message);
      throw new Error('Failed to fetch all post');
    }
  }

  // Get single post for admin
  static async getAdminPostById(postId) {
    try {
      const [results] = await db.execute(
        `SELECT
            p.id,
            p.title,
            p.slug,
            p.category_id,
            p.featured_image,
            p.content,
            p.author,
            p.meta_title,
            p.meta_description,
            p.keywords,
            p.tags,
            p.status,
            p.created_at,
            p.updated_at,
            c.name as category_name
        FROM posts p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.deleted_at IS NULL`,
        [postId]
      );
  
      if (!results[0]) {
        return null;
      }
  
      const post = results[0];
  
      return post
    } catch (error) {
      console.error('Error fetching post by ID:', error.message);
      throw new Error('Failed to fetch post')
    }
  }

  // Get single published post for public
  static async getPublicPostBySlug(slug) {
    try {
      const [results] = await db.execute(
        `SELECT p.id,
                p.title,
                p.slug,
                p.category_id,
                p.featured_image,
                p.content, 
                p.author, 
                p.meta_title,
                p.meta_description,
                p.keywords,
                p.status,
                p.tags,
                p.created_at,
                p.updated_at,
                c.name as category_name 
         FROM posts p
         JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?
         AND p.deleted_at IS NULL
         AND p.status = 'published'`,
        [slug]
      );
  
      return results[0] || null;
    } catch (error) {
      console.error("Failed to fetch post:", error.message);
      throw new Error("Failed to fetch post");
    }
  }

  // Update post
  static async updatePost(postId, postData) {
    try {
      const {
        title,
        categoryId,
        userId,
        content,
        author,
        metaTitle,
        metaDescription,
        keywords,
        tags,
        status,
        featuredImage
      } = postData;
  
      const keywordsJson = JSON.stringify(keywords || []);
      const tagsJson = JSON.stringify(tags || []);
  
      let updateFields = [
        title,
        categoryId,
        userId,
        content,
        author,
        metaTitle,
        metaDescription,
        keywordsJson,
        tagsJson,
        status,
      ];
  
      let updateQuery = `
        UPDATE posts 
        SET title = ?, category_id = ?, user_id = ?, content = ?, author = ?, 
            meta_title = ?, meta_description = ?, keywords = ?, tags = ?, status = ?
      `;
  
      if (featuredImage) {
        updateQuery += ", featured_image = ?";
        updateFields.push(featuredImage);
      }
  
      updateQuery += ", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL";
      updateFields.push(postId);
  
      try {
        const [results] = await db.execute(updateQuery, updateFields);
    
        return results.affectedRows > 0;
      } catch (error) {
        console.error('Error updating post', error);
        throw new Error('Error updating update post');
      }
    } catch (error) {
      console.error("Failed to update post:", error.message);
      throw new Error("Failed to update post");
    }

  }

  // Update post status
  static async updatePostStatus(postId, status) {
    try {
      if (!['draft', 'published'].includes(status)) {
        throw new Error("Invalid status value");
      }
  
      const [results] = await db.execute(
        "UPDATE posts SET status = ? WHERE id = ? AND deleted_at IS NULL",
        [status, postId]
      );
  
      return results.affectedRows > 0;
    } catch (error) {
      console.error("Failed to update status:", error.message);
      throw new Error("Failed to update status");
    }
  }

  // Soft delete post
  static async deletePost(postId) {
    try {
      const [results] = await db.execute(
        "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        [postId]
      );
  
      return results.affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete post:", error.message);
      throw new Error("Failed to delete post");
    }
  }

  // Restore soft-deleted post
  static async restorePost(postId) {
    try {
      const [results] = await db.execute(
        "UPDATE posts SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
        [postId]
      );
  
      return results.affectedRows > 0;
    } catch (error) {
      console.error("Failed to restore post:", error.message);
      throw new Error("Failed to restore post");
    }
  }
}

module.exports = PostModel;