const db = require('../db');
const axios = require('axios');

const getBidderPerformance = async (bidderId) => {
  try {
    const [rows] = await db.query(
      'SELECT name, past_projects, success_rate, avg_delay_days, rating_score FROM users WHERE id = ?',
      [bidderId]
    );
    if (rows.length === 0) {
      return { name: 'Unknown', past_projects: 0, success_rate: 0.78, avg_delay_days: 18, rating_score: 4.1 };
    }
    const perf = rows[0];
    return {
      name: perf.name || 'Unknown',
      past_projects: perf.past_projects || 0,
      success_rate: Number(perf.success_rate || 0.78),
      avg_delay_days: Number(perf.avg_delay_days || 18),
      rating_score: Number(perf.rating_score || 4.1)
    };
  } catch (err) {
    console.error(`[WARN] Could not load performance for bidder ${bidderId}: ${err.message}`);
    return { name: 'Unknown', past_projects: 0, success_rate: 0.78, avg_delay_days: 18, rating_score: 4.1 };
  }
};

const evaluateTenderBids = async (tender, bids) => {
  const evaluatedBids = [];
  const aiEndpoint = (process.env.AI_ENGINE_URL || 'http://localhost:5000') + '/predict_true_cost';

  for (const bid of bids) {
    const performance = await getBidderPerformance(bid.bidder_id);
    const payload = {
      bidder_id: bid.bidder_id,
      base_cost: Number(bid.quoted_bid) || 0,
      proposed_timeline: Number(bid.estimated_completion_days) || 90,
      project_type: tender.project_type || '',
      project_budget: Number(tender.estimated_budget) || Number(bid.quoted_bid) || 0,
      total_projects: performance.past_projects,
      success_rate: performance.success_rate,
      avg_delay_days: performance.avg_delay_days,
      rating_score: performance.rating_score
    };

    const aiResponse = await axios.post(aiEndpoint, payload, {
      timeout: 30000
    });

    const {
      delay_cost,
      overrun_cost,
      maintenance_cost,
      social_cost,
      risk_penalty,
      true_cost,
      explanation,
      predicted_delay,
      overrun_probability,
      risk_score
    } = aiResponse.data;

    const hidden_costs = Number(delay_cost || 0) + Number(overrun_cost || 0) + Number(maintenance_cost || 0) + Number(social_cost || 0) + Number(risk_penalty || 0);

    await db.query(
      `UPDATE bids SET 
        hidden_costs = ?, 
        true_cost = ?, 
        delay_cost = ?, 
        overrun_cost = ?, 
        maintenance_cost = ?, 
        social_cost = ?, 
        risk_penalty = ?, 
        predicted_delay = ?, 
        overrun_probability = ?, 
        risk_score = ?, 
        explanation = ? 
      WHERE id = ?`,
      [
        hidden_costs, 
        true_cost, 
        delay_cost, 
        overrun_cost, 
        maintenance_cost, 
        social_cost, 
        risk_penalty, 
        predicted_delay, 
        overrun_probability, 
        risk_score, 
        explanation, 
        bid.id
      ]
    );

    evaluatedBids.push({
      ...bid,
      bidder_name: performance.name,
      delay_cost,
      overrun_cost,
      maintenance_cost,
      social_cost,
      risk_penalty,
      true_cost,
      hidden_costs,
      explanation,
      predicted_delay,
      overrun_probability,
      risk_score
    });
  }

  evaluatedBids.sort((a, b) => a.true_cost - b.true_cost);
  return evaluatedBids;
};

module.exports = { getBidderPerformance, evaluateTenderBids };
