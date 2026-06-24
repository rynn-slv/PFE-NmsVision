<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$user = requireAuth();
$owner_id = $user['owner_id'];

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
    if (preg_match('/(?:Reply|Réponse).*?(?:time|temps)[=<]\s*(\d+)\s*ms/i', $output, $matches)) {
        return (int)$matches[1];
    }
    if (preg_match('/(?:time|temps)[=<]\s*(\d+)\s*ms/i', $output, $matches)) {
        return (int)$matches[1];
    }
    return null;
}

try {
    $db = Database::get();
    
    $networkId = $_GET['network_id'] ?? null;
    
    if ($networkId && $networkId !== 'all') {
        $stmt = $db->prepare("SELECT * FROM equipment WHERE network_id = :network_id AND owner_id = :owner_id");
        $stmt->execute(['network_id' => $networkId, 'owner_id' => $owner_id]);
    } else {
        $stmt = $db->prepare("SELECT * FROM equipment WHERE owner_id = :owner_id");
        $stmt->execute(['owner_id' => $owner_id]);
    }
    
    $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $nodes = [];
    $i = 0;

    foreach($equipments as $eq) {
        $ip = $eq['ip_address'];
        $ping = pingDevice($ip);
        
        $upd = $db->prepare("UPDATE equipment SET status = :status WHERE equipment_id = :id");
        // 🎯 REFINED ALERT LOGIC (State-Transition & Initial Detection)
        $oldStatus = $eq['status'] ?? 'online';
        $currentStatus = $ping['status'];
        $triggerAlert = false;
        $severity = 'Info';
        $msg = "";

        // 1. Detect Status Change
        if ($oldStatus !== $currentStatus) {
            $triggerAlert = true;
            if ($currentStatus === 'offline') {
                $severity = 'Critical';
                $msg = "Device {$eq['name']} is OFFLINE";
            } elseif ($currentStatus === 'warning') {
                $severity = 'Warning';
                $msg = "Device {$eq['name']} has high latency ({$ping['response_time']} ms)";
            } else {
                $severity = 'Info';
                $msg = "Device {$eq['name']} recovered to ONLINE";
            }
        } 
        // 2. Initial Bad State Catch
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
                    $msg = "Device {$eq['name']} has high latency ({$ping['response_time']} ms)";
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
        }

        $upd->execute(['status' => $ping['status'], 'id' => $eq['equipment_id']]);

        $row = floor($i / 4);
        $col = $i % 4;
        $top = 25 + ($row * 25) . '%';
        $left = 15 + ($col * 25) . '%';

        $rawType = strtolower($eq['type'] ?? 'device');
        $type = 'device';
        
        if (strpos($rawType, 'router') !== false) $type = 'router';
        elseif (strpos($rawType, 'switch') !== false) $type = 'switch';
        elseif (strpos($rawType, 'server') !== false) $type = 'server';
        elseif (strpos($rawType, 'phone') !== false || strpos($rawType, 'mobile') !== false) $type = 'phone';
        elseif (strpos($rawType, 'tablet') !== false) $type = 'tablet';
        elseif (strpos($rawType, 'printer') !== false) $type = 'printer';
        elseif (strpos($rawType, 'pc') !== false || strpos($rawType, 'computer') !== false) $type = 'device';

        if (strpos(strtolower($eq['name'] ?? ''), 'core') !== false) $type = 'core';

        $nodes[] = [
            'id' => $eq['equipment_id'],
            'label' => $eq['name'] ?? 'Device ' . ($i+1),
            'type' => $type, 
            'pos' => [
                'top' => $eq['pos_y'] ?? $top, 
                'left' => $eq['pos_x'] ?? $left
            ],
            'status' => $ping['status'],
            'response_time' => $ping['response_time']
        ];
        $i++;
    }
    
    echo json_encode(["status" => "success", "data" => $nodes]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
