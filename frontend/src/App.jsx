import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import BidderDashboard from './BidderDashboard';
import './index.css';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
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
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <Router>
            <nav className="topbar">
                <Link to="/" className="brand">System Allocator</Link>
                <div className="topbar-actions">
                    {localStorage.getItem('token') ? (
                        <button className="btn btn-ghost logout-btn" onClick={handleLogout}>Logout</button>
                    ) : (
                        <Link to="/login" className="btn btn-secondary">Login</Link>
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
