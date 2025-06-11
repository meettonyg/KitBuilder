<?php
/**
 * Builder State Integration - Phase 3 Days 11-12
 * 
 * Integrates the Builder State System with the main plugin
 * Following Nuclear Efficiency Architecture principles
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class Guestify_Builder_State_Integration {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Builder state manager
     */
    private $state_manager;
    
    /**
     * AJAX handler
     */
    private $ajax_handler;
    
    /**
     * Integration status
     */
    private $is_initialized = false;

    /**
     * Get single instance of the class
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor - Private to prevent direct instantiation
     */
    private function __construct() {
        $this->init();
    }

    /**
     * Initialize the integration
     */
    private function init() {
        // Hook into WordPress initialization
        add_action('init', array($this, 'setup_state_system'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_state_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_state_scripts'));
        
        // Hook into plugin activation
        add_action('mkb_plugin_activated', array($this, 'setup_database_tables'));
        
        // Hook into plugin updates
        add_action('mkb_plugin_updated', array($this, 'handle_state_migrations'));
        
        // Setup AJAX endpoints
        add_action('wp_ajax_mkb_init_state_system', array($this, 'init_state_system_ajax'));
        add_action('wp_ajax_nopriv_mkb_init_state_system', array($this, 'init_guest_state_system_ajax'));
        
        // Setup cleanup tasks
        add_action('mkb_daily_cleanup', array($this, 'cleanup_old_states'));
        
        // Performance monitoring
        add_action('wp_footer', array($this, 'output_performance_data'));
        
        $this->log_message('Builder State Integration initialized');
    }

    /**
     * Setup the state system
     */
    public function setup_state_system() {
        if ($this->is_initialized) {
            return;
        }

        try {
            // Initialize state manager
            $this->state_manager = Guestify_Builder_State::get_instance();
            
            // Initialize AJAX handler
            $this->ajax_handler = Guestify_Builder_Ajax::get_instance();
            
            // Setup state system hooks
            $this->setup_state_hooks();
            
            // Initialize frontend state if needed
            if (is_admin() || $this->is_builder_page()) {
                $this->init_frontend_state();
            }
            
            $this->is_initialized = true;
            $this->log_message('State system setup completed');
            
        } catch (Exception $e) {
            $this->log_message('State system setup failed: ' . $e->getMessage(), 'error');
        }
    }

    /**
     * Setup state system hooks
     */
    private function setup_state_hooks() {
        // Hook into component updates
        add_action('mkb_component_updated', array($this, 'handle_component_update'), 10, 3);
        
        // Hook into template changes
        add_action('mkb_template_switched', array($this, 'handle_template_switch'), 10, 2);
        
        // Hook into save operations
        add_action('mkb_media_kit_saved', array($this, 'handle_media_kit_save'), 10, 2);
        
        // Hook into user authentication changes
        add_action('wp_login', array($this, 'handle_user_login'), 10, 2);
        add_action('wp_logout', array($this, 'handle_user_logout'));
        
        // Hook into session management
        add_action('mkb_guest_session_created', array($this, 'handle_guest_session_created'));
        add_action('mkb_guest_session_converted', array($this, 'handle_guest_session_converted'));
    }

    /**
     * Initialize frontend state
     */
    private function init_frontend_state() {
        // Add state configuration to page
        add_action('wp_head', array($this, 'output_state_config'));
        add_action('admin_head', array($this, 'output_state_config'));
        
        // Enqueue state management scripts
        $this->enqueue_state_management_scripts();
    }

    /**
     * Enqueue state management scripts
     */
    public function enqueue_state_scripts() {
        if (!$this->is_builder_page()) {
            return;
        }

        $plugin_url = plugin_dir_url(dirname(__FILE__));
        $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';

        // Enqueue state management utilities
        wp_enqueue_script(
            'mkb-state-utils',
            $plugin_url . 'app/build/stateUtils.js',
            array(),
            $version,
            true
        );

        // Enqueue builder state manager
        wp_enqueue_script(
            'mkb-builder-state',
            $plugin_url . 'app/build/builderState.js',
            array('mkb-state-utils'),
            $version,
            true
        );

        // Enqueue user state manager
        wp_enqueue_script(
            'mkb-user-state',
            $plugin_url . 'app/build/userState.js',
            array('mkb-state-utils'),
            $version,
            true
        );

        // Enqueue template state manager
        wp_enqueue_script(
            'mkb-template-state',
            $plugin_url . 'app/build/templateState.js',
            array('mkb-state-utils'),
            $version,
            true
        );

        // Enqueue main state orchestrator
        wp_enqueue_script(
            'mkb-state-orchestrator',
            $plugin_url . 'app/build/stateOrchestrator.js',
            array('mkb-builder-state', 'mkb-user-state', 'mkb-template-state'),
            $version,
            true
        );
    }

    /**
     * Enqueue admin state scripts
     */
    public function enqueue_admin_state_scripts($hook) {
        // Only load on our admin pages
        if (!in_array($hook, array('toplevel_page_media-kit-builder', 'media-kit-builder_page_mkb-settings'))) {
            return;
        }

        $this->enqueue_state_scripts();
    }

    /**
     * Output state configuration
     */
    public function output_state_config() {
        if (!$this->is_builder_page()) {
            return;
        }

        $config = array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_builder_nonce'),
            'userId' => get_current_user_id(),
            'isGuest' => !is_user_logged_in(),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'stateConfig' => array(
                'autoSaveInterval' => 30000,
                'maxHistory' => 50,
                'performanceTracking' => true,
                'conflictResolution' => 'auto'
            ),
            'capabilities' => $this->get_user_capabilities(),
            'features' => $this->get_available_features()
        );

        echo '<script type="text/javascript">';
        echo 'window.mkbConfig = ' . wp_json_encode($config) . ';';
        echo '</script>';
    }

    /**
     * Setup database tables
     */
    public function setup_database_tables() {
        // Create builder states table
        Guestify_Builder_State::create_state_table();
        
        // Create additional tables
        $this->create_additional_state_tables();
        
        $this->log_message('Database tables created for state system');
    }

    /**
     * Create additional state tables
     */
    private function create_additional_state_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // State history table
        $history_table = $wpdb->prefix . 'mkb_state_history';
        $history_sql = "CREATE TABLE $history_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            state_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            action_type varchar(50) NOT NULL,
            state_data longtext NOT NULL,
            diff_data text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX state_id_idx (state_id),
            INDEX user_id_idx (user_id),
            INDEX action_type_idx (action_type),
            INDEX created_at_idx (created_at)
        ) $charset_collate;";

        // State metrics table
        $metrics_table = $wpdb->prefix . 'mkb_state_metrics';
        $metrics_sql = "CREATE TABLE $metrics_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            session_id varchar(255) NOT NULL,
            metric_type varchar(50) NOT NULL,
            metric_value decimal(10,4) NOT NULL,
            metadata json DEFAULT NULL,
            recorded_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX user_id_idx (user_id),
            INDEX session_id_idx (session_id),
            INDEX metric_type_idx (metric_type),
            INDEX recorded_at_idx (recorded_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($history_sql);
        dbDelta($metrics_sql);
    }

    /**
     * Handle state migrations
     */
    public function handle_state_migrations($old_version, $new_version) {
        $this->log_message("Handling state migrations from {$old_version} to {$new_version}");
        
        // Implement version-specific migrations
        if (version_compare($old_version, '1.0.0', '<') && version_compare($new_version, '1.0.0', '>=')) {
            $this->migrate_to_v1_0_0();
        }
    }

    /**
     * Migrate to version 1.0.0
     */
    private function migrate_to_v1_0_0() {
        global $wpdb;
        
        // Example migration - update state data format
        $states_table = $wpdb->prefix . 'mkb_builder_states';
        
        $states = $wpdb->get_results("SELECT id, state_data FROM $states_table");
        
        foreach ($states as $state) {
            $state_data = json_decode($state->state_data, true);
            
            if ($state_data && !isset($state_data['meta'])) {
                $state_data['meta'] = array(
                    'version' => '1.0.0',
                    'migrated_at' => current_time('mysql')
                );
                
                $wpdb->update(
                    $states_table,
                    array('state_data' => wp_json_encode($state_data)),
                    array('id' => $state->id),
                    array('%s'),
                    array('%d')
                );
            }
        }
        
        $this->log_message('Migration to v1.0.0 completed');
    }

    /**
     * Handle component update
     */
    public function handle_component_update($component_id, $component_data, $user_id) {
        if ($this->state_manager) {
            $state_update = array(
                'components' => array(
                    $component_id => $component_data
                ),
                'timestamp' => current_time('timestamp')
            );
            
            $this->state_manager->update_state($state_update);
        }
    }

    /**
     * Handle template switch
     */
    public function handle_template_switch($old_template_id, $new_template_id) {
        if ($this->state_manager) {
            $state_update = array(
                'template' => array(
                    'id' => $new_template_id,
                    'previous_id' => $old_template_id,
                    'switched_at' => current_time('timestamp')
                ),
                'timestamp' => current_time('timestamp')
            );
            
            $this->state_manager->update_state($state_update);
        }
    }

    /**
     * Handle media kit save
     */
    public function handle_media_kit_save($media_kit_id, $user_id) {
        if ($this->state_manager) {
            // Force save current state
            $this->state_manager->save_state_to_database('manual');
            
            $this->log_message("Media kit {$media_kit_id} saved, state persisted");
        }
    }

    /**
     * Handle user login
     */
    public function handle_user_login($user_login, $user) {
        // Convert guest session to user session if applicable
        if (isset($_COOKIE['mkb_guest_session'])) {
            $this->convert_guest_session_to_user($user->ID);
        }
    }

    /**
     * Handle user logout
     */
    public function handle_user_logout() {
        // Save current state before logout
        if ($this->state_manager) {
            $this->state_manager->save_state_to_database('logout');
        }
    }

    /**
     * Convert guest session to user session
     */
    private function convert_guest_session_to_user($user_id) {
        global $wpdb;
        
        $guest_session_id = sanitize_text_field($_COOKIE['mkb_guest_session']);
        $states_table = $wpdb->prefix . 'mkb_builder_states';
        
        // Update guest states to user states
        $updated = $wpdb->update(
            $states_table,
            array('user_id' => $user_id),
            array('session_id' => $guest_session_id, 'user_id' => 0),
            array('%d'),
            array('%s', '%d')
        );
        
        if ($updated) {
            $this->log_message("Converted {$updated} guest states to user {$user_id}");
        }
        
        // Clear guest session cookie
        setcookie('mkb_guest_session', '', time() - 3600, '/');
    }

    /**
     * Cleanup old states
     */
    public function cleanup_old_states() {
        if ($this->state_manager) {
            $result = $this->state_manager->cleanup_old_states(30);
            $this->log_message("Cleaned up {$result['deleted_count']} old states");
        }
    }

    /**
     * Output performance data
     */
    public function output_performance_data() {
        if (!$this->is_builder_page() || !$this->state_manager) {
            return;
        }

        $metrics = $this->state_manager->get_performance_metrics();
        
        echo '<script type="text/javascript">';
        echo 'if (window.mkbConfig) { window.mkbConfig.performanceMetrics = ' . wp_json_encode($metrics) . '; }';
        echo '</script>';
    }

    /**
     * AJAX Handlers
     */
    
    public function init_state_system_ajax() {
        check_ajax_referer('mkb_builder_nonce', 'nonce');
        
        try {
            $this->setup_state_system();
            
            $response = array(
                'success' => true,
                'initialized' => $this->is_initialized,
                'capabilities' => $this->get_user_capabilities(),
                'state_config' => $this->get_state_configuration()
            );
            
            wp_send_json_success($response);
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to initialize state system',
                'error' => $e->getMessage()
            ));
        }
    }

    public function init_guest_state_system_ajax() {
        try {
            // Create guest session
            $guest_session_id = wp_generate_uuid4();
            setcookie('mkb_guest_session', $guest_session_id, time() + (7 * 24 * 60 * 60), '/');
            
            $response = array(
                'success' => true,
                'guest_session_id' => $guest_session_id,
                'capabilities' => $this->get_guest_capabilities(),
                'state_config' => $this->get_state_configuration()
            );
            
            wp_send_json_success($response);
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to initialize guest state system',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * Helper Methods
     */

    private function is_builder_page() {
        // Check if we're on a page that needs the state system
        global $pagenow;
        
        if (is_admin()) {
            return in_array($pagenow, array('admin.php')) && 
                   isset($_GET['page']) && 
                   strpos($_GET['page'], 'media-kit-builder') !== false;
        }
        
        // Check for frontend builder pages
        return is_singular('guest') || 
               (isset($_GET['mkb_builder']) && $_GET['mkb_builder'] === '1');
    }

    private function get_user_capabilities() {
        if (!is_user_logged_in()) {
            return $this->get_guest_capabilities();
        }

        $current_user = wp_get_current_user();
        
        return array(
            'can_save' => current_user_can('edit_posts'),
            'can_publish' => current_user_can('publish_posts'),
            'can_export' => current_user_can('export'),
            'can_customize' => true,
            'premium_features' => current_user_can('manage_options'),
            'collaboration' => current_user_can('edit_others_posts'),
            'state_management' => array(
                'unlimited_history' => current_user_can('manage_options'),
                'advanced_features' => current_user_can('edit_others_posts')
            )
        );
    }

    private function get_guest_capabilities() {
        return array(
            'can_save' => false,
            'can_publish' => false,
            'can_export' => false,
            'can_customize' => true,
            'premium_features' => false,
            'collaboration' => false,
            'registration_required' => array(
                'save', 'export', 'premium_features', 'unlimited_history'
            ),
            'state_management' => array(
                'unlimited_history' => false,
                'advanced_features' => false,
                'max_history' => 10
            )
        );
    }

    private function get_available_features() {
        return array(
            'auto_save' => true,
            'undo_redo' => true,
            'state_validation' => true,
            'performance_monitoring' => defined('WP_DEBUG') && WP_DEBUG,
            'conflict_resolution' => true,
            'state_export' => is_user_logged_in(),
            'collaborative_editing' => false // Future feature
        );
    }

    private function get_state_configuration() {
        return array(
            'max_history' => is_user_logged_in() ? 50 : 10,
            'auto_save_interval' => 30000,
            'cleanup_days' => 30,
            'performance_tracking' => defined('WP_DEBUG') && WP_DEBUG,
            'compression_enabled' => true,
            'validation_enabled' => true
        );
    }

    private function log_message($message, $level = 'info') {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("Builder State Integration [{$level}]: {$message}");
        }
    }
}

// Initialize the integration
function mkb_init_builder_state_integration() {
    return Guestify_Builder_State_Integration::get_instance();
}

// Hook for WordPress initialization
add_action('plugins_loaded', 'mkb_init_builder_state_integration');

// Register activation hook for database setup
register_activation_hook(__FILE__, function() {
    $integration = Guestify_Builder_State_Integration::get_instance();
    $integration->setup_database_tables();
});
