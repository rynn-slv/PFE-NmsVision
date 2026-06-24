import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Zap, Activity, ArrowUpRight, ArrowDownRight, Clock,
  Monitor, Wifi, Server, Smartphone, Tablet, Tv, HardDrive,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Bell
} from 'lucide-react';
import AlertPanel from '../components/AlertPanel';

const getServerHost = () => {
  const host = window.location.hostname;
  return (host === 'localhost' || host === '127.0.0.1') ? 'localhost' : host;
};
const API_BASE = `http://${getServerHost()}/Backend/page`;

// ── icon per device type ─────────────────────────────────────────────────────
const deviceIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('router') || t.includes('switch')) return Wifi;
  if (t.includes('server')) return Server;
  if (t.includes('phone') || t.includes('mobile')) return Smartphone;
  if (t.includes('tablet')) return Tablet;
  if (t.includes('tv')) return Tv;
  if (t.includes('nas') || t.includes('storage')) return HardDrive;
  return Monitor;
};

const statusMeta = {
  online: { color: '#10b981', Icon: CheckCircle, label: 'Online' },
  warning: { color: '#fbbf24', Icon: AlertTriangle, label: 'Warning' },
  offline: { color: '#ef4444', Icon: XCircle, label: 'Offline' },
};

const Dashboard = () => {
  const [speedHistory, setSpeedHistory] = useState([]);
  const [summary, setSummary] = useState({ avgDown: null, avgUp: null, avgPing: null });
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devLoading, setDevLoading] = useState(true);
  const [alertLoading, setAlertLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    const refreshAll = async () => {
      await fetchDevices();
      fetchAlerts();
      fetchSpeedData();
      setLastRefresh(new Date());
    };

    refreshAll();
    const interval = setInterval(refreshAll, 15000);

    return () => clearInterval(interval);
  }, []);

  // ── Speed history (real tests only, no fake numbers) ─────────────────────
  const fetchSpeedData = async () => {
    try {
      const res = await fetch(`${API_BASE}/SpeedTest.php?action=get_history`, { credentials: 'include' });
      const data = await res.json();

      if (data.status === 'success' && data.data.length > 0) {
        // data is DESC from DB → reverse to chronological for the chart
        const sorted = [...data.data].reverse();
        const formatted = sorted.map(item => ({
          name: new Date(item.test_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          down: parseFloat(item.download_speed),
          up: parseFloat(item.upload_speed),
          ping: parseInt(item.ping),
        }));
        setSpeedHistory(formatted);

        const n = formatted.length;
        const sums = formatted.reduce((a, c) => ({
          down: a.down + c.down,
          up: a.up + c.up,
          ping: a.ping + c.ping,
        }), { down: 0, up: 0, ping: 0 });

        setSummary({
          avgDown: (sums.down / n).toFixed(1),
          avgUp: (sums.up / n).toFixed(1),
          avgPing: Math.round(sums.ping / n),
        });
      } else {
        // No tests yet — show zeros, not fake numbers
        setSummary({ avgDown: null, avgUp: null, avgPing: null });
      }
    } catch (e) {
      console.error('Speed data fetch error', e);
    }
  };

  // ── Devices (Equipment.php) ───────────────────────────────────────────────
  const fetchDevices = async () => {
    setDevLoading(true);
    try {
      const res = await fetch(`${API_BASE}/Equipment.php`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setDevices(data.data);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Device fetch error', e);
    } finally {
      setDevLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/GetAlerts.php`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setAlerts(data.data);
      }
    } catch (e) {
      console.error('Alert fetch error', e);
    } finally {
      setAlertLoading(false);
    }
  };

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-primary)' }}>

      {/* ── HEADER ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            Architecture <span style={{ color: 'var(--primary-accent)' }}>Overview</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time usage and connectivity monitoring.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--primary-accent)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Last 10 Tests</span>
          </div>
          <div style={pillStyle('#10b981')}>
            <span style={dotStyle('#10b981')} /> {devices.length} Devices
          </div>
        </div>
      </header>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <StatCard
          icon={ArrowDownRight}
          label="Avg Download"
          value={summary.avgDown}
          unit="Mbps"
          color="#10b981"
          empty={summary.avgDown === null}
        />
        <StatCard
          icon={ArrowUpRight}
          label="Avg Upload"
          value={summary.avgUp}
          unit="Mbps"
          color="#a855f7"
          empty={summary.avgUp === null}
        />
        <StatCard
          icon={Activity}
          label="Avg Latency"
          value={summary.avgPing}
          unit="ms"
          color="#fbbf24"
          empty={summary.avgPing === null}
        />
      </div>

      {/* ── CONNECTIVITY CHART ── */}
      <div className="glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <Zap size={20} color="var(--primary-accent)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Connectivity Performance (Last 10 Tests)</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <LegendItem color="#10b981" label="Download" />
            <LegendItem color="#a855f7" label="Upload" />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {speedHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedHistory}>
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted)" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit=" Mb" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-dark-2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(v, n) => [`${v.toFixed(1)} Mbps`, n === 'down' ? 'Download' : 'Upload']}
                />
                <Area type="monotone" dataKey="down" stroke="#10b981" fill="url(#colorDown)" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                <Area type="monotone" dataKey="up" stroke="#a855f7" fill="url(#colorUp)" strokeWidth={2} dot={{ r: 3, fill: '#a855f7' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStateStyle}>
              <Zap size={32} color="var(--text-muted)" />
              <span>No speed test data yet — run a test in the Connectivity page.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ALERTS & RECENT DEVICES ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '1.5rem', alignItems: 'start' }}>
        <AlertPanel alerts={alerts} loading={alertLoading} />

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Table Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
            <Server size={18} color="var(--primary-accent)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Recent Devices</h3>

            {/* Status summary pills */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[
                { count: onlineCount, color: '#10b981', label: 'Online' },
                { count: warningCount, color: '#fbbf24', label: 'Warning' },
                { count: offlineCount, color: '#ef4444', label: 'Offline' },
              ].map(({ count, color, label }) => (
                <span key={label} style={{
                  padding: '3px 10px', borderRadius: '20px',
                  background: `${color}18`, border: `1px solid ${color}40`,
                  fontSize: '0.75rem', fontWeight: '700', color
                }}>
                  {count} {label}
                </span>
              ))}
              <button
                onClick={fetchDevices}
                title="Refresh devices"
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', transition: '0.2s'
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {devLoading ? (
            <div style={emptyStateStyle}><span style={{ color: 'var(--text-muted)' }}>Loading devices…</span></div>
          ) : devices.length === 0 ? (
            <div style={emptyStateStyle}>
              <Monitor size={32} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>No devices found. Add devices in the Equipment page.</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Device', 'Type', 'IP Address', 'Network', 'Status', 'Latency', 'Last Seen'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: '0.72rem', fontWeight: '800',
                        color: 'var(--text-muted)', letterSpacing: '0.05em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.map((dev, idx) => {
                    const DevIcon = deviceIcon(dev.type);
                    const { color, Icon: SIcon, label } = statusMeta[dev.status] ?? statusMeta.offline;
                    return (
                      <tr key={dev.id ?? idx} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Name + icon */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              padding: '6px', borderRadius: '8px',
                              background: 'var(--bg-dark-2)',
                              border: '1px solid var(--glass-border)',
                              display: 'flex'
                            }}>
                              <DevIcon size={15} color="var(--primary-accent)" />
                            </div>
                            <span style={{ fontWeight: '600' }}>{dev.name}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{dev.type}</td>

                        {/* IP */}
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{
                            background: 'rgba(56,189,248,0.08)', color: 'var(--primary-accent)',
                            padding: '2px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '700'
                          }}>{dev.ip_address}</code>
                        </td>

                        {/* Network */}
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {dev.network_name}
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '20px',
                            background: `${color}15`, border: `1px solid ${color}40`,
                            fontSize: '0.78rem', fontWeight: '700', color
                          }}>
                            <SIcon size={11} />
                            {label}
                          </span>
                        </td>

                        {/* Latency */}
                        <td style={{ padding: '12px 14px' }}>
                          {dev.response_time != null ? (
                            <span style={{ fontWeight: '700', color: dev.response_time > 100 ? '#fbbf24' : '#10b981' }}>
                              {dev.response_time} ms
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>—</span>
                          )}
                        </td>

                        {/* Last seen */}
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {dev.last_seen ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {lastRefresh && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, unit, color, empty }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ padding: '12px', background: `${color}10`, borderRadius: '12px', border: `1px solid ${color}30` }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
      {empty ? (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>No data yet</div>
      ) : (
        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
          {value} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
  </div>
);

const pillStyle = (color) => ({
  padding: '6px 14px', background: 'var(--bg-dark-2)', borderRadius: '8px',
  border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center',
  gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)'
});

const dotStyle = (color) => ({
  width: '8px', height: '8px', borderRadius: '50%',
  backgroundColor: color, boxShadow: `0 0 8px ${color}`
});

const emptyStateStyle = {
  height: '100%', minHeight: '80px', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)'
};

export default Dashboard;