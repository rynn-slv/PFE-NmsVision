<?php
require_once __DIR__ . '/../config/dbconn.php';

try {
    $db = Database::get();
    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'avatar'");
    $exists = $stmt->fetch();
    if (!$exists) {
        $db->exec("ALTER TABLE users ADD COLUMN avatar LONGTEXT DEFAULT NULL");
        echo "Column 'avatar' added successfully.\n";
    } else {
        echo "Column 'avatar' already exists.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
