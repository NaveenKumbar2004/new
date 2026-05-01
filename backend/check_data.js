const mysql = require('mysql2/promise');

async function checkData() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Nave@2004',
            database: 'smart_parking'
        });

        const [users] = await connection.query('SELECT * FROM Users');
        console.log("Users:", users);

        const [vehicles] = await connection.query('SELECT * FROM Vehicles');
        console.log("Vehicles:", vehicles);

        const [bookings] = await connection.query('SELECT * FROM Bookings');
        console.log("Bookings:", bookings);

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

checkData();
