-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
-- Host: 127.0.0.1
-- Generation Time: Apr 25, 2026
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12
--
-- ⚡ FINAL VERSION — includes RBAC (Role-Based Access Control)
--    admin_id  → links operator to their admin (users table)
--    owner_id  → scopes networks and equipment to an admin

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ================== DATABASE ==================
CREATE DATABASE IF NOT EXISTS NmsVision;
USE NmsVision;

-- ================== USERS ==================
-- RBAC change: added admin_id (NULL = admin, FK to users.id = operator)
--              role ENUM is now only 'admin' | 'operator'
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    fullname   VARCHAR(100)  NOT NULL,
    email      VARCHAR(255)  UNIQUE NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    role       ENUM('admin','operator') NOT NULL DEFAULT 'admin',
    admin_id   INT           DEFAULT NULL,          -- NULL if admin, admin's id if operator
    phone      VARCHAR(20)   DEFAULT NULL,
    is_active  TINYINT(1)    DEFAULT 1,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    avatar     LONGTEXT      DEFAULT NULL,
    CONSTRAINT fk_users_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================== PASSWORD RESET ==================
CREATE TABLE password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    expires_at DATETIME     NOT NULL,
    used       TINYINT(1)   DEFAULT 0
) ENGINE=InnoDB;

-- ================== NETWORKS ==================
-- RBAC change: added owner_id — every network belongs to one admin
CREATE TABLE networks (
    network_id   INT AUTO_INCREMENT PRIMARY KEY,
    network_name VARCHAR(100) NOT NULL,
    subnet_ipv4  VARCHAR(18)  DEFAULT NULL,
    gateway      VARCHAR(45)  DEFAULT NULL,
    description  TEXT         DEFAULT NULL,
    owner_id     INT          DEFAULT NULL,          -- FK to users.id (the admin who owns this network)
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_networks_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================== EQUIPMENT ==================
-- RBAC change: added owner_id — every device belongs to one admin
CREATE TABLE equipment (
    equipment_id        INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    type                ENUM(
                            'Phone',
                            'Router',
                            'Switch',
                            'PC',
                            'Printer'
                        ) NOT NULL,
    ip_address          VARCHAR(45)  NOT NULL,
    mac_address         VARCHAR(17)  DEFAULT NULL,
    vendor              VARCHAR(100) DEFAULT NULL,
    location            VARCHAR(150) DEFAULT NULL,
    description         TEXT         DEFAULT NULL,
    monitoring_protocol ENUM('SNMP','ICMP','ARP','HYBRID') DEFAULT 'ICMP',
    snmp_enabled        TINYINT(1)   DEFAULT 0,
    status              ENUM('online','warning','offline') DEFAULT 'offline',
    response_time       INT          DEFAULT NULL,
    network_id          INT          DEFAULT NULL,
    owner_id            INT          DEFAULT NULL,          -- FK to users.id (the admin who owns this device)
    added_by            INT          DEFAULT NULL,
    added_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_seen           TIMESTAMP    NULL DEFAULT NULL,
    CONSTRAINT unique_ip_per_owner  UNIQUE (owner_id, ip_address),
    CONSTRAINT fk_equipment_network FOREIGN KEY (network_id) REFERENCES networks(network_id) ON DELETE SET NULL,
    CONSTRAINT fk_equipment_owner   FOREIGN KEY (owner_id)   REFERENCES users(id)            ON DELETE SET NULL,
    CONSTRAINT fk_equipment_added   FOREIGN KEY (added_by)   REFERENCES users(id)            ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================== SNMP CONFIGS ==================
CREATE TABLE snmp_configs (
    config_id     INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id  INT NOT NULL UNIQUE,
    community     VARCHAR(100) DEFAULT 'public',
    version       ENUM('v1','v2c','v3') DEFAULT 'v2c',
    port          SMALLINT UNSIGNED DEFAULT 161,
    username      VARCHAR(100) DEFAULT NULL,
    auth_protocol ENUM('MD5','SHA') DEFAULT NULL,
    auth_password VARCHAR(255) DEFAULT NULL,
    priv_protocol ENUM('DES','AES') DEFAULT NULL,
    priv_password VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================== ARP CACHE ==================
CREATE TABLE arp_cache (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_address   VARCHAR(45) NOT NULL,
    mac_address  VARCHAR(17) NOT NULL,
    equipment_id INT         DEFAULT NULL,
    entry_type   ENUM('dynamic','static') DEFAULT 'dynamic',
    scanned_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================== METRICS ==================
CREATE TABLE metrics (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_id        INT NOT NULL,
    cpu_usage           TINYINT UNSIGNED  DEFAULT NULL,
    ram_usage           TINYINT UNSIGNED  DEFAULT NULL,
    bandwidth_in_kbps   INT UNSIGNED      DEFAULT NULL,
    bandwidth_out_kbps  INT UNSIGNED      DEFAULT NULL,
    latency_ms          SMALLINT UNSIGNED DEFAULT NULL,
    packet_loss         TINYINT UNSIGNED  DEFAULT NULL,
    monitoring_type     ENUM('SNMP','ICMP','ARP','HYBRID') NOT NULL DEFAULT 'ICMP',
    recorded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================== PORT SCAN RESULTS ==================
CREATE TABLE port_scan_results (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    port         SMALLINT UNSIGNED NOT NULL,
    protocol     ENUM('TCP','UDP') DEFAULT 'TCP',
    service_name VARCHAR(50)  DEFAULT NULL,
    state        ENUM('open','closed','filtered') DEFAULT 'open',
    scanned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================== ALERTS ==================
CREATE TABLE alerts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    severity     ENUM('Critical','Warning','Info') DEFAULT 'Info',
    source       ENUM('SNMP','ICMP','ARP','SYSTEM') DEFAULT 'SYSTEM',
    message      TEXT NOT NULL,
    is_resolved  TINYINT(1) DEFAULT 0,
    resolved_by  INT        DEFAULT NULL,
    created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    resolved_at  TIMESTAMP  NULL DEFAULT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by)  REFERENCES users(id)              ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================== TOOLS (Subnet Calculator) ==================
CREATE TABLE Tools (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    ip_address        VARCHAR(15) NOT NULL,
    cidr              INT NOT NULL,
    subnet_mask       VARCHAR(15),
    network_address   VARCHAR(15),
    broadcast_address VARCHAR(15),
    usable_hosts      INT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================== LATENCY HISTORY ==================
CREATE TABLE IF NOT EXISTS latency_history (
    history_id   INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    latency_ms   INT DEFAULT NULL,
    recorded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================== SPEED TEST HISTORY ==================
CREATE TABLE IF NOT EXISTS speed_test_history (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    test_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_speed FLOAT NOT NULL,
    upload_speed   FLOAT NOT NULL,
    ping           INT NOT NULL,
    server_name    VARCHAR(100) DEFAULT 'Unknown',
    server_ip      VARCHAR(45)  DEFAULT '0.0.0.0'
) ENGINE=InnoDB;

-- ================== DEFAULT ADMIN ==================
-- Password hash below is a placeholder — replace with a real bcrypt hash
-- To generate: php -r "echo password_hash('yourpassword', PASSWORD_BCRYPT);"
INSERT INTO users (fullname, email, password, role, admin_id) VALUES
('Super Admin', 'admin@nmsvision.com', '$2y$10$changethishashbeforeproduction', 'admin', NULL);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;