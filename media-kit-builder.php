<?php
/**
 * Plugin Name: Media Kit Builder
 * Plugin URI: https://guestify.com/media-kit-builder
 * Description: A drag-and-drop media kit builder with guest-first architecture and modern React interface.
 * Version: 2.0.0
 * Author: Guestify
 * Author URI: https://guestify.com
 * License: GPL v2 or later
 * Text Domain: media-kit-builder
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MKB_VERSION', '2.0.0');
define('MKB_PLUGIN_FILE', __FILE__);
define('MKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MKB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MKB_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Define paths
define('MKB_INCLUDES_DIR', MKB_PLUGIN_DIR . 'includes/');
define('MKB_TEMPLATES_DIR', MKB_PLUGIN_DIR . 'templates/');
define('MKB_ASSETS_DIR', MKB_PLUGIN_DIR . 'assets/');
define('MKB_ASSETS_URL', MKB_PLUGIN_URL . 'assets/');

/**
 * Main Media Kit Builder Plugin Class
 * 
 * This is the core plugin class that initializes all components
 * following the Single Source of Truth and Direct Operations principles.
 * Updated to include URL routing system for clean frontend URLs.
 */
final class Media_Kit_Builder {
    
    /**
     * Plugin instance
     * @var Media_Kit_Builder
     */
    private static $instance = null;
    
    /**
     * Core systems
     * @var array
     */
    private $core_systems = array();
    
    /**
     * Plugin initialization status
     * @var bool
     */
    private $initialized = false;
    
