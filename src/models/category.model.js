const { db } = require('../config/database');


class CategoryModel {
    static async createCategory(categoryData) {
        const connection = await db.getConnection();
        try {
            const name = categoryData;

            const [result] = await connection.execute(
                `INSERT INTO categories
                (name, created_at)
                VALUES (?, NOW())`,
                [name]
            )

            return result;
        } finally {
            connection.release();
        }
    }

    static async updateCategory(categoryId, categoryData) {
        const connection = await db.getConnection();
        try {
            const name = categoryData;

            const [result] = await connection.execute(
                `UPDATE categories
                SET name = '${name}' WHERE id = ${categoryId} AND deleted_at IS NULL`,
            )

            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    static async getCategories(page = 1, limit = 10, search) {
        const connection = await db.getConnection();
        try {
            const offset = (page - 1) * limit;
            const numericPage = parseInt(page);
            const numericLimit = parseInt(limit);

            let whereClause = 'deleted_at IS NULL';
            let params = []

            if (search && search.trim() !== '') {
                const searchValue = `%${search.trim()}%`;

                whereClause += ` AND name LIKE ?`;
                params.push(searchValue);
            }

            const [countResults] = await db.query(
                `SELECT COUNT(*) as total FROM categories WHERE ${whereClause}`,
                params
            );

            const total = countResults[0].total;

            const [result] = await connection.execute(
                `SELECT id, name FROM categories
                    WHERE ${whereClause}
                    ORDER BY created_at DESC
                    LIMIT ${numericLimit} OFFSET ${offset}`,
                    params
            )

            return {
                result,
                pagination: {
                    total,
                    pages: Math.ceil(total/limit),
                    currentPage: numericPage,
                    limit: numericLimit
                }
            };
        } finally {
            connection.release();
        }
    }

    static async getCategory(categoryId) {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                `SELECT name FROM categories WHERE id = ${categoryId} AND deleted_at IS NULL`
            )

            return result[0];
        } finally {
            connection.release();
        }
    }

    static async deleteCategory(categoryId) {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                `UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
                [categoryId]
            )

            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }
}

module.exports = CategoryModel;