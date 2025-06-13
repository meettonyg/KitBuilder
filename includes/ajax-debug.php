<?php
/**
 * Media Kit Builder - AJAX Debug Helper
 * 
 * This file creates a log file to track AJAX requests.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register AJAX debug hooks
 */
function mkb_register_ajax_debug() {
    add_action('admin_init', 'mkb_setup_ajax_debug');
}
add_action('init', 'mkb_register_ajax_debug');

/**
 * Set up AJAX debug hooks
 */
function mkb_setup_ajax_debug() {
    if (!defined('DOING_AJAX') || !DOING_AJAX) {
        return;
    }
    
    // Log all AJAX requests
    mkb_log_ajax_request();
    
    // Add shutdown function to log AJAX response
    add_action('shutdown', 'mkb_log_ajax_response');
}

/**
 * Log AJAX request
 */
function mkb_log_ajax_request() {
    $log_dir = MKB_PLUGIN_DIR . 'logs';
    
    // Create logs directory if it doesn't exist
    if (!file_exists($log_dir)) {
        wp_mkdir_p($log_dir);
    }
    
    // Create log file
    $log_file = $log_dir . '/ajax-debug.log';
    
    // Build log entry
    $log_entry = date('[Y-m-d H:i:s]') . ' AJAX Request: ' . $_REQUEST['action'] . "\n";
    $log_entry .= 'Request Data: ' . print_r($_REQUEST, true) . "\n";
    $log_entry .= 'Server Data: ' . print_r($_SERVER, true) . "\n";
    $log_entry .= "---------------------------------------------------\n";
    
    // Write to log file
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

/**
 * Log AJAX response
 */
function mkb_log_ajax_response() {
    $log_dir = MKB_PLUGIN_DIR . 'logs';
    $log_file = $log_dir . '/ajax-debug.log';
    
    // Get response headers
    $headers = headers_list();
    
    // Build log entry
    $log_entry = date('[Y-m-d H:i:s]') . ' AJAX Response Headers: ' . "\n";
    $log_entry .= print_r($headers, true) . "\n";
    $log_entry .= "===================================================\n\n";
    
    // Write to log file
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}
