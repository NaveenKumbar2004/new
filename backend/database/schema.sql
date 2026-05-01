-- Drop existing tables to recreate schema cleanly (for setup)
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS ParkingSlots;
DROP TABLE IF EXISTS Places;
DROP TABLE IF EXISTS Cities;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS SystemSettings;

-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE Vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('car', 'bike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Cities Table
CREATE TABLE Cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Places Table (Areas)
CREATE TABLE Places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE
);

-- ParkingSlots Table (Dynamic per Place)
CREATE TABLE ParkingSlots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id INT NOT NULL,
    slot_number VARCHAR(10) NOT NULL,
    status ENUM('available', 'occupied') DEFAULT 'available',
    type ENUM('car', 'bike') DEFAULT 'car',
    UNIQUE KEY (place_id, slot_number),
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE Bookings (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    city_id INT NOT NULL,
    place_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL, -- References ParkingSlots.id now
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    entry_status ENUM('pending', 'entered', 'exited') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (city_id) REFERENCES Cities(id),
    FOREIGN KEY (place_id) REFERENCES Places(id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id),
    FOREIGN KEY (slot_id) REFERENCES ParkingSlots(id)
);

-- System Settings
CREATE TABLE SystemSettings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

-- 4. Insert Initial Data (Locations only, no dummy users)
INSERT INTO Cities (name) VALUES ('Bangalore'), ('Mumbai');
INSERT INTO Places (city_id, name) VALUES (1, 'MG Road'), (1, 'Indiranagar'), (2, 'Colaba');

-- Initial Slots for MG Road
INSERT INTO ParkingSlots (place_id, slot_number, type) VALUES 
(1, 'A1', 'car'), (1, 'A2', 'car'), (1, 'A3', 'car'), (1, 'B1', 'car');

-- Initial Slots for Indiranagar
INSERT INTO ParkingSlots (place_id, slot_number, type) VALUES 
(2, 'C1', 'car'), (2, 'C2', 'car'), (2, 'M1', 'bike');

INSERT INTO SystemSettings (setting_key, setting_value) VALUES ('parking_fee', '10.00');
