<?php
// Set JSON header
header("Content-Type: application/json");

// Return success response
echo json_encode([
    "success" => true,
    "message" => "Connection successful (direct endpoint)",
    "timestamp" => date("c"),
    "plugin_status" => "active"
]);
exit;