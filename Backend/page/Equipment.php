<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';
require_once '../config/NotificationUtil.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$user = requireAuth();
$owner_id = $user['owner_id'];  // ← always the admin's id (works for both roles)

function pingDevice($ip) {
    if (!$ip || $ip === '0.0.0.0') {
        return ["status" => "offline", "response_time" => null];
    }

    $ip = trim($ip);
    $safeIp = escapeshellarg($ip);
    
    $output = shell_exec("ping -n 1 -w 1000 $safeIp 2>&1");
    $latency = extractTime($output);

    if ($latency !== null && stripos($output, "TTL=") !== false && stripos($output, "unreachable") === false) {
        $lInt = intval($latency);
        
        // 🎯 🟢 ONLINE (<= 100ms) | 🟡 WARNING (> 100ms)
        // Hard enforcement: if it's over 100, it MUST be warning.
        $status = ($lInt > 100) ? "warning" : "online";

        return [
            "status" => $status,
            "response_time" => $lInt
        ];
    }

    return [
        "status" => "offline",
        "response_time" => null
    ];
}

function extractTime($output) {
    // Try to find the time in the main response line first (e.g. Reply from ... time=10ms)
    // This avoids matching summary lines like "Minimum = 1ms"
    if (preg_match('/(?:Reply|Réponse).*?(?:time|temps)[=<]\s*(\d+)\s*ms/i', $output, $matches)) {
        return (int)$matches[1];
    }
    // Fallback if the above doesn't match
    if (preg_match('/(?:time|temps)[=<]\s*(\d+)\s*ms/i', $output, $matches)) {
        return (int)$matches[1];
    }
    return null;
}

