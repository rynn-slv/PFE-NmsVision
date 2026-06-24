import React, { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Server, Activity, AlertTriangle, X } from "lucide-react";

export default function ManageNetworks() {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const [networks, setNetworks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        network_name: '',
        subnet_ipv4: '',
        description: ''
    });

    const isNetworkAddress = (ip) => {
        if (!ip) return true; // Optional field
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        if (parts.some(p => isNaN(p) || p === '' || parseInt(p) < 0 || parseInt(p) > 255)) return false;
        return parts[3] === '0';
    };

    // Deletion Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [networkToDelete, setNetworkToDelete] = useState(null);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        fetchNetworks();
    }, []);

    const fetchNetworks = async () => {
        try {
            const res = await fetch('http://localhost/Backend/page/Networks.php', { credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                setNetworks(data.data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.network_name.trim()) {
            setError('Network name cannot be empty or whitespace only');
            return;
        }

        if (!form.subnet_ipv4.trim()) {
            setError('Subnet (IPv4) is required');
            return;
        }

        if (!form.description.trim()) {
            setError('Description is required (provide context for this network)');
            return;
        }

        if (form.subnet_ipv4 && !isNetworkAddress(form.subnet_ipv4)) {
            setError('Invalid Subnet: Format must be 4 octets (0-255) and end in .0 (e.g., 192.168.100.0)');
            return;
        }

        // Duplicate Check
        const isDuplicateName = networks.some(net => 
            net.network_name.toLowerCase().trim() === form.network_name.toLowerCase().trim()
        );
        const isDuplicateSubnet = networks.some(net => 
            net.subnet_ipv4 === form.subnet_ipv4.trim()
        );

        if (isDuplicateName) {
            setError(`A network with the name "${form.network_name}" already exists.`);
            return;
        }

        if (isDuplicateSubnet) {
            setError(`The subnet ${form.subnet_ipv4} is already assigned to another network.`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost/Backend/page/Networks.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (data.status === 'success') {
                setSuccess('Network created successfully!');
                setForm({ network_name: '', subnet_ipv4: '', description: '' });
                setShowForm(false);
                fetchNetworks();
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            setError("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (network) => {
        setNetworkToDelete(network);
        setShowDeleteModal(true);
        setConfirmText('');
    };

    const confirmDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setLoading(true);
        try {
            const res = await fetch(`http://localhost/Backend/page/Networks.php?id=${networkToDelete.network_id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();

            if (data.status === 'success') {
                setSuccess('Network and associated devices deleted successfully');
                setShowDeleteModal(false);
                fetchNetworks();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Network Management</h1>
                    <p style={styles.subtitle}>Define subnets and logical groupings for your infrastructure.</p>
                </div>
                {isAdmin && (
                    <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                        <Plus size={18} /> Add Network
                    </button>
                )}
            </div>

            {/* Alerts */}
            {error && <div style={styles.alertError}>{error}</div>}
            {success && <div style={styles.alertSuccess}>{success}</div>}

            {/* Add Network Form */}
            {showForm && (
                <div style={styles.formCard} className="glass-panel">
                    <h3 style={styles.formTitle}>New Network Config</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Network Name *</label>
                                <input
                                    style={styles.input}
                                    placeholder="e.g. Idoom Fibre"
                                    value={form.network_name}
                                    onChange={e => setForm({ ...form, network_name: e.target.value })}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Subnet (IPv4) *</label>
                                <input
                                    style={styles.input}
                                    placeholder="e.g. 192.168.100.0 (Must be unique)"
                                    value={form.subnet_ipv4}
                                    onChange={e => setForm({ ...form, subnet_ipv4: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description *</label>
                            <input
                                style={styles.input}
                                placeholder="Mandatory: e.g. Core switching or Home subnet..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div style={styles.formActions}>
                            <button
                                type="button"
                                style={styles.cancelBtn}
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={styles.saveBtn}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Network Scope'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Networks Table */}
            <div style={styles.tableCard} className="glass-panel">
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHead}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Network Name</th>
                            <th style={styles.th}>Subnet</th>
                            <th style={styles.th}>Devices</th>
                            <th style={styles.th}>Description</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {networks.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={styles.empty}>
                                    No networks defined yet.
                                </td>
                            </tr>
                        ) : (
                            networks.map(net => (
                                <tr key={net.network_id} style={styles.tableRow}>
                                    <td style={styles.td}>#{net.network_id}</td>
                                    <td style={{ ...styles.td, color: 'var(--primary-accent)', fontWeight: 'bold' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Globe size={16} /> {net.network_name}
                                        </div>
                                    </td>
                                    <td style={styles.td}>{net.subnet_ipv4 || '--'}</td>
                                    <td style={styles.td}>
                                        <div style={{
                                            background: 'rgba(56, 189, 248, 0.1)',
                                            color: 'var(--primary-accent)',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            display: 'inline-block',
                                            fontSize: '0.8rem',
                                            fontWeight: '700'
                                        }}>
                                            {net.device_count} devs
                                        </div>
                                    </td>
                                    <td style={styles.td}>{net.description || '--'}</td>
                                    <td style={styles.td}>
                                        {isAdmin ? (
                                            <button
                                                style={styles.deleteBtn}
                                                onClick={() => handleDelete(net)}
                                            >
                                                <Trash2 size={18} color="#ef4444" />
                                            </button>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No access</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Specialized Deletion Modal */}
            {showDeleteModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.deleteModal} className="animate-scale-in">
                        <div style={styles.modalHeader}>
                            <div style={styles.warningIcon}>
                                <AlertTriangle size={24} color="#ef4444" />
                            </div>
                            <h2 style={styles.modalTitle}>Destructive Action</h2>
                            <button style={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <p style={styles.warningText}>
                                Warning: This network <strong>"{networkToDelete?.network_name}"</strong> contains <strong>{networkToDelete?.device_count} devices</strong>.
                                Deleting it will permanently remove all associated equipment and monitoring data.
                            </p>

                            <div style={styles.confirmBox}>
                                <label style={styles.confirmLabel}>Type <span style={{ color: '#ef4444', fontWeight: 'bold' }}>'DELETE'</span> to confirm:</label>
                                <input
                                    style={styles.confirmInput}
                                    placeholder="DELETE"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.modalCancelBtn} onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button
                                style={{
                                    ...styles.modalDeleteBtn,
                                    opacity: confirmText === 'DELETE' ? 1 : 0.5,
                                    cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed'
                                }}
                                disabled={confirmText !== 'DELETE' || loading}
                                onClick={confirmDelete}
                            >
                                {loading ? 'Deleting...' : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { padding: '2rem', minHeight: '100vh', color: 'var(--text-primary)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
    title: { fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-accent)', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.5rem' },
    addBtn: {
        background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
        color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px',
        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 8px 16px rgba(56, 189, 248, 0.2)'
    },
    alertError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
    alertSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
    formCard: { padding: '24px', marginBottom: '24px' },
    formTitle: { color: 'var(--primary-accent)', marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    label: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
    input: { backgroundColor: 'var(--bg-dark-2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' },
    formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1rem' },
    cancelBtn: { backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },
    saveBtn: { background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)' },
    tableCard: { padding: 0, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: 'var(--bg-dark-2)' },
    th: { padding: '16px 20px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tableRow: { borderTop: '1px solid var(--glass-border)', transition: 'background 0.2s ease', '&:hover': { background: 'rgba(255,255,255,0.02)' } },
    td: { padding: '16px 20px', fontSize: '0.95rem', color: 'var(--text-primary)' },
    empty: { padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1 } },

    // Modal Styles
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    deleteModal: {
        backgroundColor: 'var(--bg-dark-1)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.1)',
        overflow: 'hidden'
    },
    modalHeader: {
        padding: '24px 24px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative'
    },
    warningIcon: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: '8px',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    modalTitle: {
        margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)'
    },
    closeBtn: {
        position: 'absolute', right: '20px', top: '24px',
        background: 'none', border: 'none', color: 'var(--text-muted)',
        cursor: 'pointer'
    },
    modalBody: {
        padding: '24px'
    },
    warningText: {
        color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem',
        margin: '0 0 24px 0'
    },
    confirmBox: {
        display: 'flex', flexDirection: 'column', gap: '8px'
    },
    confirmLabel: {
        fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600'
    },
    confirmInput: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        textAlign: 'center',
        letterSpacing: '0.1em',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        '&:focus': {
            borderColor: '#ef4444',
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
        }
    },
    modalFooter: {
        padding: '16px 24px 24px',
        display: 'flex', gap: '12px',
        backgroundColor: 'var(--bg-dark-2)'
    },
    modalCancelBtn: {
        flex: 1, backgroundColor: 'transparent', border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)', padding: '12px', borderRadius: '10px', fontWeight: '600',
        cursor: 'pointer', transition: 'all 0.2s ease'
    },
    modalDeleteBtn: {
        flex: 1, backgroundColor: '#ef4444', border: 'none',
        color: 'var(--text-primary)', padding: '12px', borderRadius: '10px', fontWeight: '700',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
    }
};
