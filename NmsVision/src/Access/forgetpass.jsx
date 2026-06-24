import React, { useState } from 'react';
import { Mail, ArrowLeft, Wifi } from 'lucide-react';
import { HashLink } from 'react-router-hash-link';
import logo from '../assets/logo.png';
import './Login.css';

const Forgetpass = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset password for:", email);
  };

  return (
    <div className="login-page-wrapper">
      <div className="bg-glow"></div>

      {/* Decorative Icons */}
      <div className="bg-decor icon-tl"><Wifi size={100} /></div>
      <div className="bg-decor icon-tr"><Wifi size={80} /></div>

      <div className="glass-card">
        <div className="header-section">
          <div className="logo-box">
            <img
              src={logo}
              alt="NMS Vision Logo"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                filter: 'invert(1) hue-rotate(180deg) brightness(1.2) saturate(1.5)'
              }}
            />
          </div>
          <h1 className="title">Reset<span>Password</span></h1>
          <p className="subtitle">Enter your email to receive a reset link</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="Enter your registered email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="main-login-btn">
            Send Reset Link
          </button>

          <div className="form-footer">
            <HashLink to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Back to Login
            </HashLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Forgetpass;
