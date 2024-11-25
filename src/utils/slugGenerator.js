const slugify = require('slugify');
const pool = require('../config/database');

async function generateSlug(title) {
    let slug = slugify(title, { lower: true });
    const connection = await pool.getConnection();

    try {
        let counter = 0;
        let uniqueSlug = slug;

        while (true) {
            const [rows] = await connection.query(
                'SELECT id FROM posts WHERE slug = ?',
                [uniqueSlug] 
            );

            if (rows.length === 0) break;
            counter++;
            uniqueSlug = `${slug}-${counter}`;
        }
        return uniqueSlug;
    } finally {
        connection.release();
    }
}

module.exports = generateSlug;