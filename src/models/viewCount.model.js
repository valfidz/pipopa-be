const { db } = require('../config/database');

class ViewCountModel {
    static async createCount(postId) {
        const connection = await db.getConnection();
        try {
            let count = 0;
            const [viewCount] = await connection.execute(
                `INSERT INTO view_counts (post_id, view_count)
                VALUES (?, ?)`,
                [postId, count]
            )

            return count;
        } finally {
            connection.release();
        }
    }

    static async getCount(postId) {
        const connection = await db.getConnection();
        try {
            const [getCount] = await connection.execute(
                `SELECT view_count
                FROM view_counts
                WHERE post_id = ? AND deleted_at IS NULL`,
                [postId]
            )

            if (!getCount) {
                return false
            }

            return getCount[0]
        } finally {
            connection.release();
        }
    }

    static async updateCount(postId, countValue) {
        const connection = await db.getConnection();
        try {
            // let count = 0;

            // if (countValue == 0) {
            //     count++
            // } else if (countValue > 0) {
            //     count = countValue
            //     count += 1;
            // }

            const [updateCount] = await connection.execute(
                `UPDATE view_counts
                SET view_count = ${countValue}
                WHERE post_id = ${postId} AND deleted_at IS NULL`
            )

            return updateCount;
        } finally {
            connection.release();
        }
    }

    static async deleteCount(postId) {
        const connection = await db.getConnection();
        try {
            const [results] = await connection.execute(
                `UPDATE view_counts
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE post_id = ${postId} AND deleted_at IS NULL`
            )

            return results.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    static async restoreCount(postId) {
        const connection = await db.getConnection();
        try {
            const [results] = await connection.execute(
                `UPDATE view_counts
                SET deleted_at = NULL
                WHERE post_id = ${postId} AND deleted_at IS NOT NULL`
            )

            return results.affectedRows > 0;
        } finally {
            connection.release();
        }
    }
}

module.exports = ViewCountModel;