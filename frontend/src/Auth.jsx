import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'bidder' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post('/auth/login', {
            email: formData.email, password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.user.role);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/bidder');
      } else {
        await axios.post('/auth/register', formData);
        alert('Registered successfully, please login.');
        setIsLogin(true);
      }
    } catch (err) {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="dashboard-container" style={{maxWidth: '400px', marginTop: '10vh'}}>
      <header className="dashboard-header">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        <p className="subtitle">Smart Tender Allocation System</p>
      </header>
      
      <div className="chart-container">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" required style={inputStyle} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <select style={inputStyle} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="bidder">Bidder</option>
                  <option value="admin">Admin</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Email Address" required style={inputStyle} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}/>
          <input type="password" placeholder="Password" required style={inputStyle} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}/>
          
          <button type="submit" style={btnStyle}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem', cursor: 'pointer', color: 'var(--primary)'}} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

const inputStyle = { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' };
const btnStyle = { padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' };

export default Auth;
