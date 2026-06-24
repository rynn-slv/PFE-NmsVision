import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HashLink } from "react-router-hash-link";
import './Login.css';
import logo from '../assets/logo.png';
import { Wifi, Lock, Mail, Activity, Shield, Cpu, Globe, CheckCircle, AlertTriangle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'email') {
      value = value.toLowerCase().trim();
    }
    setFormData({ ...formData, [name]: value });
    
    // Clear error as user types
    if (error) setError('');
  };

  const validateForm = () => {
    const { email, password } = formData;
    
    // Email Validation
    if (!email) return "Email address is required";
    if (email.length > 254) return "Email address is too long";
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";

    // Password Validation
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must contain at least 8 characters";
    if (password.length > 64) return "Password must be less than 64 characters";
    
    const passPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passPolicy.test(password)) {
      return "Password must include uppercase, lowercase, number and symbol";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost/Backend/page/Login.php', {
        method: 'POST',
        credentials: 'include', // ← send/receive session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store user session info for role-based UI
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userAvatar', data.avatar || '');

        showToast('Login successful! Welcome back.', 'success');
        
        // Wait 1.5s to let the premium toast shine, then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        const errMsg = data.message || 'Login failed. Please try again.';
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const connErr = 'Connection error. Please ensure the backend is running.';
      setError(connErr);
      showToast(connErr, 'error');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {toast.show && (
        <div className={`auth-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
      {/* Dynamic Background Elements */}
      <div className="bg-glow"></div>

      {/* Decorative Background Icons */}
      <div className="bg-decor icon-tl"><Wifi size={100} /></div>
      <div className="bg-decor icon-tr"><Globe size={80} /></div>
      <div className="bg-decor icon-bl"><Activity size={90} /></div>
      <div className="bg-decor icon-br"><Shield size={70} /></div>
      <div className="bg-decor icon-center-left"><Cpu size={60} /></div>

      <div className="glass-card">
        {/* Header Section */}
        <div className="header-section">
          <div className="welcome-badge">Welcome back</div>
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
          <h1 className="title">NMS<span>Vision</span></h1>
          <p className="subtitle">Welcome to NmsVision</p>
          <p className="description">Please enter your details to access your account</p>
        </div>


        {/* Input Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                onChange={handleChange}
                maxLength={64}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="forgot-wrapper">
              <HashLink to="/forgetpass" className="forgot-link">Forgot password?</HashLink>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="main-login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Login'}
          </button>

          <div className="form-footer">
            <p>Don't have an account? <HashLink to="/signup">Sign up</HashLink></p>
          </div>

          <div className="back-home-wrapper" style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: 'var(--primary-accent)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;