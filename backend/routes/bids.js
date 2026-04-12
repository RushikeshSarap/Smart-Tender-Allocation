const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { generateBidHash, blockchainLogger } = require('../web3_setup');
const { authenticateToken } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '..', 'uploads', 'bids');
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9\.\-]/g, '_')}`;
            cb(null, safeName);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) return cb(new Error('Only PDF/PNG/JPG documents are allowed'), false);
        cb(null, true);
    }
});

router.post('/', authenticateToken, upload.single('support_doc'), async (req, res) => {
    const { tender_id, quoted_bid, estimated_completion_days } = req.body;
    const bidder_id = req.user?.id;
    const support_doc_url = req.file ? `/uploads/bids/${req.file.filename}` : null;

    try {
        console.log(`[INFO] Received bid for Tender ${tender_id} from Bidder ${bidder_id}`);

        const bidDataObj = {
            tender_id: Number(tender_id),
            bidder_id,
            quoted_bid: Number(quoted_bid) || 0,
            estimated_completion_days: Number(estimated_completion_days) || 0,
            support_doc_url
        };
        const bid_hash = generateBidHash(bidDataObj);

        const [result] = await db.query(
            'INSERT INTO bids (tender_id, bidder_id, quoted_bid, estimated_completion_days, support_doc_url, hidden_costs, true_cost, bid_hash) VALUES (?, ?, ?, ?, ?, 0, 0, ?)',
            [tender_id, bidder_id, quoted_bid, estimated_completion_days || null, support_doc_url, bid_hash]
        );
        const bidId = result.insertId;

        console.log(`[INFO] Bid stored in MySQL successfully. Bid ID: ${bidId}`);

        const txHash = await blockchainLogger.storeBidHash(tender_id, bid_hash);
        try {
            await db.query('UPDATE bids SET bid_tx_hash = ? WHERE id = ?', [txHash, bidId]);
        } catch (updateErr) {
            console.warn(`[WARN] bid_tx_hash column update failed: ${updateErr.message}`);
        }

        res.status(201).json({
            message: 'Bid submitted and secured on blockchain successfully',
            id: bidId,
            hash: bid_hash,
            blockchain_tx_hash: txHash,
            support_doc_url
        });
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
