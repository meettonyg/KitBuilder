<?php
/**
 * Media Kit Builder - Deactivator
 * 
 * Handles plugin deactivation tasks.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Deactivator Class
 * 
 * Handles deactivation hooks and cleanup
 */
class MKB_Deactivator {
    
    /**
     * Deactivate the plugin
     */
    public static function deactivate() {
        // Clean up transients
        self::cleanup_transients();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Trigger deactivation hook for extensions
        do_action('mkb_deactivated');
    }
    
    /**
     * Clean up transients
     */
    private static function cleanup_transients() {
        // Delete plugin transients
        delete_transient('mkb_templates');
        delete_transient('mkb_components');
        
        // Delete any other plugin transients
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mkb_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mkb_%'");
    }
}
