const mysql = require('mysql2/promise');

async function testBooking() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Nave@2004',
            database: 'smart_parking'
        });

        // Test the exact insert query to see what fails
        const booking_id = 'BKG12345';
        const userId = '1';
        const vehicle_id = '1';
        const slot_id = 'A1';
        const date = '2026-04-29';
        const start_time = '10:00';
        const end_time = '12:00';
        const total_cost = '10.00';

        console.log("Attempting to insert booking...");
        await connection.query(
            `INSERT INTO Bookings (id, user_id, vehicle_id, slot_id, date, start_time, end_time, total_cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [booking_id, userId, vehicle_id, slot_id, date, start_time, end_time, total_cost]
        );
        console.log("Success!");
        await connection.end();
    } catch (e) {
        console.error("Query Error:", e);
    }
}

testBooking();
