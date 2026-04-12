import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const Home = () => {
  return (
    <div className="page-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-eyebrow">Procurement reimagined</span>
          <h1 className="hero-title">Smart Tender Allocation System</h1>
          <p className="hero-description">
            Transparent, AI-driven, and blockchain-secured procurement. Stop relying strictly on base bids—let AI calculate the True Cost of delays, risks, and public impact.
          </p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Login to Dashboard</Link>
            <Link to="/register" className="btn btn-secondary">Register as Bidder</Link>
          </div>
        </div>

        <div className="hero-panel glass-card">
          <p className="panel-label">Setup in seconds</p>
          <h2>Modern bidding with color-coded intelligence</h2>
          <p>Instant insights, live bid visibility, and a polished award experience for admins and bidders.</p>
          <div className="panel-badges">
            <span>AI Ranking</span>
            <span>Blockchain Guard</span>
            <span>Live Analytics</span>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <article className="glass-card feature-card">
          <h3>🤖 AI True Cost Evaluation</h3>
          <p>Our advanced algorithm calculates delays, risk, maintenance, and social factors so awards reflect the real lifecycle cost.</p>
        </article>
        <article className="glass-card feature-card">
          <h3>🔗 Immutable Blockchain Ledger</h3>
          <p>All bid submissions are secured with cryptographic hashes, eliminating tampering and increasing audit confidence.</p>
        </article>
        <article className="glass-card feature-card">
          <h3>📊 Real-time Admin Insights</h3>
          <p>Compare bidders with colorful graphs, winner summaries, and interactive dashboards that feel premium.</p>
        </article>
      </section>
    </div>
  );
};
export default Home;
