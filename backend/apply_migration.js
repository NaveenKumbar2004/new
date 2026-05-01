const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
    try {
        console.log("Connecting to Database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Nave@2004',
            database: process.env.DB_NAME || 'smart_parking',
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false },
            multipleStatements: true
        });

        console.log("Reading migration_v2.sql...");
        const migrationPath = path.join(__dirname, 'database', 'migration_v2.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Executing migration...");
        await connection.query(sql);

        console.log("✅ Migration applied successfully!");
        await connection.end();
    } catch (e) {
        console.error("❌ Migration failed:", e);
    }
}

applyMigration();
