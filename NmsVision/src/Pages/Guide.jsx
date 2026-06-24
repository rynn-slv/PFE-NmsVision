import React, { useState } from 'react';
import {
  Zap, Shield, Map, Activity, LayoutDashboard,
  Package, Search, Bell, CheckCircle, ArrowRight,
  Server, Globe, Cpu, Network, BarChart3, Settings
} from 'lucide-react';

const Guide = () => {
  const [expandedStep, setExpandedStep] = useState(null);

  const toggleStep = (index) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const sections = [
    {
      icon: LayoutDashboard,
      title: "Real-time Monitoring & Status",
      subtitle: "Heartbeat & Availability Tracking",
      description: "NmsVision implements a robust three-state monitoring logic to ensure precise infrastructure oversight.",
      details: [
        "Online: Active devices responding with latency < 100ms.",
        "Warning: Devices exhibiting high latency (> 100ms) or packet loss.",
        "Offline: Unreachable devices requiring immediate attention.",
        "Real-time Polling: 10-second synchronization for live dashboard updates."
      ],
      color: "var(--primary-accent)"
    },
    {
      icon: Map,
      title: "Interactive Network Topology",
      subtitle: "Dynamic Visualization & Mapping",
      description: "Automated topology mapping provides a visual representation of the network hierarchy.",
      details: [
        "Node Visualization: Interactive representation of routers, switches, and endpoints.",
        "Connection Logic: Visual links showing logical dependencies between devices.",
        "Instant Diagnostics: Click any node for direct access to metrics and status.",
        "Network Switching: Toggle between multiple managed networks seamlessly."
      ],
      color: "var(--secondary-accent)"
    },
    {
      icon: Activity,
      title: "Connectivity & Performance Suite",
      subtitle: "Advanced Diagnostic Tools",
      description: "Empowering administrators with high-precision performance measurement tools.",
      details: [
        "Speed Test: Accurate Download/Upload bandwidth measurement via Cloudflare API integration.",
        "Ping Diagnostics: ICMP-based verification for reachability and jitter assessment.",
        "Performance History: Historical tracking of latency trends for capacity planning.",
        "Bandwidth Analysis: Real-time throughput visualization for active networks."
      ],
      color: "var(--success)"
    },
    {
      icon: Package,
      title: "Infrastructure Management",
      subtitle: "Inventory & Asset Lifecycle",
      description: "Centralized management of physical and logical network assets.",
      details: [
        "Multiple Networks: Support for managing disparate logical subnets and environments.",
        "Equipment Lifecycle: Tracking devices from deployment to decommissioning.",
        "Inventory Details: Comprehensive storage of MAC addresses, IPs, and hardware vendors.",
        "Role-Based Access: Secure management with admin, operator, and viewer levels."
      ],
      color: "var(--warning)"
    },
    {
      icon: Settings,
      title: "Technical Utilities & Tools",
      subtitle: "Network Administrative Toolkit",
      description: "A comprehensive set of utilities for daily network administration tasks.",
      details: [
        "Subnet Calculator: Automated IPv4 subnetting and CIDR planning.",
        "Port Scanner: Verify service availability and security posture via socket testing.",
        "System Log: Audit trails for administrative actions and device state changes.",
        "Global Search: Instant access to any device or configuration across the platform."
      ],
      color: "var(--primary-accent)"
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Hero Section */}
      <section style={{ marginBottom: '5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 20px',
          background: 'rgba(56, 189, 248, 0.1)',
          borderRadius: '50px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          marginBottom: '1.5rem'
        }}>
          <Network size={16} color="var(--primary-accent)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-accent)', letterSpacing: '1px' }}>ACADEMIC PROJECT OVERVIEW</span>
        </div>

        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Welcome to <span className="text-gradient">NMS Vision</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          A professional Network Monitoring System designed for precision infrastructure monitoring,
          performance analysis, and automated topology visualization.
        </p>
      </section>

      {/* Guide Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem', marginBottom: '5rem' }}>
        {sections.map((section, index) => (
          <div key={index} className="glass-panel interactive" style={{ position: 'relative', overflow: 'hidden', padding: '2.5rem' }}>
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              opacity: '0.03',
              transform: 'rotate(-15deg)'
            }}>
              <section.icon size={180} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: `rgba(${section.color === 'var(--primary-accent)' ? '56, 189, 248' : section.color === 'var(--success)' ? '34, 197, 94' : '129, 140, 248'}, 0.1)`,
                  border: `1px solid ${section.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <section.icon size={26} color={section.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {section.title}
                  </h3>
                  <span style={{ fontSize: '0.9rem', color: section.color, fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {section.subtitle}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                  {section.description}
                </p>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  {section.details.map((detail, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem'
                    }}>
                      <div style={{ marginTop: '6px' }}>
                        <CheckCircle size={14} color={section.color} />
                      </div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Academic Mission / Pro Tip */}
      <div className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2.5rem',
        padding: '3rem',
        background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.05) 0%, transparent 100%)',
        borderLeft: '4px solid var(--primary-accent)',
        borderRadius: '24px'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Shield size={35} color="var(--primary-accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Professional Standards & Security</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            NmsVision adheres to enterprise monitoring standards by implementing encrypted
            credentials storage and real-time ICMP diagnostics. Our mission is to provide
            a stable, scalable, and intuitive platform for modern network administration.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <Globe size={30} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>v2.4.0</span>
        </div>
      </div>

      <style>{`
        .text-gradient {
          background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .interactive {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          cursor: default;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .interactive:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Guide;