function getMacAddress($ip) {
    if (!$ip || $ip === '0.0.0.0') return null;
    $ip = trim($ip);
    
    // On Windows, 'arp -a <ip>' returns the ARP table entry for that IP
    $output = shell_exec("arp -a " . escapeshellarg($ip));
    
    if ($output) {
        // Regex to match MAC address patterns (00-00-00... or 00:00:00...)
        if (preg_match('/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/', $output, $matches)) {
            return strtoupper(str_replace('-', ':', $matches[0]));
        }
    }
    return "Unknown";
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::get();

    if ($method === 'GET') {
        $networkId = $_GET['network_id'] ?? null;
        
        if ($networkId && $networkId !== 'all') {
            $stmt = $db->prepare("
                SELECT e.*, n.network_name 
                FROM equipment e 
                LEFT JOIN networks n ON e.network_id = n.network_id 
                WHERE e.owner_id = :owner_id AND e.network_id = :network_id
            ");
            $stmt->execute(['owner_id' => $owner_id, 'network_id' => $networkId]);
        } else {
            $stmt = $db->prepare("
                SELECT e.*, n.network_name 
                FROM equipment e 
                LEFT JOIN networks n ON e.network_id = n.network_id
                WHERE e.owner_id = :owner_id
            ");
            $stmt->execute(['owner_id' => $owner_id]);
        }
        
        $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($equipments as $eq) {
            $ip = $eq['ip_address'] ?? '127.0.0.1';
            
            $pingResult = pingDevice($ip);
            $currentStatus = $pingResult['status'];
            $responseTime = $pingResult['response_time'];
            
            // Handle last seen logic
            $lastSeenStr = 'Offline';
            if ($currentStatus === 'online' || $currentStatus === 'warning') {
                $lastSeenStr = 'Just now';
            } else {
                if (!empty($eq['last_seen'])) {
                    try {
                        $date = new DateTime($eq['last_seen']);
                        $lastSeenStr = $date->format('Y-m-d H:i:s');
                    } catch (Exception $e) {
                        $lastSeenStr = 'Offline';
                    }
                }
            }

            $results[] = [
                'id' => $eq['equipment_id'],
                'name' => $eq['name'] ?? 'Unknown',
                'type' => $eq['type'] ?? 'Device',
                'ip_address' => $ip,
                'mac_address' => $eq['mac_address'] ?? 'N/A',
                'network_name' => $eq['network_name'] ?? 'Default',
                'status' => $currentStatus,
                'response_time' => $responseTime,
                'last_seen' => $lastSeenStr
            ];
            
            // Sync database status and last_seen
            if ($currentStatus === 'online' || $currentStatus === 'warning') {
                $updateStmt = $db->prepare("UPDATE equipment SET status = :status, last_seen = NOW() WHERE equipment_id = :id");
            } else {
                $updateStmt = $db->prepare("UPDATE equipment SET status = :status WHERE equipment_id = :id");
            }
            
            // 🎯 REFINED ALERT LOGIC (State-Transition & Initial Detection)
            $oldStatus = $eq['status'] ?? 'online';
            $triggerAlert = false;
            $severity = 'Info';
            $msg = "";

            // 1. Detect Status Change (The user's transition table)
            if ($oldStatus !== $currentStatus) {
                $triggerAlert = true;
                if ($currentStatus === 'offline') {
                    $severity = 'Critical';
                    $msg = "Device {$eq['name']} is OFFLINE";
                } elseif ($currentStatus === 'warning') {
                    $severity = 'Warning';
                    $msg = "Device {$eq['name']} has high latency ({$responseTime} ms)";
                } else {
                    $severity = 'Info';
                    $msg = "Device {$eq['name']} recovered to ONLINE";
                }
            } 
            // 2. Initial Bad State Catch (If device is bad but never had an alert recorded)
            elseif ($currentStatus !== 'online') {
                $checkAlertStmt = $db->prepare("SELECT id FROM alerts WHERE equipment_id = :eid AND severity = :sev LIMIT 1");
                $checkAlertStmt->execute([
                    'eid' => $eq['equipment_id'],
                    'sev' => ($currentStatus === 'offline' ? 'Critical' : 'Warning')
                ]);
                if (!$checkAlertStmt->fetch()) {
                    $triggerAlert = true;
                    if ($currentStatus === 'offline') {
                        $severity = 'Critical';
                        $msg = "Device {$eq['name']} is OFFLINE";
                    } else {
                        $severity = 'Warning';
                        $msg = "Device {$eq['name']} has high latency ({$responseTime} ms)";
                    }
                }
            }

            if ($triggerAlert) {
                $alertStmt = $db->prepare("INSERT INTO alerts (equipment_id, severity, source, message) VALUES (:eid, :sev, 'ICMP', :msg)");
                $alertStmt->execute([
                    'eid' => $eq['equipment_id'],
                    'sev' => $severity,
                    'msg' => $msg
                ]);

                // 📧 Trigger Email Alert for OFFLINE status
                if ($currentStatus === 'offline') {
                    try {
                        // Fetch the admin's email
                        $userStmt = $db->prepare("SELECT email FROM users WHERE id = :oid LIMIT 1");
                        $userStmt->execute(['oid' => $owner_id]);
                        $adminUser = $userStmt->fetch(PDO::FETCH_ASSOC);

                        if ($adminUser && !empty($adminUser['email'])) {
                            NotificationUtil::sendOfflineAlert($adminUser['email'], $eq['name'], $ip);
                        }
                    } catch (Exception $mailEx) {
                        // Log mail error but don't break the monitoring loop
                        error_log("Failed to send offline email alert: " . $mailEx->getMessage());
                    }
                }
            }

            $updateStmt->execute([
                'status' => $currentStatus, 
                'id' => $eq['equipment_id']
            ]);
        }

        // 🧹 Maintain only the last 10 alerts FOR THIS ADMIN
        $stmt = $db->prepare("
            DELETE FROM alerts 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT a.id FROM alerts a
                    JOIN equipment e ON a.equipment_id = e.equipment_id
                    WHERE e.owner_id = :oid1
                    ORDER BY a.created_at DESC, a.id DESC 
                    LIMIT 10
                ) tmp
            ) AND equipment_id IN (SELECT equipment_id FROM equipment WHERE owner_id = :oid2)
        ");
        $stmt->execute(['oid1' => $owner_id, 'oid2' => $owner_id]);
        
        echo json_encode(["status" => "success", "data" => $results]);
    } 
    elseif ($method === 'PUT') {
        $id = $_GET['id'] ?? null;
        $data = json_decode(file_get_contents("php://input"), true);
        
        if ($id && $data) {
            $ip = trim($data['ip_address']);
            
            // Check if IP is taken by another device for THIS admin
            $checkStmt = $db->prepare("SELECT equipment_id FROM equipment WHERE ip_address = :ip AND equipment_id != :id AND owner_id = :owner_id");
            $checkStmt->execute(['ip' => $ip, 'id' => $id, 'owner_id' => $owner_id]);
            if ($checkStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "This IP address is already reserved or used by another device."]);
                exit;
            }

            $mac = getMacAddress($ip);
            
            $stmt = $db->prepare("UPDATE equipment SET name = :name, type = :type, ip_address = :ip, mac_address = :mac, network_id = :network_id WHERE equipment_id = :id AND owner_id = :owner_id");
            $stmt->execute([
                'name' => $data['name'],
                'type' => $data['type'],
                'ip' => $ip,
                'mac' => $mac,
                'network_id' => !empty($data['network_id']) ? $data['network_id'] : null,
                'id' => $id,
                'owner_id' => $owner_id
            ]);
            echo json_encode(["status" => "success", "message" => "Equipment updated successfully", "mac_discovered" => $mac]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing ID or data"]);
        }
    }
    elseif ($method === 'DELETE') {
        // Only admins can delete devices
        requireAdmin($user);
        $id = $_GET['id'] ?? null;
        if ($id) {
            // Ensure device belongs to this admin
            $stmt = $db->prepare("DELETE FROM equipment WHERE equipment_id = :id AND owner_id = :owner_id");
            $stmt->execute(['id' => $id, 'owner_id' => $owner_id]);
            echo json_encode(["status" => "success", "message" => "Equipment deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing ID parameter"]);
        }
    }
    elseif ($method === 'POST') {
        // Only admins can add devices
        requireAdmin($user);
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            $ip = trim($data['ip_address'] ?? '0.0.0.0');
            
            // Duplicate IP protection (scoped to this admin's devices)
            $checkStmt = $db->prepare("SELECT equipment_id FROM equipment WHERE ip_address = :ip AND owner_id = :owner_id");
            $checkStmt->execute(['ip' => $ip, 'owner_id' => $owner_id]);
            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "This device (IP) already exists in the database."]);
                exit;
            }

            // Auto-Discovery: resolve MAC and Ping status
            $mac = getMacAddress($ip);
            $pingResult = pingDevice($ip);
            $status = $pingResult['status'];

            $stmt = $db->prepare("INSERT INTO equipment (name, type, ip_address, mac_address, status, network_id, owner_id, last_seen) VALUES (:name, :type, :ip_address, :mac_address, :status, :network_id, :owner_id, " . (($status === 'online' || $status === 'warning') ? "NOW()" : "NULL") . ")");
            $stmt->execute([
                'name'       => $data['name'] ?? 'Unknown',
                'type'       => $data['type'] ?? 'Device',
                'ip_address' => $ip,
                'mac_address'=> $mac,
                'status'     => $status,
                'network_id' => !empty($data['network_id']) ? $data['network_id'] : null,
                'owner_id'   => $owner_id
            ]);
            
            echo json_encode([
                "status"         => "success", 
                "message"        => "Device added successfully", 
                "device_status"  => $status,
                "mac_discovered" => $mac
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid JSON data"]);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>