// const pool = require('../config/database');

// class PostModel {
//   static async create(postData, contentBlocks, seoData) {
//     const connection = await pool.getConnection();
    
//     try {
//       await connection.beginTransaction();

//       const [postResult] = await connection.query(
//         `INSERT INTO posts (
//           title, slug, category, featured_image_url, author, 
//           publication_date, deleted_at
//         ) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
//         [postData.title, postData.slug, postData.category, postData.featuredImage, 
//          postData.author, postData.date]
//       );

//       const postId = postResult.insertId;

//       // Insert content blocks
//       for (let i = 0; i < contentBlocks.length; i++) {
//         const block = contentBlocks[i];
//         await connection.query(
//           `INSERT INTO content_blocks (
//             post_id, block_type, content, image_url, image_alt, display_order
//           ) VALUES (?, ?, ?, ?, ?, ?)`,
//           [
//             postId,
//             block.type,
//             block.type === 'paragraph' ? block.content : null,
//             block.type === 'image' ? block.url : null,
//             block.type === 'image' ? block.alt : null,
//             i
//           ]
//         );
//       }

//       // Insert SEO metadata
//       await connection.query(
//         `INSERT INTO seo_metadata (
//           post_id, meta_title, meta_description, canonical_url,
//           keywords, og_title, og_description, og_image_url
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           postId,
//           seoData.metaTitle,
//           seoData.metaDescription,
//           seoData.canonical,
//           seoData.keywords,
//           seoData.ogTitle,
//           seoData.ogDescription,
//           seoData.ogImage
//         ]
//       );

//       await connection.commit();
//       return { id: postId, slug: postData.slug };
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   }

//   static async getBySlug(slug) {
//     const connection = await pool.getConnection();
    
//     try {
//       const [posts] = await connection.query(
//         'SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL',
//         [slug]
//       );

//       if (posts.length === 0) {
//         return null;
//       }

//       const post = posts[0];

//       const [blocks] = await connection.query(
//         'SELECT * FROM content_blocks WHERE post_id = ? ORDER BY display_order',
//         [post.id]
//       );

//       const [seoData] = await connection.query(
//         'SELECT * FROM seo_metadata WHERE post_id = ?',
//         [post.id]
//       );

//       return {
//         ...post,
//         contentBlocks: blocks.map(block => ({
//           id: block.id,
//           type: block.block_type,
//           ...(block.block_type === 'paragraph' ? { content: block.content } : {
//             url: block.image_url,
//             alt: block.image_alt
//           })
//         })),
//         seo: seoData[0]
//       };
//     } finally {
//       connection.release();
//     }
//   }

//   static async update(id, postData, contentBlocks, seoData) {
//     const connection = await pool.getConnection();
    
//     try {
//       await connection.beginTransaction();

//       await connection.query(
//         `UPDATE posts 
//          SET title = ?, category = ?, featured_image_url = ?, 
//              author = ?, publication_date = ?
//          WHERE id = ? AND deleted_at IS NULL`,
//         [postData.title, postData.category, postData.featuredImage, 
//          postData.author, postData.date, id]
//       );

//       await connection.query(
//         'DELETE FROM content_blocks WHERE post_id = ?',
//         [id]
//       );

//       for (let i = 0; i < contentBlocks.length; i++) {
//         const block = contentBlocks[i];
//         await connection.query(
//           `INSERT INTO content_blocks (
//             post_id, block_type, content, image_url, image_alt, display_order
//           ) VALUES (?, ?, ?, ?, ?, ?)`,
//           [
//             id,
//             block.type,
//             block.type === 'paragraph' ? block.content : null,
//             block.type === 'image' ? block.url : null,
//             block.type === 'image' ? block.alt : null,
//             i
//           ]
//         );
//       }

//       await connection.query(
//         `UPDATE seo_metadata 
//          SET meta_title = ?, meta_description = ?, canonical_url = ?,
//              keywords = ?, og_title = ?, og_description = ?, og_image_url = ?
//          WHERE post_id = ?`,
//         [
//           seoData.metaTitle,
//           seoData.metaDescription,
//           seoData.canonical,
//           seoData.keywords,
//           seoData.ogTitle,
//           seoData.ogDescription,
//           seoData.ogImage,
//           id
//         ]
//       );

//       await connection.commit();
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   }

//   static async softDelete(id) {
//     const connection = await pool.getConnection();
    
//     try {
//       await connection.beginTransaction();
//       await connection.query(
//         'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
//         [id]
//       );
//       await connection.commit();
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   }

//   static async getAll(page = 1, limit = 10) {
//     const connection = await pool.getConnection();
    
//     try {
//       const offset = (page - 1) * limit;

