const { db } = require('../config/database');
const { hashPassword } = require('../utils/passwordUtils');
const { v4: uuidv4 } = require('uuid');

class User {
    // Create a new user
    static async create(userData) {
        const connection = await db.getConnection();
        try {
            // Generate UUID for the user ID
            const userId = uuidv4();

            // Hash password before storing
            userData.password = await hashPassword(userData.password);

            const [result] = await connection.execute(
                `INSERT INTO users
                (id, username, email, password, role, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    userId,
                    userData.username,
                    userData.email,
                    userData.password,
                    userData.role || 'author'
                ]
            );

            return userId;
        } finally {
            connection.release();
        }
    }

    // Find user by email
    static async findByEmail(email) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`,
                [email]
            );

            return rows[0] || null
        } finally {
            connection.release();
        }
    }

    // Find by username
    static async findByUsername(username) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM users WHERE username = ? AND deleted_at IS NULL`,
                [username]
            );

            return rows[0] || null
        } finally {
            connection.release();
        }
    }

    // Update user
    static async update(userId, updateData) {
        const connection = await db.getConnection();
        try {
            // if password being updated, hash it
            if (updateData.password) {
                updateData.password = await hashPassword(updateData.password);
            }

            const updateFields = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');

            const values = [...Object.values(updateData), userId];

            await connection.execute(
                `UPDATE users
                SET ${updateFields}, updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL`,
                values
            );

            return true;
        } finally {
            connection.release();
        }
    }

    // Soft delete user
    static async delete(userId) {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                `UPDAtE users
                SET deleted_at = NOW()
                WHERE id = ?`,
                [userId]
            );

            return true;
        } finally {
            connection.release();
        }
    }
}

module.exports = User;