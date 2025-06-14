<?php
/**
 * Plugin Name: Media Kit Builder
 * Description: Create professional media kits with a drag-and-drop builder.
 * Version: 1.0.1
 * Author: Guestify
 * Text Domain: media-kit-builder
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MKB_VERSION', '1.0.1');
define('MKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MKB_PLUGIN_URL', plugin_dir_url(__FILE__));

// CRITICAL: Define constants needed by the URL router
define('MEDIA_KIT_BUILDER_FILE', __FILE__);
define('MEDIA_KIT_BUILDER_PATH', plugin_dir_path(__FILE__));
define('MEDIA_KIT_BUILDER_URL', plugin_dir_url(__FILE__));

// Enable debugging
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('Media Kit Builder initializing v' . MKB_VERSION);
}

// CRITICAL: Initialize URL router early - before any other plugin functionality
require_once MKB_PLUGIN_DIR . 'includes/class-url-router.php';
$media_kit_builder_router = new Media_Kit_Builder_URL_Router();

// Include the main plugin class
require_once MKB_PLUGIN_DIR . 'includes/core/class-plugin.php';

/**
 * The main function for returning the Media_Kit_Builder instance.
 *
 * @return MKB_Plugin
 */
function Media_Kit_Builder() {
    return MKB_Plugin::instance();
}

// Initialize the plugin
add_action('plugins_loaded', 'Media_Kit_Builder');

// Register AJAX handlers directly here to ensure they're available
function mkb_register_direct_ajax_handlers() {
    add_action('wp_ajax_mkb_test_connection', 'mkb_direct_test_connection');
    add_action('wp_ajax_nopriv_mkb_test_connection', 'mkb_direct_test_connection');
}
add_action('init', 'mkb_register_direct_ajax_handlers', 5);

function mkb_direct_test_connection() {
    // Send success response without verifying nonce
    wp_send_json_success(array(
        'message' => 'Connection successful',
        'timestamp' => date('c'),
        'plugin_version' => MKB_VERSION,
        'plugin_status' => 'active'
    ));
    exit;
}

// Create symbolic links for standalone mode
function mkb_create_standalone_symlinks() {
    // Only run this in admin and only once per session
    if (!is_admin() || get_transient('mkb_symlinks_created')) {
        return;
    }
    
    // Get WordPress content directories
    $wp_content_dir = WP_CONTENT_DIR;
    $wp_content_url = content_url();
    
    // Create directory if it doesn't exist
    if (!file_exists($wp_content_dir . '/plugins/css')) {
        wp_mkdir_p($wp_content_dir . '/plugins/css');
    }
    
    if (!file_exists($wp_content_dir . '/plugins/js')) {
        wp_mkdir_p($wp_content_dir . '/plugins/js');
    }
    
    // Create symbolic links to our CSS and JS files
    if (file_exists(MKB_PLUGIN_DIR . 'dist/css/media-kit-builder.css')) {
        @copy(
            MKB_PLUGIN_DIR . 'dist/css/media-kit-builder.css',
            $wp_content_dir . '/plugins/css/guestify-builder.css'
        );
        
        @copy(
            MKB_PLUGIN_DIR . 'dist/js/media-kit-builder.js',
            $wp_content_dir . '/plugins/js/guestify-builder.js'
        );
        
        // Set transient to avoid doing this on every page load
        set_transient('mkb_symlinks_created', true, DAY_IN_SECONDS);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Media Kit Builder: Created symlinks for standalone mode');
        }
    }
}
add_action('admin_init', 'mkb_create_standalone_symlinks');

// Add AJAX test points at multiple URLs to ensure compatibility
function mkb_add_test_points() {
    // Create endpoint files in plugin root
    $test_file = MKB_PLUGIN_DIR . 'test-connection.php';
    
    if (!file_exists($test_file)) {
        $content = '<?php
// Set JSON header
header("Content-Type: application/json");

// Return success response
echo json_encode([
    "success" => true,
    "message" => "Connection successful (direct endpoint)",
    "timestamp" => date("c"),
    "plugin_version" => "' . MKB_VERSION . '",
    "plugin_status" => "active"
]);
exit;';
        
        file_put_contents($test_file, $content);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Media Kit Builder: Created test connection file');
        }
    }
}
add_action('admin_init', 'mkb_add_test_points');
