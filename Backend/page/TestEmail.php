<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';
require_once '../config/NotificationUtil.php';

try {
    $user = requireAuth();
    $owner_id = $user['owner_id'];
    
    $db = Database::get();
    
    // Get user email
    $stmt = $db->prepare("SELECT email, fullname FROM users WHERE id = :id");
    $stmt->execute(['id' => $user['user_id']]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData || empty($userData['email'])) {
        throw new Exception("No email found for your account.");
    }

    $email = $userData['email'];
    $success = NotificationUtil::sendOfflineAlert($email, "TEST_DEVICE", "192.168.1.100");

    if ($success) {
        echo json_encode(["status" => "success", "message" => "Test email alert sent to $email. Please check your inbox (and spam folder)."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to send email. Check error logs."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
