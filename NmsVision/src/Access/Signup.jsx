import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Lock, Mail, User, Globe, Activity, Shield, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import { HashLink } from "react-router-hash-link";
import logo from '../assets/logo.png';
import './Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const validateFullName = (name) => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return "Name must be at least 2 characters long.";
    if (/[0-9]/.test(name)) return "Name cannot contain numbers.";
    if (/[@#!$%^&*()_+={}[\]:;"<>,.?/|\\~]/.test(name)) return "Name cannot contain special characters.";
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) return "Name contains invalid characters.";
    return null;
  };

  const validateEmail = (email) => {
    if (/\s/.test(email)) return "Email cannot contain spaces.";
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return "Invalid email format (name@domain.tld).";
    if (email.endsWith("@test.com")) return "Disposable domains are not allowed.";
    return null;
  };

  const validatePassword = (pass, email) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[@#!$%^&*]/.test(pass)) return "Password must contain at least one special character (@#!$%).";
    if (/\s/.test(pass)) return "Password cannot contain spaces.";
    if (pass === email) return "Password cannot be the same as your email.";
    
    const commonPasswords = ['password123', '12345678', 'qwertyuiop'];
    if (commonPasswords.includes(pass.toLowerCase())) return "This password is too common.";
    
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Auto-trim Full Name leading/trailing spaces as they type (or on submit)
    // To allow spaces between names, we only trim on the final value or check for numbers/special chars
    
    setFormData(prev => {
      const nextData = { ...prev, [name]: newValue };
      
      // Real-time password matching check
      if (name === 'confirmPassword' || name === 'password') {
        if (nextData.confirmPassword && nextData.password !== nextData.confirmPassword) {
          setError("Passwords do not match!");
        } else {
          setError("");
        }
      }
      
      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field Validation
    const nameErr = validateFullName(formData.fullName);
    if (nameErr) { setError(nameErr); return; }

    const emailErr = validateEmail(formData.email);
    if (emailErr) { setError(emailErr); return; }

    const passErr = validatePassword(formData.password, formData.email);
    if (passErr) { setError(passErr); return; }

    if (formData.password !== formData.confirmPassword) {
      const matchErr = "Passwords do not match!";
      setError(matchErr);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost/Backend/page/Signup.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        const succMsg = 'Account created successfully! Redirecting to login...';
        setSuccess(succMsg);
        showToast(succMsg, 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errMsg = data.error || 'Failed to create account.';
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const connErr = 'Connection error. Please try again later.';
      setError(connErr);
      showToast(connErr, 'error');
      console.error('Signup error:', err);
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
      <div className="bg-glow"></div>

      {/* Decorative Icons */}
      <div className="bg-decor icon-tl"><Wifi size={100} /></div>
      <div className="bg-decor icon-tr"><Wifi size={80} /></div>
      <div className="bg-decor icon-bl"><Wifi size={90} /></div>
      <div className="bg-decor icon-br"><Wifi size={70} /></div>

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
          <h1 className="title">NMS<span>Vision</span></h1>
          <p className="subtitle">Network Monitoring & Speed Testing</p>
        </div>


        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                name="fullName"
                type="text"
                placeholder="Enter your name"
                required
                onChange={handleChange}
              />
            </div>
          </div>

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
                type="password"
                placeholder="Create a password"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                onChange={handleChange}
              />
            </div>
          </div>


          {/* No role selector — all public registrations are Admin accounts */}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message" style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            padding: '10px',
            borderRadius: '10px',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '15px'
          }}>{success}</div>}

          <button type="submit" className="main-login-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="form-footer">
            <p>Already have an account? <HashLink to="/login">Login</HashLink></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;