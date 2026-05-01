require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve static frontend files from root

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nave@2004',
    database: process.env.DB_NAME || 'smart_parking',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }, // Required for Cloud DBs like Aiven
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log("✅ Successfully connected to the database!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ DATABASE CONNECTION ERROR:", err.message);
        console.error("Details:", {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
    });

// ==========================================
// AUTHENTICATION APIs
// ==========================================

app.post('/api/register', async (req, res) => {
    try {
        const { name, username, password, vehicle_number } = req.body;
        if (!name || !username || !password || !vehicle_number) {
            return res.status(400).json({ status: 'fail', message: 'All fields are required' });
        }

        const vNum = vehicle_number.trim().toUpperCase();

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert User
            const [userResult] = await connection.query(
                'INSERT INTO Users (name, username, password_hash) VALUES (?, ?, ?)',
                [name, username, password] // Storing password in plain text for demo, use bcrypt in production
            );
            
            const userId = userResult.insertId;

            // Insert Vehicle
            await connection.query(
                'INSERT INTO Vehicles (user_id, vehicle_number, vehicle_type) VALUES (?, ?, ?)',
                [userId, vNum, 'car'] // Default to car for registration
            );

            await connection.commit();
            res.json({ status: 'success', message: 'Registration successful' });
        } catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ status: 'fail', message: 'Username or Vehicle already exists' });
            }
            console.error(err);
            res.status(500).json({ status: 'error', message: 'DB Error during registration' });
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [rows] = await pool.query('SELECT id, name, username FROM Users WHERE username = ? AND password_hash = ?', [username, password]);
        
        if (rows.length === 0) {
            return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        }
        
        res.json({ status: 'success', message: 'Login successful', data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

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
        
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });

        await pool.query('INSERT INTO Vehicles (user_id, vehicle_number, vehicle_type) VALUES (?, ?, ?)', 
            [userId, vNum, vehicle_type]);
            
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
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });

        await pool.query('DELETE FROM Vehicles WHERE id = ? AND user_id = ?', [req.params.id, userId]);
        res.json({ status: 'success', message: 'Vehicle deleted' });
    } catch (err) {
        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});

// ==========================================
// SLOT APIs
// ==========================================

app.get('/api/slots', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ParkingSlots');
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});

app.post('/api/add-slot', async (req, res) => {
    try {
        const { slot_id, type = 'car' } = req.body;
        const cleanId = slot_id.trim().toUpperCase();

        await pool.query('INSERT INTO ParkingSlots (id, status, type) VALUES (?, ?, ?)', [cleanId, 'free', type]);
        res.json({ status: 'success', message: 'Slot added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'fail', message: 'Slot already exists' });
        }
        console.error(err);
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.delete('/api/delete-slot/:id', async (req, res) => {
    try {
        const slotId = req.params.id;
        
        // Ensure it's not occupied
        const [slots] = await pool.query('SELECT status FROM ParkingSlots WHERE id = ?', [slotId]);
        if (slots.length === 0) return res.status(404).json({ status: 'fail', message: 'Slot not found' });
        if (slots[0].status === 'occupied') return res.status(400).json({ status: 'fail', message: 'Cannot delete occupied slot' });

        await pool.query('DELETE FROM ParkingSlots WHERE id = ?', [slotId]);
        res.json({ status: 'success', message: 'Slot deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

// ==========================================
// BOOKING APIs
// ==========================================

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

        const userId = req.headers['x-user-id'];
        if (!userId) {
            await connection.rollback();
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        // Insert booking
        await connection.query(
            `INSERT INTO Bookings (id, user_id, vehicle_id, slot_id, date, start_time, end_time, total_cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [booking_id, userId, vehicle_id, slot_id, date, start_time, end_time, total_cost]
        );

        // Update slot status
        await connection.query('UPDATE ParkingSlots SET status = \'occupied\' WHERE id = ?', [slot_id]);

        await connection.commit();
        res.json({ status: 'success', message: 'Slot booked successfully', booking_id });
    } catch (err) {
        await connection.rollback();
        console.error("Booking Transaction Failed:", err);
        res.status(500).json({ status: 'error', message: 'Transaction Failed: ' + err.message });
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
        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
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
            await pool.query('UPDATE Bookings SET entry_status = \'entered\' WHERE id = ?', [booking.booking_id]);
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

// ==========================================
// SYSTEM SETTINGS APIs
// ==========================================

app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM SystemSettings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ status: 'success', data: settings });
    } catch (err) {
        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { parking_fee } = req.body;
        if (parking_fee) {
            // First try to update
            const [result] = await pool.query(
                'UPDATE SystemSettings SET setting_value = ? WHERE setting_key = ?',
                [parking_fee.toString(), 'parking_fee']
            );
            
            // If no rows updated, it doesn't exist, so insert
            if (result.affectedRows === 0) {
                await pool.query(
                    'INSERT INTO SystemSettings (setting_key, setting_value) VALUES (?, ?)',
                    ['parking_fee', parking_fee.toString()]
                );
            }
        }
        res.json({ status: 'success', message: 'Settings updated' });
    } catch (err) {
        console.error("API Error (/api/settings):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✅ Smart Parking Server running on port ${PORT}`);
    console.log(`📡 Deployment Ready: Serving frontend and API`);
    console.log(`======================================================\n`);
});
