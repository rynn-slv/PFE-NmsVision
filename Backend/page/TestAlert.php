<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/dbconn.php';

try {
    $db = Database::get();
    
    // Find a valid equipment_id to use for the test alert
    $eqStmt = $db->query("SELECT equipment_id, name FROM equipment LIMIT 1");
    $eq = $eqStmt->fetch();
    
    if (!$eq) {
        echo json_encode(["status" => "error", "message" => "No equipment found. Please add a device first."]);
        exit;
    }

    $eid = $eq['equipment_id'];
    $name = $eq['name'];
    
    // Insert a Manual Test Warning
    $stmt = $db->prepare("INSERT INTO alerts (equipment_id, severity, source, message) VALUES (?, 'Warning', 'SYSTEM', ?)");
    $stmt->execute([$eid, "TEST ALERT: High latency detected on $name (Manual Trigger)"]);
    
    // Insert a Manual Test Critical
    $stmt = $db->prepare("INSERT INTO alerts (equipment_id, severity, source, message) VALUES (?, 'Critical', 'SYSTEM', ?)");
    $stmt->execute([$eid, "TEST ALERT: $name is OFFLINE (Manual Trigger)"]);

    // 🧹 Clean up old alerts, keeping only the last 10
    $db->exec("
        DELETE FROM alerts 
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id FROM alerts 
                ORDER BY created_at DESC, id DESC 
                LIMIT 10
            ) tmp
        )
    ");

    echo json_encode([
        "status" => "success", 
        "message" => "Test alerts generated successfully for device: $name",
        "next_steps" => "Go back to the Dashboard and wait up to 10 seconds for the alerts to appear in the 'Live Network Alerts' panel."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
