<?php
/**
 * Media Kit Builder - Debugging Helper
 * 
 * Provides debugging functions for the plugin.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Write to debug log
 * 
 * @param mixed $data Data to log
 * @param string $prefix Log prefix
 */
function mkb_debug_log($data, $prefix = 'MKB Debug') {
    if (!defined('WP_DEBUG') || !WP_DEBUG) {
        return;
    }
    
    if (is_array($data) || is_object($data)) {
        error_log($prefix . ': ' . print_r($data, true));
    } else {
        error_log($prefix . ': ' . $data);
    }
}

/**
 * Add debug info to page
 * 
 * @param string $info Debug info
 */
function mkb_debug_info($info) {
    if (!defined('WP_DEBUG') || !WP_DEBUG || !is_admin()) {
        return;
    }
    
    echo '<!-- MKB Debug: ' . esc_html($info) . ' -->';
}

/**
 * Register AJAX debugging endpoint
 */
function mkb_register_debug_endpoint() {
    add_action('wp_ajax_mkb_debug_info', 'mkb_ajax_debug_info');
    add_action('wp_ajax_nopriv_mkb_debug_info', 'mkb_ajax_debug_info');
}
add_action('init', 'mkb_register_debug_endpoint');

/**
 * AJAX debug info handler
 */
function mkb_ajax_debug_info() {
    // Don't check nonce for debug info
    
    // Get plugin info
    $plugin_data = array(
        'version' => MKB_VERSION,
        'systems' => array_keys(media_kit_builder()->systems ?? array()),
        'api_controller' => media_kit_builder()->get_api_controller() ? 'loaded' : 'not loaded',
        'php_version' => phpversion(),
        'wordpress_version' => get_bloginfo('version'),
        'server_info' => $_SERVER['SERVER_SOFTWARE'],
        'ajax_url' => admin_url('admin-ajax.php'),
        'rest_url' => rest_url('media-kit/v2'),
    );
    
    // Get active hooks
    global $wp_filter;
    $ajax_hooks = array();
    
    foreach ($wp_filter as $hook => $callbacks) {
        if (strpos($hook, 'wp_ajax_mkb_') === 0) {
            $ajax_hooks[] = $hook;
        }
    }
    
    $plugin_data['ajax_hooks'] = $ajax_hooks;
    
    wp_send_json_success($plugin_data);
}
