# 🌐 NmsVision - Enterprise Network Management System

**NmsVision** is a high-performance Network Management System (NMS) engineered for real-time monitoring, infrastructure visualization, and strategic device management. Built as a professional-grade **Projet de Fin d'Études (PFE)**, it provides network administrators with absolute visibility into their infrastructure's health and performance through an elite React interface and a robust PHP/MySQL backend.

---

## 🚀 Core Functionalities

### 📡 Real-Time Monitoring & Heartbeat
*   **3-State Intelligence**: Direct ICMP polling with smart categorization:
    *   🟢 **Online**: Latency $\le$ 100ms (High performance).
    *   🟡 **Warning**: Latency > 100ms (Heavily congested/Jitter alert).
    *   🔴 **Offline**: Connection timeout.
*   **10s Heartbeat**: Fully automated polling synchronization on all monitoring pages (Table, Grid, Map) with no manual refresh required.

### 🗺️ Interactive Topology Mapping
*   **Dynamic Visualizer**: Real-time representation of network architecture showing device relationships and positions.
*   **Glassmorphism UI**: High-end visual design with live status glows and interactive node management.
*   **Network Scoping**: Intelligent filtering to isolate specific network segments for deep-dive monitoring.

### 🛠️ Infrastructure Utilities & IPAM
*   **Device Management**: Comprehensive CRUD operations for all hardware (Routers, Switches, Servers, Mobile devices).
*   **Connectivity Manager**: Professional-grade speed testing suite measuring latency, download, and upload telemetry.
*   **Subnet Calculator**: Precise IPv4 planning tools (CIDR, Netmask, Broadcast, and Host ranges).

---

## 📋 Logical Use Cases (Functional Spec)

### UC1: Real-Time Infrastructure Oversight
Ensuring all mission-critical devices are reachable and performant. The system monitors the "Vitality" of nodes and alerts administrators to performance degradation (>100ms) before downtime occurs.

### UC2: Network Connectivity Visualization
Aiding administrators in understanding the physical and logical relationships between hardware through an interactive topology heatmap.

### UC3: Multi-Network Management
The system allows for managing multiple disparate networks from a single pane of glass, providing device counting and scoped monitoring per network.

### UC4: Performance Performance Audit
Running professional benchmarks to validate ISP performance or local trunk bandwidth through multi-threaded telemetry tests.

---

## 💻 Technical Architecture

### Frontend (Modern UI/UX)
*   **React 18**: Component-based architecture for reactive, state-managed updates.
*   **Lucide React**: Clean, enterprise-ready iconography.
*   **Recharts**: High-performance data visualization for latency and bandwidth history.
*   **Glassmorphism Engine**: Custom CSS design system for a premium, futuristic aesthetics.

### Backend (Robust Services)
*   **PHP 8.x + Shell Services**: RESTful API service utilizing native OS primitives for low-level network polling.
*   **MySQL**: Relational storage for persistent asset data and network segmentation.

---

## ⚙️ Installation & Setup

### Prerequisites
*   **Web Server**: XAMPP, WAMP, or Apache/Nginx.
*   **Language**: PHP 8.1+ & Node.js 16+.
*   **Database**: MySQL / MariaDB.

### Database Setup
1. Create a database named `nmsvision` via phpMyAdmin.
2. Import the `NmsVision.sql` file provided in the root directory.
3. Verify credentials in `Backend/config/dbconn.php`.

### Application Launch
1. **Backend**: Host the `/Backend` folder on your local server root.
2. **Frontend**:
   ```bash
   cd NmsVision
   npm install
   npm run dev
   ```

---

## 👥 Authors
*   **Walid Rezzoug**
*   **EL Miloudi Mohamed Rayan**

---

**NmsVision** – *Precision monitoring for professional infrastructures.*
