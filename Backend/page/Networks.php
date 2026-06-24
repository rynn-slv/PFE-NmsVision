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

$user     = requireAuth();
$owner_id = $user['owner_id'];


try {
    $db = Database::get();

    $db = Database::get();

    switch($method) {
        case 'GET':
            $stmt = $db->prepare("
                SELECT n.*, COUNT(e.equipment_id) as device_count 
                FROM networks n
                LEFT JOIN equipment e ON n.network_id = e.network_id
                WHERE n.owner_id = :owner_id
                GROUP BY n.network_id
                ORDER BY n.created_at DESC
            ");
            $stmt->execute(['owner_id' => $owner_id]);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            requireAdmin($user); // Only admins can create networks
            $data = json_decode(file_get_contents("php://input"), true);
            $name   = trim($data['network_name'] ?? '');
            $subnet = trim($data['subnet_ipv4']  ?? '');
            $desc   = trim($data['description']  ?? '');

            if (empty($name)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Network name is required"]);
                break;
            }

            $stmt = $db->prepare("INSERT INTO networks (network_name, subnet_ipv4, description, owner_id) VALUES (:name, :subnet, :desc, :owner_id)");
            $stmt->execute(['name' => $name, 'subnet' => $subnet, 'desc' => $desc, 'owner_id' => $owner_id]);
            
            echo json_encode([
                "status"     => "success", 
                "message"    => "Network created", 
                "network_id" => $db->lastInsertId()
            ]);
            break;

        case 'DELETE':
            requireAdmin($user); // Only admins can delete networks
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Network ID required"]);
                break;
            }

            $db->beginTransaction();
            try {
                // 1. Delete alerts associated with devices in this network
                $stmt = $db->prepare("DELETE FROM alerts WHERE equipment_id IN (SELECT equipment_id FROM equipment WHERE network_id = :id AND owner_id = :owner_id)");
                $stmt->execute(['id' => $id, 'owner_id' => $owner_id]);

                // 2. Delete devices in this network
                $stmt = $db->prepare("DELETE FROM equipment WHERE network_id = :id AND owner_id = :owner_id");
                $stmt->execute(['id' => $id, 'owner_id' => $owner_id]);

                // 3. Delete the network
                $stmt = $db->prepare("DELETE FROM networks WHERE network_id = :id AND owner_id = :owner_id");
                $stmt->execute(['id' => $id, 'owner_id' => $owner_id]);

                $db->commit();
                echo json_encode(["status" => "success", "message" => "Network and all associated devices deleted"]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
