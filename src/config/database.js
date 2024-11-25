const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'dev_compro'
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;