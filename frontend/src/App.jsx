import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import BidderDashboard from './BidderDashboard';
import './index.css';

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) return <Navigate to="/login" />;
    if (roleRequired && role !== roleRequired) {
        return role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/bidder" />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <nav style={{padding: '1rem 2rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <h2 style={{margin: 0, background: 'linear-gradient(90deg, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer'}} onClick={()=>window.location.href='/'}>System Allocator</h2>
                <div>
                   {localStorage.getItem('token') ? (
                       <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{padding: '0.5rem 1rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold'}}>Logout</button>
                   ) : (
                       <div style={{display: 'flex', gap: '1rem'}}>
                          <button onClick={()=>window.location.href='/login'} style={{padding: '0.5rem 1rem', cursor: 'pointer', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontWeight: 'bold'}}>Login</button>
                       </div>
                   )}
                </div>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={
                    <ProtectedRoute roleRequired="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/bidder" element={
                    <ProtectedRoute roleRequired="bidder">
                        <BidderDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
