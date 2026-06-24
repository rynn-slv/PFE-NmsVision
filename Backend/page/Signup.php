<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/dbconn.php';

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

$fullname = trim($data['fullName'] ?? '');
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

// Public registration ALWAYS creates Admin accounts.
// Operators are provisioned by Admins from the Manage Operators page.
$role     = 'admin';
$admin_id = null;

if (!$fullname || !$email || !$password) {
    echo json_encode(['success' => false, 'error' => 'All mandatory fields must be filled.']);
    exit();
}

try {
    $conn = Database::get();

    // 1. Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'This email is already registered.']);
        exit();
    }

    // 2. Hash the password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // 3. Insert as Admin (admin_id = NULL)
    $stmt   = $conn->prepare("INSERT INTO users (fullname, email, password, role, admin_id) VALUES (?, ?, ?, ?, ?)");
    $success = $stmt->execute([$fullname, $email, $hashedPassword, $role, $admin_id]);

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Account created successfully.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Could not create account. Please try again.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
