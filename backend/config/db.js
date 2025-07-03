const mysql = require('mysql2/promise'); // Using promise-based mysql2
require('dotenv').config();
// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user:"abaya",
    password:"johntheripper",
    database: "abaya_haven_db",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10, // Adjust as needed
    queueLimit: 0
});

// Test DB Connection (optional, but good for startup)
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database via db.js!');
        connection.release(); // Release the connection immediately after testing
    })
    .catch(err => {
        console.error('Error connecting to MySQL database in db.js:', err.message);
        // It's critical to exit if DB connection fails on startup
        process.exit(1);
    });

module.exports = pool; // Export the pool for use in other files