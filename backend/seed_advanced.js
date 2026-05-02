require('dotenv').config();
const mysql = require('mysql2/promise');

const data = [
    {
        city: "Bangalore",
        places: ["MG Road", "Indiranagar", "Koramangala", "Whitefield", "Jayanagar"]
    },
    {
        city: "Mumbai",
        places: ["Colaba", "Bandra", "Andheri", "Juhu", "Worli"]
    },
    {
        city: "Delhi",
        places: ["Connaught Place", "Saket", "Hauz Khas", "Karol Bagh", "Chandni Chowk"]
    },
    {
        city: "Hyderabad",
        places: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Hitech City"]
    },
    {
        city: "Chennai",
        places: ["T. Nagar", "Adyar", "Mylapore", "Anna Nagar", "Velachery"]
    },
    {
        city: "Pune",
        places: ["Koregaon Park", "Viman Nagar", "Baner", "Kothrud", "Hinjewadi"]
    },
    {
        city: "Kolkata",
        places: ["Park Street", "Salt Lake", "Gariahat", "New Town", "Ballygunge"]
    }
];

async function seedAdvanced() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Nave@2004',
        database: process.env.DB_NAME || 'smart_parking',
        port: process.env.DB_PORT || 3306,
        ssl: { rejectUnauthorized: false }
    });

    console.log("🚀 Starting Advanced Seeding...");

    try {
        // Clear existing data to avoid duplicates (Optional, but cleaner for seeding)
        // console.log("Cleaning old data...");
        // await pool.query("DELETE FROM ParkingSlots");
        // await pool.query("DELETE FROM Places");
        // await pool.query("DELETE FROM Cities");

        for (const entry of data) {
            console.log(`📍 Seeding City: ${entry.city}`);
            
            // Insert City
            const [cityResult] = await pool.query("INSERT IGNORE INTO Cities (name) VALUES (?)", [entry.city]);
            let cityId;
            
            if (cityResult.insertId) {
                cityId = cityResult.insertId;
            } else {
                const [rows] = await pool.query("SELECT id FROM Cities WHERE name = ?", [entry.city]);
                cityId = rows[0].id;
            }

            for (const placeName of entry.places) {
                console.log(`   🏠 Adding Place: ${placeName}`);
                
                // Insert Place
                const [placeResult] = await pool.query("INSERT IGNORE INTO Places (city_id, name) VALUES (?, ?)", [cityId, placeName]);
                let placeId;

                if (placeResult.insertId) {
                    placeId = placeResult.insertId;
                } else {
                    const [rows] = await pool.query("SELECT id FROM Places WHERE city_id = ? AND name = ?", [cityId, placeName]);
                    placeId = rows[0].id;
                }

                // Add 10 Normal Slots
                for (let i = 1; i <= 10; i++) {
                    const slotNum = `N${i}`;
                    await pool.query(
                        "INSERT IGNORE INTO ParkingSlots (place_id, slot_number, slot_type, price_per_hour, status, vehicle_type) VALUES (?, ?, 'normal', 20.00, 'available', 'car')",
                        [placeId, slotNum]
                    );
                }

                // Add 5 EV Slots
                for (let i = 1; i <= 5; i++) {
                    const slotNum = `E${i}`;
                    await pool.query(
                        "INSERT IGNORE INTO ParkingSlots (place_id, slot_number, slot_type, price_per_hour, status, vehicle_type) VALUES (?, ?, 'ev', 50.00, 'available', 'car')",
                        [placeId, slotNum]
                    );
                }
            }
        }

        console.log("\n✅ Advanced Seeding Completed Successfully!");
        console.log(`Stats: 7 Cities, 35 Places, 525 Slots total.`);

    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
    } finally {
        await pool.end();
    }
}

seedAdvanced();
