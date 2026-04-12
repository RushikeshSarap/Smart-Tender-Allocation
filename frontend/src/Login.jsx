import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/auth/login', formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.user.role);
        localStorage.setItem('userId', res.data.user.id);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/bidder');
    } catch (err) {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="page-shell page-card-shell">
      <div className="auth-panel glass-card">
        <header className="dashboard-header">
          <h1>Login</h1>
          <p className="subtitle">Welcome back to the portal</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="form-field"
            type="email"
            placeholder="Email Address"
            required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            className="form-field"
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit" className="btn btn-primary form-submit">Sign In</button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register" className="link-accent">Register</Link>
        </p>
        <p className="auth-footer">
          <Link to="/" className="link-muted">← Back Home</Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
