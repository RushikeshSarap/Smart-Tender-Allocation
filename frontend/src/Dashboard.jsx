import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const Dashboard = ({ data }) => {
  const [bids, setBids] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (data) {
        setBids(data.all_bids);
        setWinner(data.winner);
    }
  }, [data]);

  if (!winner) return <div className="loading">Loading Results...</div>;

  const chartData = {
    labels: bids.map(b => b.bidder_id),
    datasets: [
      {
        label: 'Base Cost',
        data: bids.map(b => b.quoted_bid),
        backgroundColor: '#4ade80'
      },
      {
        label: 'Delay Cost',
        data: bids.map(b => b.delay_cost),
        backgroundColor: '#f87171'
      },
      {
        label: 'Risk Penalty',
        data: bids.map(b => b.risk_penalty),
        backgroundColor: '#fbbf24'
      },
      {
        label: 'Overrun Cost',
        data: bids.map(b => b.overrun_cost),
        backgroundColor: '#60a5fa'
      },
      {
        label: 'Maintenance Cost',
        data: bids.map(b => b.maintenance_cost),
        backgroundColor: '#a78bfa'
      },
      {
        label: 'Social Impact Cost',
        data: bids.map(b => b.social_cost),
        backgroundColor: '#f472b6'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: { x: { stacked: true }, y: { stacked: true } }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Tender Evaluation Results</h1>
        <p className="subtitle">Smart Allocation Engine - L1 True Cost Analysis</p>
      </header>

      <div className="winner-card">
        <h2>🎉 Winning Bidder: {winner.bidder_id}</h2>
        <p className="explanation">
          <strong>Why this won:</strong> {winner.bidder_id} was selected because it has the lowest True Cost of ${winner.true_cost.toLocaleString()} after considering delay risk, lower social impact, and better performance history. Even though other bidders may have quoted a lower base rate, the AI factored in lower hidden costs for {winner.bidder_id} yielding a smaller True Cost over the lifecycle of the project.
        </p>
        <div className="blockchain-veri">
          <span className="badge">Verified on Blockchain</span>
          <span className="tx-id">Transaction ID / Bid Hash: {winner.bid_hash}</span>
        </div>
      </div>

      <div className="bids-table-container">
        <table className="bids-table">
          <thead>
            <tr>
              <th>Bidder</th>
              <th>Base Bid</th>
              <th>Delay Cost</th>
              <th>Overrun Cost</th>
              <th>Maintenance</th>
              <th>Social Impact</th>
              <th>Risk Penalty</th>
              <th>Final True Cost</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(bid => (
              <tr key={bid.id} className={bid.id === winner.id ? 'winner-row' : ''}>
                <td>{bid.bidder_id} {bid.id === winner.id && '🏅'}</td>
                <td>${bid.quoted_bid.toLocaleString()}</td>
                <td>${(bid.delay_cost||0).toLocaleString()}</td>
                <td>${(bid.overrun_cost||0).toLocaleString()}</td>
                <td>${(bid.maintenance_cost||0).toLocaleString()}</td>
                <td>${(bid.social_cost||0).toLocaleString()}</td>
                <td>${(bid.risk_penalty||0).toLocaleString()}</td>
                <td className="true-cost-val">${bid.true_cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chart-container">
        <h3>True Cost Comparison</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Dashboard;
