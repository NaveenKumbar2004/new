const mysql = require('mysql2/promise');

async function addSlots() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Nave@2004',
            database: 'smart_parking'
        });

        console.log("Adding 50 slots...");
        
        const slots = [];
        const rows = ['A', 'B', 'C', 'D', 'E'];
        
        for (let r of rows) {
            for (let i = 1; i <= 10; i++) {
                slots.push(`('${r}${i}', 'free', 'car')`);
            }
        }
        
        await connection.query(`INSERT IGNORE INTO ParkingSlots (id, status, type) VALUES ${slots.join(',')}`);
        console.log("Slots added!");
        
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

addSlots();
