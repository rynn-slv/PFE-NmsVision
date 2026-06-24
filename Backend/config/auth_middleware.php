<?php
date_default_timezone_set('Africa/Algiers');

/**
 * Auth Middleware — NmsVision RBAC
 * 
 * Call requireAuth() at the top of any protected endpoint.
 * Returns an array: ['user_id', 'role', 'owner_id', 'name']
 * 
 * owner_id logic:
 *   - Admin   → owner_id = their own id
 *   - Operator → owner_id = their admin's id
 * 
 * This means ALL data queries use owner_id, and both admin
 * and operator see the exact same data set.
 */

function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 86400,
            'path'     => '/',
            'domain'   => 'localhost',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

/**
 * Verifies that the current request has a valid session.
 * Exits with 401 JSON if not authenticated.
 * 
 * @return array ['user_id', 'role', 'owner_id', 'name']
 */
function requireAuth(): array {
    startSecureSession();

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
        exit;
    }

    return [
        'user_id'  => (int) $_SESSION['user_id'],
        'role'     => $_SESSION['role'],
        'owner_id' => (int) $_SESSION['owner_id'],  // ← key field for data isolation
        'name'     => $_SESSION['user_name'] ?? ''
    ];
}

/**
 * Verifies that the current user is an admin.
 * Exits with 403 JSON if not.
 * 
 * @param array $user result from requireAuth()
 */
function requireAdmin(array $user): void {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied. Admins only.']);
        exit;
    }
}
