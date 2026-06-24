import React, { useState } from 'react';
import { Mail, ArrowLeft, Wifi, Loader2 } from 'lucide-react';
import { HashLink } from 'react-router-hash-link';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Login.css';

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost/Backend/page/password_reset/VerifyEmail.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        // Store email in session storage to use in next steps
        sessionStorage.setItem('resetEmail', email);
        navigate('/verify-code');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check if your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="bg-glow"></div>

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
          <h1 className="title">Forgot<span>Password?</span></h1>
          <p className="subtitle">Enter your email and we'll send you a 6-digit code.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message" style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: '1rem', background: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>{error}</div>}

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

          <button type="submit" className="main-login-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Code'}
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

export default VerifyEmail;
