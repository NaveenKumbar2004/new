-- Drop existing tables to recreate schema cleanly
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

-- Places Table
CREATE TABLE Places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE
);

-- ParkingSlots Table
CREATE TABLE ParkingSlots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id INT NOT NULL,
    slot_number VARCHAR(10) NOT NULL,
    slot_type ENUM('normal', 'ev') DEFAULT 'normal',
    price_per_hour DECIMAL(10, 2) DEFAULT 20.00,
    status ENUM('available', 'occupied') DEFAULT 'available',
    vehicle_type ENUM('car', 'bike') DEFAULT 'car',
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
    slot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    entry_time DATETIME NULL,
    exit_time DATETIME NULL,
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
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

-- Initial Data
INSERT INTO Cities (name) VALUES ('Bangalore'), ('Mumbai');
INSERT INTO Places (city_id, name) VALUES (1, 'MG Road'), (1, 'Indiranagar'), (2, 'Colaba');

-- Initial Slots for MG Road
INSERT INTO ParkingSlots (place_id, slot_number, slot_type, price_per_hour) VALUES 
(1, 'A1', 'normal', 20.00), 
(1, 'A2', 'normal', 20.00), 
(1, 'A3', 'ev', 50.00), 
(1, 'B1', 'ev', 50.00);

-- Initial Slots for Indiranagar
INSERT INTO ParkingSlots (place_id, slot_number, slot_type, price_per_hour) VALUES 
(2, 'C1', 'normal', 25.00), 
(2, 'C2', 'ev', 60.00), 
(2, 'M1', 'normal', 15.00);

INSERT INTO SystemSettings (setting_key, setting_value) VALUES ('parking_fee', '20.00');
