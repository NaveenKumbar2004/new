-- Drop existing tables to recreate schema cleanly (for setup)
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS ParkingSlots;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table (New Feature)
CREATE TABLE Vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('car', 'bike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ParkingSlots Table
CREATE TABLE ParkingSlots (
    id VARCHAR(10) PRIMARY KEY,
    status ENUM('free', 'occupied') DEFAULT 'free',
    type ENUM('car', 'bike') DEFAULT 'car'
);

-- Bookings Table
CREATE TABLE Bookings (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    slot_id VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    entry_status ENUM('pending', 'entered', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id),
    FOREIGN KEY (slot_id) REFERENCES ParkingSlots(id)
);

-- Insert Dummy Data for Demo
INSERT INTO Users (id, name, username, password_hash) VALUES (1, 'Test User', 'testuser', 'password');

INSERT INTO Vehicles (id, user_id, vehicle_number, vehicle_type) VALUES 
(1, 1, 'MH-12-AB-1234', 'car'),
(2, 1, 'KA-01-XY-9999', 'bike');

INSERT INTO ParkingSlots (id, status, type) VALUES 
('A1', 'free', 'car'), ('A2', 'free', 'car'), ('A3', 'free', 'car'),
('B1', 'free', 'car'), ('B2', 'occupied', 'car'), ('B3', 'free', 'car'),
('M1', 'free', 'bike'), ('M2', 'free', 'bike');