//       const [posts] = await connection.query(
//         `SELECT * FROM posts 
//          WHERE deleted_at IS NULL
//          ORDER BY created_at DESC 
//          LIMIT ? OFFSET ?`,
//         [limit, offset]
//       );

//       const [countResult] = await connection.query(
//         'SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL'
//       );

//       return {
//         posts,
//         pagination: {
//           page,
//           limit,
//           total: countResult[0].total,
//           totalPages: Math.ceil(countResult[0].total / limit)
//         }
//       };
//     } finally {
//       connection.release();
//     }
//   }
// }

const { db } = require('../config/database');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

class PostModel {
  // Create a new post
  static async createPost(postData) {
    const {
      title,
      category,
      content,
      author,
      metaTitle,
      metaDescription,
      keywords,
      status = 'draft',
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

    await db.execute(
      `INSERT INTO posts (title, slug, category, featured_image, content, author, meta_title, meta_description, keywords, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, category, featuredImage, content, author, metaTitle, metaDescription, keywords, status]
    );

    return finalSlug;
  }

  // Get all posts for admin (with status filter)
  static async getAllAdminPosts(page = 1, limit = 10, status, role, username) {
    const offset = (page - 1) * limit;
    let whereClause = `deleted_at IS NULL`;

    if (status) {
      whereClause += ` AND status = '${status}'`;
    }

    if (role && role == 'author') {
      whereClause += ` AND author = '${username}'`;
    }

    const [countResults] = await db.query(
      `SELECT COUNT(*) as total FROM posts WHERE ${whereClause}`
    );

    const total = countResults[0].total;

    const [posts] = await db.execute(
      `SELECT id, title, slug, category, featured_image, content, author, meta_title, meta_description, keywords, status, created_at, updated_at
      FROM posts
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}`
    );

    return {
      posts,
      pagination: {
        total,
        pages: Math.ceil(total/limit),
        currentPage: page,
        limit
      }
    }
  };

  // Get all published posts for public
  static async getAllPublicPosts(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [countResults] = await db.query(
      `SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL AND status = 'published'`
    );

    const total = countResults[0].total;

    const [posts] = await db.execute(
      `SELECT id, title, slug, category, featured_image, content, author, 
              meta_title, meta_description, keywords, status, created_at, updated_at 
       FROM posts 
       WHERE deleted_at IS NULL AND status = 'published'
       ORDER BY created_at DESC 
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
  }

  // Get single post for admin
  static async getAdminPostById(postId) {
    const [results] = await db.execute(
      `SELECT id, title, slug, category, featured_image, content, author, 
              meta_title, meta_description, keywords, status, created_at, updated_at 
       FROM posts 
       WHERE id = ? AND deleted_at IS NULL`,
      [postId]
    );

    return results[0] || null;
  }

  // Get single published post for public
  static async getPublicPostBySlug(slug) {
    const [results] = await db.execute(
      `SELECT id, title, slug, category, featured_image, content, author, 
              meta_title, meta_description, keywords, status, created_at, updated_at 
       FROM posts 
       WHERE slug = ?
       AND deleted_at IS NULL
       AND status = 'published'`,
      [slug]
    );

    return results[0] || null;
  }

  // Update post
  static async updatePost(postId, postData) {
    const {
      title,
      category,
      content,
      author,
      metaTitle,
      metaDescription,
      keywords,
      status,
      featuredImage
    } = postData;

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

    let updateQuery = `
      UPDATE posts 
      SET title = ?, category = ?, content = ?, author = ?, 
          meta_title = ?, meta_description = ?, keywords = ?, status = ?
    `;

    if (featuredImage) {
      updateQuery += ", featured_image = ?";
      updateFields.push(featuredImage);
    }

    updateQuery += " WHERE id = ? AND deleted_at IS NULL";
    updateFields.push(postId);

    const [results] = await db.execute(updateQuery, updateFields);

    return results.affectedRows > 0;
  }

  // Update post status
  static async updatePostStatus(postId, status) {
    if (!['draft', 'published'].includes(status)) {
      throw new Error("Invalid status value");
    }

    const [results] = await db.execute(
      "UPDATE posts SET status = ? WHERE id = ? AND deleted_at IS NULL",
      [status, postId]
    );

    return results.affectedRows > 0;
  }

  // Soft delete post
  static async deletePost(postId) {
    const [results] = await db.execute(
      "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
      [postId]
    );

    return results.affectedRows > 0;
  }

  // Restore soft-deleted post
  static async restorePost(postId) {
    const [results] = await db.execute(
      "UPDATE posts SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
      [postId]
    );

    return results.affectedRows > 0;
  }
}

module.exports = PostModel;