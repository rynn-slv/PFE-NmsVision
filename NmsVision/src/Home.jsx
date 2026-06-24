import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Shield, Map, Activity, LayoutDashboard,
  ChevronRight, Globe, Github, Menu, X, ArrowRight,
  Wifi, Cpu, Gauge
} from 'lucide-react';
import landingBg from './assets/landing-bg.png';
import logo from './assets/logo.png';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const observerOptions = {
      threshold: 0.05
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      title: "Professional Speed Testing",
      description: "Accurate measurement of network bandwidth and latency, providing reliable diagnostic data to ensure optimal connection performance.",
      icon: Gauge,
      color: "#38bdf8"
    },
    {
      title: "Interactive Monitoring",
      description: "Real-time visualization of network health, translating complex data into clear, actionable insights through dynamic dashboards.",
      icon: LayoutDashboard,
      color: "#a855f7"
    },
    {
      title: "Infrastructure Management",
      description: "Comprehensive management of network infrastructure, providing essential tools for asset organization, IP planning, and reliable equipment tracking.",
      icon: Shield,
      color: "#10b981"
    }
  ];

  return (
    <div className="landing-container">
      {/* Dynamic Background Elements (Coherence with Login) */}
      <div className="bg-glow"></div>
      <div className="bg-decor icon-tl"><Wifi size={100} /></div>
      <div className="bg-decor icon-tr"><Globe size={80} /></div>
      <div className="bg-decor icon-bl"><Activity size={90} /></div>
      <div className="bg-decor icon-br"><Shield size={70} /></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-box-small">
              <img
                src={logo}
                alt="NMS Vision Logo"
                style={{
                  width: '24px',
                  height: '24px',
                  objectFit: 'contain',
                  filter: 'invert(1) hue-rotate(180deg) brightness(1.2) saturate(1.5)'
                }}
              />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
              NMS<span style={{ color: '#38bdf8' }}>Vision</span>
            </span>
          </div>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <a href="#home" className="nav-item">Home</a>
            <a href="#services" className="nav-item">Services</a>
            <Link to="/login" className="btn-login-small">Login</Link>
            <Link to="/signup" className="btn-signup-small">Sign Up</Link>
          </div>

          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${landingBg})` }}>
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-floating-box reveal">
            <div className="status-badge">
              <span className="dot"></span>
              System Live: 24/7 Monitoring
            </div>
            <h1>Elite Testing. Strategic Management.</h1>
            <p>
              Master your infrastructure with professional-grade speed testing and autonomous
              device management. Engineered for absolute visibility and elite performance control.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn-main-gradient">
                Get Started Now <ArrowRight size={18} />
              </Link>
              <a href="#services" className="btn-outline-small">View Services</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="section-header reveal">
          <h2>Industrial-Grade Management</h2>
          <p>Professional tools ensuring your network remains resilient, fast, and fully monitored.</p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card reveal" style={{ transitionDelay: `${index * 0.1}s` }}>
              <div className="service-icon-wrapper" style={{ boxShadow: `0 10px 20px ${service.color}20` }}>
                <service.icon size={28} color={service.color} />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats/Info Section */}
      <section className="stats reveal">
        <div className="stats-container">
          <div className="stat-card">
            <span className="stat-num">ICMP</span>
            <span className="stat-txt">Unified Monitoring</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">CIDR/IP</span>
            <span className="stat-txt">Subnet Planning</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">&lt; 1ms</span>
            <span className="stat-txt">Polling Latency</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-box-small">
                <img
                  src={logo}
                  alt="NMS Vision Logo"
                  style={{
                    width: '24px',
                    height: '24px',
                    objectFit: 'contain',
                    filter: 'invert(1) hue-rotate(180deg) brightness(1.2) saturate(1.5)'
                  }}
                />
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
                NMS<span style={{ color: '#38bdf8' }}>Vision</span>
              </span>
            </div>
            <p>Advanced network monitoring and speed testing for the modern infrastructure.</p>
          </div>
          <div className="footer-nav">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#services">Services</a>
              <a href="/guide">Documentation</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#">Contact</a>
              <a href="#">Github</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-text">
          <p>&copy; 2026 NMS Vision. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        :root {
          --bg-dark: #060910;
          --glass-bg: rgba(15, 23, 42, 0.8);
          --glass-border: rgba(255, 255, 255, 0.08);
          --accent-blue: #38bdf8;
          --accent-purple: #a855f7;
          --text-primary: #ffffff;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --gradient-main: linear-gradient(90deg, #0ea5e9 0%, #a855f7 100%);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-container {
          background-color: var(--bg-dark);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Dynamic Background (from login) */
        .bg-glow {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 10% 10%, rgba(124, 58, 237, 0.03) 0%, transparent 30%);
          pointer-events: none;
          z-index: 0;
        }

        .bg-decor {
          position: fixed;
          color: var(--accent-blue);
          opacity: 0.04;
          z-index: 0;
          pointer-events: none;
        }

        .icon-tl { top: 10%; left: 5%; }
        .icon-tr { top: 15%; right: 5%; }
        .icon-bl { bottom: 10%; left: 8%; }
        .icon-br { bottom: 5%; right: 8%; }

        /* Reveal Logic */
        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Navbar */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 6%;
          background: rgba(6, 9, 16, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          z-index: 100;
        }

        .nav-content {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -0.02em;
        }

        .logo-box-small {
          width: 36px;
          height: 36px;
          background: var(--gradient-main);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.3s;
        }
        .nav-item:hover { color: var(--accent-blue); }

        .btn-login-small {
          background: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: 0.3s;
        }
        .btn-login-small:hover { border-color: var(--accent-blue); }

        .btn-signup-small {
          background: var(--gradient-main);
          color: white;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
        }
        .btn-signup-small:hover { filter: brightness(1.1); transform: translateY(-1px); }

        .menu-toggle { display: none; background: none; border: none; color: white; cursor: pointer; }

        /* Hero */
        .hero {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          padding: 0 6%;
          z-index: 1;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          z-index: -1;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, var(--bg-dark) 40%, rgba(6, 9, 16, 0.4) 100%);
        }

        .hero-content { width: 100%; max-width: 1440px; margin: 0 auto; }

        .hero-floating-box {
          max-width: 600px;
          padding: 40px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(56, 189, 248, 0.1);
          border-radius: 50px;
          color: var(--accent-blue);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .dot { width: 6px; height: 6px; background: var(--accent-blue); border-radius: 50%; box-shadow: 0 0 8px var(--accent-blue); animation: ping 1.5s infinite; }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

        .hero-floating-box h1 { font-size: 3.25rem; font-weight: 900; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.04em; }
        .hero-floating-box p { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; }

        .hero-actions { display: flex; align-items: center; gap: 20px; }
        .btn-main-gradient {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 28px; background: var(--gradient-main); color: white;
          text-decoration: none; font-weight: 700; border-radius: 14px; transition: 0.3s;
          box-shadow: 0 8px 20px rgba(14, 165, 233, 0.25);
        }
        .btn-main-gradient:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-outline-small { 
          color: var(--text-secondary); text-decoration: none; font-weight: 600; font-size: 0.95rem; 
          border-bottom: 1px solid transparent; transition: 0.3s;
        }
        .btn-outline-small:hover { color: white; border-color: white; }

        /* Services */
        .services { padding: 120px 6%; z-index: 1; position: relative; }
        .section-header { text-align: center; margin-bottom: 72px; }
        .section-header h2 { font-size: 2.75rem; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.03em; }
        .section-header p { font-size: 1.15rem; color: var(--text-secondary); max-width: 650px; margin: 0 auto; }

        .services-grid { 
          display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
          gap: 32px; max-width: 1440px; margin: 0 auto; 
        }

        .service-card {
          padding: 40px;
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex; flex-direction: column; gap: 20px;
        }
        .service-card:hover {
          background: rgba(15, 23, 42, 0.5);
          transform: translateY(-10px);
          border-color: rgba(56, 189, 248, 0.3);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
        }

        .service-icon-wrapper {
          width: 56px; height: 56px; background: rgba(255, 255, 255, 0.03);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
        }
        .service-card h3 { font-size: 1.5rem; font-weight: 800; color: white; }
        .service-card p { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; }

        .service-footer-small {
          margin-top: auto; display: flex; align-items: center; gap: 8px;
          color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.3s;
          opacity: 0.6;
        }
        .service-card:hover .service-footer-small { opacity: 1; gap: 12px; color: var(--accent-blue); }

        /* Stats */
        .stats { padding: 60px 6% 120px; z-index: 1; position: relative; }
        .stats-container {
          max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr);
          background: rgba(15, 23, 42, 0.4); border: 1px solid var(--glass-border);
          border-radius: 32px; padding: 48px; text-align: center; gap: 40px;
        }
        .stat-card { display: flex; flex-direction: column; gap: 8px; }
        .stat-num { font-size: 3rem; font-weight: 900; background: var(--gradient-main); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-txt { font-weight: 600; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em; }

        /* Footer */
        .footer { padding: 100px 6% 60px; background: #04060b; border-top: 1px solid var(--glass-border); position: relative; z-index: 1; }
        .footer-content { max-width: 1440px; margin: 0 auto; display: flex; justify-content: space-between; gap: 60px; margin-bottom: 60px; }
        .footer-brand { max-width: 350px; display: flex; flex-direction: column; gap: 20px; }
        .footer-brand p { color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; }
        .footer-nav { display: flex; gap: 100px; }
        .footer-col h4 { margin-bottom: 24px; font-size: 1rem; font-weight: 700; color: white; }
        .footer-col a { display: block; margin-bottom: 12px; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: 0.3s; }
        .footer-col a:hover { color: var(--accent-blue); }
        .footer-bottom-text { max-width: 1440px; margin: 0 auto; border-top: 1px solid var(--glass-border); padding-top: 40px; color: var(--text-muted); font-size: 0.85rem; text-align: center; }

        /* Mobile */
        @media (max-width: 900px) {
          .nav-links { display: none; }
          .menu-toggle { display: block; }
          .hero-floating-box h1 { font-size: 2.5rem; }
          .stats-container { grid-template-columns: 1fr; padding: 32px; }
          .footer-content { flex-direction: column; gap: 40px; }
          .footer-nav { gap: 60px; }
        }
      `}</style>
    </div>
  );
};

export default Home;