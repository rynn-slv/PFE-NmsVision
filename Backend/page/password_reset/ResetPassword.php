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
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit();
}

try {
    $conn = Database::get();
    // Force PDO to throw exceptions for better error catching
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $conn->beginTransaction();

    // 1. Final Security Check: Is there a valid code entry?
    $check = $conn->prepare("SELECT email FROM password_resets WHERE email = ? AND expires_at >= NOW() LIMIT 1");
    $check->execute([$email]);
    
    if (!$check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Reset session expired or invalid. Please request a new code.']);
        exit();
    }

    // 2. Securely hash the password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // 3. Update the password in the main users table
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);

    // 4. Cleanup: Delete the used reset entry
    $del = $conn->prepare("DELETE FROM password_resets WHERE email = ?");
    $del->execute([$email]);

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Password has been reset successfully.'
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}
