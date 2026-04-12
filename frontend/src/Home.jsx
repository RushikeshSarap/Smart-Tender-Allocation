import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const Home = () => {
  return (
    <div className="dashboard-container" style={{textAlign: 'center', marginTop: '5vh'}}>
      <div className="hero-section" style={{marginBottom: '4rem'}}>
        <h1 className="hero-title" style={{fontSize: '3.5rem', background: 'linear-gradient(90deg, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Smart Tender Allocation System</h1>
        <p className="subtitle" style={{fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto'}}>
          Transparent, AI-driven, and Blockchain-secured procurement. 
          Stop relying strictly on base bids—let AI calculate the True Cost of delays and risks.
        </p>
        <div className="hero-buttons" style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
          <Link to="/login" style={{padding: '1rem 2rem', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold'}}>Login to Dashboard</Link>
          <Link to="/register" style={{padding: '1rem 2rem', background: 'white', color: 'var(--primary)', border: '2px solid var(--primary)', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold'}}>Register as Bidder</Link>
        </div>
      </div>

      <div className="bids-table-container" style={{display: 'flex', gap: '2rem', padding: '2rem', background: 'transparent', boxShadow: 'none'}}>
         <div className="winner-card" style={{flex: 1}}>
            <h3>🤖 AI True Cost Evaluation</h3>
            <p>Our advanced L1 algorithm calculates hidden variables like delays, public impact, and maintenance risk to find the absolute best vendor.</p>
         </div>
         <div className="winner-card" style={{flex: 1}}>
            <h3>🔗 Immutable Blockchain Ledger</h3>
            <p>Cryptographic SHA-256 hashes generated natively on submission natively ensure zero tampering with submitted bids until deadline evaluation.</p>
         </div>
         <div className="winner-card" style={{flex: 1}}>
            <h3>📊 Real-time Admin Insights</h3>
            <p>Instantly compare bidders through visual stacked graphs, tabular breakdowns, and transparent explanations.</p>
         </div>
      </div>
    </div>
  );
};
export default Home;
