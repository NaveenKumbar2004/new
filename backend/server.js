require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
// const bcrypt = require('bcryptjs'); (Removed for simplicity)


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
        console.log(`[AUTH] Registering user: ${username}`);

        if (!name || !username || !password || !vehicle_number) {
            return res.status(400).json({ status: 'fail', message: 'All fields are required' });
        }

        const vNum = vehicle_number.trim().toUpperCase();

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert User (Storing plain text password as requested)
            const [userResult] = await connection.query(
                'INSERT INTO Users (name, username, password_hash) VALUES (?, ?, ?)',
                [name, username, password]
            );

            const userId = userResult.insertId;
            console.log(`[AUTH] User created with ID: ${userId}`);

            // Insert Vehicle
            await connection.query(
                'INSERT INTO Vehicles (user_id, vehicle_number, vehicle_type) VALUES (?, ?, ?)',
                [userId, vNum, 'car']
            );

            await connection.commit();
            console.log(`[AUTH] Registration complete for ${username}`);
            res.json({ status: 'success', message: 'Registration successful' });
        } catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY') {
                console.warn(`[AUTH] Registration failed: Duplicate entry for ${username} or ${vNum}`);
                return res.status(400).json({ status: 'fail', message: 'Username or Vehicle already exists' });
            }
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("[AUTH ERROR] Registration:", err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${username}`);
        
        if (!username || !password) {
            return res.status(400).json({ status: 'fail', message: 'Username and password are required' });
        }

        // 1. HARDCODED ADMIN CHECK (Specific credentials for admin portal)
        if (username === 'admin' && password === 'admin123') {
            console.log(`[AUTH] Admin login recognized`);
            return res.json({ 
                status: 'success', 
                message: 'Admin login successful',
                data: { id: 999, name: 'System Administrator', username: 'admin' }
            });
        }

        // 2. DATABASE USER CHECK (Same as earlier)
        const [rows] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            console.warn(`[AUTH] Login failed: User ${username} not found`);
            return res.status(401).json({ status: 'fail', message: 'User not found' });
        }

        const user = rows[0];
        console.log(`[AUTH] User found: ${user.name} (ID: ${user.id})`);

        // Compare plain text password
        const isMatch = (password === user.password_hash);
        
        if (!isMatch) {
            console.warn(`[AUTH] Login failed: Invalid password for ${username}`);
            return res.status(401).json({ status: 'fail', message: 'Invalid password' });
        }

        console.log(`[AUTH] Login successful for ${username}`);
        res.json({ 
            status: 'success', 
            message: 'Login successful',
            data: { id: user.id, name: user.name, username: user.username }
        });
    } catch (err) {
        console.error("[AUTH ERROR] Login:", err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
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

app.get('/api/slots/:placeId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ParkingSlots WHERE place_id = ?', [req.params.placeId]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});

app.post('/api/add-slot', async (req, res) => {
    try {
        const { place_id, slot_number, type = 'car' } = req.body;
        const cleanNum = slot_number.trim().toUpperCase();

        await pool.query('INSERT INTO ParkingSlots (place_id, slot_number, status, type) VALUES (?, ?, ?, ?)',
            [place_id, cleanNum, 'available', type]);
        res.json({ status: 'success', message: 'Slot added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'fail', message: 'Slot already exists in this place' });
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
// LOCATION APIs
// ==========================================

app.get('/api/cities', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Cities ORDER BY name');
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.post('/api/add-city', async (req, res) => {
    try {
        const { name } = req.body;
        await pool.query('INSERT INTO Cities (name) VALUES (?)', [name]);
        res.json({ status: 'success', message: 'City added' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'fail', message: 'City already exists' });
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.get('/api/places/:cityId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Places WHERE city_id = ? ORDER BY name', [req.params.cityId]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.post('/api/add-place', async (req, res) => {
    try {
        const { city_id, name } = req.body;
        await pool.query('INSERT INTO Places (city_id, name) VALUES (?, ?)', [city_id, name]);
        res.json({ status: 'success', message: 'Place added' });
    } catch (err) {
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
        const { slot_id, vehicle_id, city_id, place_id, date, start_time, end_time, total_cost } = req.body;
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
            `INSERT INTO Bookings (id, user_id, city_id, place_id, vehicle_id, slot_id, date, start_time, end_time, total_cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [booking_id, userId, city_id, place_id, vehicle_id, slot_id, date, start_time, end_time, total_cost]
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
            SELECT b.*, v.vehicle_number, u.name as user_name, c.name as city_name, p.name as place_name, s.slot_number
            FROM Bookings b
            JOIN Vehicles v ON b.vehicle_id = v.id
            JOIN Users u ON b.user_id = u.id
            JOIN Cities c ON b.city_id = c.id
            JOIN Places p ON b.place_id = p.id
            JOIN ParkingSlots s ON b.slot_id = s.id
            ORDER BY b.created_at DESC
        `);

        res.json({ status: 'success', data: rows });
    } catch (err) {

        console.error("API Error (/api/slots):", err);
        res.status(500).json({ status: 'error', message: 'DB Error: ' + err.message });
    }
});

app.get('/api/my-bookings/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, v.vehicle_number, c.name as city_name, p.name as place_name, s.slot_number
            FROM Bookings b
            JOIN Vehicles v ON b.vehicle_id = v.id
            JOIN Cities c ON b.city_id = c.id
            JOIN Places p ON b.place_id = p.id
            JOIN ParkingSlots s ON b.slot_id = s.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [req.params.userId]);

        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error(err);
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

app.post('/api/verify-entry', async (req, res) => {
    try {
        const { booking_id } = req.body;
        await pool.query('UPDATE Bookings SET entry_status = \'entered\' WHERE id = ?', [booking_id]);
        res.json({ status: 'success', message: 'Vehicle marked as Entered' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'DB Error' });
    }
});

app.post('/api/mark-exit', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { booking_id } = req.body;

        // Get slot_id first
        const [bookings] = await connection.query('SELECT slot_id FROM Bookings WHERE id = ?', [booking_id]);
        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }
        const slot_id = bookings[0].slot_id;

        // Update status
        await connection.query('UPDATE Bookings SET entry_status = \'exited\' WHERE id = ?', [booking_id]);

        // Free the slot
        await connection.query('UPDATE ParkingSlots SET status = \'available\' WHERE id = ?', [slot_id]);


        await connection.commit();
        res.json({ status: 'success', message: 'Vehicle marked as Exited and slot freed' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: 'DB Error' });
    } finally {
        connection.release();
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
