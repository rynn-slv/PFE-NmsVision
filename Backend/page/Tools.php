<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --------------------------------------------------------
// Fonctions utilitaires réseau
// --------------------------------------------------------

function ipToInt($ip) {
    $value = ip2long($ip);
    $value = sprintf('%u', $value);
    return $value;
}

function intToIp($int) {
    return long2ip($int);
}

function calculateNetworkDetails($ip, $cidr) {
    $ipInt = ipToInt($ip);
    // Calcul du masque depuis le CIDR
   $maskInt = (0xFFFFFFFF << (32 - $cidr)) & 0xFFFFFFFF;
    
    $networkInt = $ipInt & $maskInt;
    $broadcastInt = $networkInt | (~$maskInt & 0xFFFFFFFF);
    
    if ($cidr == 32) {
        $numHosts = 1;
    } elseif ($cidr == 31) {
        $numHosts = 2;
    } else {
        $numHosts = max(0, $broadcastInt - $networkInt - 1);
    }
    
    return [
        'subnetMask' => intToIp($maskInt),
        'networkAddress' => intToIp($networkInt),
        'broadcastAddress' => intToIp($broadcastInt),
        'numHosts' => $numHosts
    ];
}

function generateUsableIps($networkAddress, $broadcastAddress, $cidr) {
    $startInt = ipToInt($networkAddress) + ($cidr >= 31 ? 0 : 1);
    $endInt = ipToInt($broadcastAddress) - ($cidr >= 31 ? 0 : 1);
    
    $ips = [];
    // Limite de sécurité pour éviter de bloquer le serveur sur des gros réseaux (exp: /16 ou /8)
    $totalIps = $endInt - $startInt + 1; if ($totalIps > 10000) {
        throw new Exception("Réseau trop grand pour être scanné directement (limité à 10000 IPs par mesure de sécurité).");
    }
    
    for ($i = $startInt; $i <= $endInt; $i++) {
        $ips[] = intToIp($i);
    }
    return $ips;
}

function pingDevice($ip) {
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        exec("ping -n 1 -w 1000 " . escapeshellarg($ip), $output, $returnCode);
        return ($returnCode === 0) ? "online" : "offline";
    } else {
        exec("ping -c 1 -W 1 " . escapeshellarg($ip), $output, $returnCode);
        return ($returnCode === 0) ? "online" : "offline";
    }
}

// --------------------------------------------------------
// Routage et logique principale
// --------------------------------------------------------

