<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$user     = requireAuth();
$owner_id = $user['owner_id'];

try {
    $db = Database::get();
    
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

    // Fetch 10 most recent alerts scoped to this admin's devices
    $stmt = $db->prepare("
        SELECT a.*, e.name as equipment_name, e.ip_address 
        FROM alerts a 
        LEFT JOIN equipment e ON a.equipment_id = e.equipment_id 
        WHERE e.owner_id = :owner_id
        ORDER BY a.created_at DESC 
        LIMIT 10
    ");
    $stmt->execute(['owner_id' => $owner_id]);
    
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "data" => $alerts]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
