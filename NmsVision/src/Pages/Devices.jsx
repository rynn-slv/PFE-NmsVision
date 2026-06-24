import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Server, Router, Activity, Shield, MoreVertical, Plus, X, Monitor, Printer, Smartphone } from 'lucide-react';
import '../main.css';

const getStatusColor = (status) => {
  switch (status) {
    case "online": return "#22c55e"; // green
    case "warning": return "#f59e0b"; // orange
    case "offline": return "#ef4444"; // red
    default: return "#94a3b8"; // gray
  }
};

const Devices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'router': return Router;
      case 'switch': return Server;
      case 'firewall': return Shield;
      case 'pc': return Monitor;
      case 'printer': return Printer;
      case 'phone': return Smartphone;
      default: return Activity;
    }
  };

  const fetchNetworks = async () => {
    try {
      const response = await fetch('http://localhost/Backend/page/Networks.php', { credentials: 'include' });
      const data = await response.json();
      if (data.status === 'success') {
        setNetworks(data.data);
      }
    } catch (error) {
      console.error('Error fetching networks:', error);
    }
  };

  const fetchEquipments = async () => {
    try {
      const url = `http://localhost/Backend/page/Equipment.php${selectedNetwork !== 'all' ? `?network_id=${selectedNetwork}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (data.status === 'success') {
        setEquipmentList(data.data);
      }
    } catch (error) {
      console.error('Error fetching equipments:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  useEffect(() => {
    fetchEquipments();
    const heartbeat = setInterval(fetchEquipments, 15000); // 15s auto-refresh
    return () => clearInterval(heartbeat);
  }, [selectedNetwork]);

  const filteredDevices = equipmentList.filter(dev => 
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.ip_address.includes(searchQuery) ||
    dev.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Network Devices
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
            Real-time status and performance metrics for all connected equipment.
          </p>

          {/* Network Selector */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by Network:
            </span>
            <select 
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              style={{
                background: 'var(--bg-dark-2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="all">
                🌐 All Networks ({networks.reduce((acc, net) => acc + parseInt(net.device_count || 0), 0)})
              </option>
              {networks.map(net => (
                <option key={net.network_id} value={net.network_id}>
                  📍 {net.network_name} ({net.device_count || 0} devices)
                </option>
              ))}
            </select>
          </div>
        </div>
       

      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'var(--bg-dark-2)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-dark-1)',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          border: '1px solid var(--glass-border)'
        }}>
          <Search size={20} style={{ color: '#9ca3af', marginRight: '10px' }} />
          <input
            type="text"
            placeholder="Search by IP, MAC, Name or Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-dark-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          <Filter size={20} /> Filters
        </button>
      </div>

      {/* Device Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredDevices.map((dev) => {
          const IconComponent = getIcon(dev.type);
          return (
            <div key={dev.id} style={{
              background: 'var(--glass-panel-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>{dev.name}</h3>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{dev.type}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDevice(dev);
                    setShowDetails(true);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#9ca3af' }}>IP Address</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{dev.ip_address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#9ca3af' }}>Network</span>
                  <span style={{ color: '#38bdf8', fontWeight: '500' }}>{dev.network_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#9ca3af' }}>Latency</span>
                  <span style={{ 
                    color: dev.response_time !== null ? (dev.response_time > 100 ? '#f59e0b' : (dev.status === 'online' ? '#22c55e' : (dev.status === 'warning' ? '#f59e0b' : '#ef4444'))) : '#e2e8f0', 
                    fontWeight: '500' 
                  }}>
                    {dev.response_time !== null ? `${dev.response_time} ms` : '--'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: dev.response_time > 100 ? getStatusColor('warning') : getStatusColor(dev.status),
                    boxShadow: `0 0 8px ${dev.response_time > 100 ? getStatusColor('warning') : getStatusColor(dev.status)}` 
                  }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'capitalize' }}>
                    {dev.response_time > 100 ? 'warning' : dev.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Last seen: {dev.last_seen || 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Device Details Modal */}
      {showDetails && selectedDevice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }} onClick={() => setShowDetails(false)}>
          <div style={{
            background: 'var(--bg-dark-1)',
            border: '1px solid var(--glass-border)',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.7)',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header / Banner Area */}
            <div style={{ 
              height: '120px', 
              background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.02) 100%)',
              position: 'relative',
              padding: '2rem',
              display: 'flex',
              alignItems: 'flex-end'
            }}>
              <button 
                onClick={() => setShowDetails(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: '#9ca3af',
                  padding: '8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  boxShadow: '0 12px 24px -8px rgba(0,0,0,0.5)'
                }}>
                  {React.createElement(getIcon(selectedDevice.type), { size: 36 })}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                    {selectedDevice.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '700', 
                      color: '#38bdf8', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>{selectedDevice.type}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>#{selectedDevice.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              
              {/* Primary Info Card */}
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '20px', 
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.03)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Primary IP Address
                    </span>
                    <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                      {selectedDevice.ip_address}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '14px',
                      background: selectedDevice.response_time > 100 ? 'rgba(245, 158, 11, 0.1)' : (selectedDevice.status === 'online' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                      border: `1px solid ${selectedDevice.response_time > 100 ? 'rgba(245, 158, 11, 0.2)' : (selectedDevice.status === 'online' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)')}`,
                      color: selectedDevice.response_time > 100 ? '#f59e0b' : (selectedDevice.status === 'online' ? '#22c55e' : '#ef4444'),
                      fontSize: '0.9rem',
                      fontWeight: '800'
                    }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: 'currentColor',
                        boxShadow: '0 0 10px currentColor'
                      }}></div>
                      {selectedDevice.response_time > 100 ? 'Warning' : selectedDevice.status.charAt(0).toUpperCase() + selectedDevice.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                      <Activity size={14} />
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latency</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: selectedDevice.response_time > 100 ? '#f59e0b' : '#e2e8f0' }}>
                      {selectedDevice.response_time !== null ? `${selectedDevice.response_time} ms` : 'No Signal'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                      <Server size={14} />
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Network</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#38bdf8' }}>{selectedDevice.network_name}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                  <Activity size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Last heartbeat recorded: <span style={{ color: '#e2e8f0', fontWeight: '700' }}>{selectedDevice.last_seen || 'N/A'}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setShowDetails(false);
                    navigate(`/edit-device/${selectedDevice.id}`, { state: selectedDevice });
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  Edit Configuration
                </button>
                <button 
                  onClick={() => setShowDetails(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(56, 189, 248, 0.4)',
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  Close Overview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Devices;
