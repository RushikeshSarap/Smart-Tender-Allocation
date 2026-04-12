require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const db = require('../db');

const adminUser = {
  name: 'Admin Operator',
  email: 'admin@example.com',
  password: 'AdminPass123!',
  role: 'admin'
};

const bidders = [
  { name: 'Atlas Construction', email: 'bidder1@example.com', password: 'BidderPass1!', role: 'bidder', past_projects: 38, success_rate: 0.92, avg_delay_days: 30, rating_score: 4.8 },
  { name: 'BluePeak Engineering', email: 'bidder2@example.com', password: 'BidderPass2!', role: 'bidder', past_projects: 29, success_rate: 0.88, avg_delay_days: 120, rating_score: 4.2 },
  { name: 'CoreTech Systems', email: 'bidder3@example.com', password: 'BidderPass3!', role: 'bidder', past_projects: 16, success_rate: 0.97, avg_delay_days: 12, rating_score: 4.9 },
  { name: 'Delta Infrastructure', email: 'bidder4@example.com', password: 'BidderPass4!', role: 'bidder', past_projects: 51, success_rate: 0.70, avg_delay_days: 240, rating_score: 3.5 },
  { name: 'Emerald Builders', email: 'bidder5@example.com', password: 'BidderPass5!', role: 'bidder', past_projects: 22, success_rate: 0.85, avg_delay_days: 90, rating_score: 4.1 }
];

const tenders = [
  {
    title: 'Riverfront Road Upgrade',
    description: 'Upgrade 14 km of riverfront roadway with flood-resistant surfacing and drainage.',
    estimated_budget: 1200000,
    deadline: '2025-12-31 18:00:00',
    required_experience: 'Highway and civil engineering',
    project_type: 'Road',
    evaluation_status: 'completed'
  },
  {
    title: 'Municipal IT Portal',
    description: 'Build a citizen services portal with e-payment, permits, and analytics.',
    estimated_budget: 550000,
    deadline: '2025-10-15 18:00:00',
    required_experience: 'Software development and UX design',
    project_type: 'IT',
    evaluation_status: 'completed'
  },
  {
    title: 'City Hospital Wing',
    description: 'Construct a new hospital wing with surgical, ICU, and support facilities.',
    estimated_budget: 2800000,
    deadline: '2026-03-20 18:00:00',
    required_experience: 'Healthcare construction',
    project_type: 'Building',
    evaluation_status: 'completed'
  }
];

