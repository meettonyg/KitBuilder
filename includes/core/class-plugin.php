<?php
/**
 * Media Kit Builder - Main Plugin Class
 * 
 * Coordinates all plugin functionality.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Plugin Class
 * 
 * Main plugin class that initializes all functionality
 */
class MKB_Plugin {
    
    /**
     * Instance
     * @var MKB_Plugin
     */
    private static $instance = null;
    
    /**
     * Core systems instances
     * @var array
     */
    private $systems = array();
    
    /**
     * Plugin version
     * @var string
     */
    private $version;
    
    /**
     * API Controller instance
     * @var MKB_API_Controller
     */
    private $api_controller;
    
    /**
     * Get instance
     * 
     * @return MKB_Plugin
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
        $this->version = MKB_VERSION;
        
        $this->load_dependencies();
        $this->init_hooks();
        $this->init_api(); // Initialize API controller early
        $this->init_systems();
    }
    
    /**
     * Load dependencies
     */
    private function load_dependencies() {
        // Core systems
        require_once MKB_PLUGIN_DIR . 'includes/core/class-session-manager.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-wpfusion-reader.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-pods-integration.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-template-manager.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-component-registry.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-builder-state.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-export-engine.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-share-manager.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-migration.php';
        
        // Model classes
        require_once MKB_PLUGIN_DIR . 'includes/models/class-component.php';
        require_once MKB_PLUGIN_DIR . 'includes/models/class-section.php';
        require_once MKB_PLUGIN_DIR . 'includes/models/class-media-kit.php';
        
        // API classes - main controller only, endpoints are loaded by the controller
        require_once MKB_PLUGIN_DIR . 'includes/api/class-api-controller.php';
        
        // Admin interface
        require_once MKB_PLUGIN_DIR . 'includes/admin/class-admin-interface.php';
        
        // Activation/Deactivation
        require_once MKB_PLUGIN_DIR . 'includes/core/class-activator.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-deactivator.php';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register activation and deactivation hooks
        register_activation_hook(MKB_PLUGIN_DIR . 'media-kit-builder.php', array('MKB_Activator', 'activate'));
        register_deactivation_hook(MKB_PLUGIN_DIR . 'media-kit-builder.php', array('MKB_Deactivator', 'deactivate'));
        
        // Scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Plugin action links
        add_filter('plugin_action_links_' . plugin_basename(MKB_PLUGIN_DIR . 'media-kit-builder.php'), array($this, 'add_plugin_action_links'));
        
        // Initialize admin interface
        if (is_admin()) {
            add_action('init', array($this, 'init_admin_interface'));
        }
        
        // Initialize migration
        add_action('init', array($this, 'init_migration'));
    }
    
    /**
     * Initialize core systems
     */
    private function init_systems() {
        // Initialize and store core systems
        $this->systems = array(
            'session' => MKB_Session_Manager::instance(),
            'wpfusion' => MKB_WPFusion_Reader::instance(),
            'pods' => MKB_Pods_Integration::instance(),
            'templates' => MKB_Template_Manager::instance(),
            'components' => MKB_Component_Registry::instance(),
            'state' => MKB_Builder_State::instance(),
            'export' => MKB_Export_Engine::instance(),
            'share' => MKB_Share_Manager::instance()
        );
    }
    
    /**
     * Initialize API
     */
    public function init_api() {
        // Initialize API controller
        $this->api_controller = MKB_API_Controller::instance();
    }
    
    /**
     * Initialize admin interface
     */
    public function init_admin_interface() {
        MKB_Admin_Interface::instance();
    }
    
