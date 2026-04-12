const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { blockchainLogger, generateResultHash } = require('../web3_setup');

router.get('/bids/:tender_id', authenticateToken, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const bidHashes = await blockchainLogger.getBidHashes(tenderId);
    res.json({ tenderId, bid_hashes: bidHashes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/result/:tender_id', authenticateToken, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const result = await blockchainLogger.getResult(tenderId);
    res.json({ tenderId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:tender_id', authenticateToken, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const [tenderRows] = await db.query('SELECT * FROM tenders WHERE id = ?', [tenderId]);
    if (tenderRows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    const [bids] = await db.query('SELECT * FROM bids WHERE tender_id = ? ORDER BY true_cost ASC', [tenderId]);
    const winner = bids.find((bid) => bid.is_winner) || null;
    if (!winner) return res.status(404).json({ error: 'No winning bid found for verification' });

    const localResultData = {
      tenderId,
      winnerId: String(winner.bidder_id),
      trueCost: Number(winner.true_cost)
    };
    const localResultHash = generateResultHash(localResultData);

    const blockchainResult = await blockchainLogger.getResult(tenderId);
    const resultVerified = blockchainResult?.resultHash === localResultHash;

    const chainBidHashes = await blockchainLogger.getBidHashes(tenderId);
    const bidAudit = bids.map((bid) => ({
      bidId: bid.id,
      bidderId: bid.bidder_id,
      localHash: bid.bid_hash,
      onChain: chainBidHashes.some((chain) => chain.bidHash === bid.bid_hash)
    }));

    res.json({
      tenderId,
      resultVerified,
      localResultHash,
      blockchainResult,
      bidAudit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
