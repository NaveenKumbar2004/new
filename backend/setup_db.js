const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDB() {
    try {
        console.log("Connecting to MySQL...");
        // Connect without database selected first
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Nave@2004',
            multipleStatements: true
        });

        console.log("Creating database smart_parking if not exists...");
        await connection.query("CREATE DATABASE IF NOT EXISTS smart_parking;");
        await connection.query("USE smart_parking;");

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
