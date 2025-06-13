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
    // You can add admin-specific builder assets here if needed in the future
    // For now, the router handles the main builder.
    // Load admin styles with proper dependencies
    wp_enqueue_style('mkb-core-styles', MKB_PLUGIN_URL . 'assets/css/builder.css', [], MKB_VERSION);
    wp_enqueue_style('mkb-admin-compat', MKB_PLUGIN_URL . 'assets/css/wp-admin-compat.css', ['mkb-core-styles'], MKB_VERSION);
    wp_enqueue_style('mkb-admin-styles', MKB_PLUGIN_URL . 'assets/css/admin.css', ['mkb-core-styles', 'mkb-admin-compat'], MKB_VERSION);
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

    // Load our core CSS first (for base variables)
    wp_enqueue_style('mkb-core-styles', MKB_PLUGIN_URL . 'assets/css/builder.css', [], MKB_VERSION);
    
    // Load component styles (depends on core)
    wp_enqueue_style('mkb-component-styles', MKB_PLUGIN_URL . 'assets/css/components.css', ['mkb-core-styles'], MKB_VERSION);
    
    // Load frontend-specific styles last
    wp_enqueue_style('mkb-frontend-styles', MKB_PLUGIN_URL . 'assets/css/frontend.css', ['mkb-core-styles', 'mkb-component-styles'], MKB_VERSION);
    wp_enqueue_script('mkb-public-viewer', MKB_PLUGIN_URL . 'assets/js/public-viewer.js', ['jquery'], MKB_VERSION, true);

    wp_localize_script('mkb-public-viewer', 'mkbPreviewData', [
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('mkb_nonce'),
        'entryKey'  => get_query_var('mkb_entry_key'),
    ]);
}
add_action('wp_enqueue_scripts', 'mkb_enqueue_public_view_assets');