CREATE DATABASE IF NOT EXISTS smart_tender_db;
USE smart_tender_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'bidder') DEFAULT 'bidder',
    past_projects INT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.78,
    avg_delay_days DECIMAL(6,2) DEFAULT 18,
    rating_score DECIMAL(3,2) DEFAULT 4.10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_budget DECIMAL(15, 2) DEFAULT 0,
    deadline DATETIME NOT NULL,
    required_experience VARCHAR(255),
    project_type VARCHAR(255),
    created_by INT,
    evaluation_status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    winner_bid_id INT DEFAULT NULL,
    evaluation_result_at DATETIME DEFAULT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id INT NOT NULL,
    bidder_id INT NOT NULL,
    quoted_bid DECIMAL(15, 2) NOT NULL,
    estimated_completion_days INT DEFAULT NULL,
    support_doc_url VARCHAR(255),
    hidden_costs DECIMAL(15, 2) NOT NULL,
    delay_cost DECIMAL(15, 2) DEFAULT 0,
    overrun_cost DECIMAL(15, 2) DEFAULT 0,
    maintenance_cost DECIMAL(15, 2) DEFAULT 0,
    social_cost DECIMAL(15, 2) DEFAULT 0,
    risk_penalty DECIMAL(15, 2) DEFAULT 0,
    predicted_delay DECIMAL(5, 2) DEFAULT 0,
    overrun_probability DECIMAL(5, 2) DEFAULT 0,
    risk_score DECIMAL(5, 2) DEFAULT 0,
    explanation TEXT,
    true_cost DECIMAL(15, 2) NOT NULL,
    bid_hash VARCHAR(255),
    bid_tx_hash VARCHAR(255),
    is_winner BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tender_id) REFERENCES tenders(id),
    FOREIGN KEY (bidder_id) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    result_bid_id INT DEFAULT NULL,
    result_tx_hash VARCHAR(255),
    error TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (tender_id) REFERENCES tenders(id)
);
