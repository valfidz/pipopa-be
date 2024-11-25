const pool = require('../config/database');

class PostModel {
  static async create(postData, contentBlocks, seoData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [postResult] = await connection.query(
        `INSERT INTO posts (
          title, slug, category, featured_image_url, author, 
          publication_date, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [postData.title, postData.slug, postData.category, postData.featuredImage, 
         postData.author, postData.date]
      );

      const postId = postResult.insertId;

      // Insert content blocks
      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        await connection.query(
          `INSERT INTO content_blocks (
            post_id, block_type, content, image_url, image_alt, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            postId,
            block.type,
            block.type === 'paragraph' ? block.content : null,
            block.type === 'image' ? block.url : null,
            block.type === 'image' ? block.alt : null,
            i
          ]
        );
      }

      // Insert SEO metadata
      await connection.query(
        `INSERT INTO seo_metadata (
          post_id, meta_title, meta_description, canonical_url,
          keywords, og_title, og_description, og_image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          postId,
          seoData.metaTitle,
          seoData.metaDescription,
          seoData.canonical,
          seoData.keywords,
          seoData.ogTitle,
          seoData.ogDescription,
          seoData.ogImage
        ]
      );

      await connection.commit();
      return { id: postId, slug: postData.slug };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getBySlug(slug) {
    const connection = await pool.getConnection();
    
    try {
      const [posts] = await connection.query(
        'SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL',
        [slug]
      );

      if (posts.length === 0) {
        return null;
      }

      const post = posts[0];

      const [blocks] = await connection.query(
        'SELECT * FROM content_blocks WHERE post_id = ? ORDER BY display_order',
        [post.id]
      );

      const [seoData] = await connection.query(
        'SELECT * FROM seo_metadata WHERE post_id = ?',
        [post.id]
      );

      return {
        ...post,
        contentBlocks: blocks.map(block => ({
          id: block.id,
          type: block.block_type,
          ...(block.block_type === 'paragraph' ? { content: block.content } : {
            url: block.image_url,
            alt: block.image_alt
          })
        })),
        seo: seoData[0]
      };
    } finally {
      connection.release();
    }
  }

  static async update(id, postData, contentBlocks, seoData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE posts 
         SET title = ?, category = ?, featured_image_url = ?, 
             author = ?, publication_date = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [postData.title, postData.category, postData.featuredImage, 
         postData.author, postData.date, id]
      );

      await connection.query(
        'DELETE FROM content_blocks WHERE post_id = ?',
        [id]
      );

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        await connection.query(
          `INSERT INTO content_blocks (
            post_id, block_type, content, image_url, image_alt, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            block.type,
            block.type === 'paragraph' ? block.content : null,
            block.type === 'image' ? block.url : null,
            block.type === 'image' ? block.alt : null,
            i
          ]
        );
      }

      await connection.query(
        `UPDATE seo_metadata 
         SET meta_title = ?, meta_description = ?, canonical_url = ?,
             keywords = ?, og_title = ?, og_description = ?, og_image_url = ?
         WHERE post_id = ?`,
        [
          seoData.metaTitle,
          seoData.metaDescription,
          seoData.canonical,
          seoData.keywords,
          seoData.ogTitle,
          seoData.ogDescription,
          seoData.ogImage,
          id
        ]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async softDelete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAll(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;

      const [posts] = await connection.query(
        `SELECT * FROM posts 
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL'
      );

      return {
        posts,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = PostModel;