    /**
     * Get plugin instance (Singleton)
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
     * Constructor - Initialize the plugin
     */
    private function __construct() {
        // Hook into WordPress initialization
        add_action('plugins_loaded', array($this, 'init'), 10);
        add_action('init', array($this, 'late_init'), 15);
        
        // Register REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Plugin lifecycle hooks
        register_activation_hook(MKB_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(MKB_PLUGIN_FILE, array($this, 'deactivate'));
        
        // Load textdomain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
    }
    
    /**
     * Initialize the plugin core
     */
    public function init() {
        if ($this->initialized) {
            return;
        }
        
        // Check system requirements
        if (!$this->check_requirements()) {
            return;
        }
        
        // Load core files
        $this->load_core_files();
        
        // Initialize core systems
        $this->init_core_systems();
        
        // Initialize admin interface
        if (is_admin()) {
            $this->init_admin();
        }
        
        // Set up cleanup cron job
        $this->setup_cleanup_cron();
        
        $this->initialized = true;
        
        do_action('mkb_initialized', $this);
    }
    
    /**
     * Late initialization for WordPress hooks
     */
    public function late_init() {
        // Initialize after all plugins are loaded
        do_action('mkb_late_init', $this);
    }
    
    /**
     * Check system requirements
     * 
     * @return bool
     */
    private function check_requirements() {
        // Check PHP version
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>';
                echo __('Media Kit Builder requires PHP 7.4 or higher. Please upgrade your PHP version.', 'media-kit-builder');
                echo '</p></div>';
            });
            return false;
        }
        
        // Check WordPress version
        global $wp_version;
        if (version_compare($wp_version, '5.0', '<')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>';
                echo __('Media Kit Builder requires WordPress 5.0 or higher. Please upgrade WordPress.', 'media-kit-builder');
                echo '</p></div>';
            });
            return false;
        }
        
        // Check for required plugins
        $this->check_plugin_dependencies();
        
        return true;
    }
    
    /**
     * Check for required plugin dependencies
     */
    private function check_plugin_dependencies() {
        $required_plugins = array();
        
        // Check for Formidable Forms
        if (!class_exists('FrmEntry')) {
            $required_plugins[] = 'Formidable Forms';
        }
        
        // Check for Pods (optional but recommended)
        if (!function_exists('pods')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-warning"><p>';
                echo __('Media Kit Builder: Pods Framework is recommended for enhanced functionality.', 'media-kit-builder');
                echo '</p></div>';
            });
        }
        
        // Check for WP Fusion (optional)
        if (!function_exists('wp_fusion')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-info"><p>';
                echo __('Media Kit Builder: WP Fusion integration available for advanced user management.', 'media-kit-builder');
                echo '</p></div>';
            });
        }
        
        // Show error for required plugins
        if (!empty($required_plugins)) {
            add_action('admin_notices', function() use ($required_plugins) {
                echo '<div class="notice notice-error"><p>';
                echo sprintf(
                    __('Media Kit Builder requires the following plugins: %s', 'media-kit-builder'),
                    implode(', ', $required_plugins)
                );
                echo '</p></div>';
            });
        }
    }
    
    /**
     * Load core plugin files
     */
    private function load_core_files() {
        // Load URL routing system (NEW - highest priority)
        require_once MKB_INCLUDES_DIR . 'class-url-router.php';
        
        // Load AJAX handlers (NEW - high priority)
        require_once MKB_INCLUDES_DIR . 'class-ajax-handlers.php';
        
        // Load models if they exist
        $models = array(
            'class-media-kit.php',
            'class-guest-session.php',
            'class-component.php',
            'class-template.php'
        );
        
        foreach ($models as $model) {
            $file = MKB_INCLUDES_DIR . $model;
            if (file_exists($file)) {
                require_once $file;
            }
        }
        
        // Load core systems if they exist (The 7 Core Systems from architecture)
        $core_systems = array(
            'class-session-manager.php',      // Guest session handling
            'class-wpfusion-reader.php',      // WP Fusion tag reading
            'class-pods-integration.php',     // Pods custom field management
            'class-template-manager.php',     // Template storage/switching
            'class-component-registry.php',   // Component management
            'class-builder-state.php',        // Real-time builder state
            'class-export-engine.php'         // PDF generation
        );
        
        foreach ($core_systems as $system) {
            $file = MKB_INCLUDES_DIR . $system;
            if (file_exists($file)) {
                require_once $file;
            }
        }
    }
    
    /**
     * Initialize core systems
     */
    private function init_core_systems() {
        // Initialize URL Router (CRITICAL - this enables the new URL system)
        if (class_exists('Media_Kit_Builder_URL_Router')) {
            $this->core_systems['router'] = new Media_Kit_Builder_URL_Router();
        }
        
        // Initialize AJAX Handlers (CRITICAL - this enables data loading/saving)
        if (class_exists('Media_Kit_Builder_AJAX_Handlers')) {
            $this->core_systems['ajax'] = new Media_Kit_Builder_AJAX_Handlers();
        }
        
        // Initialize other core systems if they exist
        $system_classes = array(
            'session' => 'MKB_Session_Manager',
            'wpfusion' => 'MKB_WPFusion_Reader',
            'pods' => 'MKB_Pods_Integration',
            'templates' => 'MKB_Template_Manager',
            'components' => 'MKB_Component_Registry',
            'state' => 'MKB_Builder_State',
            'export' => 'MKB_Export_Engine'
        );
        
        foreach ($system_classes as $key => $class_name) {
            if (class_exists($class_name)) {
                if (method_exists($class_name, 'instance')) {
                    $this->core_systems[$key] = $class_name::instance();
                } else {
                    $this->core_systems[$key] = new $class_name();
                }
            }
        }
    }
    
    /**
     * Initialize admin interface
     */
    private function init_admin() {
        // Add admin menu for settings and management
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Media Kit Builder', 'media-kit-builder'),
            __('Media Kit Builder', 'media-kit-builder'),
            'manage_options',
            'media-kit-builder',
            array($this, 'admin_page'),
            'dashicons-layout',
            30
        );
        
        add_submenu_page(
            'media-kit-builder',
            __('Settings', 'media-kit-builder'),
            __('Settings', 'media-kit-builder'),
            'manage_options',
            'media-kit-builder-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Admin page callback
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Media Kit Builder', 'media-kit-builder'); ?></h1>
            
            <div class="mkb-admin-content">
                <div class="mkb-admin-card">
                    <h2><?php _e('URL Routing System', 'media-kit-builder'); ?></h2>
                    <p><?php _e('The new URL routing system provides clean, SEO-friendly URLs:', 'media-kit-builder'); ?></p>
                    <ul>
                        <li><strong>Gallery:</strong> <code><?php echo home_url('/media-kit-builder/'); ?></code></li>
                        <li><strong>Edit:</strong> <code><?php echo home_url('/media-kit-builder/[entry-key]'); ?></code></li>
                        <li><strong>New:</strong> <code><?php echo home_url('/media-kit-builder/new'); ?></code></li>
                        <li><strong>Preview:</strong> <code><?php echo home_url('/media-kit-builder/preview/[entry-key]'); ?></code></li>
                    </ul>
                </div>
                
                <div class="mkb-admin-card">
                    <h2><?php _e('System Status', 'media-kit-builder'); ?></h2>
                    <?php $this->show_system_status(); ?>
                </div>
                
                <div class="mkb-admin-card">
                    <h2><?php _e('Quick Actions', 'media-kit-builder'); ?></h2>
                    <p>
                        <a href="<?php echo home_url('/media-kit-builder/'); ?>" class="button button-primary" target="_blank">
                            <?php _e('View Template Gallery', 'media-kit-builder'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=media-kit-builder-settings'); ?>" class="button">
                            <?php _e('Settings', 'media-kit-builder'); ?>
                        </a>
                    </p>
                </div>
            </div>
        </div>
        
        <style>
        .mkb-admin-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .mkb-admin-card {
            background: white;
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            padding: 20px;
        }
        .mkb-admin-card h2 {
            margin-top: 0;
        }
        .mkb-status-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .mkb-status-icon {
            margin-right: 10px;
            font-size: 16px;
        }
        .mkb-status-ok { color: #00a32a; }
        .mkb-status-warning { color: #dba617; }
        .mkb-status-error { color: #d63638; }
        </style>
        <?php
    }
    
    /**
     * Settings page callback
     */
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Media Kit Builder Settings', 'media-kit-builder'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('mkb_settings');
                do_settings_sections('mkb_settings');
                ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Guest Session Duration', 'media-kit-builder'); ?></th>
                        <td>
                            <input type="number" name="mkb_guest_session_duration" value="<?php echo get_option('mkb_guest_session_duration', 7); ?>" min="1" max="30" />
                            <p class="description"><?php _e('Number of days to keep guest sessions (1-30 days)', 'media-kit-builder'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Auto Cleanup', 'media-kit-builder'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="mkb_auto_cleanup_enabled" value="1" <?php checked(get_option('mkb_auto_cleanup_enabled', true)); ?> />
                                <?php _e('Automatically cleanup expired guest sessions', 'media-kit-builder'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Show system status
     */
    private function show_system_status() {
        $systems = array(
            'URL Router' => isset($this->core_systems['router']),
            'AJAX Handlers' => isset($this->core_systems['ajax']),
            'Formidable Forms' => class_exists('FrmEntry'),
            'Pods Framework' => function_exists('pods'),
            'WP Fusion' => function_exists('wp_fusion')
        );
        
        foreach ($systems as $system => $status) {
            $icon = $status ? '✅' : '❌';
            $class = $status ? 'mkb-status-ok' : 'mkb-status-error';
            $text = $status ? __('Active', 'media-kit-builder') : __('Inactive', 'media-kit-builder');
            
            echo "<div class='mkb-status-item'>";
            echo "<span class='mkb-status-icon {$class}'>{$icon}</span>";
            echo "<strong>{$system}:</strong> <span class='{$class}'>{$text}</span>";
            echo "</div>";
        }
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'media-kit-builder') === false) {
            return;
        }
        
        wp_enqueue_style(
            'mkb-admin-style',
            MKB_ASSETS_URL . 'css/admin.css',
            array(),
            MKB_VERSION
        );
    }
    
    /**
     * Setup cleanup cron job
     */
    private function setup_cleanup_cron() {
        if (!wp_next_scheduled('mkb_cleanup_guest_sessions')) {
            wp_schedule_event(time(), 'daily', 'mkb_cleanup_guest_sessions');
        }
        
        add_action('mkb_cleanup_guest_sessions', array($this, 'cleanup_expired_sessions'));
    }
    
    /**
     * Cleanup expired guest sessions
     */
    public function cleanup_expired_sessions() {
        if (!get_option('mkb_auto_cleanup_enabled', true)) {
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM $table_name WHERE expires_at < %s",
            current_time('mysql')
        ));
    }
    
    /**
     * Get core system instance
     * 
     * @param string $system
     * @return object|null
     */
    public function get_system($system) {
        return isset($this->core_systems[$system]) ? $this->core_systems[$system] : null;
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        $this->create_database_tables();
        
        // Set default options
        $this->set_default_options();
        
        // Force flush rewrite rules (CRITICAL for URL routing)
        delete_option('rewrite_rules');
        
        do_action('mkb_activated');
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('mkb_cleanup_guest_sessions');
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        do_action('mkb_deactivated');
    }
    
    /**
     * Create database tables
     */
    private function create_database_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Guest sessions table
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(255) NOT NULL,
            data longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            expires_at datetime NOT NULL,
            last_activity datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY session_id (session_id),
            KEY expires_at (expires_at),
            KEY last_activity (last_activity)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Set default options
     */
    private function set_default_options() {
        add_option('mkb_version', MKB_VERSION);
        add_option('mkb_guest_session_duration', 7); // 7 days
        add_option('mkb_auto_cleanup_enabled', true);
        
        // Register settings
        register_setting('mkb_settings', 'mkb_guest_session_duration');
        register_setting('mkb_settings', 'mkb_auto_cleanup_enabled');
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // Register templates endpoint with proper permission callback
        register_rest_route('media-kit/v1', '/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_templates'),
            'permission_callback' => function() {
                // Allow anyone to access templates
                return true;
            }
        ));
    }
    
    /**
     * REST API callback for templates
     */
    public function get_templates( $request ) {
        // Get template manager
        $template_manager = $this->get_system('templates');
        
        if (!$template_manager) {
            // If template manager is not available, return default templates
            $templates = $this->get_default_templates();
            return new WP_REST_Response($templates, 200);
        }
        
        try {
            // Get templates
            $templates = $template_manager->get_templates();
            
            // If no templates are found, provide default templates
            if (empty($templates)) {
                $templates = $this->get_default_templates();
            }
            
            return new WP_REST_Response($templates, 200);
        } catch (Exception $e) {
            // Log error and return default templates
            error_log('Error getting templates: ' . $e->getMessage());
            $templates = $this->get_default_templates();
            return new WP_REST_Response($templates, 200);
        }
    }
    
    /**
     * Get default templates
     */
    private function get_default_templates() {
        return array(
            'basic-hero' => array(
                'name' => 'Basic Hero',
                'type' => 'hero',
                'layout' => 'full-width',
                'description' => 'Simple hero section with title and image',
                'premium' => false,
                'components' => array(
                    array('type' => 'hero', 'content' => array('name' => 'Your Name', 'title' => 'Your Title'))
                )
            ),
            'two-column-bio' => array(
                'name' => 'Two Column Bio',
                'type' => 'content',
                'layout' => 'two-column',
                'description' => 'Biography with image',
                'premium' => false,
                'components' => array(
                    'left' => array(
                        array('type' => 'biography', 'content' => array('text' => 'Your professional biography goes here...') )
                    ),
                    'right' => array(
                        array('type' => 'image', 'content' => array('url' => '', 'alt' => 'Profile Image') )
                    )
                )
            ),
            'social-links' => array(
                'name' => 'Social Links',
                'type' => 'contact',
                'layout' => 'full-width',
                'description' => 'Social media links',
                'premium' => false,
                'components' => array(
                    array('type' => 'social', 'content' => array())
                )
            )
        );
    }

    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'media-kit-builder',
            false,
            dirname(MKB_PLUGIN_BASENAME) . '/languages'
        );
    }
}

/**
 * Initialize the plugin
 * 
 * @return Media_Kit_Builder
 */
function media_kit_builder() {
    return Media_Kit_Builder::instance();
}

/**
 * Helper function to get plugin instance
 */
function mkb() {
    return media_kit_builder();
}

// Start the plugin
media_kit_builder();
