const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Update with your MySQL password
    database: 'smart_parking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Mocked Auth for Demo purposes (since JWT is complex for this scope)
// In a real app, use JWT. For now, we assume user ID 1 is logged in.
const MOCK_USER_ID = 1;

// ==========================================
// VEHICLE APIs
// ==========================================

app.get('/api/vehicles/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Vehicles WHERE user_id = ?', [req.params.userId]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.post('/api/add-vehicle', async (req, res) => {
    try {
        const { vehicle_number, vehicle_type } = req.body;
        const vNum = vehicle_number.trim().toUpperCase();
        
        await pool.query('INSERT INTO Vehicles (user_id, vehicle_number, vehicle_type) VALUES (?, ?, ?)', 
            [MOCK_USER_ID, vNum, vehicle_type]);
            
        res.json({ status: 'success', message: 'Vehicle added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'fail', message: 'Vehicle already exists' });
        }
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.delete('/api/delete-vehicle/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Vehicles WHERE id = ? AND user_id = ?', [req.params.id, MOCK_USER_ID]);
        res.json({ status: 'success', message: 'Vehicle deleted' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

// ==========================================
// SLOT & BOOKING APIs
// ==========================================

app.get('/api/slots', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ParkingSlots');
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.post('/api/book-slot', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { slot_id, vehicle_id, date, start_time, end_time, total_cost } = req.body;
        const booking_id = 'BKG' + Math.floor(Math.random() * 1000000);

        // Check slot availability
        const [slots] = await connection.query('SELECT status FROM ParkingSlots WHERE id = ? FOR UPDATE', [slot_id]);
        if (slots.length === 0 || slots[0].status === 'occupied') {
            await connection.rollback();
            return res.status(400).json({ status: 'fail', message: 'Slot not available' });
        }

        // Insert booking
        await connection.query(
            `INSERT INTO Bookings (id, user_id, vehicle_id, slot_id, date, start_time, end_time, total_cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [booking_id, MOCK_USER_ID, vehicle_id, slot_id, date, start_time, end_time, total_cost]
        );

        // Update slot status
        await connection.query('UPDATE ParkingSlots SET status = "occupied" WHERE id = ?', [slot_id]);

        await connection.commit();
        res.json({ status: 'success', message: 'Slot booked successfully', booking_id });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Transaction Failed' });
    } finally {
        connection.release();
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, v.vehicle_number, u.name as user_name 
            FROM Bookings b
            JOIN Vehicles v ON b.vehicle_id = v.id
            JOIN Users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

// ==========================================
// ADMIN API: ENTRY VERIFICATION
// ==========================================

app.post('/api/verify-vehicle', async (req, res) => {
    try {
        const { booking_id, vehicle_number } = req.body;
        if (!booking_id || !vehicle_number) {
            return res.status(400).json({ status: 'fail', message: 'Missing inputs' });
        }

        const searchId = booking_id.trim().toUpperCase();
        const arrivingVehicle = vehicle_number.trim().toUpperCase();

        const [rows] = await pool.query(`
            SELECT b.id as booking_id, b.slot_id, b.start_time, b.end_time, b.entry_status, v.vehicle_number, u.name as user_name
            FROM Bookings b
            JOIN Vehicles v ON b.vehicle_id = v.id
            JOIN Users u ON b.user_id = u.id
            WHERE b.id = ? OR b.slot_id = ?
            ORDER BY b.created_at DESC LIMIT 1
        `, [searchId, searchId]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        const booking = rows[0];

        if (booking.vehicle_number === arrivingVehicle) {
            // Access Granted
            await pool.query('UPDATE Bookings SET entry_status = "entered" WHERE id = ?', [booking.booking_id]);
            return res.json({
                status: 'success',
                message: 'Access Granted',
                data: booking
            });
        } else {
            // Vehicle Mismatch
            return res.status(403).json({
                status: 'fail',
                message: 'Vehicle Mismatch',
                details: { expected: booking.vehicle_number, arrived: arrivingVehicle }
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
