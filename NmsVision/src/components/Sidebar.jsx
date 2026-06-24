import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Network, Activity, Map, Settings, Zap,
    Calculator, LogOut, User as UserIcon, Package, Shield, Globe, Wifi, Users
} from 'lucide-react';
import logo from '../assets/logo.png';
import LogoutModal from './LogoutModal';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const userRole = localStorage.getItem('userRole') || 'operator';
    const userName = localStorage.getItem('userName') || 'User';
    const isAdmin = userRole === 'admin';
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');

    useEffect(() => {
        const handleStorageChange = () => {
            setUserAvatar(localStorage.getItem('userAvatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const allNavItems = [
        { icon: Activity, label: 'Getting Started', path: '/guide', adminOnly: false },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', adminOnly: false },
        { icon: Network, label: 'Devices', path: '/devices', adminOnly: false },
        { icon: Globe, label: 'Manage Networks', path: '/manage-networks', adminOnly: false },
        { icon: Activity, label: 'Connectivity', path: '/connectivity', adminOnly: false },
        { icon: Map, label: 'Network Map', path: '/map', adminOnly: false },
        { icon: Calculator, label: 'Tools', path: '/tools', adminOnly: false },
        { icon: Package, label: 'Manage Devices', path: '/manage-devices', adminOnly: false },
        { icon: Users, label: 'Manage Operators', path: '/manage-operators', adminOnly: true },
        { icon: Settings, label: 'Settings', path: '/settings', adminOnly: true },
    ];

    // Filter nav items based on role
    const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

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

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--glass-border)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100
        }}>
            {/* Logo */}
            <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                    src={logo}
                    alt="NMS Vision Logo"
                    style={{
                        width: '42px',
                        height: '42px',
                        objectFit: 'contain',
                        filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg) brightness(1.2) saturate(1.5)' : 'none'
                    }}
                />
                <h1 style={{
                    fontSize: '1.6rem',
                    fontWeight: '900',
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.03em',
                    lineHeight: '1'
                }}>
                    NMS<span style={{ color: '#38bdf8' }}>Vision</span>
                </h1>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            borderLeft: isActive ? '3px solid var(--primary-accent)' : '3px solid transparent',
                            transition: 'all 0.25s ease',
                        })}
                    >
                        <item.icon size={20} />
                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Profile Section */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                    className="glass-panel"
                    style={{ padding: '1rem', cursor: 'pointer' }}
                    onClick={() => navigate('/settings')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: isAdmin
                                ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}>
                            {userAvatar ? (
                                <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                isAdmin ? <Shield size={20} color="white" /> : <UserIcon size={20} color="white" />
                            )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userName}
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: isAdmin ? '#38bdf8' : '#22c55e',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {isAdmin ? '⚙ Administrator' : '👁 Operator'}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#f87171',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </aside>
    );
};

export default Sidebar;