import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowLeft, Wifi, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Login.css';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('resetEmail');
    if (!savedEmail) {
      navigate('/forgetpass');
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost/Backend/page/password_reset/VerifyCode.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/reset-password');
      } else {
        setError(data.message || 'Invalid code.');
      }
    } catch (err) {
      setError('Connection error.');
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
            <img src={logo} alt="Logo" style={{ width: '40px', filter: 'invert(1)' }} />
          </div>
          <h1 className="title">Verify<span>Code</span></h1>
          <p className="subtitle">Sent to {email}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label>6-Digit Code</label>
            <div className="input-wrapper">
              <KeyRound className="input-icon" size={18} />
              <input
                type="text"
                placeholder="000000"
                maxLength="6"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button type="submit" className="main-login-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
          </button>

          <div className="form-footer">
            <button
              type="button"
              onClick={() => navigate('/forgetpass')}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Change Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyCode;
