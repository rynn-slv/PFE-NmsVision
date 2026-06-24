<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/dbconn.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$code  = trim($data['code'] ?? '');

if (!$email || !$code) {
    echo json_encode(['success' => false, 'message' => 'Email and code are required.']);
    exit();
}

try {
    $conn = Database::get();
    
    // Check if code exists and is not expired
    $stmt = $conn->prepare("SELECT * FROM password_resets WHERE email = :email AND code = :code AND expires_at >= NOW() LIMIT 1");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':code', $code);
    $stmt->execute();
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired verification code.']);
        exit();
    }

    // Success! Don't delete yet—let the final password update handle the deletion.
    echo json_encode([
        'success' => true,
        'message' => 'Code verified successfully.'
    ]);

} catch (\Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}
