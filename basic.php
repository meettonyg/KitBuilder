<?php
// Turn off all error reporting for this file
error_reporting(0);
ini_set('display_errors', 0);

// Set proper JSON content type
header('Content-Type: application/json');

// Output a basic JSON response
echo json_encode([
    'success' => true,
    'data' => [
        'message' => 'Direct handler working',
        'timestamp' => date('c'),
        'test' => true
    ]
]);
exit;
