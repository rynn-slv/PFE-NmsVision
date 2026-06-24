import React, { useState, useEffect } from 'react';
import { Lock, Wifi, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Login.css';

const ResetPass = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const email = sessionStorage.getItem('resetEmail');

  useEffect(() => {
    if (!email) {
      navigate('/forgetpass');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost/Backend/page/password_reset/ResetPassword.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        sessionStorage.removeItem('resetEmail');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page-wrapper">
        <div className="bg-glow"></div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={60} color="#4ade80" style={{ margin: '0 auto 20px' }} />
          <h1 className="title">Success!</h1>
          <p className="subtitle">Your password has been reset successfully.</p>
          <p className="subtitle">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="bg-glow"></div>

      <div className="bg-decor icon-tl"><Wifi size={100} /></div>
      <div className="bg-decor icon-tr"><Wifi size={80} /></div>

      <div className="glass-card">
        <div className="header-section">
          <div className="logo-box">
            <img src={logo} alt="Logo" style={{ width: '40px', filter: 'invert(1)' }} />
          </div>
          <h1 className="title">New<span>Password</span></h1>
          <p className="subtitle">Set a secure password for {email}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="main-login-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPass;
