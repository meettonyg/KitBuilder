<?php
/**
 * Media Kit Builder - Activator
 * 
 * Handles plugin activation tasks.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Activator Class
 * 
 * Handles activation hooks and setup
 */
class MKB_Activator {
    
    /**
     * Activate the plugin
     */
    public static function activate() {
        // Create required database tables
        self::create_tables();
        
        // Set up default options
        self::set_default_options();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Trigger activation hook for extensions
        do_action('mkb_activated');
    }
    
    /**
     * Create database tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Media kits table
        $media_kits_table = $wpdb->prefix . 'media_kits';
        
        $sql_media_kits = "CREATE TABLE $media_kits_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            entry_key varchar(100) NOT NULL,
            user_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL,
            data longtext NOT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY entry_key (entry_key),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        // Components table
        $components_table = $wpdb->prefix . 'mkb_components';
        
        $sql_components = "CREATE TABLE $components_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            component_id varchar(100) NOT NULL,
            media_kit_id bigint(20) NOT NULL,
            type varchar(100) NOT NULL,
            content longtext NOT NULL,
            styles longtext DEFAULT NULL,
            metadata longtext DEFAULT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY component_media_kit (component_id, media_kit_id),
            KEY media_kit_id (media_kit_id)
        ) $charset_collate;";
        
        // Templates table
        $templates_table = $wpdb->prefix . 'mkb_templates';
        
        $sql_templates = "CREATE TABLE $templates_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            template_id varchar(100) NOT NULL,
            template_data longtext NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY template_id (template_id)
        ) $charset_collate;";
        
        // Guest sessions table
        $guest_sessions_table = $wpdb->prefix . 'mkb_guest_sessions';
        
        $sql_guest_sessions = "CREATE TABLE $guest_sessions_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(100) NOT NULL,
            session_data longtext NOT NULL,
            created datetime NOT NULL,
            expires datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY session_id (session_id),
            KEY expires (expires)
        ) $charset_collate;";
        
        // Shared media kits table
        $shared_media_kits_table = $wpdb->prefix . 'mkb_shared_media_kits';
        
        $sql_shared_media_kits = "CREATE TABLE $shared_media_kits_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            share_key varchar(100) NOT NULL,
            media_kit_id varchar(100) NOT NULL,
            user_id bigint(20) NOT NULL,
            settings longtext DEFAULT NULL,
            created datetime NOT NULL,
            expires datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY share_key (share_key),
            KEY media_kit_id (media_kit_id),
            KEY user_id (user_id),
            KEY expires (expires)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Create tables
        dbDelta($sql_media_kits);
        dbDelta($sql_components);
        dbDelta($sql_templates);
        dbDelta($sql_guest_sessions);
        dbDelta($sql_shared_media_kits);
        
        // Store current database version
        update_option('mkb_db_version', MKB_VERSION);
    }
    
    /**
     * Set default options
     */
    private static function set_default_options() {
        // General settings
        $general_settings = array(
            'enable_guest_mode' => true,
            'guest_session_expire' => 7, // days
            'max_guest_kits' => 3,
            'default_theme' => 'default',
            'default_template' => 'hero-basic',
            'allow_public_sharing' => true,
            'share_link_expire' => 30 // days
        );
        
        if (!get_option('mkb_general_settings')) {
            add_option('mkb_general_settings', $general_settings);
        }
        
        // Export settings
        $export_settings = array(
            'pdf_page_size' => 'letter',
            'pdf_orientation' => 'portrait',
            'pdf_template' => 'default',
            'pdf_header' => true,
            'pdf_footer' => true,
            'image_quality' => 90,
            'image_format' => 'jpg',
            'html_include_styles' => true
        );
        
        if (!get_option('mkb_export_settings')) {
            add_option('mkb_export_settings', $export_settings);
        }
        
        // Compatibility settings
        $compatibility_settings = array(
            'use_object_cache' => true,
            'disable_emojis' => false,
            'disable_jquery_migrate' => false,
            'load_separate_jquery' => false,
            'enable_debug_mode' => false
        );
        
        if (!get_option('mkb_compatibility_settings')) {
            add_option('mkb_compatibility_settings', $compatibility_settings);
        }
    }
}
