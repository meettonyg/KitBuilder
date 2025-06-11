<?php
/**
 * Media Kit Builder - Plugin Uninstall
 * 
 * Handles complete removal of plugin data when uninstalled.
 * This file is called when the plugin is deleted from WordPress admin.
 */

// If uninstall not called from WordPress, then exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Define plugin constants for uninstall
define('MKB_UNINSTALL', true);

/**
 * Remove all plugin data
 */
function mkb_uninstall_plugin() {
    global $wpdb;
    
    // Remove options
    $options_to_remove = array(
        'mkb_version',
        'mkb_db_version',
        'mkb_activated',
        'mkb_deactivated',
        'mkb_activation_time',
        'mkb_deactivation_time',
        'mkb_activation_errors',
        'mkb_guest_session_duration',
        'mkb_auto_cleanup_enabled',
        'mkb_max_guest_sessions',
        'mkb_default_template',
        'mkb_allowed_file_types',
        'mkb_max_file_size',
        'mkb_max_components_per_kit',
        'mkb_enable_analytics',
        'mkb_enable_guest_mode',
        'mkb_registration_redirect',
        'mkb_pdf_watermark_text',
        'mkb_enable_social_sharing',
        'mkb_cache_expiry',
        'mkb_debug_mode',
        'mkb_pdf_library',
        'mkb_enable_watermark'
    );
    
    foreach ($options_to_remove as $option) {
        delete_option($option);
        delete_site_option($option); // For multisite
    }
    
    // Remove database tables
    $tables_to_remove = array(
        $wpdb->prefix . 'mkb_guest_sessions',
        $wpdb->prefix . 'mkb_templates',
        $wpdb->prefix . 'mkb_component_stats',
        $wpdb->prefix . 'mkb_exports',
        $wpdb->prefix . 'mkb_export_queue'
    );
    
    foreach ($tables_to_remove as $table) {
        $wpdb->query("DROP TABLE IF EXISTS $table");
    }
    
    // Remove posts and meta
    $media_kit_posts = get_posts(array(
        'post_type' => 'mkb_media_kit',
        'posts_per_page' => -1,
        'post_status' => 'any'
    ));
    
    foreach ($media_kit_posts as $post) {
        wp_delete_post($post->ID, true);
    }
    
    // Remove user meta
    $wpdb->query("DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'mkb_%'");
    
    // Remove post meta
    $wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE '_mkb_%'");
    
    // Remove transients
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mkb_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mkb_%'");
    
    // Clear scheduled events
    wp_clear_scheduled_hook('mkb_cleanup_guest_sessions');
    wp_clear_scheduled_hook('mkb_daily_maintenance');
    wp_clear_scheduled_hook('mkb_weekly_analytics');
    wp_clear_scheduled_hook('mkb_process_export_queue');
    
    // Remove uploaded files
    $upload_dir = wp_upload_dir();
    $mkb_upload_dir = $upload_dir['basedir'] . '/mkb-exports/';
    
    if (file_exists($mkb_upload_dir)) {
        mkb_remove_directory($mkb_upload_dir);
    }
    
    // Remove custom capabilities if any were added
    $roles = wp_roles();
    foreach ($roles->roles as $role_name => $role_info) {
        $role = get_role($role_name);
        if ($role) {
            $role->remove_cap('mkb_manage_media_kits');
            $role->remove_cap('mkb_edit_media_kits');
            $role->remove_cap('mkb_delete_media_kits');
        }
    }
    
    // Flush rewrite rules
    flush_rewrite_rules();
    
    // Final cleanup
    do_action('mkb_plugin_uninstalled');
}

/**
 * Recursively remove directory and all contents
 * 
 * @param string $dir
 * @return bool
 */
function mkb_remove_directory($dir) {
    if (!file_exists($dir)) {
        return true;
    }
    
    if (!is_dir($dir)) {
        return unlink($dir);
    }
    
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }
        
        if (!mkb_remove_directory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }
    
    return rmdir($dir);
}

// Run the uninstall
mkb_uninstall_plugin();
