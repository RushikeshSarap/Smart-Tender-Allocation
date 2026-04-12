const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateBidHash, blockchainLogger } = require('../web3_setup');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, async (req, res) => {
    const { tender_id, bidder_id, quoted_bid, delay_factor, risk_score } = req.body;
    try {
        console.log(`[INFO] Received bid for Tender ${tender_id} from Bidder ${bidder_id}`);

        // Generate Hash
        const bidDataObj = { tender_id, bidder_id, quoted_bid, delay_factor, risk_score };
        const bid_hash = generateBidHash(bidDataObj);

        // Store sequentially in DB (True costs will be 0 until evaluation)
        const [result] = await db.query(
            'INSERT INTO bids (tender_id, bidder_id, quoted_bid, hidden_costs, true_cost, bid_hash) VALUES (?, ?, ?, 0, 0, ?)',
            [tender_id, bidder_id, quoted_bid, bid_hash]
        );
        const bidId = result.insertId;

        console.log(`[INFO] Bid stored in MySQL successfully. Bid ID: ${bidId}`);

        // Store Hash on Blockchain
        await blockchainLogger.storeBidHash(bidId, tender_id, bid_hash);

        res.status(201).json({ message: 'Bid submitted and secured on blockchain successfully', id: bidId, hash: bid_hash });
    } catch (err) {
        console.error(`[ERROR] Failed to submit bid: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:tender_id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM bids WHERE tender_id = ? ORDER BY true_cost ASC', [req.params.tender_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
