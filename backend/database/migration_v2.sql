-- Update Schema for New Features

-- Cities Table
CREATE TABLE IF NOT EXISTS Cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Places Table
CREATE TABLE IF NOT EXISTS Places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE
);

-- Add sample data for cities and places
INSERT IGNORE INTO Cities (name) VALUES ('Bangalore'), ('Mumbai'), ('Delhi'), ('Pune');

-- Bangalore Places
INSERT IGNORE INTO Places (city_id, name) VALUES 
(1, 'MG Road'), (1, 'Indiranagar'), (1, 'Koramangala'), (1, 'Whitefield');

-- Mumbai Places
INSERT IGNORE INTO Places (city_id, name) VALUES 
(2, 'Colaba'), (2, 'Andheri'), (2, 'Bandra'), (2, 'Juhu');

-- Update Bookings Table
-- Adding city_id and place_id
ALTER TABLE Bookings ADD COLUMN city_id INT AFTER user_id;
ALTER TABLE Bookings ADD COLUMN place_id INT AFTER city_id;

-- Add Foreign Keys for city and place
ALTER TABLE Bookings ADD CONSTRAINT fk_booking_city FOREIGN KEY (city_id) REFERENCES Cities(id);
ALTER TABLE Bookings ADD CONSTRAINT fk_booking_place FOREIGN KEY (place_id) REFERENCES Places(id);

-- Update entry_status ENUM
-- Note: MySQL 8.0+ allows modifying ENUMs easily, but for safety in older versions or different environments, we handle it carefully.
ALTER TABLE Bookings MODIFY COLUMN entry_status ENUM('pending', 'entered', 'exited') DEFAULT 'pending';

-- Update ParkingSlots to be more flexible if needed, but for now we keep it as is.
