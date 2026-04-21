const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { blockchainLogger, generateResultHash } = require('../web3_setup');

router.get('/:tender_id', authenticateToken, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const [tenderRows] = await db.query('SELECT * FROM tenders WHERE id = ?', [tenderId]);
    if (tenderRows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    const [bids] = await db.query(
      `SELECT b.*, u.name as bidder_name 
       FROM bids b 
       JOIN users u ON b.bidder_id = u.id 
       WHERE b.tender_id = ? 
       ORDER BY b.true_cost ASC`, 
      [tenderId]
    );
    const [jobs] = await db.query(
      'SELECT * FROM evaluation_jobs WHERE tender_id = ? ORDER BY created_at DESC LIMIT 1',
      [tenderId]
    );

    const tender = tenderRows[0];
    const evaluationJob = jobs.length > 0 ? jobs[0] : null;
    const winner = bids.find((bid) => bid.is_winner) || null;

    const blockchainBidHashes = await blockchainLogger.getBidHashes(tenderId);
    const blockchainResult = await blockchainLogger.getResult(tenderId);

    let localResultHash = null;
    let resultIntegrity = null;
    if (winner && blockchainResult) {
      localResultHash = generateResultHash({
        tenderId,
        winnerId: String(winner.bidder_id),
        trueCost: Number(winner.true_cost)
      });
      resultIntegrity = blockchainResult.resultHash === localResultHash;
    }

    res.json({
      tender,
      evaluation_status: tender.evaluation_status || (evaluationJob ? evaluationJob.status : 'pending'),
      winner,
      all_bids: bids,
      job: evaluationJob,
      blockchain: {
        bid_hashes: blockchainBidHashes,
        result_record: blockchainResult,
        result_integrity: resultIntegrity,
        local_result_hash: localResultHash,
        result_transaction_hash: evaluationJob?.result_tx_hash || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
