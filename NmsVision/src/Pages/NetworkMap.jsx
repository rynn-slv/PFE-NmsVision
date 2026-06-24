import React, { useState, useEffect } from 'react';
import { Maximize2, RefreshCw, ZoomIn, ZoomOut, Layers, Filter, Zap, Monitor, Server, Activity, Globe, Shield, Router as RouterIcon, Smartphone, Tablet, Printer, AlertCircle } from 'lucide-react';
import '../main.css';
const getStatusColor = (status) => {
  switch (status) {
    case "online": return "#22c55e"; // green
    case "warning": return "#f59e0b"; // orange
    case "offline": return "#ef4444"; // red
    default: return "#94a3b8"; // gray
  }
};

const NetworkMap = () => {
  const [zoom, setZoom] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [nodes, setNodes] = useState([]);

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

  const fetchNodes = async () => {
    setIsRefreshing(true);
    try {
      const url = `http://localhost/Backend/page/NetworkMap.php${selectedNetwork !== 'all' ? `?network_id=${selectedNetwork}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (data.status === 'success') {
        setNodes(data.data);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  useEffect(() => {
    fetchNodes();
    // 💓 Add heartbeat refresh every 10 seconds
    const heartbeat = setInterval(fetchNodes, 15000); // 15s auto-refresh
    return () => clearInterval(heartbeat);
  }, [selectedNetwork]);

  const handleRefresh = () => {
    fetchNodes();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Nodes fetched from backend

  const filteredNodes = nodes;

  const toolButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.8)',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ padding: '1rem', color: 'white', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 4rem)' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="text-gradient">Network Map</h1>
          <p>Visual representation of your network architecture and connectivity.</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '1rem' }}>
            {/* Network Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Select Network:
              </span>
              <select 
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '6px 12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '220px'
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

            {/* Reachability Warning inline */}
            {selectedNetwork !== 'all' && (
              <div style={{
                padding: '6px 16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f59e0b',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} />
                <span>Notice: Ensure server is local to <b>{networks.find(n => n.network_id == selectedNetwork)?.network_name}</b> for live status.</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '2px solid white',
              padding: '10px 20px',
              borderRadius: '14px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: isRefreshing ? 0.7 : 1
            }}
          >
            <RefreshCw
              size={22}
              strokeWidth={2.5}
              style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
            />
            <span style={{ fontSize: '1rem' }}>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="glass-panel" style={{
        flex: 1,
        background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '600px',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
      }}>
        {/* Floating Toolbar */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          zIndex: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <button onClick={handleZoomIn} title="Zoom In" style={toolButtonStyle}><ZoomIn size={24} strokeWidth={2} /></button>
          <button onClick={handleZoomOut} title="Zoom Out" style={toolButtonStyle}><ZoomOut size={24} strokeWidth={2} /></button>
          <button onClick={handleResetZoom} title="Reset Zoom" style={toolButtonStyle}><Maximize2 size={24} strokeWidth={2} /></button>
          <button onClick={handleRefresh} title="Filter" style={toolButtonStyle}><Filter size={24} strokeWidth={2} /></button>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '12px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          gap: '20px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor('online'), boxShadow: `0 0 8px ${getStatusColor('online')}` }}></span>
            Online
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor('warning'), boxShadow: `0 0 8px ${getStatusColor('warning')}` }}></span>
            Warning
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor('offline'), boxShadow: `0 0 8px ${getStatusColor('offline')}` }}></span>
            Offline
          </div>
        </div>

        {/* Scalable Map Area */}
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${zoom})`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center'
        }}>
          {/* SVG Connections Overlay - Cleared to remove hardcoded ghost lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            {/* Real dynamic lines can be added here once neighbor discovery logic is implemented */}
          </svg>

          {/* Device Nodes */}
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                top: node.pos.top,
                left: node.pos.left,
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 2,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: node.type === 'core' ? '70px' : '55px',
                  height: node.type === 'core' ? '70px' : '55px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderRadius: node.type === 'router' ? '12px' : '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 20px ${(node.response_time > 100 ? getStatusColor('warning') : getStatusColor(node.status))}33`,
                  border: `2px solid ${node.response_time > 100 ? getStatusColor('warning') : getStatusColor(node.status)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {node.type === 'core' && <Layers size={30} color="#38bdf8" />}
                {node.type === 'switch' && <Zap size={22} color="#38bdf8" />}
                {node.type === 'device' && <Monitor size={22} color="#38bdf8" />}
                {node.type === 'phone' && <Smartphone size={22} color="#38bdf8" />}
                {node.type === 'tablet' && <Tablet size={22} color="#38bdf8" />}
                {node.type === 'printer' && <Printer size={22} color="#38bdf8" />}
                {node.type === 'server' && <Server size={26} color="#38bdf8" />}
                {node.type === 'router' && <RouterIcon size={22} color="#38bdf8" />}

                {/* Status Dot */}
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '14px',
                  height: '14px',
                  background: node.response_time > 100 ? getStatusColor('warning') : getStatusColor(node.status),
                  borderRadius: '50%',
                  border: '2px solid #0f172a',
                  boxShadow: `0 0 10px ${node.response_time > 100 ? getStatusColor('warning') : getStatusColor(node.status)}`
                }}></div>
              </div>
              <span style={{
                display: 'block',
                marginTop: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default NetworkMap;