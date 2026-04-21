import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { formatCurrency } from './utils';

const Dashboard = ({ data }) => {
  const [bids, setBids] = useState([]);
  const [winner, setWinner] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('Not verified');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [expandedBidId, setExpandedBidId] = useState(null);

  const toggleBidDetails = (bidId) => {
    setExpandedBidId(expandedBidId === bidId ? null : bidId);
  };

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
    labels: bids.map((b, idx) => b.bidder_name || `Bidder ${idx + 1}`),
    datasets: [
      {
        label: 'True Cost',
        data: bids.map((b) => Number(b.true_cost || 0)),
        backgroundColor: bids.map((b) => (b.id === winner.id ? '#22c55e' : '#38bdf8'))
      }
    ]
  };

  const breakdownData = {
    labels: bids.map((b, idx) => b.bidder_name || `Bidder ${idx + 1}`),
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
  const costGap = secondBest ? formatCurrency(secondBest.true_cost - winner.true_cost) : 'N/A';
  const winnerName = winner.bidder_name || `Bidder ${winner.bidder_id}`;
  const explanationText = data.explanation || `${winnerName} selected because it has the lowest true cost, driven by balanced delay, risk, and social factors.`;

  const handleVerify = async () => {
    if (!data?.tender?.id) return;
    setVerifying(true);
    setVerificationStatus('Verifying...');
    setVerifyResult(null);

    try {
      const response = await axios.get(`/blockchain/verify/${data.tender.id}`);
      setVerifyResult(response.data);
      setVerificationStatus(response.data.resultVerified ? 'Verified' : 'Mismatch detected');
    } catch (err) {
      console.error(err);
      setVerificationStatus('Verification error');
    } finally {
      setVerifying(false);
    }
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
            <h2>{winner.bidder_name || `Bidder ${winner.bidder_id}`}</h2>
          </div>
          <div className="winner-score">{formatCurrency(winner.true_cost)}</div>
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
          <p className="cost-gap">Cost gap to runner-up: <strong>₹{costGap}</strong></p>
        </div>
      </section>

      <div className="result-grid">
        <section className="bids-table-card glass-card">
          <h3>Bid Cost Breakdown</h3>
          <div className="bids-table-container">
            <table className="bids-table">
              <thead>
                <tr>
                  <th></th>
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
                  <React.Fragment key={bid.id}>
                    <tr className={`${bid.id === winner.id ? 'winner-row' : ''} ${expandedBidId === bid.id ? 'expanded-row-base' : ''}`}>
                      <td className="expand-cell">
                        <button className="expand-toggle" onClick={() => toggleBidDetails(bid.id)}>
                          {expandedBidId === bid.id ? '−' : '+'}
                        </button>
                      </td>
                      <td>{bid.bidder_name || `Bidder ${bid.bidder_id}`}{bid.id === winner.id ? ' (winner)' : ''}</td>
                      <td>{formatCurrency(bid.quoted_bid)}</td>
                      <td>{formatCurrency(bid.delay_cost || 0)}</td>
                      <td>{formatCurrency(bid.overrun_cost || 0)}</td>
                      <td>{formatCurrency(bid.maintenance_cost || 0)}</td>
                      <td>{formatCurrency(bid.social_cost || 0)}</td>
                      <td>{formatCurrency(bid.risk_penalty || 0)}</td>
                      <td className="true-cost-val">{formatCurrency(bid.true_cost || 0)}</td>
                    </tr>
                    {expandedBidId === bid.id && (
                      <tr className="explanation-row">
                        <td colSpan="9">
                          <div className="explanation-content-wrapper">
                            <strong>Calculation Reasoning:</strong>
                            <p>{bid.explanation || "No detailed reasoning available for this evaluation."}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
            <p>Winning Bid Hash</p>
            <div className="tx-id-line">{winner.bid_hash || 'Not available'}</div>
            <p>On-chain Result Hash</p>
            <div className="tx-id-line">{data.blockchain?.result_record?.resultHash || 'Not available'}</div>
            <p>Status: <strong>{verificationStatus}</strong></p>
            <button className="btn btn-primary" onClick={handleVerify} disabled={verifying || verificationStatus === 'Verified'}>
              {verificationStatus === 'Verified' ? 'Verified' : verifying ? 'Verifying...' : 'Verify Integrity'}
            </button>
            {data.blockchain?.result_transaction_hash && (
              <p className="blockchain-note">Transaction ID: <strong>{data.blockchain.result_transaction_hash}</strong></p>
            )}
            {verifyResult && (
              <div className={`verify-badge ${verifyResult.resultVerified ? 'verified' : 'unverified'}`}>
                {verifyResult.resultVerified ? 'Result integrity confirmed' : 'Result mismatch detected'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
