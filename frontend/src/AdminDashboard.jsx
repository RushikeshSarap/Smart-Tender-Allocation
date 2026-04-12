import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import Dashboard from './Dashboard';

const AdminDashboard = () => {
    const [tenders, setTenders] = useState([]);
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [evaluationData, setEvaluationData] = useState(null);

    useEffect(() => {
        fetchTenders();
    }, []);

    const fetchTenders = async () => {
        try {
            const res = await axios.get('http://localhost:3000/tenders');
            setTenders(res.data);
        } catch (err) {}
    };

    const handleCreateTender = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/tenders', {
                title, description: "Dynamic creation", deadline, created_by: 1
            });
            alert('Tender Created');
            fetchTenders();
        } catch (err) {
            alert('Error creating tender');
        }
    };

    const handleEvaluate = async (tenderId) => {
        try {
            const res = await axios.post(`http://localhost:3000/tenders/evaluate/${tenderId}`);
            setEvaluationData(res.data);
        } catch (err) {
            alert("No bids found or error: " + (err.response?.data?.error || err.message));
        }
    };

    if (evaluationData) {
        return (
            <div>
                <button onClick={() => setEvaluationData(null)} style={{margin: '1rem 2rem', padding: '0.5rem', cursor: 'pointer'}}>Back to Tenders</button>
                <Dashboard data={evaluationData} />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
            </header>

            <div className="chart-container" style={{marginBottom: '2rem'}}>
                <h3>Create New Tender</h3>
                <form onSubmit={handleCreateTender} style={{display: 'flex', gap: '1rem'}}>
                    <input type="text" placeholder="Tender Title" value={title} onChange={e => setTitle(e.target.value)} required style={{padding: '0.5rem'}}/>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required style={{padding: '0.5rem'}}/>
                    <button type="submit" style={{padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor:'pointer'}}>Create</button>
                </form>
            </div>

            <div className="bids-table-container">
                <table className="bids-table">
                    <thead>
                        <tr>
                            <th>ID</th>
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
                                    <button onClick={() => handleEvaluate(t.id)} style={{padding: '0.5rem', background: '#f59e0b', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Evaluate Winner</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