    /**
     * Initialize migration
     */
    public function init_migration() {
        // Only run migrations in admin
        if (is_admin()) {
            MKB_Migration::instance();
        }
    }
    
    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets() {
        // Only load on media kit pages
        if (is_page() && has_shortcode(get_the_content(), 'media_kit_builder')) {
            // CSS
            wp_enqueue_style('mkb-frontend', MKB_PLUGIN_URL . 'dist/css/media-kit-builder.css', array(), $this->version);
            
            // JavaScript
            wp_enqueue_script('mkb-frontend', MKB_PLUGIN_URL . 'dist/js/media-kit-builder.js', array('jquery'), $this->version, true);
            
            // Localize script
            wp_localize_script('mkb-frontend', 'mkbData', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('mkb_nonce'),
                'restUrl' => rest_url($this->get_api_namespace()),
                'restNonce' => wp_create_nonce('wp_rest'),
                'isLoggedIn' => is_user_logged_in(),
                'userId' => get_current_user_id(),
                'settings' => $this->get_frontend_settings()
            ));
        }
    }
    
    /**
     * Enqueue admin assets
     * 
     * @param string $hook Current admin page hook
     */
    public function enqueue_admin_assets($hook) {
        // Only load on media kit admin pages
        if (strpos($hook, 'media-kit-builder') !== false) {
            // CSS
            wp_enqueue_style('mkb-admin', MKB_PLUGIN_URL . 'dist/css/admin.css', array(), $this->version);
            
            // JavaScript
            wp_enqueue_script('mkb-admin', MKB_PLUGIN_URL . 'dist/js/admin.js', array('jquery'), $this->version, true);
            
            // Localize script
            wp_localize_script('mkb-admin', 'mkbAdminData', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('mkb_admin_nonce'),
                'restUrl' => rest_url($this->get_api_namespace()),
                'restNonce' => wp_create_nonce('wp_rest'),
                'version' => $this->version,
                'settings' => $this->get_admin_settings()
            ));
        }
    }
    
    /**
     * Add plugin action links
     * 
     * @param array $links Plugin action links
     * @return array Modified plugin action links
     */
    public function add_plugin_action_links($links) {
        $plugin_links = array(
            '<a href="' . admin_url('admin.php?page=media-kit-builder') . '">' . __('Settings', 'media-kit-builder') . '</a>',
            '<a href="' . admin_url('admin.php?page=media-kit-builder-docs') . '">' . __('Documentation', 'media-kit-builder') . '</a>'
        );
        
        return array_merge($plugin_links, $links);
    }
    
    /**
     * Get system
     * 
     * @param string $system_name System name
     * @return object|null System instance
     */
    public function get_system($system_name) {
        if (isset($this->systems[$system_name])) {
            return $this->systems[$system_name];
        }
        
        return null;
    }
    
    /**
     * Get frontend settings
     * 
     * @return array Frontend settings
     */
    private function get_frontend_settings() {
        $general_settings = get_option('mkb_general_settings', array());
        
        $settings = array(
            'enable_guest_mode' => isset($general_settings['enable_guest_mode']) ? (bool) $general_settings['enable_guest_mode'] : true,
            'default_theme' => isset($general_settings['default_theme']) ? $general_settings['default_theme'] : 'default',
            'default_template' => isset($general_settings['default_template']) ? $general_settings['default_template'] : 'hero-basic',
            'allow_public_sharing' => isset($general_settings['allow_public_sharing']) ? (bool) $general_settings['allow_public_sharing'] : true,
            'version' => $this->version
        );
        
        return $settings;
    }
    
    /**
     * Get admin settings
     * 
     * @return array Admin settings
     */
    private function get_admin_settings() {
        $general_settings = get_option('mkb_general_settings', array());
        $export_settings = get_option('mkb_export_settings', array());
        $compatibility_settings = get_option('mkb_compatibility_settings', array());
        
        $settings = array(
            'general' => $general_settings,
            'export' => $export_settings,
            'compatibility' => $compatibility_settings,
            'version' => $this->version
        );
        
        return $settings;
    }
    
    /**
     * Get API namespace
     * 
     * @return string API namespace
     */
    public function get_api_namespace() {
        return $this->api_controller ? $this->api_controller->get_namespace() : 'media-kit/v2';
    }
    
    /**
     * Get plugin version
     * 
     * @return string Plugin version
     */
    public function get_version() {
        return $this->version;
    }
    
    /**
     * Get API controller
     * 
     * @return MKB_API_Controller API controller instance
     */
    public function get_api_controller() {
        return $this->api_controller;
    }
}
