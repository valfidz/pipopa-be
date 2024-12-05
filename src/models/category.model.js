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

    static async getCategories() {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                `SELECT name FROM categories WHERE deleted_at IS NULL`
            )

            return result[0];
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