<?php
/**
 * Plugin Name: Media Kit Builder
 * Description: A drag-and-drop builder for creating professional media kits
 * Version: 1.0.0
 * Author: Guestify
 * Text Domain: media-kit-builder
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MKB_VERSION', '1.0.0');
define('MKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MKB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MKB_PLUGIN_FILE', __FILE__);

/**
 * Main plugin class
 */
class Media_Kit_Builder {
    /**
     * Instance of this class
     *
     * @var Media_Kit_Builder
     */
    private static $instance;

    /**
     * Get instance of this class
     *
     * @return Media_Kit_Builder
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
    public function __construct() {
        // Load required files
        $this->includes();
        
        // Register hooks
        $this->init_hooks();
    }

    /**
     * Include required files
     */
    private function includes() {
        // Core classes
        require_once MKB_PLUGIN_DIR . 'includes/enqueue-scripts.php';
        require_once MKB_PLUGIN_DIR . 'includes/class-api-endpoints.php';
        
        // Admin classes
        if (is_admin()) {
            require_once MKB_PLUGIN_DIR . 'includes/admin/class-admin-menu.php';
            // Check if file exists before including
            $builder_page_path = MKB_PLUGIN_DIR . 'includes/admin/class-builder-page.php';
            if (file_exists($builder_page_path)) {
                require_once $builder_page_path;
            } else {
                add_action('admin_notices', function() {
                    echo '<div class="notice notice-error"><p>';
                    echo esc_html__('Media Kit Builder: Missing required file class-builder-page.php', 'media-kit-builder');
                    echo '</p></div>';
                });
            }
        }
        
        // Include AJAX handlers
        require_once MKB_PLUGIN_DIR . 'includes/ajax/class-ajax-handlers.php';
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation hook
        register_activation_hook(MKB_PLUGIN_FILE, array($this, 'activate'));
        
        // Deactivation hook
        register_deactivation_hook(MKB_PLUGIN_FILE, array($this, 'deactivate'));
        
        // Load textdomain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
    }

    /**
     * Activate plugin
     */
    public function activate() {
        // Include activation file
        require_once MKB_PLUGIN_DIR . 'activation.php';
        
        // Run activation functions
        mkb_activate();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Deactivate plugin
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Load textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain('media-kit-builder', false, dirname(plugin_basename(MKB_PLUGIN_FILE)) . '/languages');
    }
}

/**
 * Start the plugin
 */
function mkb_init() {
    return Media_Kit_Builder::instance();
}

// Initialize the plugin
mkb_init();
