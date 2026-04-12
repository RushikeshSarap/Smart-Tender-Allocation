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
        await axios.post('http://localhost:3000/auth/register', formData);
        alert('Registered successfully, please login.');
        navigate('/login');
    } catch (err) {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="dashboard-container" style={{maxWidth: '400px', marginTop: '10vh'}}>
      <header className="dashboard-header">
        <h1>Register</h1>
        <p className="subtitle">Join as an Admin or Bidder</p>
      </header>
      
      <div className="chart-container">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input type="text" placeholder="Full Name" required style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <select style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="bidder">Bidder</option>
              <option value="admin">Admin</option>
          </select>
          <input type="email" placeholder="Email Address" required style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}/>
          <input type="password" placeholder="Password" required style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc'}} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}/>
          
          <button type="submit" style={{padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
            Create Account
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem', color: 'var(--text-light)'}}>
          Already have an account? <Link to="/login" style={{color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none'}}>Login</Link>
        </p>
        <p style={{textAlign: 'center', marginTop: '1rem'}}>
          <Link to="/" style={{color: 'var(--text-light)', textDecoration: 'none'}}>← Back Home</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
