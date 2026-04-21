require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function seed() {
    try {
        console.log('\n🌱 Starting database seed...\n');

        // ─── Clear old data (order matters due to FK constraints) ───────────
        await db.query('DELETE FROM evaluation_jobs');
        await db.query('DELETE FROM bids');
        await db.query('DELETE FROM tenders');
        await db.query('DELETE FROM users');
        await db.query('ALTER TABLE evaluation_jobs AUTO_INCREMENT = 1');
        await db.query('ALTER TABLE bids AUTO_INCREMENT = 1');
        await db.query('ALTER TABLE tenders AUTO_INCREMENT = 1');
        await db.query('ALTER TABLE users AUTO_INCREMENT = 1');
        console.log('✅ Old data cleared.');

        // ─── USERS ───────────────────────────────────────────────────────────
        const adminHash   = await bcrypt.hash('Admin@123',    SALT_ROUNDS);
        const bidder1Hash = await bcrypt.hash('Bidder1@123',  SALT_ROUNDS);
        const bidder2Hash = await bcrypt.hash('Bidder2@123',  SALT_ROUNDS);
        const bidder3Hash = await bcrypt.hash('Bidder3@123',  SALT_ROUNDS);
        const bidder4Hash = await bcrypt.hash('Bidder4@123',  SALT_ROUNDS);
        const bidder5Hash = await bcrypt.hash('Bidder5@123',  SALT_ROUNDS);

        // Insert admin (no AI profile fields needed)
        const [adminRes] = await db.query(
            `INSERT INTO users (name, email, password_hash, role, past_projects, success_rate, avg_delay_days, rating_score)
             VALUES (?, ?, ?, 'admin', 0, 0, 0, 0)`,
            ['Admin User', 'admin@tender.com', adminHash]
        );
        const adminId = adminRes.insertId;
        console.log(`✅ Admin created → ID ${adminId}  |  admin@tender.com / Admin@123`);

        // Bidder profiles (past_projects, success_rate, avg_delay_days, rating_score)
        const bidders = [
            { name: 'Ravi Sharma',   email: 'ravi@tender.com',   hash: bidder1Hash, past_projects: 12, success_rate: 0.92, avg_delay_days: 5,  rating_score: 4.7 },
            { name: 'Priya Mehta',   email: 'priya@tender.com',  hash: bidder2Hash, past_projects: 8,  success_rate: 0.85, avg_delay_days: 12, rating_score: 4.2 },
            { name: 'Arjun Patel',   email: 'arjun@tender.com',  hash: bidder3Hash, past_projects: 20, success_rate: 0.78, avg_delay_days: 22, rating_score: 3.9 },
            { name: 'Sunita Rao',    email: 'sunita@tender.com', hash: bidder4Hash, past_projects: 5,  success_rate: 0.95, avg_delay_days: 3,  rating_score: 4.9 },
            { name: 'Deepak Singh',  email: 'deepak@tender.com', hash: bidder5Hash, past_projects: 15, success_rate: 0.80, avg_delay_days: 18, rating_score: 4.1 },
        ];

        const bidderIds = [];
        for (const b of bidders) {
            const [res] = await db.query(
                `INSERT INTO users (name, email, password_hash, role, past_projects, success_rate, avg_delay_days, rating_score)
                 VALUES (?, ?, ?, 'bidder', ?, ?, ?, ?)`,
                [b.name, b.email, b.hash, b.past_projects, b.success_rate, b.avg_delay_days, b.rating_score]
            );
            bidderIds.push(res.insertId);
            console.log(`✅ Bidder created  → ID ${res.insertId}  |  ${b.email} / ${b.name.split(' ')[0]}@123  (projects:${b.past_projects}, rate:${b.success_rate}, delay:${b.avg_delay_days}d, rating:${b.rating_score})`);
        }

        // ─── TENDERS ─────────────────────────────────────────────────────────
        const [tender1Res] = await db.query(
            `INSERT INTO tenders (title, description, estimated_budget, deadline, required_experience, project_type, created_by, evaluation_status)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?, ?, 'pending')`,
            [
                'National Highway Construction - Phase 1',
                'Design and construction of a 25 km four-lane national highway including bridges, drainage systems, and safety railings. Work must comply with NHAI standards.',
                15000000000.00,
                '10 years in mega road infrastructure',
                'Infrastructure'
            ].concat([adminId])
        );
        const tender1Id = tender1Res.insertId;
        console.log(`\n✅ Tender 1 created → ID ${tender1Id}  |  National Highway Construction - Phase 1`);

        const [tender2Res] = await db.query(
            `INSERT INTO tenders (title, description, estimated_budget, deadline, required_experience, project_type, created_by, evaluation_status)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 21 DAY), ?, ?, ?, 'pending')`,
            [
                'Smart City Water Treatment Plant',
                'Construction and commissioning of a 50 MLD water treatment plant including civil work, mechanical equipment supply, electrical systems, and SCADA integration.',
                4500000000.00,
                '8 years in water/civil infrastructure',
                'Civil Engineering'
            ].concat([adminId])
        );
        const tender2Id = tender2Res.insertId;
        console.log(`✅ Tender 2 created → ID ${tender2Id}  |  Smart City Water Treatment Plant`);

        // ─── BIDS ─────────────────────────────────────────────────────────────
        // Tender 1 bids (budget ~₹1500 Cr)
        const bids_t1 = [
            { bidder_idx: 0, quoted_bid: 14200000000, hidden_costs: 850000000, completion_days: 1050 },
            { bidder_idx: 1, quoted_bid: 15150000000, hidden_costs: 420000000, completion_days: 1200 },
            { bidder_idx: 2, quoted_bid: 13800000000, hidden_costs: 1150000000, completion_days: 1100 },
            { bidder_idx: 3, quoted_bid: 15500000000, hidden_costs: 380000000, completion_days: 950 },
            { bidder_idx: 4, quoted_bid: 14850000000, hidden_costs: 620000000, completion_days: 1150 },
        ];

        // Tender 2 bids (budget ~₹450 Cr)
        const bids_t2 = [
            { bidder_idx: 0, quoted_bid: 4100000000, hidden_costs: 250000000, completion_days: 520 },
            { bidder_idx: 1, quoted_bid: 4350000000, hidden_costs: 180000000, completion_days: 580 },
            { bidder_idx: 2, quoted_bid: 3950000000, hidden_costs: 420000000, completion_days: 640 },
            { bidder_idx: 3, quoted_bid: 4420000000, hidden_costs: 140000000, completion_days: 500 },
            { bidder_idx: 4, quoted_bid: 4210000000, hidden_costs: 290000000, completion_days: 550 },
        ];

        console.log('\n📋 Inserting bids for Tender 1...');
        for (const bid of bids_t1) {
            const true_cost = bid.quoted_bid + bid.hidden_costs;
            const bid_hash = `hash_t1_b${bidderIds[bid.bidder_idx]}_${Date.now()}`;
            await db.query(
                `INSERT INTO bids (tender_id, bidder_id, quoted_bid, estimated_completion_days, hidden_costs, true_cost, bid_hash, delay_cost, overrun_cost, maintenance_cost, social_cost, risk_penalty)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tender1Id, bidderIds[bid.bidder_idx], bid.quoted_bid, bid.completion_days, bid.hidden_costs, true_cost, bid_hash, 0, 0, 0, 0, 0]
            );
            console.log(`   ↳ Bidder ${bidderIds[bid.bidder_idx]} bid ₹${(bid.quoted_bid/1e7).toFixed(2)}Cr (true: ₹${(true_cost/1e7).toFixed(2)}Cr, ${bid.completion_days} days)`);
        }

        console.log('\n📋 Inserting bids for Tender 2...');
        for (const bid of bids_t2) {
            const true_cost = bid.quoted_bid + bid.hidden_costs;
            const bid_hash = `hash_t2_b${bidderIds[bid.bidder_idx]}_${Date.now()}`;
            await db.query(
                `INSERT INTO bids (tender_id, bidder_id, quoted_bid, estimated_completion_days, hidden_costs, true_cost, bid_hash, delay_cost, overrun_cost, maintenance_cost, social_cost, risk_penalty)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tender2Id, bidderIds[bid.bidder_idx], bid.quoted_bid, bid.completion_days, bid.hidden_costs, true_cost, bid_hash, 0, 0, 0, 0, 0]
            );
            console.log(`   ↳ Bidder ${bidderIds[bid.bidder_idx]} bid ₹${(bid.quoted_bid/1e7).toFixed(2)}Cr (true: ₹${(true_cost/1e7).toFixed(2)}Cr, ${bid.completion_days} days)`);
        }

        console.log('\n🎉 Database seeded successfully!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('  LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════');
        console.log('  ADMIN  : admin@tender.com    /  Admin@123');
        console.log('  Bidder1: ravi@tender.com     /  Ravi@123    → Replace with Bidder1@123');
        console.log('  Bidder1: ravi@tender.com     /  Bidder1@123');
        console.log('  Bidder2: priya@tender.com    /  Bidder2@123');
        console.log('  Bidder3: arjun@tender.com    /  Bidder3@123');
        console.log('  Bidder4: sunita@tender.com   /  Bidder4@123');
        console.log('  Bidder5: deepak@tender.com   /  Bidder5@123');
        console.log('═══════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seed();
