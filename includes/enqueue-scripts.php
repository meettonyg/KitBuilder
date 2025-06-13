<?php
/**
 * Script and Style Enqueuing for Media Kit Builder
 * Handles admin and public preview assets. The main builder is loaded by the URL Router.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueues assets for the WordPress Admin area.
 * @param string $hook The current admin page hook.
 */
function mkb_admin_enqueue_assets($hook) {
    if (strpos($hook, 'media-kit-builder') === false) {
        return;
    }
    
    // Load admin styles with proper dependencies
    wp_enqueue_style('mkb-admin-styles', MKB_PLUGIN_URL . 'assets/css/admin.css', [], MKB_VERSION);
    
    // Load the new modular builder
    wp_enqueue_style('mkb-builder', MKB_PLUGIN_URL . 'dist/media-kit-builder.css', [], MKB_VERSION);
    wp_enqueue_script('mkb-builder', MKB_PLUGIN_URL . 'dist/media-kit-builder.js', ['jquery'], MKB_VERSION, true);
    
    // Pass configuration to the builder
    wp_localize_script('mkb-builder', 'mediaKitBuilderConfig', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('mkb_nonce'),
        'platform' => 'wordpress',
        'version' => MKB_VERSION,
        'restBase' => rest_url('media-kit/v2'),
        'adminUrl' => admin_url('admin.php?page=media-kit-builder'),
        'debug' => defined('WP_DEBUG') && WP_DEBUG,
        'theme' => 'default'
    ]);
}
add_action('admin_enqueue_scripts', 'mkb_admin_enqueue_assets');

/**
 * Enqueue scripts for the public-facing preview pages (non-builder).
 */
function mkb_enqueue_public_view_assets() {
    // Only load on the public preview route
    if (get_query_var('mkb_page') !== 'preview') {
        return;
    }

    // Load our bundled CSS
    wp_enqueue_style('mkb-builder', MKB_PLUGIN_URL . 'dist/media-kit-builder.css', [], MKB_VERSION);
    
    // Load frontend-specific styles
    wp_enqueue_style('mkb-frontend-styles', MKB_PLUGIN_URL . 'assets/css/frontend.css', ['mkb-builder'], MKB_VERSION);
    
    // Load the public viewer script
    wp_enqueue_script('mkb-public-viewer', MKB_PLUGIN_URL . 'assets/js/public-viewer.js', ['jquery'], MKB_VERSION, true);

    wp_localize_script('mkb-public-viewer', 'mkbPreviewData', [
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('mkb_nonce'),
        'entryKey'  => get_query_var('mkb_entry_key'),
    ]);
}
add_action('wp_enqueue_scripts', 'mkb_enqueue_public_view_assets');