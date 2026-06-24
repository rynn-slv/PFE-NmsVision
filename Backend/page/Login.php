<?php
ob_start();

require_once __DIR__ . '/../config/auth_middleware.php'; // provides startSecureSession()

startSecureSession();

// CORS Headers - Adapted for Vite dev server (usually 5173) and credential sharing
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Handle logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['logout'])) {
    startSecureSession();
    $_SESSION = [];
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out.']);
    exit();
}

require_once __DIR__ . '/../config/dbconn.php';

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and Password are required.']);
    exit();
}

try {
    $conn = Database::get();
    
    // Fetch user including admin_id (NULL for admins, set for operators)
    $stmt = $conn->prepare("SELECT id, fullname, password, role, admin_id, is_active, avatar FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        // Check if account is active
        if (!$user['is_active']) {
            echo json_encode(['success' => false, 'message' => 'Account is deactivated.']);
            exit();
        }

        // owner_id is the KEY for data isolation:
        // - Admin   → points to themselves (sees their own data)
        // - Operator → points to their admin (sees admin's data)
        $owner_id = ($user['role'] === 'admin') ? $user['id'] : $user['admin_id'];

        session_regenerate_id(true);
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['fullname'];
        $_SESSION['role']      = $user['role'];
        $_SESSION['owner_id']  = $owner_id;

        session_write_close();

        echo json_encode([
            'success'  => true,
            'role'     => $user['role'],
            'name'     => $user['fullname'],
            'owner_id' => $owner_id,
            'avatar'   => $user['avatar'],
            'message'  => 'Login successful.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

ob_end_flush();
?>
