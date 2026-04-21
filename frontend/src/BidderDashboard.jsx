import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import { formatCurrency } from './utils';

const BidderDashboard = () => {
    const [tenders, setTenders] = useState([]);
    const [selectedTender, setSelectedTender] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('');
    const [supportDocument, setSupportDocument] = useState(null);
    const [notification, setNotification] = useState(null);
    const [submittedBids, setSubmittedBids] = useState([]);

    useEffect(() => {
        fetchTenders();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4500);
    };

    const fetchTenders = async () => {
        try {
            const res = await axios.get('/tender');
            setTenders(res.data);
        } catch (err) {
            console.error('Unable to fetch tenders', err);
            showNotification('Unable to load tenders.', 'error');
        }
    };

    const selectTender = async (tender) => {
        setSelectedTender(tender);
        setSelectedResult(null);
        setBidAmount('');
        setEstimatedDays('');
        setSupportDocument(null);
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTender) return showNotification('Please select a tender first.', 'warning');
        if (!bidAmount || Number(bidAmount) <= 0) return showNotification('Enter a valid bid amount.', 'warning');

        try {
            const payload = new FormData();
            payload.append('tender_id', selectedTender.id);
            payload.append('quoted_bid', Number(bidAmount));
            payload.append('estimated_completion_days', Number(estimatedDays) || 0);
            if (supportDocument) payload.append('support_doc', supportDocument);

            const res = await axios.post('/bid', payload);
            setSubmittedBids(prev => [...prev, {
                tenderId: selectedTender.id,
                bid: Number(bidAmount),
                days: Number(estimatedDays) || 0,
                txHash: res.data.hash,
                timestamp: new Date().toLocaleString()
            }]);
            showNotification('Bid submitted successfully.', 'success');
            setBidAmount('');
            setEstimatedDays('');
            setSupportDocument(null);
        } catch (err) {
            showNotification('Error submitting bid: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const loadTenderResult = async () => {
        if (!selectedTender) return;
        try {
            const res = await axios.get(`/result/${selectedTender.id}`);
            setSelectedResult(res.data);
        } catch (err) {
            showNotification('Unable to load tender result.', 'error');
        }
    };

    const myBidsForTender = selectedTender ? submittedBids.filter(b => b.tenderId === selectedTender.id) : [];

    return (
        <div className="page-shell">
            <div className="dashboard-header page-header">
                <h1>Bidder Dashboard</h1>
                <p className="subtitle">View tenders, submit bids, and compare true-cost evaluation outcomes.</p>
            </div>

            <div className="dashboard-grid">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-brand">Bidder Panel</div>
                    <nav className="sidebar-nav">
                        <button className="sidebar-item active">Available Tenders</button>
                        <button className="sidebar-item" onClick={() => selectedTender && loadTenderResult()}>View Result</button>
                    </nav>
                    <div className="sidebar-summary">
                        <div className="summary-label">Selected Tender</div>
                        <div className="summary-value">{selectedTender ? selectedTender.id : 'None'}</div>
                        <div className="summary-note">Tap a tender row to inspect details</div>
                    </div>
                </aside>

                <main className="dashboard-main">
                    {notification && (
                        <div className={`notification-banner ${notification.type}`}>
                            {notification.message}
                        </div>
                    )}

                    <div className="stats-grid">
                        <div className="metric-card glass-card">
                            <p>Available Tenders</p>
                            <h2>{tenders.length}</h2>
                        </div>
                        <div className="metric-card glass-card">
                            <p>Bids Submitted</p>
                            <h2>{submittedBids.length}</h2>
                        </div>
                        <div className="metric-card glass-card">
                            <p>Current Selection</p>
                            <h2>{selectedTender ? selectedTender.title.substring(0, 24) : 'Choose tender'}</h2>
                        </div>
                    </div>

                    <section className="glass-card table-panel">
                        <div className="table-panel-header">
                            <h3>Available Tenders</h3>
                            <p>Choose a tender to review requirements, submit bids, and see evaluation results.</p>
                        </div>
                        <div className="table-scroll">
                            <table className="bids-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Deadline</th>
                                        <th>Budget</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenders.map((t) => (
                                        <tr key={t.id}>
                                            <td>{t.id}</td>
                                            <td>{t.title}</td>
                                            <td>{new Date(t.deadline).toLocaleDateString()}</td>
                                            <td>{formatCurrency(t.estimated_budget)}</td>
                                            <td className="table-actions">
                                                <button className="btn btn-secondary" onClick={() => selectTender(t)}>Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {selectedTender && (
                        <section className="glass-card tender-detail-wrapper">
                            <div className="panel-header">
                                <h3>Tender Detail</h3>
                                <p>Review full tender information before submitting your bid.</p>
                            </div>
                            <div className="tender-detail-card">
                                <div className="tender-detail-grid">
                                    <div>
                                        <span>Title</span>
                                        <strong>{selectedTender.title}</strong>
                                    </div>
                                    <div>
                                        <span>Budget</span>
                                        <strong>{formatCurrency(selectedTender.estimated_budget)}</strong>
                                    </div>
                                    <div>
                                        <span>Deadline</span>
                                        <strong>{new Date(selectedTender.deadline).toLocaleDateString()}</strong>
                                    </div>
                                    <div>
                                        <span>Project Type</span>
                                        <strong>{selectedTender.project_type || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span>Required Experience</span>
                                        <strong>{selectedTender.required_experience || 'N/A'}</strong>
                                    </div>
                                </div>
                                <div className="tender-detail-description">
                                    <span>Description</span>
                                    <p>{selectedTender.description}</p>
                                </div>
                            </div>

                            <div className="bid-submit-panel glass-card">
                                <h4>Submit a Bid</h4>
                                <form className="tender-form" onSubmit={handleBidSubmit}>
                                    <input
                                        className="form-field"
                                        placeholder="Bid Amount (₹)"
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        min="1"
                                        required
                                    />
                                    <input
                                        className="form-field"
                                        placeholder="Estimated Completion Time (days)"
                                        type="number"
                                        value={estimatedDays}
                                        onChange={(e) => setEstimatedDays(e.target.value)}
                                        min="1"
                                    />
                                    <input
                                        className="form-field"
                                        type="file"
                                        accept="application/pdf,image/png,image/jpeg"
                                        onChange={(e) => setSupportDocument(e.target.files[0])}
                                    />
                                    <button type="submit" className="btn btn-primary">Submit Bid</button>
                                </form>
                                <div className="hint-box">
                                    <p><strong>Tip:</strong> Use a balanced bid with realistic completion days to improve True Cost ranking.</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {selectedResult && (
                        <section className="glass-card result-panel">
                            <div className="panel-header">
                                <h3>Evaluation Result</h3>
                                <p>Review the winner and the cost breakdown for the selected tender.</p>
                            </div>
                            <div className="result-summary">
                                <div>
                                    <span>Result Status</span>
                                    <strong>{selectedResult.evaluation_status || 'unknown'}</strong>
                                </div>
                                <div>
                                    <span>Winner</span>
                                    <strong>{selectedResult.winner ? (selectedResult.winner.bidder_name || `Bidder ${selectedResult.winner.bidder_id}`) : 'Pending'}</strong>
                                </div>
                                <div>
                                    <span>Total Bids</span>
                                    <strong>{selectedResult.all_bids.length}</strong>
                                </div>
                            </div>
                        </section>
                    )}

                    {myBidsForTender.length > 0 && (
                        <section className="glass-card bid-tracking-panel">
                            <div className="panel-header">
                                <h3>Your Submitted Bids</h3>
                                <p>Track your recent bids for the selected tender.</p>
                            </div>
                            <div className="table-scroll">
                                <table className="bids-table">
                                    <thead>
                                        <tr>
                                            <th>Bid Amount</th>
                                            <th>Days</th>
                                            <th>Tx Hash</th>
                                            <th>When</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myBidsForTender.map((item, index) => (
                                            <tr key={index}>
                                                <td>{formatCurrency(item.bid)}</td>
                                                <td>{item.days}</td>
                                                <td>{item.txHash}</td>
                                                <td>{item.timestamp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BidderDashboard;
