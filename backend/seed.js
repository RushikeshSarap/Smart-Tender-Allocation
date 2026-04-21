const db = require('./db');

async function seed() {
    try {
        console.log("Seeding database...");
        
        // Ensure tables exist
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'bidder') DEFAULT 'bidder',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Clean up data for fresh seed (optional but good for testing)
        // Ignoring cleanup for now to prevent deleting user's work, just inserting defaults
        
        // 1. Create an admin
        const [adminResult] = await db.query(
            "INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES (1, 'Admin', 'admin@example.com', 'hash', 'admin')"
        );
        
        // 2. Create bidders
        await db.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES (2, 'Bidder A', 'bidderA@example.com', 'hash', 'bidder')");
        await db.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES (3, 'Bidder B', 'bidderB@example.com', 'hash', 'bidder')");
        await db.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES (4, 'Bidder C', 'bidderC@example.com', 'hash', 'bidder')");

        // 3. Create a tender
        const [tenderResult] = await db.query(
            "INSERT INTO tenders (title, description, deadline, created_by) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?)",
            ["Public Highway Project 2026", "Construct a 10km highway", 1]
        );
        const tenderId = tenderResult.insertId;

        // 4. Create bids
        await db.query(
            "INSERT INTO bids (tender_id, bidder_id, quoted_bid, hidden_costs, true_cost, bid_hash) VALUES (?, ?, ?, ?, ?, ?)",
            [tenderId, 2, 80000.00, 0, 0, "hash_a"]
        );
        await db.query(
            "INSERT INTO bids (tender_id, bidder_id, quoted_bid, hidden_costs, true_cost, bid_hash) VALUES (?, ?, ?, ?, ?, ?)",
            [tenderId, 3, 95000.00, 0, 0, "hash_b"]
        );
        await db.query(
            "INSERT INTO bids (tender_id, bidder_id, quoted_bid, hidden_costs, true_cost, bid_hash) VALUES (?, ?, ?, ?, ?, ?)",
            [tenderId, 4, 90000.00, 0, 0, "hash_c"]
        );

        console.log("Database seeded successfully! Now click Evaluate Winner in the UI.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
