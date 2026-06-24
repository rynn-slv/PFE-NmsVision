<?php
require_once __DIR__ . '/../config/auth_middleware.php';
startSecureSession();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = Database::get();

    // -------------------------------------------------------------------------
    // ID de l'utilisateur connecté 
    // -------------------------------------------------------------------------
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        throw new Exception("Non autorisé, veuillez vous connecter.");
    }

    // 1. GET /settings.php?action=get_profile
    if ($method === 'GET' && $action === 'get_profile') {
        $stmt = $db->prepare("SELECT id, fullname as name, email, phone, avatar FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(["status" => "success", "data" => $user]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Utilisateur non trouvé"]);
        }
    }

    // 2. POST /settings.php?action=update_profile
    // Attendu: { "name": "...", "email": "...", "phone": "..." }
    elseif ($method === 'POST' && $action === 'update_profile') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $avatar = $data['avatar'] ?? null;

        if (!$name || !$email) {
            throw new Exception("Le nom complet et l'adresse email sont obligatoires.");
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Adresse email invalide.");
        }

        // Vérifier si l'email existe déjà pour un AUTRE utilisateur
        $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $stmtCheck->execute(['email' => $email, 'id' => $userId]);
        if ($stmtCheck->fetch()) {
            throw new Exception("Cette adresse email est déjà utilisée par un autre compte.");
        }

        $stmt = $db->prepare("UPDATE users SET fullname = :name, email = :email, phone = :phone, avatar = :avatar WHERE id = :id");
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'avatar' => $avatar,
            'id' => $userId
        ]);

        echo json_encode(["status" => "success", "message" => "Profil mis à jour avec succès"]);
    }

    // 3. POST /settings.php?action=update_password
    // Attendu: { "current_password": "...", "new_password": "..." }
    elseif ($method === 'POST' && $action === 'update_password') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (!$currentPassword || !$newPassword) {
            throw new Exception("Le mot de passe actuel et le nouveau mot de passe sont requis.");
        }

        // Récupérer le mot de passe actuel en BDD
        $stmt = $db->prepare("SELECT password FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception("Utilisateur non trouvé");
        }

        // Vérification de l'ancien mot de passe
        // Ici on utilise password_verify. Si vous stockez les mots de passe en clair (ce n'est pas recommandé), 
        // ajoutez une condition `elseif ($user['password'] === $currentPassword)`
        if (!password_verify($currentPassword, $user['password'])) {
            // Fallback temporaire au cas où le mdp en bdd ne serait pas hashé en bcrypt
            if ($user['password'] !== $currentPassword) {
                throw new Exception("Le mot de passe actuel est incorrect.");
            }
        }

        // Hasher le nouveau mot de passe de façon sécurisée
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        // Mettre à jour le mot de passe
        $updateStmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
        $updateStmt->execute([
            'password' => $hashedPassword,
            'id' => $userId
        ]);

        echo json_encode(["status" => "success", "message" => "Mot de passe mis à jour avec succès"]);
    }
    
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Action non supportée ou manquante."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
