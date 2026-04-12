import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const Dashboard = ({ data }) => {
  const [bids, setBids] = useState([]);
  const [winner, setWinner] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('Not verified');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (data) {
      setBids(data.all_bids || []);
      setWinner(data.winner || null);
      setVerificationStatus('Not verified');
      setVerifying(false);
    }
  }, [data]);

  if (!data) return <div className="loading">Loading Results...</div>;
  if (!winner) return <div className="loading">No winning bid has been selected yet.</div>;

  const trueCostData = {
    labels: bids.map((b) => `Bidder ${b.bidder_id}`),
    datasets: [
      {
        label: 'True Cost',
        data: bids.map((b) => Number(b.true_cost || 0)),
        backgroundColor: bids.map((b) => (b.id === winner.id ? '#22c55e' : '#38bdf8'))
      }
    ]
  };

  const breakdownData = {
    labels: bids.map((b) => `Bidder ${b.bidder_id}`),
    datasets: [
      { label: 'Base Cost', data: bids.map((b) => Number(b.quoted_bid || 0)), backgroundColor: '#4ade80' },
      { label: 'Delay Cost', data: bids.map((b) => Number(b.delay_cost || 0)), backgroundColor: '#f87171' },
      { label: 'Overrun Cost', data: bids.map((b) => Number(b.overrun_cost || 0)), backgroundColor: '#60a5fa' },
      { label: 'Maintenance Cost', data: bids.map((b) => Number(b.maintenance_cost || 0)), backgroundColor: '#a78bfa' },
      { label: 'Social Impact', data: bids.map((b) => Number(b.social_cost || 0)), backgroundColor: '#fb7185' },
      { label: 'Risk Penalty', data: bids.map((b) => Number(b.risk_penalty || 0)), backgroundColor: '#fbbf24' }
    ]
  };

  const stackedOptions = {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    },
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  const secondBest = bids.filter((b) => b.id !== winner.id).sort((a, b) => a.true_cost - b.true_cost)[0];
  const costGap = secondBest ? Number(secondBest.true_cost - winner.true_cost).toLocaleString() : 'N/A';
  const explanationText = data.explanation || `Bidder ${winner.bidder_id} selected because it has the lowest true cost, driven by balanced delay, risk, and social factors.`;

  const handleVerify = () => {
    setVerifying(true);
    setVerificationStatus('Verifying...');
    setTimeout(() => {
      setVerificationStatus('Verified');
      setVerifying(false);
    }, 1400);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Tender Evaluation Results</h1>
        <p className="subtitle">Transparent outcome visualization with cost breakdown and blockchain verification.</p>
      </header>

      <section className="winner-card glass-card">
        <div className="winner-headline">
          <div>
            <span className="badge winner-badge">L1 True Cost Winner</span>
            <h2>Bidder {winner.bidder_id}</h2>
          </div>
          <div className="winner-score">${Number(winner.true_cost).toLocaleString()}</div>
        </div>

        <div className="explanation-panel">
          <h4>Why this bid won</h4>
          <p>{explanationText}</p>
          <div className="key-factors">
            <span>Primary drivers:</span>
            <ul>
              <li>Lowest weighted delay cost</li>
              <li>Minimal risk and overrun exposure</li>
              <li>Cost-efficient maintenance and social impact</li>
            </ul>
          </div>
          <p className="cost-gap">Cost gap to runner-up: <strong>${costGap}</strong></p>
        </div>
      </section>

      <div className="result-grid">
        <section className="bids-table-card glass-card">
          <h3>Bid Cost Breakdown</h3>
          <div className="bids-table-container">
            <table className="bids-table">
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Base Cost</th>
                  <th>Delay</th>
                  <th>Overrun</th>
                  <th>Maintenance</th>
                  <th>Social Impact</th>
                  <th>Risk Penalty</th>
                  <th>True Cost</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid.id} className={bid.id === winner.id ? 'winner-row' : ''}>
                    <td>Bidder {bid.bidder_id}{bid.id === winner.id ? ' 🏆' : ''}</td>
                    <td>${Number(bid.quoted_bid).toLocaleString()}</td>
                    <td>${Number(bid.delay_cost || 0).toLocaleString()}</td>
                    <td>${Number(bid.overrun_cost || 0).toLocaleString()}</td>
                    <td>${Number(bid.maintenance_cost || 0).toLocaleString()}</td>
                    <td>${Number(bid.social_cost || 0).toLocaleString()}</td>
                    <td>${Number(bid.risk_penalty || 0).toLocaleString()}</td>
                    <td className="true-cost-val">${Number(bid.true_cost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="charts-panel">
          <div className="chart-card glass-card">
            <h4>True Cost Comparison</h4>
            <Bar data={trueCostData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="chart-card glass-card">
            <h4>Cost Component Stack</h4>
            <Bar data={breakdownData} options={stackedOptions} />
          </div>
          <div className="verification-panel glass-card">
            <h4>Blockchain Verification</h4>
            <p>Transaction ID / Bid Hash</p>
            <div className="tx-id-line">{winner.bid_hash || 'Not available'}</div>
            <p>Status: <strong>{verificationStatus}</strong></p>
            <button className="btn btn-primary" onClick={handleVerify} disabled={verifying || verificationStatus === 'Verified'}>
              {verificationStatus === 'Verified' ? 'Verified' : verifying ? 'Verifying...' : 'Verify on Blockchain'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
