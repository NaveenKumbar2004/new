require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedData() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    };

    const connection = await mysql.createConnection(config);
    console.log("Connected to Aiven DB for seeding...");

    try {
        // 1. Clear existing locations to avoid duplicates if re-run
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE ParkingSlots');
        await connection.query('TRUNCATE TABLE Places');
        await connection.query('TRUNCATE TABLE Cities');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const cities = [
            { name: 'Bangalore', places: ['MG Road', 'Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar'] },
            { name: 'Mumbai', places: ['Colaba', 'Andheri', 'Bandra', 'Worli', 'Juhu'] },
            { name: 'Delhi', places: ['Connaught Place', 'Hauz Khas', 'Chandni Chowk', 'Karol Bagh', 'Rohini'] },
            { name: 'Hyderabad', places: ['Gachibowli', 'Banjara Hills', 'Jubilee Hills', 'Secunderabad', 'Madhapur'] },
            { name: 'Chennai', places: ['T-Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Anna Nagar'] }
        ];

        for (const cityData of cities) {
            const [cityResult] = await connection.query('INSERT INTO Cities (name) VALUES (?)', [cityData.name]);
            const cityId = cityResult.insertId;
            console.log(`Added City: ${cityData.name}`);

            for (const placeName of cityData.places) {
                const [placeResult] = await connection.query('INSERT INTO Places (city_id, name) VALUES (?, ?)', [cityId, placeName]);
                const placeId = placeResult.insertId;
                console.log(`  Added Place: ${placeName}`);

                // Add 10 slots for each place
                for (let i = 1; i <= 10; i++) {
                    const slotNum = `S-${i.toString().padStart(2, '0')}`;
                    await connection.query('INSERT INTO ParkingSlots (place_id, slot_number, type) VALUES (?, ?, ?)', [placeId, slotNum, 'car']);
                }
                console.log(`    Created 10 slots for ${placeName}`);
            }
        }

        console.log("✅ Seeding complete!");
    } catch (err) {
        console.error("❌ Seeding failed:", err);
    } finally {
        await connection.end();
    }
}

seedData();
