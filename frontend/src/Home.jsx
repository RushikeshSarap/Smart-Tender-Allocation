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
            Transparent, AI-driven, and blockchain-secured procurement for organizations that need fair, predictable, and auditable tender awards.
          </p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Login to Dashboard</Link>
            <Link to="/register" className="btn btn-secondary">Register as Bidder</Link>
          </div>

          <div className="hero-highlights">
            <div className="highlight-card">
              <strong>5x faster</strong>
              <span>Tender evaluation reviews</span>
            </div>
            <div className="highlight-card">
              <strong>7x more</strong>
              <span>audit-ready records</span>
            </div>
            <div className="highlight-card">
              <strong>99%+</strong>
              <span>bid integrity validation</span>
            </div>
          </div>
        </div>

        <div className="hero-panel glass-card">
          <p className="panel-label">Why it works</p>
          <h2>Balanced awarding that protects cost, quality, and social impact</h2>
          <p>
            Combine structured tender details, bidder performance metrics, and smart blockchain controls to select bids that truly reduce long-term risk.
          </p>
          <div className="feature-list">
            <div>
              <strong>True Cost AI</strong>
              <p>Weight bids on delay, risk, social impact, and maintenance.</p>
            </div>
            <div>
              <strong>Secure Recordkeeping</strong>
              <p>Immutable hashes store bid and result proof on-chain.</p>
            </div>
            <div>
              <strong>Clear Decisions</strong>
              <p>Winner selection is visible, explainable, and defensible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="section-heading">
          <p className="panel-label">Built for modern procurement</p>
          <h2>Get faster insights, stronger awards, and better transparency</h2>
        </div>

        <div className="info-grid">
          <article className="glass-card info-card">
            <h3>Scenario-based evaluation</h3>
            <p>Test the system with real-world bidder mixes that highlight delay, performance, and social impact tradeoffs.</p>
          </article>
          <article className="glass-card info-card">
            <h3>Data-driven bidder scoring</h3>
            <p>Bid decisions are driven by performance metrics, not just quoted totals.</p>
          </article>
          <article className="glass-card info-card">
            <h3>Trust in every transaction</h3>
            <p>Blockchain-backed hashes ensure submission and result integrity over time.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Home;
