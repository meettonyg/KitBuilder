<?php
// Direct AJAX Handler - No WordPress dependencies
// This file is completely independent and doesn't require WordPress to function

// Turn off all error reporting
error_reporting(0);
ini_set('display_errors', 0);

// Set content type
header('Content-Type: application/json');

// Get action
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

// Handle test connection
if ($action === 'mkb_test_connection') {
    echo json_encode([
        'success' => true,
        'data' => [
            'message' => 'Connection successful (standalone)',
            'timestamp' => date('c'),
            'plugin_status' => 'active',
            'test_type' => 'direct'
        ]
    ]);
    exit;
}

// Default response
echo json_encode([
    'success' => false,
    'error' => 'Unknown action',
    'action' => $action
]);
exit;
