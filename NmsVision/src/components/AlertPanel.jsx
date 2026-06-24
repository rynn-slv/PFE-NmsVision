import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Bell, Clock } from 'lucide-react';

const alertStyles = {
    Critical: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        Icon: AlertCircle
    },
    Warning: {
        bg: 'rgba(251, 191, 36, 0.1)',
        border: 'rgba(251, 191, 36, 0.2)',
        color: '#fbbf24',
        Icon: AlertTriangle
    },
    Info: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)',
        color: '#10b981',
        Icon: CheckCircle
    }
};

const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSec = Math.floor((now - date) / 1000);

    if (diffInSec < 60) return 'Just now';
    if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
    if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
    return date.toLocaleDateString();
};

const AlertPanel = ({ alerts = [], loading }) => {
    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '1rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                <Bell size={16} color="var(--primary-accent)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Live Network Alerts</h3>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '3px 8px',
                    borderRadius: '12px'
                }}>
                    Last 10 events
                </span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    Loading alerts...
                </div>
            ) : alerts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1.5rem' }}>
                    <CheckCircle size={32} color="var(--success)" opacity={0.3} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent alerts. System healthy.</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {alerts.map((alert) => {
                        const style = alertStyles[alert.severity] || alertStyles.Info;
                        const { Icon } = style;
                        return (
                            <div
                                key={alert.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    background: style.bg,
                                    border: `1px solid ${style.border}`,
                                    borderRadius: '10px',
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                <div style={{
                                    padding: '5px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex'
                                }}>
                                    <Icon size={14} color={style.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', lineHeight: '1.2' }}>{alert.message}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={10} />
                                            {formatTime(alert.created_at)}
                                        </div>
                                        {alert.ip_address && (
                                            <div style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                {alert.ip_address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AlertPanel;
