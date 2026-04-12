const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:tender_id', authenticateToken, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const [tenderRows] = await db.query('SELECT * FROM tenders WHERE id = ?', [tenderId]);
    if (tenderRows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    const [bids] = await db.query('SELECT * FROM bids WHERE tender_id = ? ORDER BY true_cost ASC', [tenderId]);
    const [jobs] = await db.query(
      'SELECT * FROM evaluation_jobs WHERE tender_id = ? ORDER BY created_at DESC LIMIT 1',
      [tenderId]
    );

    const tender = tenderRows[0];
    const evaluationJob = jobs.length > 0 ? jobs[0] : null;
    const winner = bids.find((bid) => bid.is_winner) || null;

    res.json({
      tender,
      evaluation_status: tender.evaluation_status || (evaluationJob ? evaluationJob.status : 'pending'),
      winner,
      all_bids: bids,
      job: evaluationJob
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