try {
    $db = Database::get();

    // 1. GET /Tools.php?action=get_networks
    if ($method === 'GET' && $action === 'get_networks') {
        $stmt = $db->query("SELECT * FROM networks ORDER BY created_at DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    // 2. GET /Tools.php?action=get_network&id=1
    elseif ($method === 'GET' && $action === 'get_network') {
        $id = $_GET['id'] ?? null;
        if (!$id) throw new Exception("ID du réseau manquant");
        
        $stmt = $db->prepare("SELECT * FROM networks WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $network = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$network) throw new Exception("Réseau introuvable");
        echo json_encode(["status" => "success", "data" => $network]);
    }
    
    // 3. POST /Tools.php?action=add_network (Body JSON: { "ip_address": "...", "cidr": 24 })
    elseif ($method === 'POST' && $action === 'add_network') {
        $data = json_decode(file_get_contents("php://input"), true);
        $ip = $data['ip_address'] ?? null;
        $cidr = isset($data['cidr']) ? (int)$data['cidr'] : null;
        
        if (!$ip || filter_var($ip, FILTER_VALIDATE_IP) === false) {
            throw new Exception("Adresse IP invalide");
        }
        if ($cidr === null || $cidr < 0 || $cidr > 32) {
            throw new Exception("CIDR invalide (doit être entre 0 et 32)");
        }
        
        $details = calculateNetworkDetails($ip, $cidr);
        
        $stmt = $db->prepare("INSERT INTO networks (ip_address, cidr, network_address, broadcast_address, subnet_mask, num_hosts) VALUES (:ip, :cidr, :net, :broad, :mask, :hosts)");
        $stmt->execute([
            'ip' => $ip,
            'cidr' => $cidr,
            'net' => $details['networkAddress'],
            'broad' => $details['broadcastAddress'],
            'mask' => $details['subnetMask'],
            'hosts' => $details['numHosts']
        ]);
        
        echo json_encode([
            "status" => "success", 
            "message" => "Réseau ajouté avec succès", 
            "networkId" => $db->lastInsertId(),
            "details" => $details
        ]);
    }
    
    // 4. POST /Tools.php?action=scan_network&id=1
    elseif ($method === 'POST' && $action === 'scan_network') {
        $networkId = $_GET['id'] ?? null;
        if (!$networkId) throw new Exception("ID de réseau manquant pour le scan");
        
        $stmt = $db->prepare("SELECT * FROM networks WHERE id = :id");
        $stmt->execute(['id' => $networkId]);
        $network = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$network) throw new Exception("Réseau introuvable");
        
        $ipsToScan = generateUsableIps($network['network_address'], $network['broadcast_address'], $network['cidr']);
        
        $devicesOnline = 0;
        $devicesOffline = 0;
        $results = [];
        
        // Attention : En PHP synchrone, ce scan peut prendre beaucoup de temps si la plage d'IP est grande.
        // On a réduit le timeout de ping pour compenser.
        foreach ($ipsToScan as $scanIp) {
            $status = pingDevice($scanIp);
            $results[] = ["ip" => $scanIp, "status" => $status];
            
            if ($status === 'online') {
                $devicesOnline++;
            } else {
                $devicesOffline++;
            }
            
            // Sauvegarder dans la table devices
            $checkStmt = $db->prepare("SELECT id FROM devices WHERE ip_address = :ip AND network_id = :nid");
            $checkStmt->execute(['ip' => $scanIp, 'nid' => $networkId]);
            $device = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($device) {
                // Si le device existe, le mettre à jour
                $upStmt = $db->prepare("UPDATE devices SET status = :status, last_seen = NOW() WHERE id = :id");
                $upStmt->execute(['status' => $status, 'id' => $device['id']]);
            } else {
                // S'il n'existe pas, l'insérer
                $inStmt = $db->prepare("INSERT INTO devices (ip_address, status, network_id) VALUES (:ip, :status, :nid)");
                $inStmt->execute(['ip' => $scanIp, 'status' => $status, 'nid' => $networkId]);
            }
        }
        
        echo json_encode([
            "status" => "success",
            "message" => "Scan réseau terminé",
            "details" => [
                "scanned_ips" => count($ipsToScan),
                "online" => $devicesOnline,
                "offline" => $devicesOffline
            ],
            "results" => $results
        ]);
    }
    
    // 5. GET /Tools.php?action=get_devices&network_id=1 (ou global)
    elseif ($method === 'GET' && $action === 'get_devices') {
        $networkId = $_GET['network_id'] ?? null;
        
        if ($networkId) {
            $stmt = $db->prepare("SELECT * FROM devices WHERE network_id = :nid ORDER BY ip_address ASC");
            $stmt->execute(['nid' => $networkId]);
        } else {
            $stmt = $db->query("SELECT * FROM devices ORDER BY last_seen DESC");
        }
        
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    // 6. POST /Tools.php?action=calculate_subnet (Mode calculatrice pure sans DB)
    elseif ($method === 'POST' && $action === 'calculate_subnet') {
        $data = json_decode(file_get_contents("php://input"), true);
        $ip = $data['ip_address'] ?? null;
        $cidr = isset($data['cidr']) ? (int)$data['cidr'] : null;
        
        if (!$ip || filter_var($ip, FILTER_VALIDATE_IP) === false) throw new Exception("Adresse IP invalide");
        if ($cidr === null || $cidr < 0 || $cidr > 32) throw new Exception("CIDR invalide");
        
        $details = calculateNetworkDetails($ip, $cidr);
        echo json_encode(["status" => "success", "data" => $details]);
    }
    
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Action non reconnue. Paramètre 'action' attendu."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
