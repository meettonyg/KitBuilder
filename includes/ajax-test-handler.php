<?php
/**
 * Media Kit Builder - Test Ajax Handler
 * 
 * This is a standalone file that can be included to test AJAX functionality.
 * It implements exactly what the frontend is expecting for the test connection.
 */

// Direct access check
if (!defined('ABSPATH')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

/**
 * Register standalone test endpoint
 */
function mkb_register_standalone_test() {
    add_action('wp_ajax_mkb_test_connection', 'mkb_standalone_test_handler');
    add_action('wp_ajax_nopriv_mkb_test_connection', 'mkb_standalone_test_handler');
}
add_action('init', 'mkb_register_standalone_test');

/**
 * Handle test connection AJAX request
 */
function mkb_standalone_test_handler() {
    // Log all incoming data for debugging
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('STANDALONE TEST REQUEST: ' . print_r($_REQUEST, true));
        
        // Check for specific expected parameters
        $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'unknown';
        $nonce = isset($_REQUEST['nonce']) ? $_REQUEST['nonce'] : 'missing';
        
        error_log("TEST ACTION: $action, NONCE STATUS: " . ($nonce === 'missing' ? 'missing' : 'present'));
    }
    
    // Skip nonce verification entirely for this test
    header('Content-Type: application/json');
    
    // Structure response exactly as the frontend expects
    $response = array(
        'success' => true,
        'data' => array(
            'message' => 'Connection test successful (standalone)',
            'timestamp' => gmdate('c'),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'plugin_version' => defined('MKB_VERSION') ? MKB_VERSION : 'unknown',
            'plugin_status' => 'active',
            'api_status' => 'available',
            'debug_info' => array(
                'request_method' => $_SERVER['REQUEST_METHOD'],
                'content_type' => isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'unknown',
                'referer' => isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'unknown'
            )
        )
    );
    
    echo json_encode($response);
    wp_die();
}

// Test log entry to confirm this file is loaded
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('STANDALONE TEST HANDLER LOADED');
}
