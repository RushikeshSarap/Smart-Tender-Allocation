const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, verifyAdmin } = require('../middleware/authMiddleware');
const { evaluateTenderBids } = require('../services/evaluationService');
const { blockchainLogger, generateResultHash } = require('../web3_setup');

const POLL_INTERVAL_MS = 4000;
let workerRunning = false;
let currentJob = null;

const startEvaluationWorker = () => {
  if (workerRunning) return;
  workerRunning = true;

  setInterval(async () => {
    if (currentJob) return;
    try {
      await processPendingJob();
    } catch (err) {
      console.error(`[WORKER] Unexpected evaluation worker error: ${err.message}`);
    }
  }, POLL_INTERVAL_MS);
};

const processPendingJob = async () => {
  const [jobs] = await db.query(
    'SELECT * FROM evaluation_jobs WHERE status = ? ORDER BY created_at ASC LIMIT 1',
    ['pending']
  );
  if (jobs.length === 0) return;

  currentJob = jobs[0];
  const jobId = currentJob.id;
  const tenderId = currentJob.tender_id;

  await db.query('UPDATE evaluation_jobs SET status = ?, started_at = NOW() WHERE id = ?', ['in_progress', jobId]);
  await db.query('UPDATE tenders SET evaluation_status = ? WHERE id = ?', ['in_progress', tenderId]);

  console.log(`[WORKER] Starting evaluation job ${jobId} for tender ${tenderId}`);

  try {
    const [tenderRows] = await db.query('SELECT * FROM tenders WHERE id = ?', [tenderId]);
    if (tenderRows.length === 0) {
      throw new Error('Tender not found for evaluation job');
    }

    const tender = tenderRows[0];
    const [bids] = await db.query('SELECT * FROM bids WHERE tender_id = ?', [tenderId]);
    if (bids.length === 0) {
      throw new Error('No bids found for this tender');
    }

    const evaluatedBids = await evaluateTenderBids(tender, bids);
    const winningBid = evaluatedBids[0];

    await db.query('UPDATE bids SET is_winner = false WHERE tender_id = ?', [tenderId]);
    await db.query('UPDATE bids SET is_winner = true WHERE id = ?', [winningBid.id]);
    await db.query(
      'UPDATE tenders SET evaluation_status = ?, winner_bid_id = ?, evaluation_result_at = NOW() WHERE id = ?',
      ['completed', winningBid.id, tenderId]
    );
    await db.query(
      'UPDATE evaluation_jobs SET status = ?, completed_at = NOW(), result_bid_id = ? WHERE id = ?',
      ['completed', winningBid.id, jobId]
    );

    const resultPayload = {
      tenderId,
      winnerId: String(winningBid.bidder_id),
      trueCost: Number(winningBid.true_cost)
    };
    const resultHash = generateResultHash(resultPayload);
    const txHash = await blockchainLogger.storeResult(tenderId, resultPayload.winnerId, resultPayload.trueCost, resultHash);

    try {
      await db.query('UPDATE evaluation_jobs SET result_tx_hash = ? WHERE id = ?', [txHash, jobId]);
    } catch (updateErr) {
      console.warn(`[WARN] result_tx_hash column update failed: ${updateErr.message}`);
    }

    console.log(`[WORKER] Completed evaluation job ${jobId} for tender ${tenderId}`);
  } catch (err) {
    console.error(`[WORKER] Evaluation failed for job ${jobId}: ${err.message}`);
    await db.query('UPDATE evaluation_jobs SET status = ?, error = ? WHERE id = ?', ['failed', err.message, jobId]);
    await db.query('UPDATE tenders SET evaluation_status = ? WHERE id = ?', ['failed', currentJob.tender_id]);
  } finally {
    currentJob = null;
  }
};

router.post('/:tender_id', authenticateToken, verifyAdmin, async (req, res) => {
  const tenderId = Number(req.params.tender_id);
  try {
    const [tenderRows] = await db.query('SELECT * FROM tenders WHERE id = ?', [tenderId]);
    if (tenderRows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    const [result] = await db.query(
      'INSERT INTO evaluation_jobs (tender_id, status) VALUES (?, ?)',
      [tenderId, 'pending']
    );

    await db.query('UPDATE tenders SET evaluation_status = ? WHERE id = ?', ['pending', tenderId]);
    startEvaluationWorker();

    res.status(202).json({
      message: 'Evaluation queued successfully',
      jobId: result.insertId,
      tenderId,
      evaluation_status: 'pending'
    });
  } catch (err) {
    console.error(`[ERROR] Queue evaluation failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

startEvaluationWorker();
module.exports = router;