const sampleBids = [
  {
    tenderTitle: 'Riverfront Road Upgrade',
    bids: [
      { bidderEmail: 'bidder4@example.com', quoted_bid: 980000, estimated_completion_days: 420, hidden_costs: 250000, true_cost: 1230000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder3@example.com', quoted_bid: 1150000, estimated_completion_days: 150, hidden_costs: 120000, true_cost: 1270000, bid_tx_hash: null, is_winner: true },
      { bidderEmail: 'bidder1@example.com', quoted_bid: 1220000, estimated_completion_days: 180, hidden_costs: 100000, true_cost: 1320000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder5@example.com', quoted_bid: 1130000, estimated_completion_days: 210, hidden_costs: 140000, true_cost: 1270000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder2@example.com', quoted_bid: 1080000, estimated_completion_days: 260, hidden_costs: 180000, true_cost: 1260000, bid_tx_hash: null, is_winner: false }
    ]
  },
  {
    tenderTitle: 'Municipal IT Portal',
    bids: [
      { bidderEmail: 'bidder1@example.com', quoted_bid: 520000, estimated_completion_days: 90, hidden_costs: 35000, true_cost: 555000, bid_tx_hash: null, is_winner: true },
      { bidderEmail: 'bidder3@example.com', quoted_bid: 530000, estimated_completion_days: 45, hidden_costs: 40000, true_cost: 570000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder2@example.com', quoted_bid: 525000, estimated_completion_days: 60, hidden_costs: 45000, true_cost: 570000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder5@example.com', quoted_bid: 540000, estimated_completion_days: 70, hidden_costs: 39000, true_cost: 579000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder4@example.com', quoted_bid: 500000, estimated_completion_days: 150, hidden_costs: 130000, true_cost: 630000, bid_tx_hash: null, is_winner: false }
    ]
  },
  {
    tenderTitle: 'City Hospital Wing',
    bids: [
      { bidderEmail: 'bidder3@example.com', quoted_bid: 2950000, estimated_completion_days: 300, hidden_costs: 150000, true_cost: 3100000, bid_tx_hash: null, is_winner: true },
      { bidderEmail: 'bidder1@example.com', quoted_bid: 2820000, estimated_completion_days: 360, hidden_costs: 260000, true_cost: 3080000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder5@example.com', quoted_bid: 2890000, estimated_completion_days: 330, hidden_costs: 210000, true_cost: 3100000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder2@example.com', quoted_bid: 2800000, estimated_completion_days: 390, hidden_costs: 300000, true_cost: 3100000, bid_tx_hash: null, is_winner: false },
      { bidderEmail: 'bidder4@example.com', quoted_bid: 2700000, estimated_completion_days: 450, hidden_costs: 450000, true_cost: 3150000, bid_tx_hash: null, is_winner: false }
    ]
  }
];

const createHash = (payload) => crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

async function seed() {
  console.log('Starting sample data seed...');
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.query('TRUNCATE TABLE evaluation_jobs');
  await db.query('TRUNCATE TABLE bids');
  await db.query('TRUNCATE TABLE tenders');
  await db.query('TRUNCATE TABLE users');
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  const adminHash = await bcrypt.hash(adminUser.password, 10);
  const [adminResult] = await db.query(
    'INSERT INTO users (name, email, password_hash, role, past_projects, success_rate, avg_delay_days, rating_score) VALUES (?, ?, ?, ?, 0, 0, 0, 0)',
    [adminUser.name, adminUser.email, adminHash, adminUser.role]
  );
  console.log(`Created admin user: ${adminUser.email}`);

  const bidderIdMap = {};
  for (const bidder of bidders) {
    const hashed = await bcrypt.hash(bidder.password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, past_projects, success_rate, avg_delay_days, rating_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [bidder.name, bidder.email, hashed, bidder.role, bidder.past_projects, bidder.success_rate, bidder.avg_delay_days, bidder.rating_score]
    );
    bidderIdMap[bidder.email] = result.insertId;
    console.log(`Created bidder: ${bidder.email}`);
  }

  const tenderIdMap = {};
  for (const tender of tenders) {
    const [result] = await db.query(
      'INSERT INTO tenders (title, description, estimated_budget, deadline, required_experience, project_type, created_by, evaluation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tender.title, tender.description, tender.estimated_budget, tender.deadline, tender.required_experience, tender.project_type, adminResult.insertId, tender.evaluation_status]
    );
    tenderIdMap[tender.title] = result.insertId;
    console.log(`Created tender: ${tender.title}`);
  }

  for (const tenderMix of sampleBids) {
    const tenderId = tenderIdMap[tenderMix.tenderTitle];
    let winnerBidId = null;
    for (const bid of tenderMix.bids) {
      const bidderId = bidderIdMap[bid.bidderEmail];
      const bidPayload = {
        tender_id: tenderId,
        bidder_id: bidderId,
        quoted_bid: bid.quoted_bid,
        estimated_completion_days: bid.estimated_completion_days,
        support_doc_url: bid.support_doc_url,
        hidden_costs: bid.hidden_costs,
        true_cost: bid.true_cost
      };
      const bidHash = createHash(bidPayload);
      const [result] = await db.query(
        'INSERT INTO bids (tender_id, bidder_id, quoted_bid, estimated_completion_days, support_doc_url, hidden_costs, true_cost, bid_hash, bid_tx_hash, is_winner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tenderId, bidderId, bid.quoted_bid, bid.estimated_completion_days, bid.support_doc_url, bid.hidden_costs, bid.true_cost, bidHash, bid.bid_tx_hash, bid.is_winner ? 1 : 0]
      );
      if (bid.is_winner) {
        winnerBidId = result.insertId;
      }
      console.log(`Inserted bid for tender ${tenderMix.tenderTitle} by ${bid.bidderEmail}`);
    }
    if (winnerBidId) {
      await db.query('UPDATE tenders SET winner_bid_id = ? WHERE id = ?', [winnerBidId, tenderId]);
      console.log(`Marked winner for tender ${tenderMix.tenderTitle} -> bid ${winnerBidId}`);
    }
  }

  console.log('Sample data seed completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
