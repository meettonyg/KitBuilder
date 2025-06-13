<?php
/**
 * Direct AJAX Handler for Media Kit Builder
 * 
 * This file handles AJAX requests directly, bypassing WordPress's admin-ajax.php.
 * It should be accessed at /wp-content/plugins/media-kit-builder/direct-handler.php
 */

// Bootstrap WordPress
require_once(dirname(dirname(dirname(__FILE__))) . '/wp-load.php');

// Set header
header('Content-Type: application/json');

// Get the action from the request
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

// Log the request for debugging
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('DIRECT HANDLER REQUEST: ' . print_r($_REQUEST, true));
}

// Handle test connection
if ($action === 'mkb_test_connection') {
    echo json_encode(array(
        'success' => true,
        'data' => array(
            'message' => 'Connection test successful (direct handler)',
            'timestamp' => gmdate('c'),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'plugin_version' => defined('MKB_VERSION') ? MKB_VERSION : 'unknown',
            'plugin_status' => 'active',
            'api_status' => 'available'
        )
    ));
    exit;
}

// Handle other actions
// ...

// Default response for unknown action
echo json_encode(array(
    'success' => false,
    'error' => 'Unknown action',
    'action' => $action
));
exit;
