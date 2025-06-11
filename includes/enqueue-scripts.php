<?php
/**
 * Script and Style Enqueuing for Media Kit Builder
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Enqueue all scripts and styles for Media Kit Builder
 */
function mkb_enqueue_scripts() {
    $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';
    
    // Core styles
    wp_enqueue_style('mkb-builder', 
        plugin_dir_url(__FILE__) . '../assets/css/builder.css', 
        array(), 
        $version
    );
    
    // Only load builder-v2.css once, with proper dependencies
    wp_enqueue_style('mkb-builder-v2', 
        plugin_dir_url(__FILE__) . '../assets/css/builder-v2.css', 
        array('mkb-builder'), 
        $version
    );
    
    // Component-specific styles
    wp_enqueue_style('mkb-components', 
        plugin_dir_url(__FILE__) . '../assets/css/components.css', 
        array('mkb-builder', 'mkb-builder-v2'), 
        $version
    );
    
    // WP Media
    wp_enqueue_media();
    
    // Core scripts
    // Builder core first (no dependencies)
    wp_enqueue_script('mkb-core', 
        plugin_dir_url(__FILE__) . '../assets/js/builder.js', 
        array('jquery'), 
        $version, 
        true
    );
    
    // WordPress integration next (depends on core)
    wp_enqueue_script('mkb-wordpress', 
        plugin_dir_url(__FILE__) . '../assets/js/builder-wordpress.js', 
        array('jquery', 'mkb-core'), 
        $version, 
        true
    );
    
    // Premium access control (depends on WordPress integration)
    wp_enqueue_script('mkb-premium-access', 
        plugin_dir_url(__FILE__) . '../assets/js/premium-access-control.js', 
        array('jquery', 'mkb-core', 'mkb-wordpress'), 
        $version, 
        true
    );
    
    // Section templates (depends on premium access)
    wp_enqueue_script('mkb-section-templates', 
        plugin_dir_url(__FILE__) . '../assets/js/section-templates.js', 
        array('jquery', 'mkb-core', 'mkb-wordpress', 'mkb-premium-access'), 
        $version, 
        true
    );
    
    // Components (depends on core)
    wp_enqueue_script('mkb-components', 
        plugin_dir_url(__FILE__) . '../assets/js/components.js', 
        array('jquery', 'mkb-core'), 
        $version, 
        true
    );
    
    // Export functionality (depends on WordPress integration)
    wp_enqueue_script('mkb-export', 
        plugin_dir_url(__FILE__) . '../assets/js/export.js', 
        array('jquery', 'mkb-core', 'mkb-wordpress'), 
        $version, 
        true
    );
    
    // Pass data to JavaScript
    wp_localize_script('mkb-wordpress', 'mkbData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'restUrl' => rest_url('media-kit/v1/'),
        'nonce' => wp_create_nonce('media_kit_builder_nonce'),
        'restNonce' => wp_create_nonce('wp_rest'),
        'userId' => get_current_user_id(),
        'userCapabilities' => mkb_get_user_capabilities(),
        'isAdmin' => current_user_can('manage_options'),
        'accessTier' => mkb_get_user_access_tier(),
        'pluginUrl' => plugin_dir_url(dirname(__FILE__)),
        'assetsUrl' => plugin_dir_url(dirname(__FILE__)) . 'assets/',
        'upgradeUrl' => site_url('/pricing/'),
        'learnMoreUrl' => site_url('/features/'),
        'debugMode' => defined('WP_DEBUG') && WP_DEBUG
    ));
}
add_action('admin_enqueue_scripts', 'mkb_enqueue_scripts');

/**
 * Enqueue scripts for the front-end display
 */
function mkb_enqueue_frontend_scripts() {
    $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';
    
    // Front-end styles
    wp_enqueue_style('mkb-frontend', 
        plugin_dir_url(__FILE__) . '../assets/css/frontend.css', 
        array(), 
        $version
    );
    
    // Preview script (minimal)
    wp_enqueue_script('mkb-preview', 
        plugin_dir_url(__FILE__) . '../assets/js/preview.js', 
        array('jquery'), 
        $version, 
        true
    );
}
add_action('wp_enqueue_scripts', 'mkb_enqueue_frontend_scripts');

/**
 * Get user capabilities for Media Kit Builder
 * 
 * @return array User capabilities
 */
function mkb_get_user_capabilities() {
    $capabilities = array(
        'create' => current_user_can('edit_posts'),
        'edit' => current_user_can('edit_posts'),
        'delete' => current_user_can('delete_posts'),
        'publish' => current_user_can('publish_posts'),
        'admin' => current_user_can('manage_options')
    );
    
    return $capabilities;
}

/**
 * Get user access tier from WP Fusion
 * 
 * @return string User access tier
 */
function mkb_get_user_access_tier() {
    // If user is admin, always return admin tier
    if (current_user_can('manage_options')) {
        return 'admin';
    }
    
    // Check if WP Fusion is active
    if (function_exists('wp_fusion')) {
        // Get user tags
        $user_tags = wp_fusion()->user->get_tags();
        
        // Check for agency tag
        if (is_array($user_tags) && in_array('agency', $user_tags)) {
            return 'agency';
        }
        
        // Check for pro tag
        if (is_array($user_tags) && in_array('pro', $user_tags)) {
            return 'pro';
        }
        
        // Check for free tag
        if (is_array($user_tags) && in_array('free', $user_tags)) {
            return 'free';
        }
    }
    
    // Check if user is logged in
    if (is_user_logged_in()) {
        return 'free'; // Default for logged-in users
    }
    
    // Default to guest for non-logged-in users
    return 'guest';
}

/**
 * Enqueue admin-specific scripts
 */
function mkb_enqueue_admin_scripts($hook) {
    // Only enqueue on Media Kit Builder admin pages
    if (strpos($hook, 'media-kit-builder') === false) {
        return;
    }
    
    $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';
    
    // Admin styles
    wp_enqueue_style('mkb-admin', 
        plugin_dir_url(__FILE__) . '../assets/css/admin.css', 
        array(), 
        $version
    );
    
    // Admin scripts
    wp_enqueue_script('mkb-admin-js', 
        plugin_dir_url(__FILE__) . '../assets/js/admin-integration.js', 
        array('jquery'), 
        $version, 
        true
    );
    
    // Debug helper in development mode
    if (defined('WP_DEBUG') && WP_DEBUG) {
        wp_enqueue_script('mkb-debug', 
            plugin_dir_url(__FILE__) . '../assets/js/mkb-debug.js', 
            array('jquery'), 
            $version, 
            true
        );
    }
}
add_action('admin_enqueue_scripts', 'mkb_enqueue_admin_scripts');
