CREATE DATABASE IF NOT EXISTS smart_tender_db;
USE smart_tender_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'bidder') DEFAULT 'bidder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATETIME NOT NULL,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id INT NOT NULL,
    bidder_id INT NOT NULL,
    quoted_bid DECIMAL(15, 2) NOT NULL,
    hidden_costs DECIMAL(15, 2) NOT NULL,
    true_cost DECIMAL(15, 2) NOT NULL,
    bid_hash VARCHAR(255),
    is_winner BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tender_id) REFERENCES tenders(id),
    FOREIGN KEY (bidder_id) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
