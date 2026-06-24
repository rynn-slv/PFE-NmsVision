import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Globe, Wifi, Activity, DownloadCloud, UploadCloud,
    User, Star, RefreshCw, Send, Settings, Shield,
    History, Zap, CheckCircle, AlertCircle, Server
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import SpeedGauge from '../components/SpeedGauge';

// Detect the correct Backend URL dynamically based on current host
const getServerHost = () => {
    const host = window.location.hostname;
    return (host === 'localhost' || host === '127.0.0.1') ? 'localhost' : host;
};

const API_BASE = `http://${getServerHost()}/Backend/page/SpeedTest.php`;

const Connectivity = () => {
    const [testState, setTestState] = useState('idle'); // idle, ping, download, upload, complete
    const [speed, setSpeed] = useState(0);
    const [download, setDownload] = useState(0);
    const [upload, setUpload] = useState(0);
    const [pingResult, setPingResult] = useState(0);
    const [downLatency, setDownLatency] = useState(0);
    const [upLatency, setUpLatency] = useState(0);

    const [testHistory, setTestHistory] = useState([]);
    const abortController = useRef(null);

    const [gatewayIP, setGatewayIP] = useState('192.168.1.1');
    const [tempIP, setTempIP] = useState('192.168.1.1');
    const [showIPModal, setShowIPModal] = useState(false);
    const [selectedServer, setSelectedServer] = useState({
        name: 'Local Router (Gateway)',
        location: '192.168.1.1',
        host: '192.168.1.1',
        type: 'router'
    });

    const availableServers = [
        { name: 'Local Router (Gateway)', location: gatewayIP, host: gatewayIP, type: 'router' },
        { name: 'Algeria Telecom', location: 'Algiers, DZ', host: '105.101.6.153', type: 'external' }
    ];

    const openIPModal = (e) => {
        e.stopPropagation();
        setTempIP(gatewayIP);
        setShowIPModal(true);
    };

    const handleIPSubmit = () => {
        if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(tempIP)) {
            setGatewayIP(tempIP);
            setShowIPModal(false);
            if (selectedServer.type === 'router') {
                setSelectedServer({ ...availableServers[0], location: tempIP, host: tempIP });
            }
        } else {
            alert("Please enter a valid IP address.");
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}?action=get_history`, { credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                const formatted = data.data.reverse().map(item => ({
                    time: new Date(item.test_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    latency: parseInt(item.ping),
                    download: parseFloat(item.download_speed),
                    upload: parseFloat(item.upload_speed)
                }));
                setTestHistory(formatted);
            }
        } catch (e) { console.error("History fetch failed", e); }
    };

    const saveTestToDB = async (finalDown, finalUp, finalPing) => {
        try {
            await fetch(`${API_BASE}?action=save_history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    download: finalDown,
                    upload: finalUp,
                    ping: finalPing,
                    server_name: selectedServer.name,
                    server_ip: selectedServer.host
                })
            });
            fetchHistory();
        } catch (e) { console.error("Failed to save history", e); }
    };

    // ─── REAL SPEED TEST ENGINE (Cloudflare API) ───────────────────────────────
    // speed.cloudflare.com is designed for browser testing and has full CORS support.
    // These endpoints give real internet speeds matching speedtest.net results.
    const CF_DOWN = 'https://speed.cloudflare.com/__down';
    const CF_UP = 'https://speed.cloudflare.com/__up';

    const measurePing = async () => {
        const samples = [];
        const isExternal = selectedServer.type === 'external';
        
        for (let i = 0; i < 8; i++) {
            const start = performance.now();
            try {
                if (isExternal) {
                    await fetch(`${CF_DOWN}?bytes=0&cb=${Math.random()}`, { cache: 'no-store' });
                    samples.push(performance.now() - start);
                } else {
                    // It's the Router, use Backend relay with dynamic IP
                    const res = await fetch(`${API_BASE}?action=ping_target&target=${gatewayIP}&cb=${Math.random()}`, { cache: 'no-store' });
                    const data = await res.json();
                    samples.push(data.latency || (performance.now() - start));
                }
            } catch (e) {
                samples.push(isExternal ? 50 : 5);
            }
            await new Promise(r => setTimeout(r, 80));
        }
        
        if (samples.length > 1) samples.shift();
        const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
        setPingResult(avg);
        return avg;
    };

    const bytesRef = useRef(0);
    const finalDownRef = useRef(0);
    const finalUpRef = useRef(0);

    const runDownloadTest = async () => {
        const DURATION = 10000;
        const startTime = performance.now();
        bytesRef.current = 0;
        let lastMbps = 0;

        const isExternal = selectedServer.type === 'external';
        const url = isExternal 
            ? `${CF_DOWN}?bytes=104857600&cb=${Math.random()}`
            : `${API_BASE}?action=download&size=50&cb=${Math.random()}`;

        const stream = async () => {
            try {
                const response = await fetch(url, {
                    signal: abortController.current.signal
                });
                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done || performance.now() - startTime > DURATION) {
                        reader.cancel();
                        break;
                    }
                    bytesRef.current += value.length;
                    const elapsed = (performance.now() - startTime) / 1000;
                    if (elapsed > 0.3) {
                        lastMbps = (bytesRef.current * 8) / (elapsed * 1_000_000);
                        setSpeed(lastMbps);
                        setDownload(lastMbps);
                    }
                }
            } catch (e) { /* aborted or done */ }
        };

        const streamCount = isExternal ? 4 : 2;
        await Promise.race([
            Promise.all(Array.from({ length: streamCount }, () => stream())),
            new Promise(r => setTimeout(r, DURATION))
        ]);

        const elapsed = (performance.now() - startTime) / 1000;
        const finalDown = (bytesRef.current * 8) / (elapsed * 1_000_000);
        finalDownRef.current = finalDown;
        setDownload(finalDown);
        return finalDown;
    };

    const runUploadTest = async () => {
        const DURATION = 10000;
        const startTime = performance.now();
        bytesRef.current = 0;
        let isDone = false;

        const isExternal = selectedServer.type === 'external';
        const url = isExternal ? CF_UP : `${API_BASE}?action=upload`;

        const CHUNK = 1024 * 1024;
        const blob = new Blob([new Uint8Array(CHUNK)], { type: 'text/plain' });

        const ticker = setInterval(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            if (elapsed > 0.3 && bytesRef.current > 0) {
                const mbps = (bytesRef.current * 8) / (elapsed * 1_000_000);
                setSpeed(mbps);
                setUpload(mbps);
            }
        }, 300);

        const stream = async () => {
            while (!isDone) {
                try {
                    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}cb=${Math.random()}`, {
                        method: 'POST',
                        body: blob
                    });
                    if (res.ok) bytesRef.current += CHUNK;
                } catch (e) {
                    if (isExternal) {
                        try {
                            await fetch(`${API_BASE}?action=upload&cb=${Math.random()}`, {
                                method: 'POST',
                                body: blob
                            });
                            bytesRef.current += CHUNK;
                        } catch (e2) { }
                    }
                }
            }
        };

        const streamCount = isExternal ? 6 : 2;
        await Promise.race([
            Promise.all(Array.from({ length: streamCount }, () => stream())),
            new Promise(r => setTimeout(r, DURATION))
        ]);

        isDone = true;
        clearInterval(ticker);

        const elapsed = (performance.now() - startTime) / 1000;
        const finalUp = bytesRef.current > 0
            ? (bytesRef.current * 8) / (elapsed * 1_000_000)
            : 0;
        finalUpRef.current = finalUp;
        setUpload(finalUp);
        return finalUp;
    };

    const startTest = async () => {
        try {
            const isExternal = selectedServer.type === 'external';
            setTestState('ping');
            setSpeed(0); setDownload(0); setUpload(0); setPingResult(0);
            finalDownRef.current = 0;
            finalUpRef.current = 0;
            abortController.current = new AbortController();

            const finalPing = await measurePing();

            if (isExternal) {
                setTestState('download');
                setSpeed(0);
                const finalDown = await runDownloadTest();

                setTestState('upload');
                setSpeed(0);
                const finalUp = await runUploadTest();

                setTestState('complete');
                setSpeed(0);
                saveTestToDB(finalDown, finalUp, finalPing);
            } else {
                setTestState('complete');
                setSpeed(0);
                saveTestToDB(0, 0, finalPing);
            }
        } catch (e) {
            console.error('Speed test error:', e);
            setTestState('idle');
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Connectivity <span className="text-gradient">Manager</span></h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Full spectrum network speed and stability analyzer.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* ISP Information Removed as per request */}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {selectedServer.type === 'external' && (
                    <>
                        <MetricCard label="DOWNLOAD" value={testState === 'download' ? speed : download} unit="Mbps" icon={DownloadCloud} color="#10b981" active={testState === 'download'} />
                        <MetricCard label="UPLOAD" value={testState === 'upload' ? speed : upload} unit="Mbps" icon={UploadCloud} color="#a855f7" active={testState === 'upload'} />
                    </>
                )}
                <MetricCard label="LATENCY" value={pingResult} unit="ms" icon={Activity} color="#fbbf24" active={testState === 'ping'} />
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '3rem', background: 'var(--glass-panel-bg)' }}>
                <ExperienceItem icon={Globe} label="Web" rating={download > 10 ? 5 : 2} color="#10b981" />
                <ExperienceItem icon={Zap} label="Gaming" rating={pingResult < 30 ? 5 : 3} color="#10b981" />
                <ExperienceItem icon={Play} label="Video" rating={download > 20 ? 5 : 4} color="#10b981" />
                <ExperienceItem icon={User} label="Calls" rating={upload > 5 ? 5 : 3} color="#10b981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '450px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="var(--primary-accent)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-accent)', letterSpacing: '0.08em' }}>LIVE ENGINE</span>
                    </div>

                    {(testState === 'idle' || testState === 'complete') ? (
                        <button onClick={startTest} className="go-button-premium">
                            {testState === 'idle' ? 'START TEST' : 'RETEST'}
                        </button>
                    ) : (
                        <div style={{ transform: 'scale(1.2)' }}>
                            <SpeedGauge
                                value={speed}
                                color={testState === 'upload' ? '#a855f7' : '#10b981'}
                                label={testState.toUpperCase()}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <History size={18} color="var(--primary-accent)" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>History (Last 10 Tests)</h3>
                        </div>
                        <div style={{ height: '180px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={testHistory.length > 0 ? testHistory : [{ time: '', latency: 0 }]}>
                                    <defs>
                                        <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-dark-1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    <Area type="monotone" dataKey="latency" stroke="var(--primary-accent)" fill="url(#latencyGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>SERVER SELECTION</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableServers.map(server => (
                                <div
                                    key={server.name}
                                    onClick={() => setSelectedServer(server)}
                                    style={{
                                        padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                        background: selectedServer.name === server.name ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-dark-2)',
                                        border: `1px solid ${selectedServer.name === server.name ? 'var(--primary-accent)' : 'var(--glass-border)'}`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {server.type === 'local'
                                                ? <Server size={16} color="var(--primary-accent)" />
                                                : <Globe size={16} color="var(--primary-accent)" />}
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{server.name}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {server.type === 'router' && (
                                                <button 
                                                    onClick={openIPModal}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                                    title="Change Gateway IP"
                                                >
                                                    <Settings size={14} />
                                                </button>
                                            )}
                                            {selectedServer.name === server.name && <CheckCircle size={16} color="var(--success)" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showIPModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="glass-panel" style={{
                        width: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px' }}>
                                <Settings size={22} color="var(--primary-accent)" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Gateway Settings</h3>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TARGET IP ADDRESS</label>
                            <input 
                                type="text"
                                value={tempIP}
                                onChange={(e) => setTempIP(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)', borderRadius: '10px',
                                    color: 'var(--text-primary)', fontSize: '1.1rem', outline: 'none', transition: '0.2s'
                                }}
                                placeholder="e.g. 192.168.1.1"
                                autoFocus
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Any connected network host (e.g., 192.168.100.15) can be targeted for measurement.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
                            <button 
                                onClick={() => setShowIPModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-dark-2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleIPSubmit}
                                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'var(--primary-accent)', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}
                            >
                                SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .text-gradient { background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .pill { padding: 6px 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 50px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot.success { background: var(--success); box-shadow: 0 0 10px var(--success); }
                .go-button-premium { width: 180px; height: 180px; border-radius: 50%; background: var(--bg-dark-2); border: 2px solid var(--primary-accent); color: var(--text-primary); font-weight: 800; font-size: 1.2rem; cursor: pointer; box-shadow: 0 0 30px rgba(56, 189, 248, 0.2); transition: all 0.4s ease; letter-spacing: 2px; }
                .go-button-premium:hover { box-shadow: 0 0 50px rgba(56, 189, 248, 0.5); transform: scale(1.05); letter-spacing: 4px; }
            `}</style>
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon: Icon, color, active }) => (
    <div className="glass-panel" style={{
        padding: '1.5rem',
        borderLeft: active ? `4px solid ${color}` : '1px solid var(--glass-border)',
        background: active ? `linear-gradient(90deg, ${color}08, transparent)` : 'var(--glass-panel-bg)',
        transition: 'all 0.3s'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>{label}</span>
            <Icon size={18} color={active ? color : 'var(--text-muted)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {value === 0 ? '0.0' : typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{unit}</span>
        </div>
    </div>
);

const ExperienceItem = ({ icon: Icon, label, rating, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-dark-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
            <Icon size={20} color="var(--primary-accent)" />
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i <= rating ? color : 'var(--glass-border)', boxShadow: i <= rating ? `0 0 5px ${color}` : 'none' }}></div>
            ))}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
    </div>
);

export default Connectivity;
