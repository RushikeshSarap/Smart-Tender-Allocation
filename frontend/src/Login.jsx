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
        const res = await axios.post('http://localhost:3000/auth/login', formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.user.role);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/bidder');
    } catch (err) {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="dashboard-container" style={{maxWidth: '400px', marginTop: '10vh'}}>
      <header className="dashboard-header">
        <h1>Login</h1>
        <p className="subtitle">Welcome back to the portal</p>
      </header>
      
      <div className="chart-container">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input type="email" placeholder="Email Address" required style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}/>
          <input type="password" placeholder="Password" required style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}/>
          
          <button type="submit" style={{padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
            Sign In
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem', color: 'var(--text-light)'}}>
          Don't have an account? <Link to="/register" style={{color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none'}}>Register</Link>
        </p>
        <p style={{textAlign: 'center', marginTop: '1rem'}}>
          <Link to="/" style={{color: 'var(--text-light)', textDecoration: 'none'}}>← Back Home</Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
