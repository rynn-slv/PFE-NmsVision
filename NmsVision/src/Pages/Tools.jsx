import React, { useState } from 'react';

import { Calculator, Globe, Shield, Zap, Search, Activity, ArrowRight } from 'lucide-react';

import '../main.css';

const Tools = () => {
    const [ip, setIp] = useState('');
    const [mask, setMask] = useState('');
    const [result, setResult] = useState(null);

    const calculateSubnet = () => {
        if (!ip || !mask) return;
        const cidr = parseInt(mask.replace('/', ''));
        if (isNaN(cidr) || cidr < 0 || cidr > 32) return;
        const ipParts = ip.split('.').map(Number);
        if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) return;
        let ipInt = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
        let maskInt = (0xFFFFFFFF << (32 - cidr)) >>> 0;
        let networkInt = (ipInt & maskInt) >>> 0;
        let broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
        const intToIp = (int) => { return `${(int >>> 24) & 255}.${(int >>> 16) & 255}.${(int >>> 8) & 255}.${int & 255}`; };
        let hosts;
        if (cidr === 32) hosts = 1;
        else if (cidr === 31) hosts = 2;
        else hosts = Math.pow(2, (32 - cidr)) - 2;
        setResult({ network: intToIp(networkInt), broadcast: intToIp(broadcastInt), mask: intToIp(maskInt), hosts: hosts > 0 ? hosts : 0 });
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Network Utilities</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Advanced tools for network professionals.</p>
            </header>

            {/* Subnet Calculator Panel */}
            <div className="glass-panel" style={{
                padding: '2.5rem',
                background: 'var(--glass-panel-bg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                        <Calculator size={20} color="var(--primary-accent)" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Subnet Calculator</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>IP Address</label>
                        <input
                            type="text"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="192.168.1.0"
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>CIDR / Prefix</label>
                        <input
                            type="text"
                            value={mask}
                            onChange={(e) => setMask(e.target.value)}
                            placeholder="/24"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <button
                    onClick={calculateSubnet}
                    className="calculate-btn"
                    style={calculateBtnStyle}
                >
                    Calculate
                </button>

                {result && (
                    <div className="animate-fade-in" style={{
                        marginTop: '2.5rem',
                        padding: '1.5rem',
                        background: 'var(--bg-dark-1)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <ResultItem label="Network" value={result.network} />
                        <ResultItem label="Broadcast" value={result.broadcast} />
                        <ResultItem label="Mask" value={result.mask} />
                        <ResultItem label="Usable Hosts" value={result.hosts.toLocaleString()} color="var(--primary-accent)" />
                    </div>
                )}
            </div>


            <style>{`
                .calculate-btn {
                    width: 100%;
                    padding: 1rem;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(90deg, #0ea5e9, #3b82f6);
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
                }
                .calculate-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5);
                    filter: brightness(1.1);
                }
                .calculate-btn:active {
                    transform: translateY(0);
                }
                .interactive:hover {
                    border-color: var(--primary-accent);
                    background: rgba(56, 189, 248, 0.05);
                    cursor: pointer;
                }
            `}</style>
        </div >
    );
};

const inputStyle = {
    background: 'var(--bg-dark-2)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    padding: '1rem',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box'
};

const calculateBtnStyle = {
    // Moved most to <style> tag for easier management of hover/active
};

const ResultItem = ({ label, value, color = 'var(--text-primary)' }) => (
    <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: '600', color: color }}>{value}</div>
    </div>
);

export default Tools;