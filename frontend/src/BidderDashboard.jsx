import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const BidderDashboard = () => {
    const [tenders, setTenders] = useState([]);
    
    useEffect(() => {
        axios.get('http://localhost:3000/tenders').then(res => setTenders(res.data)).catch(console.error);
    }, []);

    const handleBidSubmit = async (e, tender_id) => {
        e.preventDefault();
        const quoted_bid = e.target.quote.value;
        const bidder_id = localStorage.getItem('role') === 'bidder' ? 1 : 99; // Replace with proper logged in token parsed ID

        try {
            const res = await axios.post('http://localhost:3000/bids', {
                tender_id, bidder_id, quoted_bid: Number(quoted_bid)
            });
            alert(`Bid Placed! Smart Contract Tx Hash: ${res.data.hash}`);
        } catch (err) {
            alert('Error submitting bid: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Bidder Workspace</h1>
                <p className="subtitle">Submit transparent, secured bids to open Tenders.</p>
            </header>

            <div className="bids-table-container">
                <table className="bids-table">
                    <thead>
                        <tr>
                            <th>Tender ID</th>
                            <th>Title</th>
                            <th>Deadline</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenders.map(t => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.title}</td>
                                <td>{new Date(t.deadline).toLocaleDateString()}</td>
                                <td>
                                    <form onSubmit={(e) => handleBidSubmit(e, t.id)} style={{display: 'flex', gap: '0.5rem'}}>
                                        <input name="quote" type="number" placeholder="Quote ($)" required style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}} />
                                        <button type="submit" style={{padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor:'pointer'}}>Submit Bid</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BidderDashboard;
