import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Bell,
    Shield,
    Monitor,
    Globe,
    Database,
    Lock,
    Camera,
    Mail,
    Smartphone,
    Save,
    RefreshCcw,
    Network,
    Moon,
    Sun,
    Eye,
    EyeOff,
    LogOut,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);

    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', avatar: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 256;
                    const MAX_HEIGHT = 256;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress image to JPEG at 80% quality to avoid MySQL max_allowed_packet errors
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setProfileData(prev => ({ ...prev, avatar: dataUrl }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    const handleLogout = async () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        try {
            await fetch('http://localhost/Backend/page/Logout.php', {
                method: 'GET',
                credentials: 'include',
            });
        } catch (_) { }

        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('http://localhost/Backend/page/settings.php?action=get_profile', {
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setProfileData({
                        name: data.data.name || '',
                        email: data.data.email || '',
                        phone: data.data.phone || '',
                        avatar: data.data.avatar || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        try {
            const response = await fetch('http://localhost/Backend/page/settings.php?action=update_profile', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            showToast(data.message, data.status === 'success' ? 'success' : 'error');
            if (data.status === 'success') {
                localStorage.setItem('userAvatar', profileData.avatar || '');
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast("Error updating profile.", 'error');
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.current_password || !passwordData.new_password) {
            showToast("Please fill in both password fields.", 'error');
            return;
        }
        try {
            const response = await fetch('http://localhost/Backend/page/settings.php?action=update_password', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            const data = await response.json();
            showToast(data.message, data.status === 'success' ? 'success' : 'error');
            if (data.status === 'success') {
                setPasswordData({ current_password: '', new_password: '' });
            }
        } catch (error) {
            console.error("Error updating password:", error);
            showToast("Error updating password.", 'error');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Personal Profile', icon: User },
        { id: 'appearance', label: 'Appearance & UI', icon: Monitor },
    ];


    return (
        <div className="fadeIn" style={{ color: 'var(--text-primary)' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                    <span className="text-gradient">Settings</span>
                </h1>
                <p>Personalize your experience and configure network monitoring settings</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', alignItems: 'start' }}>

                {/* Tabs Sidebar */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary-glow)' : 'transparent',
                                    borderLeft: activeTab === tab.id ? '3px solid var(--primary-accent)' : '3px solid transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: activeTab === tab.id ? '700' : '500',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    textAlign: 'left'
                                }}
                            >
                                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        <button className="primary-button" onClick={handleSaveProfile} style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1rem', cursor: 'pointer', border: 'none' }}>
                            <Save size={18} />
                            Save Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {activeTab === 'profile' && (
                        <div className="fadeIn">
                            <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer', width: '100px', height: '100px', borderRadius: '30px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(14, 165, 233, 0.3)', overflow: 'hidden' }}>
                                            {profileData.avatar ? (
                                                <img src={profileData.avatar} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={48} color="white" />
                                            )}
                                        </div>
                                        <button onClick={() => fileInputRef.current.click()} style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-dark-1)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Camera size={16} />
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '5px' }}>User Profile</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>Manage your personal information and credentials</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>FULL NAME</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-accent)' }} />
                                            <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} style={{ width: '100%', background: 'var(--bg-dark-1)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 12px 12px 40px', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-accent)' }} />
                                            <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} style={{ width: '100%', background: 'var(--bg-dark-1)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 12px 12px 40px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>PHONE NUMBER</label>
                                        <div style={{ position: 'relative' }}>
                                            <Smartphone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-accent)' }} />
                                            <input type="text" placeholder="+213 XXX XX XX XX" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} style={{ width: '100%', background: 'var(--bg-dark-1)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 12px 12px 40px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Lock size={20} color="#a855f7" />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Account Security</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>CURRENT PASSWORD</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                                                <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>NEW PASSWORD</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleUpdatePassword} className="flat-button" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.9rem' }}>
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="fadeIn">
                            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Monitor size={22} color="var(--primary-accent)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Visual Preferences</h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div 
                                            onClick={() => toggleTheme('dark')}
                                            style={{ 
                                                padding: '1.5rem', 
                                                background: theme === 'dark' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)', 
                                                borderRadius: '15px', 
                                                border: theme === 'dark' ? '2px solid var(--primary-accent)' : '1px solid var(--glass-border)', 
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Moon size={24} style={{ marginBottom: '1rem', color: theme === 'dark' ? 'var(--primary-accent)' : 'var(--text-muted)' }} />
                                            <div style={{ fontWeight: '800', color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Deep Dark Mode</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-muted)' }}>Optimized for OLED screens</div>
                                        </div>
                                        <div 
                                            onClick={() => toggleTheme('light')}
                                            style={{ 
                                                padding: '1.5rem', 
                                                background: theme === 'light' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)', 
                                                borderRadius: '15px', 
                                                border: theme === 'light' ? '2px solid var(--primary-accent)' : '1px solid var(--glass-border)', 
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Sun size={24} style={{ marginBottom: '1rem', color: theme === 'light' ? 'var(--primary-accent)' : 'var(--text-muted)' }} />
                                            <div style={{ fontWeight: '800', color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Light Mode</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Professional & Clean Interface</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                .text-gradient {
                    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .primary-button {
                    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
                    border: none;
                    color: white;
                    font-weight: 700;
                    box-shadow: 0 8px 16px rgba(56, 189, 248, 0.25);
                    transition: all 0.2s ease;
                }
                .primary-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 20px rgba(56, 189, 248, 0.35);
                    filter: brightness(1.1);
                }
                .primary-button:active {
                    transform: translateY(0);
                }
                .flat-button {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--glass-border);
                    color: white;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .flat-button:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--primary-accent);
                }
                input:focus {
                    outline: none;
                    border-color: var(--primary-accent) !important;
                    background: rgba(14, 165, 233, 0.05) !important;
                    box-shadow: 0 0 15px rgba(14, 165, 233, 0.1);
                }
                @keyframes slideDownFade {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>

            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: toast.type === 'success' ? '#10b981' : '#ef4444',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 9999,
                    animation: 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{toast.message}</span>
                </div>
            )}

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
};

export default Settings;
