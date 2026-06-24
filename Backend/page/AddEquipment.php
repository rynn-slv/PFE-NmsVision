<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';

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

function getServerNetworkInfo() {
    $output = shell_exec('ipconfig');
    
    // Support l'anglais (IPv4 Address, Subnet Mask) et le français (Adresse IPv4, Masque de sous-réseau)
    $ip = '127.0.0.1';
    $mask = '255.255.255.0';
    
    if (preg_match('/IPv4.*?:\s*([\d\.]+)/i', $output, $ipMatch)) {
        $ip = trim($ipMatch[1]);
    }
    if (preg_match('/(?:Subnet|Masque).*?:\s*([\d\.]+)/i', $output, $maskMatch)) {
        $mask = trim($maskMatch[1]);
    }
    
    return ['ip' => $ip, 'mask' => $mask];
}

function isSameNetwork($ip1, $ip2, $mask) {
    if (!$ip1 || !$ip2 || !$mask) return true; // Fail gracefully
    return (ip2long($ip1) & ip2long($mask)) === (ip2long($ip2) & ip2long($mask));
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::get();

    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM equipment");
        $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($equipments as $eq) {
            $ip = $eq['ip_address'] ?? '127.0.0.1';
            
            $pingResult = pingDevice($ip);
            $currentStatus = $pingResult['status'];
            $responseTime = $pingResult['response_time'];
            
            $results[] = [
                'id' => $eq['equipment_id'],
                'name' => $eq['name'] ?? 'Unknown',
                'type' => $eq['type'] ?? 'Device',
                'ip_address' => $ip,
                'mac_address' => $eq['mac_address'] ?? 'N/A',
                'status' => $currentStatus,
                'response_time' => $responseTime,
                'last_seen' => ($currentStatus === 'online') ? 'Just now' : ($eq['last_seen'] ?? 'Offline')
            ];
            
            if (($eq['status'] ?? '') !== $currentStatus) {
                $updateStmt = $db->prepare("UPDATE equipment SET status = :status, last_seen = IF(:status_check = 'online', CURRENT_TIMESTAMP, last_seen) WHERE equipment_id = :id");
                $updateStmt->execute(['status' => $currentStatus, 'status_check' => $currentStatus, 'id' => $eq['equipment_id']]);
            }
        }
        
        echo json_encode(["status" => "success", "data" => $results]);
    } 
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $db->prepare("DELETE FROM equipment WHERE equipment_id = :id");
            $stmt->execute(['id' => $id]);
            echo json_encode(["status" => "success", "message" => "Equipment deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing ID parameter"]);
        }
    }
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            $ip = $data['ip_address'] ?? '0.0.0.0';
            
            // Ping immediately upon adding
            $pingResult = pingDevice($ip);
            $status = $pingResult['status'];
            
            // Check if device is in network
            $netInfo = getServerNetworkInfo();
            $inNetwork = isSameNetwork($netInfo['ip'], $ip, $netInfo['mask']);
            $warningMsg = null;
            if (!$inNetwork && $ip !== '127.0.0.1' && $ip !== '0.0.0.0') {
                $warningMsg = "L'appareil semble être en dehors du réseau local ({$netInfo['ip']}/{$netInfo['mask']}).";
            }

            $stmt = $db->prepare("INSERT INTO equipment (name, type, ip_address, mac_address, status) VALUES (:name, :type, :ip_address, :mac_address, :status)");
            $stmt->execute([
                'name' => $data['name'] ?? 'Unknown',
                'type' => $data['type'] ?? 'Device',
                'ip_address' => $ip,
                'mac_address' => $data['mac_address'] ?? '',
                'status' => $status
            ]);
            
            $response = [
                "status" => "success", 
                "message" => "Équipement ajouté", 
                "device_status" => $status
            ];
            if ($warningMsg) {
                $response["warning"] = $warningMsg;
                $response["message"] .= " (Mais hors réseau)";
            }
            
            echo json_encode($response);
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
