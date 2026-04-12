import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'bidder' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await axios.post('/auth/register', formData);
        alert('Registered successfully, please login.');
        navigate('/login');
    } catch (err) {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="page-shell page-card-shell">
      <div className="auth-panel glass-card">
        <header className="dashboard-header">
          <h1>Register</h1>
          <p className="subtitle">Join as an Admin or Bidder</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="form-field"
            type="text"
            placeholder="Full Name"
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <select
            className="form-field"
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
              <option value="bidder">Bidder</option>
              <option value="admin">Admin</option>
          </select>
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
          <button type="submit" className="btn btn-primary form-submit">Create Account</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="link-accent">Login</Link>
        </p>
        <p className="auth-footer">
          <Link to="/" className="link-muted">← Back Home</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
