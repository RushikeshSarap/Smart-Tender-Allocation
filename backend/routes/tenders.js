const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const { authenticateToken, verifyAdmin } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9\.\-]/g, '_')}`;
            cb(null, safeName);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF documents are allowed'), false);
        cb(null, true);
    }
});

// Define routes for creating and getting tenders
router.post('/', authenticateToken, verifyAdmin, async (req, res) => {
    const { title, description, estimated_budget, deadline, required_experience, project_type } = req.body;
    const createdBy = req.user?.id;
    try {
        const [result] = await db.query(
            'INSERT INTO tenders (title, description, estimated_budget, deadline, required_experience, project_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, estimated_budget || 0, deadline, required_experience, project_type, createdBy]
        );
        console.log(`[INFO] Tender created. ID: ${result.insertId}`);
        res.status(201).json({ message: 'Tender created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/upload', authenticateToken, verifyAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Tender PDF file required' });

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const aiResponse = await axios.post((process.env.AI_ENGINE_URL || 'http://localhost:5000') + '/extract_tender', formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        res.json({ extracted: aiResponse.data, uploadPath: `/uploads/${req.file.filename}` });
    } catch (err) {
        console.error(`[ERROR] OCR extraction failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tenders ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Evaluation Endpoint (To be called after deadline)
router.post('/evaluate/:tender_id', authenticateToken, verifyAdmin, async (req, res) => {
    const { tender_id } = req.params;
    try {
        console.log(`[INFO] Initiating AI Evaluation for Tender ID: ${tender_id}`);
        
        // 1. Fetch all bids for this tender
        const [bids] = await db.query('SELECT * FROM bids WHERE tender_id = ?', [tender_id]);
        if (bids.length === 0) return res.status(404).json({ error: 'No bids found for this tender' });

        let evaluatedBids = [];

        // 2. Send each to Flask AI Engine async
        for (let bid of bids) {
            try {
                // Mock extracting factors if they were saved in the db (or defaulting)
                const aiResponse = await axios.post((process.env.AI_ENGINE_URL || 'http://localhost:5000') + '/predict_true_cost', {
                    bidder_id: bid.bidder_id,
                    base_cost: bid.quoted_bid,
                    bidder_history_score: 1.0 // Mock historical score since we don't have a robust CRM yet
                });
                
                const { delay_cost, overrun_cost, maintenance_cost, social_cost, risk_penalty, true_cost } = aiResponse.data;
                const hidden_costs = delay_cost + overrun_cost + maintenance_cost + social_cost + risk_penalty;
                
                // Update bid record in MySQL
                await db.query(
                    'UPDATE bids SET hidden_costs = ?, true_cost = ? WHERE id = ?',
                    [hidden_costs, true_cost, bid.id]
                );
                
                evaluatedBids.push({ ...bid, hidden_costs, true_cost });
            } catch (aiErr) {
                console.error(`[ERROR] AI Prediction failed for bid ${bid.id}: ${aiErr.message}`);
                throw new Error(`AI prediction failed: ${aiErr.message}`);
            }
        }

        // 3. Select bidder with minimum True Cost (L1 logic)
        evaluatedBids.sort((a, b) => a.true_cost - b.true_cost);
        const winningBid = evaluatedBids[0];

        // 4. Mark winner in MySQL
        await db.query('UPDATE bids SET is_winner = false WHERE tender_id = ?', [tender_id]);
        await db.query('UPDATE bids SET is_winner = true WHERE id = ?', [winningBid.id]);

        console.log(`[INFO] Winner for Tender ${tender_id} evaluated. Winning Bid ID: ${winningBid.id}`);

        // 5. Store final result on Blockchain
        await blockchainLogger.storeWinner(tender_id, winningBid.id, winningBid.true_cost);

        // 6. Return results
        res.json({
            message: 'Evaluation complete',
            winner: winningBid,
            all_bids: evaluatedBids
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
