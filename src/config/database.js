const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Initialize database connection and create tables
const initDatabase = () => {
    db.connect((err) => {
      if (err) {
        console.error("Database connection failed:", err.stack);
        return;
      }
      console.log("Connected to database.");
  
      // Create tables with status field
      db.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          category VARCHAR(255),
          featured_image VARCHAR(255),
          content TEXT,
          author VARCHAR(255),
          meta_title VARCHAR(255),
          meta_description TEXT,
          keywords TEXT,
          status ENUM('draft', 'published') DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL
        )
      `);
    });
  };
  
  module.exports = {
    db,
    initDatabase
  };