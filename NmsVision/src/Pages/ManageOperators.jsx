import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, X, Mail, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../main.css';

const API = 'http://localhost/Backend/page/ManageOperators.php';

const ManageOperators = () => {
  const [operators, setOperators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const [formData, setFormData] = useState({ fullname: '', email: '', password: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });

  // ─── helpers ────────────────────────────────────────────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOperators = async () => {
    try {
      const res = await fetch(API, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setOperators(data.data);
    } catch {
      showToast('error', 'Failed to load operators.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOperators(); }, []);

  // ─── create ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Operator created successfully!');
        setFormData({ fullname: '', email: '', password: '' });
        setShowForm(false);
        fetchOperators();
      } else {
        showToast('error', data.message || 'Failed to create operator.');
      }
    } catch {
      showToast('error', 'Connection error.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id, name) => {
    setConfirmDelete({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id, name } = confirmDelete;
    try {
      const res = await fetch(`${API}?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `${name} has been removed.`);
        setOperators(prev => prev.filter(op => op.id !== id));
      } else {
        showToast('error', data.message || 'Failed to remove operator.');
      }
    } catch {
      showToast('error', 'Connection error.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, name: '' });
    }
  };

  // ─── styles ──────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'var(--bg-dark-2)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', color: 'var(--text-primary)', position: 'relative' }}>

      {/* ─── Toast ─────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: toast.type === 'success' ? '#4ade80' : '#f87171',
          display: 'flex', alignItems: 'center', gap: '10px',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease',
          maxWidth: '360px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}

      {/* ─── Header ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--primary-accent)', letterSpacing: '-0.02em' }}>
            Manage Operators
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Create and manage operator accounts linked to your admin profile.
          </p>
        </div>
        <button
          id="btn-add-operator"
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
            border: 'none', borderRadius: '10px', color: 'white',
            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', boxShadow: '0 8px 16px rgba(56, 189, 248, 0.2)',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={20} /> Add Operator
        </button>
      </div>

      {/* ─── RBAC Info Banner ──────────────────────────── */}
      <div className="glass-panel" style={{
        marginBottom: '2rem', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '16px',
        borderLeft: '4px solid var(--primary-accent)'
      }}>
        <Shield size={22} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>RBAC — Role-Based Access Control</strong><br />
          Operators you create will log in with their own credentials and see <strong style={{ color: '#38bdf8' }}>your devices and networks</strong>,
          but cannot add/delete devices, change IPs, or manage users.
        </div>
      </div>

      {/* ─── Operators Table ───────────────────────────── */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading operators...</div>
        ) : operators.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No operators yet.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Click <strong style={{ color: '#38bdf8' }}>Add Operator</strong> to create the first one.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark-2)', borderBottom: '1px solid var(--glass-border)' }}>
                {['#', 'Name', 'Email', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map((op, i) => (
                <tr key={op.id} className="interactive" style={{ borderBottom: i < operators.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{op.id}</td>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <User size={16} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{op.fullname}</div>
                        <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operator</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--primary-accent)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{op.email}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(op.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(op.id, op.fullname)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginLeft: 'auto' }}
                      title="Remove operator"
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Add Operator Modal ────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', borderRadius: '20px', position: 'relative' }}>
            {/* Close */}
            <button
              onClick={() => setShowForm(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>Add New Operator</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>They will see your devices with limited permissions.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="op-name"
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.fullname}
                    onChange={e => setFormData(p => ({ ...p, fullname: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--primary-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="op-email"
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                    type="email"
                    placeholder="john@company.com"
                    required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--primary-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="op-password"
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                    type="password"
                    placeholder="Temporary password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--primary-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark-2)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  id="btn-create-operator"
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', color: 'white', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer' }}
                >
                  {formLoading ? 'Creating...' : '✓ Create Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Remove Operator"
        message={`Are you sure you want to remove ${confirmDelete.name}? They will lose access to the system immediately.`}
        confirmText="Remove Operator"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ManageOperators;
