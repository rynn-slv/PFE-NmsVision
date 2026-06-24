<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';
require_once '../config/auth_middleware.php';

$method   = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$user = requireAuth();
requireAdmin($user); // Only admins can manage operators
$admin_id = $user['user_id']; // Operators are linked to this admin's actual id

try {
    $db = Database::get();

    // GET — List all operators belonging to this admin
    if ($method === 'GET') {
        $stmt = $db->prepare("
            SELECT id, fullname, email, created_at
            FROM users
            WHERE role = 'operator' AND admin_id = :admin_id
            ORDER BY created_at DESC
        ");
        $stmt->execute(['admin_id' => $admin_id]);
        $operators = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $operators]);
    }

    // POST — Create a new operator linked to this admin
    elseif ($method === 'POST') {
        $data     = json_decode(file_get_contents("php://input"), true);
        $fullname = trim($data['fullname'] ?? '');
        $email    = trim($data['email']    ?? '');
        $password = $data['password']      ?? '';

        if (!$fullname || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required.']);
            exit;
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
            exit;
        }

        // Check for duplicate email
        $checkStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO users (fullname, email, password, role, admin_id)
            VALUES (?, ?, ?, 'operator', ?)
        ");
        $stmt->execute([$fullname, $email, $hashedPassword, $admin_id]);

        echo json_encode([
            'success'  => true,
            'message'  => 'Operator created successfully.',
            'id'       => $db->lastInsertId()
        ]);
    }

    // DELETE — Remove an operator (must belong to this admin)
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Operator ID required.']);
            exit;
        }

        // Safety check: only delete if operator belongs to this admin
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id AND admin_id = :admin_id AND role = 'operator'");
        $stmt->execute(['id' => $id, 'admin_id' => $admin_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Operator removed.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Operator not found or unauthorized.']);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
