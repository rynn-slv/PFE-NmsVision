import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../main.css';

const EditEquipment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const [networks, setNetworks] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Router',
    ip_address: '',
    network_id: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isHostAddress = (ip) => {
    if (!ip) return true;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    if (parts.some(p => isNaN(p) || p === '' || parseInt(p) < 0 || parseInt(p) > 255)) return false;
    return parts[3] !== '0';
  };

  const ipInSubnet = (ip, subnet) => {
    if (!ip || !subnet) return false;
    const ipParts = ip.split('.');
    const netParts = subnet.split('.');
    return ipParts[0] === netParts[0] && ipParts[1] === netParts[1] && ipParts[2] === netParts[2];
  };

  const filteredNetworks = React.useMemo(() => {
    if (!formData.ip_address || !/^\d+\.\d+\.\d+\.\d+$/.test(formData.ip_address)) {
      return networks;
    }
    return networks.filter(net => ipInSubnet(formData.ip_address, net.subnet_ipv4));
  }, [networks, formData.ip_address]);

  useEffect(() => {
    fetch('http://localhost/Backend/page/Networks.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setNetworks(data.data);
      });
  }, []);

  useEffect(() => {
    // 1. Try from location state first (fast)
    if (location.state) {
      setFormData({
        name: location.state.name || '',
        type: location.state.type || 'Router',
        ip_address: location.state.ip_address || '',
        network_id: location.state.network_id || '',
      });
    } else {
      // 2. Fallback to localStorage if state is missing (e.g. on refresh)
      const saved = localStorage.getItem('deviceList');
      if (saved) {
        const list = JSON.parse(saved);
        const item = list.find(eq => eq.id === parseInt(id));
        if (item) {
          setFormData({
            name: item.name || '',
            type: item.type || 'Router',
            ip_address: item.ip_address || '',
            network_id: item.network_id || '',
          });
        }
      }
    }
  }, [location.state, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.ip_address && !isHostAddress(formData.ip_address)) {
      setError('Invalid IP Address: Format must be 4 octets (0-255) and NOT end in .0');
      return;
    }

    if (formData.ip_address && formData.network_id) {
      const selectedNet = networks.find(n => n.network_id === formData.network_id);
      if (selectedNet && !ipInSubnet(formData.ip_address, selectedNet.subnet_ipv4)) {
        setError(`IP Address ${formData.ip_address} does not belong to network ${selectedNet.network_name} (${selectedNet.subnet_ipv4}). Cross-subnet migration is blocked.`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost/Backend/page/Equipment.php?id=${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess('Device updated successfully!');
        setTimeout(() => navigate('/manage-devices'), 1500);
      } else {
        setError(data.message || 'Failed to update device');
      }
    } catch (err) {
      console.error('Error updating device:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    background: 'var(--bg-dark-2)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    marginBottom: '1.25rem'
  };

  const buttonStyle = {
    flex: 1,
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Edit Managed Device
        </h1>
        {isAdmin && <div style={{ marginBottom: '1.5rem' }} />}

        {error && <div style={{ ...styles.alert, ...styles.error }}>{error}</div>}
        {success && <div style={{ ...styles.alert, ...styles.success }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Nom */}
          <input
            style={inputStyle}
            type="text"
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          />

          {/* Type Selection */}
          <select
            name="type"
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={formData.type}
            onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          >
            <option value="Router" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Router</option>
            <option value="Switch" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Switch</option>
            <option value="Phone" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Phone</option>
            <option value="PC" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>PC</option>
            <option value="Printer" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Printer</option>
          </select>

          {/* IP Address — Read-only for operators */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <input
              style={{
                ...inputStyle,
                marginBottom: 0,
                opacity: isAdmin ? 1 : 0.5,
                cursor: isAdmin ? 'text' : 'not-allowed',
              }}
              type="text"
              name="ip_address"
              placeholder="IP (ex: 192.168.1.10)"
              required
              value={formData.ip_address}
              onChange={handleChange}
              disabled={!isAdmin}
              onFocus={(e) => isAdmin && (e.target.style.borderColor = 'var(--primary-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
            />
            {!isAdmin && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#f59e0b' }}>🔒 Admin only</span>
            )}
          </div>

          {/* Network Selection — Read-only for operators */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <select
              name="network_id"
              style={{
                ...inputStyle,
                marginBottom: 0,
                appearance: 'none',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                opacity: isAdmin ? 1 : 0.5,
              }}
              value={formData.network_id}
              onChange={handleChange}
              disabled={!isAdmin}
              onFocus={(e) => isAdmin && (e.target.style.borderColor = 'var(--primary-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              <option value="" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Select a Network *</option>
              {filteredNetworks.map(net => (
                <option key={net.network_id} value={net.network_id} style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>
                  {net.network_name} ({net.subnet_ipv4})
                </option>
              ))}
            </select>
            {!isAdmin && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#f59e0b' }}>🔒 Admin only</span>
            )}
          </div>


          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/manage-devices')}
              style={{
                ...buttonStyle,
                background: 'var(--bg-dark-2)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-dark-1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-dark-2)')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
                border: 'none',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  alert: {
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    border: '1px solid transition all 0.2s'
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  success: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.2)'
  }
};

export default EditEquipment;
