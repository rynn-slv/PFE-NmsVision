<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/dbconn.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

try {
    $db = Database::get();
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) throw new Exception("No data received");

    $query = "INSERT INTO speed_test_history (download_speed, upload_speed, ping, server_name, server_ip) 
              VALUES (:down, :up, :ping, :server, :ip)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        'down'   => $data['download'],
        'up'     => $data['upload'],
        'ping'   => $data['ping'],
        'server' => $data['server_name'] ?? 'Local Network',
        'ip'     => $data['server_ip'] ?? '192.168.1.1'
    ]);

    echo json_encode(["status" => "success", "message" => "Result saved to MySQL"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e.getMessage()]);
}
?>
