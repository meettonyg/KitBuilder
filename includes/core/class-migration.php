<?php
/**
 * Media Kit Builder - Migration
 * 
 * Handles plugin data migrations between versions.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Migration Class
 * 
 * Handles data migrations between plugin versions
 */
class MKB_Migration {
    
    /**
     * Instance
     * @var MKB_Migration
     */
    private static $instance = null;
    
    /**
     * Current DB version
     * @var string
     */
    private $current_db_version;
    
    /**
     * Plugin version
     * @var string
     */
    private $plugin_version;
    
    /**
     * Get instance
     * 
     * @return MKB_Migration
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->current_db_version = get_option('mkb_db_version', '1.0.0');
        $this->plugin_version = MKB_VERSION;
        
        // Run migrations on admin_init hook to ensure WordPress is fully loaded
        add_action('admin_init', array($this, 'check_for_migrations'));
    }
    
    /**
     * Check if migrations are needed
     */
    public function check_for_migrations() {
        // Compare versions
        if (version_compare($this->current_db_version, $this->plugin_version, '<')) {
            $this->run_migrations();
        }
    }
    
    /**
     * Run migrations
     */
    public function run_migrations() {
        // Run version-specific migrations
        $this->migrate_to_1_0_1();
        
        // Update DB version
        update_option('mkb_db_version', $this->plugin_version);
        
        // Log migration
        $this->log_migration();
    }
    
    /**
     * Migration to version 1.0.1
     * 
     * @return bool True on success, false on failure
     */
    private function migrate_to_1_0_1() {
        // Only run if current version is less than 1.0.1
        if (version_compare($this->current_db_version, '1.0.1', '>=')) {
            return true;
        }
        
        try {
            global $wpdb;
            
            // Migration: Create new tables if they don't exist
            $charset_collate = $wpdb->get_charset_collate();
            
            // Components table
            $components_table = $wpdb->prefix . 'mkb_components';
            
            if ($wpdb->get_var("SHOW TABLES LIKE '$components_table'") != $components_table) {
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
                
                require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
                dbDelta($sql_components);
            }
            
            // Templates table
            $templates_table = $wpdb->prefix . 'mkb_templates';
            
            if ($wpdb->get_var("SHOW TABLES LIKE '$templates_table'") != $templates_table) {
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
                
                require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
                dbDelta($sql_templates);
            }
            
            // Migration: Migrate existing media kits to the new component structure
            $this->migrate_existing_media_kits();
            
            return true;
        } catch (Exception $e) {
            // Log error
            error_log('Media Kit Builder migration to 1.0.1 failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Migrate existing media kits to new component structure
     */
    private function migrate_existing_media_kits() {
        global $wpdb;
        
        // Get all media kits
        $media_kits_table = $wpdb->prefix . 'media_kits';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$media_kits_table'") != $media_kits_table) {
            // Table doesn't exist, nothing to migrate
            return;
        }
        
        $media_kits = $wpdb->get_results("SELECT * FROM $media_kits_table");
        
        if (empty($media_kits)) {
            // No media kits to migrate
            return;
        }
        
        // Get components table
        $components_table = $wpdb->prefix . 'mkb_components';
        
        // Process each media kit
        foreach ($media_kits as $kit) {
            // Get media kit data
            $kit_data = json_decode($kit->data, true);
            
            if (empty($kit_data) || !isset($kit_data['sections'])) {
                continue;
            }
            
            // Process each section
            foreach ($kit_data['sections'] as $section_index => $section) {
                if (empty($section) || !isset($section['components'])) {
                    continue;
                }
                
                $components = $section['components'];
                
                // Check if components is an array or organized by columns
                if (isset($components[0])) {
                    // Single column
                    $this->process_components($components, $kit->id, $components_table);
                } else {
                    // Multi-column
                    foreach ($components as $column => $column_components) {
                        if (is_array($column_components)) {
                            $this->process_components($column_components, $kit->id, $components_table);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Process components for migration
     * 
     * @param array $components Components
     * @param int $media_kit_id Media kit ID
     * @param string $components_table Components table name
     */
    private function process_components($components, $media_kit_id, $components_table) {
        global $wpdb;
        
        foreach ($components as $component) {
            if (!isset($component['type'])) {
                continue;
            }
            
            // Create a new component
            $component_id = isset($component['id']) ? $component['id'] : 'component_' . wp_generate_uuid4();
            $type = $component['type'];
            $content = isset($component['content']) ? $component['content'] : array();
            $styles = isset($component['styles']) ? $component['styles'] : array();
            $metadata = isset($component['metadata']) ? $component['metadata'] : array();
            
            // Set default metadata
            if (empty($metadata)) {
                $metadata = array(
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                    'version' => '1.0.0'
                );
            }
            
            // Insert component into components table
            $wpdb->insert(
                $components_table,
                array(
                    'component_id' => $component_id,
                    'media_kit_id' => $media_kit_id,
                    'type' => $type,
                    'content' => wp_json_encode($content),
                    'styles' => wp_json_encode($styles),
                    'metadata' => wp_json_encode($metadata),
                    'created' => $metadata['created_at'],
                    'modified' => $metadata['updated_at']
                ),
                array(
                    '%s',
                    '%d',
                    '%s',
                    '%s',
                    '%s',
                    '%s',
                    '%s',
                    '%s'
                )
            );
        }
    }
    
    /**
     * Log migration
     */
    private function log_migration() {
        $migrations = get_option('mkb_migration_log', array());
        
        $migrations[] = array(
            'from' => $this->current_db_version,
            'to' => $this->plugin_version,
            'date' => current_time('mysql'),
            'success' => true
        );
        
        update_option('mkb_migration_log', $migrations);
    }
}

// Initialize migration
MKB_Migration::instance();
