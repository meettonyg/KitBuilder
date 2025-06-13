<?php
/**
 * Plugin Name: Media Kit Builder
 * Description: Create professional media kits with a drag-and-drop builder.
 * Version: 1.0.1
 * Author: Guestify
 * Text Domain: media-kit-builder
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MKB_VERSION', '1.0.1');
define('MKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MKB_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Final Media Kit Builder Class
 *
 * This class handles the core plugin functionality and coordinates all systems.
 */
final class Media_Kit_Builder {

    private static $instance;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Core systems instances
     * @var array
     */
    private $systems = [];

    private function __construct() {
        $this->define_constants();
        $this->includes();
        $this->init_hooks();
        $this->init_systems();
    }

    private function define_constants() {
        // This is a good place for any other constants you might need.
    }

    /**
     * Include all required files.
     * The order here is important.
     */
    private function includes() {
        // Core Systems
        require_once MKB_PLUGIN_DIR . 'includes/core/class-session-manager.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-wpfusion-reader.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-pods-integration.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-template-manager.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-component-registry.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-builder-state.php';
        require_once MKB_PLUGIN_DIR . 'includes/core/class-export-engine.php';
        
        // Admin Interface & Menus
        require_once MKB_PLUGIN_DIR . 'includes/admin/class-admin-interface.php';
        
        // API Endpoints
        require_once MKB_PLUGIN_DIR . 'includes/core/class-api-endpoints.php';

        // THE MOST IMPORTANT PART: The URL Router
        // This MUST be loaded for the builder to function correctly on the front-end.
        require_once MKB_PLUGIN_DIR . 'includes/class-url-router.php';
    }

    /**
     * Initialize WordPress hooks.
     */
    private function init_hooks() {
        // Activation and Deactivation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize Admin Interface
        if (is_admin()) {
            MKB_Admin_Interface::instance();
        }
    }
    
    /**
     * Plugin activation callback.
     */
    public function activate() {
        // We only need to flush rewrite rules here.
        // The URL Router adds the rules, and this makes WordPress recognize them.
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation callback.
     */
    public function deactivate() {
        // Flush rewrite rules on deactivation to clean up.
        flush_rewrite_rules();
    }
    
    /**
     * Get a core system instance
     * 
     * @param string $system_name
     * @return object|null
     */
    public function get_system($system_name) {
        if (isset($this->systems[$system_name])) {
            return $this->systems[$system_name];
        }
        
        return null;
    }
    
    /**
     * Initialize core systems
     */
    private function init_systems() {
        // Initialize and store core systems
        $this->systems = [
            'session' => MKB_Session_Manager::instance(),
            'wpfusion' => MKB_WPFusion_Reader::instance(),
            'pods' => MKB_Pods_Integration::instance(),
            'templates' => MKB_Template_Manager::instance(),
            'components' => MKB_Component_Registry::instance(),
            'state' => MKB_Builder_State::instance(),
            'export' => MKB_Export_Engine::instance()
        ];
    }
}

/**
 * The main function for returning the Media_Kit_Builder instance.
 *
 * @return Media_Kit_Builder
 */
function Media_Kit_Builder() {
    return Media_Kit_Builder::instance();
}

// Get the plugin running properly - hook to plugins_loaded.
add_action('plugins_loaded', 'Media_Kit_Builder');