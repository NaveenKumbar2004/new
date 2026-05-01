require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDB() {
    try {
        console.log("Connecting to Database...");
        
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Nave@2004',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true,
            ssl: { rejectUnauthorized: false }
        };

        const connection = await mysql.createConnection(config);
        
        const dbName = process.env.DB_NAME || 'smart_parking';
        console.log(`Using database: ${dbName}...`);
        
        // Use the database name from .env
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log("Reading schema.sql...");
        const schema = fs.readFileSync('./database/schema.sql', 'utf8');

        console.log("Executing schema.sql...");
        await connection.query(schema);

        console.log("Database initialized successfully!");
        await connection.end();
    } catch (e) {
        console.error("Database setup failed:", e);
    }
}

setupDB();
