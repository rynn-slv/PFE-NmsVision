import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Download, Search, Settings, Server, Plus, X, Globe, Shield, Activity, Monitor, Router, Trash2, Edit2, CheckCircle, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmModal from '../components/ConfirmModal';
import '../main.css';

const getStatusColor = (status) => {
  switch (status) {
    case "online": return "#22c55e"; // green
    case "warning": return "#f59e0b"; // orange
    case "offline": return "#ef4444"; // red
    default: return "#94a3b8"; // gray
  }
};

const Equipment = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const fetchNetworks = async () => {
    try {
      const response = await fetch('http://localhost/Backend/page/Networks.php', {
        credentials: 'include'
      });
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

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const { id } = confirmDelete;
    try {
      const response = await fetch(`http://localhost/Backend/page/Equipment.php?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.status === 'success') {
        setEquipmentList(equipmentList.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  const filteredList = equipmentList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ip_address.includes(searchQuery) ||
    item.mac_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleString('en-GB');
    const networkName = selectedNetwork === 'all' ? 'All Networks' : networks.find(n => n.network_id == selectedNetwork)?.network_name;

    let csvContent = `NmsVision Inventory Report\n`;
    csvContent += `Generated: ${timestamp}\n`;
    csvContent += `Network Scope: ${networkName}\n\n`;

    const headers = ["ID", "Name", "Type", "IP Address", "MAC Address", "Network", "Status", "Latency (ms)", "Last Seen"];
    csvContent += headers.join(",") + "\n";

    filteredList.forEach(item => {
      const row = [
        item.id,
        `"${item.name}"`,
        item.type,
        item.ip_address,
        item.mac_address,
        `"${item.network_name}"`,
        item.status,
        item.response_time ?? "--",
        item.last_seen ?? "Never"
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NmsVision_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('en-GB');
    const networkName = selectedNetwork === 'all' ? 'All Networks' : networks.find(n => n.network_id == selectedNetwork)?.network_name;

    const onlineCount = filteredList.filter(d => d.status === 'online').length;
    const warningCount = filteredList.filter(d => d.status === 'warning' || (d.response_time > 100)).length;
    const offlineCount = filteredList.filter(d => d.status === 'offline').length;

    // --- Page Header ---
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("NMS Vision", 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Muted Blue-Gray
    doc.text("NETWORK MONITORING", 14, 32);

    doc.setTextColor(255, 255, 255);
    doc.text(`DATE: ${timestamp.split(',')[0]}`, 160, 20);
    doc.text(`TIME: ${timestamp.split(',')[1]}`, 160, 26);
    doc.text(`SCOPE: ${networkName.toUpperCase()}`, 160, 32);

    // --- Summary Section ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 50, 196, 50);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text("Summary Overview", 14, 60);

    // Summary Boxes (Faux cards)
    const drawSummaryBox = (x, y, label, val, color) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, 42, 20, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + 4, y + 7);
      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(val.toString(), x + 4, y + 15);
    };

    drawSummaryBox(14, 65, "TOTAL DEVICES", filteredList.length, [15, 23, 42]);
    drawSummaryBox(62, 65, "ONLINE", onlineCount, [34, 197, 94]);
    drawSummaryBox(110, 65, "WARNING", warningCount, [245, 158, 11]);
    drawSummaryBox(158, 65, "OFFLINE", offlineCount, [239, 68, 68]);

    // --- Table Section ---
    const tableColumn = ["ID", "DEVICE NAME", "TYPE", "IP ADDRESS", "NETWORK", "STATUS", "LATENCY"];
    const tableRows = [];

    filteredList.forEach(item => {
      const isWarning = item.response_time > 100 || item.status === 'warning';
      const rowData = [
        `#${item.id}`,
        item.name,
        item.type,
        item.ip_address,
        item.network_name,
        isWarning ? 'WARNING' : item.status.toUpperCase(),
        item.response_time !== null ? `${item.response_time}ms` : '--'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      startY: 95,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        3: { fontStyle: 'bold', textColor: [56, 189, 248] },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = data.cell.raw;
          if (val === 'ONLINE') data.cell.styles.textColor = [34, 197, 94];
          if (val === 'OFFLINE') data.cell.styles.textColor = [239, 68, 68];
          if (val === 'WARNING') data.cell.styles.textColor = [245, 158, 11];
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`NMS Vision - Network Monitoring`, 14, 285);
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 280, 196, 280);
    }

    doc.save(`NMS_Inventory_Fiche_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--primary-accent)' }}>
            Manage Devices
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Inventory & IP Management - Manage and monitor your network infrastructure.
          </p>

          {/* Network Selector */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Network Scope:
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

        {/* Reachability Warning Banner */}
        {selectedNetwork !== 'all' && (
          <div style={{
            flex: 1,
            margin: '1.5rem 2rem 0',
            padding: '12px 20px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#f59e0b',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle size={20} />
            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
              <span style={{ fontWeight: '800' }}>Network Scope Active:</span>
              Ensure this NMS server is physically connected to <span style={{ textDecoration: 'underline' }}>{networks.find(n => n.network_id == selectedNetwork)?.network_name}</span> to receive accurate live status and latency data.
            </div>
          </div>
        )}

        {/* Add Device — Admin only */}
        {isAdmin && (
          <button onClick={() => navigate('/add-device')} className="btn-primary" style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(56, 189, 248, 0.2)'
          }}>
            <Plus size={20} /> Add Device
          </button>
        )}
      </div>

      <div className="glass-panel" style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-dark-1)',
          borderRadius: '10px',
          padding: '0.5rem 1.25rem',
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
        <div className="export-container">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.5rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            <Download size={20} /> Export
          </button>

          {showExportMenu && (
            <div className="export-menu" style={{ minWidth: '200px' }}>
              <button className="export-item" onClick={handleExportPDF} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <FileText size={18} /> Export as PDF (Report)
              </button>
              <button className="export-item" onClick={handleExportCSV}>
                <FileSpreadsheet size={18} /> Export as CSV (Excel)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-dark-2)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>IP Address</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Network</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Device Name</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Latency</th>
              <th style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item, index) => (
              <tr key={item.id} className="interactive" style={{ borderBottom: index < filteredList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <td style={{ padding: '1.25rem 1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                  #{item.id}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', color: 'var(--primary-accent)', fontWeight: '600' }}>
                  {item.ip_address}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {item.network_name}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', fontSize: '1rem' }}>
                  {item.name}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.2)'
                  }}>
                    {item.type}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: item.response_time > 100 ? getStatusColor('warning') : getStatusColor(item.status),
                      boxShadow: `0 0 10px ${item.response_time > 100 ? getStatusColor('warning') : getStatusColor(item.status)}`
                    }}></div>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {item.response_time > 100 ? 'warning' : item.status}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: item.response_time !== null ? (item.response_time > 100 ? '#f59e0b' : (item.status === 'online' ? '#22c55e' : (item.status === 'warning' ? '#f59e0b' : '#ef4444'))) : '#64748b'
                  }}>
                    {item.response_time !== null ? `${item.response_time} ms` : '--'}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => navigate(`/edit-device/${item.id}`, { state: item })}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                      title="Edit device"
                    >
                      <Edit2 size={16} />
                    </button>
                    {/* Delete — Admin only */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                        title="Delete device"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Device"
        message="Are you sure you want to delete this device? This action cannot be undone and will remove all associated monitoring data."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Equipment;