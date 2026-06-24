<?php
// --- UNIFIED CORS HANDLING ---
// Use the dynamic origin if possible, or match the frontend URL
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$simulate = $_GET['simulate'] ?? '';

// Simulation: If simulating an external node (e.g. Algeria Telecom), add a small random delay
if ($simulate === 'external') {
    usleep(rand(30000, 60000)); // 30ms - 60ms simulated network latency
}

try {
    $db = Database::get();

    // Auth Check
    $user = requireAuth();
    $admin_id = $user['owner_id']; // This is the ID of the admin who owns the data

    // --- SELF-HEALING DATABASE BLOCK ---
    // Ensure the table exists so we don't get 500 errors
    $db->exec("CREATE TABLE IF NOT EXISTS speed_test_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        download_speed FLOAT NOT NULL,
        upload_speed FLOAT NOT NULL,
        ping INT NOT NULL,
        server_name VARCHAR(100) DEFAULT 'Unknown',
        server_ip VARCHAR(45) DEFAULT '0.0.0.0'
    )");

    // Migration: Add admin_id column if it doesn't exist (for existing tables)
    try {
        $db->query("SELECT admin_id FROM speed_test_history LIMIT 1");
    } catch (Exception $e) {
        $db->exec("ALTER TABLE speed_test_history ADD COLUMN admin_id INT NOT NULL AFTER id");
    }

    // 0. Ping Check Endpoint
    // If target is provided, pings that IP. Otherwise pings the server itself.
    if ($action === 'ping_check' || $action === 'ping_target') {
        $target = $_GET['target'] ?? '127.0.0.1';
        
        // Basic security: only allow IPs or localhost
        if (!filter_var($target, FILTER_VALIDATE_IP) && $target !== 'localhost') {
            echo json_encode(["status" => "error", "message" => "Invalid target"]);
            exit;
        }

        $latency = 0;
        $start = microtime(true);

        // Try ICMP ping if exec is allowed (Windows style for user's environment)
        $output = [];
        $result = -1;
        // -n 1: 1 packet, -w 1000: 1000ms timeout
        exec("ping -n 1 -w 1000 " . escapeshellarg($target), $output, $result);

        if ($result === 0) {
            // Parse latency from output (Windows: "time=XXms" or "time<1ms")
            foreach ($output as $line) {
                if (preg_match('/time[=<](\d+)ms/', $line, $matches)) {
                    $latency = (int)$matches[1];
                    break;
                }
            }
            if ($latency === 0) {
                $latency = round((microtime(true) - $start) * 1000);
            }
        } else {
            $fp = @fsockopen($target, 80, $errno, $errstr, 1);
            if ($fp) {
                $latency = round((microtime(true) - $start) * 1000);
                fclose($fp);
            } else {
                echo json_encode(["status" => "error", "message" => "Target unreachable"]);
                exit;
            }
        }

        echo json_encode([
            "status" => "success",
            "latency" => $latency,
            "target" => $target
        ]);
        exit;
    }

    // 1. Local Download Endpoint (Sends dummy data)
    elseif ($method === 'GET' && $action === 'download') {
        $mb = isset($_GET['size']) ? (int) $_GET['size'] : 5;
        if ($mb > 50)
            $mb = 50; // Max 50MB for security

        $size = $mb * 1024 * 1024;
        header('Content-Type: application/octet-stream');
        header('Content-Length: ' . $size);
        header('Cache-Control: no-store, no-cache, must-revalidate');

        // Output zero bytes efficiently
        $chunkSize = 8192;
        $chunk = str_repeat("\0", $chunkSize);
        $chunksNeeded = ceil($size / $chunkSize);

        for ($i = 0; $i < $chunksNeeded; $i++) {
            echo $chunk;
            if (connection_aborted())
                break;
        }
        exit;
    }

    // 2. Local Upload Endpoint (Receives and discards data)
    elseif ($method === 'POST' && $action === 'upload') {
        set_time_limit(120); // Longer timeout for high-speed fiber testing

        $input = fopen("php://input", "r");
        if ($input) {
            // Read and discard in chunks to avoid memory limits
            while (!feof($input)) {
                fread($input, 1024 * 512); // 512KB chunks
            }
            fclose($input);
        }
        echo json_encode(["status" => "success", "message" => "Burst received"]);
        exit;
    }

    // 3. Save History Endpoint
    elseif ($method === 'POST' && $action === 'save_history') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['download']) || !isset($data['upload']) || !isset($data['ping'])) {
            throw new Exception("Missing speed test data");
        }

        $stmt = $db->prepare("INSERT INTO speed_test_history (admin_id, download_speed, upload_speed, ping, server_name, server_ip) VALUES (:admin_id, :down, :up, :ping, :name, :ip)");
        $stmt->execute([
            'admin_id' => $admin_id,
            'down' => $data['download'],
            'up' => $data['upload'],
            'ping' => $data['ping'],
            'name' => $data['server_name'] ?? 'Unknown',
            'ip' => $data['server_ip'] ?? '0.0.0.0'
        ]);

        // Keep only the last 10 tests FOR THIS ADMIN
        $stmt = $db->prepare("
            DELETE FROM speed_test_history 
            WHERE admin_id = :aid1 AND id NOT IN (
                SELECT id FROM (
                    SELECT id FROM speed_test_history 
                    WHERE admin_id = :aid2
                    ORDER BY test_date DESC, id DESC 
                    LIMIT 10
                ) tmp
            )
        ");
        $stmt->execute(['aid1' => $admin_id, 'aid2' => $admin_id]);

        echo json_encode(["status" => "success", "message" => "History saved and old tests removed"]);
    }

    // 4. Get History Endpoint
    elseif ($method === 'GET' && $action === 'get_history') {
        $stmt = $db->prepare("SELECT * FROM speed_test_history WHERE admin_id = :admin_id ORDER BY test_date DESC LIMIT 10");
        $stmt->execute(['admin_id' => $admin_id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // 5. Get 24h History for Dashboard
    elseif ($method === 'GET' && $action === 'get_dashboard_history') {
        $stmt = $db->prepare("SELECT *, DATE_FORMAT(test_date, '%H:%00') as hour_label FROM speed_test_history WHERE admin_id = :admin_id AND test_date >= NOW() - INTERVAL 1 DAY ORDER BY test_date ASC");
        $stmt->execute(['admin_id' => $admin_id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>