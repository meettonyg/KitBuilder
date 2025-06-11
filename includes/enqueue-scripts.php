<?php
/**
 * Script and Style Enqueuing
 *
 * @package MediaKitBuilder
 */

defined('ABSPATH') || exit;

/**
 * Register and enqueue all scripts and styles for the Media Kit Builder
 */
function mkb_enqueue_builder_assets() {
    // Only load on builder page
    if (!is_admin() || !isset($_GET['page']) || $_GET['page'] !== 'media-kit-builder') {
        return;
    }

    // Plugin URL
    $plugin_url = plugin_dir_url(dirname(__FILE__));
    $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';
    
    // STYLES
    // Admin styles
    wp_enqueue_style('mkb-admin', $plugin_url . 'assets/css/admin.css', [], $version);
    
    // Builder styles
    wp_enqueue_style('mkb-builder', $plugin_url . 'assets/css/builder-v2.css', [], $version);
    
    // Template styles
    wp_enqueue_style('mkb-templates', $plugin_url . 'assets/css/templates.css', [], $version);
    
    // SCRIPTS
    // Deregister WordPress React to prevent conflicts
    wp_deregister_script('react');
    wp_deregister_script('react-dom');
    
    // Enqueue React (production version)
    wp_enqueue_script('mkb-react', 'https://unpkg.com/react@18/umd/react.production.min.js', [], '18.2.0', true);
    wp_enqueue_script('mkb-react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', ['mkb-react'], '18.2.0', true);
    
    // Core libraries
    wp_enqueue_script('mkb-html2pdf', $plugin_url . 'assets/js/libs/html2pdf.bundle.min.js', [], '0.10.1', true);
    
    // Debug script - load early for better diagnostics
    if (defined('WP_DEBUG') && WP_DEBUG) {
        wp_enqueue_script('mkb-debug', $plugin_url . 'assets/js/mkb-debug.js', ['jquery'], $version, true);
    }
    
    // Fixed AJAX functions - load before builder
    wp_enqueue_script('mkb-ajax-functions', $plugin_url . 'assets/js/ajax-functions.js', ['jquery'], $version, true);
    
    // Builder core scripts with proper dependencies
    wp_enqueue_script('mkb-premium-access', $plugin_url . 'assets/js/premium-access-control.js', ['jquery'], $version, true);
    wp_enqueue_script('mkb-section-templates', $plugin_url . 'assets/js/section-templates.js', ['jquery'], $version, true);
    wp_enqueue_script('mkb-builder', $plugin_url . 'assets/js/builder-wordpress.js', [
        'jquery', 
        'mkb-premium-access', 
        'mkb-section-templates', 
        'mkb-html2pdf',
        'mkb-ajax-functions'
    ], $version, true);
    
    // Localize script data - centralized data bridge between PHP and JS
    $builder_data = [
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('media_kit_builder_nonce'),
        'plugin_url' => $plugin_url,
        'user_id' => get_current_user_id(),
        'access_tier' => mkb_get_user_access_tier(),
        'is_admin' => current_user_can('manage_options'),
        'templates_endpoint' => rest_url('media-kit/v1/templates'),
        'rest_nonce' => wp_create_nonce('wp_rest'),
        'version' => $version,
        'debug_mode' => defined('WP_DEBUG') && WP_DEBUG
    ];
    
    wp_localize_script('mkb-builder', 'MediaKitBuilderData', $builder_data);
}
add_action('admin_enqueue_scripts', 'mkb_enqueue_builder_assets');

/**
 * Get user access tier
 * 
 * @return string User access tier (guest, free, pro, agency, admin)
 */
function mkb_get_user_access_tier() {
    $user_id = get_current_user_id();
    
    if (!$user_id) {
        return 'guest';
    }
    
    if (current_user_can('manage_options')) {
        return 'admin';
    }
    
    // Check WP Fusion tags if available
    if (function_exists('wp_fusion')) {
        $user_tags = wp_fusion()->user->get_tags($user_id);
        
        if (is_array($user_tags)) {
            // Check for agency tag
            if (in_array(12345, $user_tags)) { // Replace with actual Agency tag ID
                return 'agency';
            }
            
            // Check for pro tag
            if (in_array(67890, $user_tags)) { // Replace with actual Pro tag ID
                return 'pro';
            }
        }
    }
    
    return 'free';
}