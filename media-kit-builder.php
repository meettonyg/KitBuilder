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

/**
 * Inject JavaScript to replace the AJAX endpoint
 */
function mkb_inject_ajax_replacer() {
    // Only on frontend pages with the shortcode
    if (!is_admin() && is_page() && has_shortcode(get_the_content(), 'media_kit_builder')) {
        ?>
        <script type="text/javascript">
            // Execute this script as early as possible
            (function() {
                // Store the original fetch function
                var originalFetch = window.fetch;
                
                // Replace fetch with our modified version
                window.fetch = function() {
                    var url = arguments[0];
                    var options = arguments[1] || {};
                    
                    // Check if this is an AJAX request for our plugin's test connection
                    if (typeof url === 'string' && 
                        url.includes('admin-ajax.php') && 
                        options && options.body && 
                        options.body.includes('action=mkb_test_connection')) {
                        
                        // Replace the URL with our direct handler
                        arguments[0] = '<?php echo MKB_PLUGIN_URL; ?>direct-ajax.php?action=mkb_test_connection';
                        
                        // Make it a GET request with no body for simplicity
                        options.method = 'GET';
                        delete options.body;
                        arguments[1] = options;
                        
                        console.log('Media Kit Builder: Intercepted test connection request', arguments);
                    }
                    
                    // Call the original fetch with our modified arguments
                    return originalFetch.apply(this, arguments);
                };
                
                // Also replace jQuery's AJAX if it exists
                if (window.jQuery) {
                    var originalAjax = jQuery.ajax;
                    
                    jQuery.ajax = function() {
                        var settings = arguments[0];
                        
                        // Check if this is a test connection request
                        if (settings && 
                            settings.url && 
                            settings.url.includes('admin-ajax.php') && 
                            settings.data && 
                            settings.data.includes('action=mkb_test_connection')) {
                            
                            // Replace with our direct handler
                            settings.url = '<?php echo MKB_PLUGIN_URL; ?>direct-ajax.php';
                            settings.type = 'GET';
                            settings.data = { action: 'mkb_test_connection' };
                            
                            console.log('Media Kit Builder: Intercepted jQuery test connection request', settings);
                        }
                        
                        // Call the original with our modified settings
                        return originalAjax.apply(this, arguments);
                    };
                }
                
                // When the DOM is ready, we'll add some global variables
                document.addEventListener('DOMContentLoaded', function() {
                    // Add our direct URL to the global config
                    if (window.mkbData) {
                        window.mkbData.directUrl = '<?php echo MKB_PLUGIN_URL; ?>direct-ajax.php';
                        window.mkbData.basicUrl = '<?php echo MKB_PLUGIN_URL; ?>basic.php';
                        
                        console.log('Media Kit Builder: Added direct handler URLs to global config');
                    }
                    
                    // Create a test function
                    window.testMkbDirectConnection = function() {
                        fetch('<?php echo MKB_PLUGIN_URL; ?>direct-ajax.php?action=mkb_test_connection')
                            .then(function(response) { return response.json(); })
                            .then(function(data) {
                                console.log('Media Kit Builder: Direct connection test successful', data);
                            })
                            .catch(function(error) {
                                console.error('Media Kit Builder: Direct connection test failed', error);
                            });
                    };
                    
                    // Run the test after a short delay
                    setTimeout(window.testMkbDirectConnection, 1000);
                });
            })();
        </script>
        <?php
    }
}
add_action('wp_head', 'mkb_inject_ajax_replacer', 1); // Priority 1 to load as early as possible

/**
 * Standard AJAX handler for WordPress
 */
function mkb_register_ajax_handlers() {
    add_action('wp_ajax_mkb_test_connection', 'mkb_test_connection_handler');
    add_action('wp_ajax_nopriv_mkb_test_connection', 'mkb_test_connection_handler');
}
add_action('init', 'mkb_register_ajax_handlers');

/**
 * Handle test connection AJAX requests
 */
function mkb_test_connection_handler() {
    // Skip nonce verification for this test endpoint
    
    // Send the response
    wp_send_json_success(array(
        'message' => 'Connection successful (wp_ajax)',
        'timestamp' => date('c'),
        'plugin_status' => 'active',
        'test_type' => 'wp_ajax'
    ));
}
