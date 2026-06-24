import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, X, Network, Monitor, Zap } from 'lucide-react';
import '../main.css';

const AddEquipment = () => {
  const navigate = useNavigate();
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
    // Simple /24 check: first 3 octets must match
    return ipParts[0] === netParts[0] && ipParts[1] === netParts[1] && ipParts[2] === netParts[2];
  };

  const filteredNetworks = React.useMemo(() => {
    if (!formData.ip_address || !/^\d+\.\d+\.\d+\.\d+$/.test(formData.ip_address)) {
      return networks;
    }
    return networks.filter(net => ipInSubnet(formData.ip_address, net.subnet_ipv4));
  }, [networks, formData.ip_address]);

  React.useEffect(() => {
    fetch('http://localhost/Backend/page/Networks.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setNetworks(data.data);
      });
  }, []);

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
        setError(`IP Address ${formData.ip_address} does not belong to network ${selectedNet.network_name} (${selectedNet.subnet_ipv4})`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost/Backend/page/Equipment.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess('Device added successfully!');
        setTimeout(() => navigate('/manage-devices'), 1500);
      } else {
        setError(data.message || 'Failed to add device');
      }
    } catch (err) {
      console.error('Error adding device:', err);
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
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          New Equipment
        </h1>

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

          {/* IP Address */}
          <input
            style={inputStyle}
            type="text"
            name="ip_address"
            placeholder="IP (ex: 192.168.1.10)"
            required
            value={formData.ip_address}
            onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          />

          {/* Network Selection */}
          <select
            name="network_id"
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={formData.network_id}
            onChange={handleChange}
            required
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          >
            <option value="" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>Select a network *</option>
            {filteredNetworks.map(net => (
              <option key={net.network_id} value={net.network_id} style={{ background: 'var(--bg-dark-1)', color: 'var(--text-primary)' }}>
                {net.network_name} ({net.subnet_ipv4}) [{net.device_count || 0} devices]
              </option>
            ))}
          </select>


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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
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
                border: 'none'
              }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
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

export default AddEquipment;