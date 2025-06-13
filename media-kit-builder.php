<?php
/**
 * Plugin Name: Media Kit Builder
 * Description: Create professional media kits with a drag-and-drop builder
 * Version: 1.0.0
 * Author: Guestify
 * Text Domain: media-kit-builder
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define constants
define('MEDIA_KIT_BUILDER_VERSION', '1.0.0');
define('MEDIA_KIT_BUILDER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MEDIA_KIT_BUILDER_PLUGIN_URL', plugin_dir_url(__FILE__));

// Constants used by the URL router
define('MKB_VERSION', '1.0.0');
define('MKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MKB_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Media Kit Builder Plugin Class
 */
class Media_Kit_Builder {
    /**
     * Instance of this class
     * @var Media_Kit_Builder
     */
    private static $instance;
    
    /**
     * Get instance of this class
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
    private function __construct() {
        // Include required files
        $this->includes();
        
        // Setup hooks
        $this->setup_hooks();
        
        // Ensure REST API is initialized
        add_action('rest_api_init', array($this, 'init_rest_api'));
    }
    
    /**
     * Include required files
     */
    private function includes() {
        // Include admin files
        if (is_admin()) {
            // Use the correct path to admin files
            require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/admin/class-admin-menu.php';
            require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/admin/class-builder-page.php';
        }
        
        // Include core files
        require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/enqueue-scripts.php';
        
        // Include REST API endpoints
        require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/core/class-api-endpoints.php';
        
        // Include URL Router
        require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/class-url-router.php';
        require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/router-integration.php';
    }
    
    /**
     * Setup hooks
     */
    private function setup_hooks() {
        // Register activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Enqueue scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        
        // Load the initializer in the head of all pages to prevent errors
        add_action('wp_head', array($this, 'load_initializer_in_head'));
        add_action('admin_head', array($this, 'load_initializer_in_head'));
        
        // Add shortcode
        add_shortcode('media_kit_builder', array($this, 'media_kit_builder_shortcode'));
        
        // AJAX handlers
        add_action('wp_ajax_mkb_test_ajax', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_nopriv_mkb_test_ajax', array($this, 'ajax_test_connection'));
    }
    
    /**
     * Activation hook
     */
    public function activate() {
        // Create database tables
        $this->create_tables();
        
        // Set default options
        $this->set_default_options();
        
        // Flush rewrite rules to ensure custom URLs work
        flush_rewrite_rules();
    }
    
    /**
     * Deactivation hook
     */
    public function deactivate() {
        // Cleanup tasks
        
        // Flush rewrite rules to remove custom URLs
        flush_rewrite_rules();
    }
    
    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;
        
        // Table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            // Create table
            $charset_collate = $wpdb->get_charset_collate();
            
            $sql = "CREATE TABLE $table_name (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                entry_key varchar(255) NOT NULL,
                user_id bigint(20) NOT NULL,
                formidable_key varchar(255),
                post_id bigint(20),
                data longtext NOT NULL,
                created datetime NOT NULL,
                modified datetime NOT NULL,
                PRIMARY KEY  (id),
                UNIQUE KEY entry_key (entry_key),
                KEY user_id (user_id)
            ) $charset_collate;";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
    }
    
    /**
     * Set default options
     */
    private function set_default_options() {
        // Set default options
        $default_options = array(
            'version' => MEDIA_KIT_BUILDER_VERSION,
            'enable_guest_access' => true,
            'enable_pdf_export' => true,
            'enable_social_sharing' => true
        );
        
        // Update options
        update_option('media_kit_builder_options', $default_options);
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Only enqueue on our plugin page
        if ($hook !== 'toplevel_page_media-kit-builder') {
            return;
        }
        
        // Enqueue jQuery UI
        wp_enqueue_script('jquery-ui-core');
        wp_enqueue_script('jquery-ui-sortable');
        wp_enqueue_script('jquery-ui-draggable');
        wp_enqueue_script('jquery-ui-droppable');
        
        // Enqueue WordPress media uploader
        wp_enqueue_media();
        
        // Load polyfill.io for automatic browser polyfills
        wp_enqueue_script(
            'polyfill-io',
            'https://polyfill.io/v3/polyfill.min.js?features=default,Array.prototype.find,Promise,Element.prototype.closest',
            array(),
            null,
            false // Load in header
        );
        
        // Load cross-browser compatibility script before anything else
        wp_enqueue_script(
            'media-kit-builder-compatibility',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/compatibility.js',
            array('jquery'),
            MEDIA_KIT_BUILDER_VERSION,
            false // Load in header
        );
        
        // CRITICAL: First load the standalone initializer to set up the global namespace
        wp_enqueue_script(
            'media-kit-builder-initializer',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/standalone-initializer.js',
            array('jquery', 'media-kit-builder-compatibility'),
            MEDIA_KIT_BUILDER_VERSION,
            false // Load in header, not footer
        );
        
        // STEP 2: Load the regular initializer
        wp_enqueue_script(
            'media-kit-builder-initializer-full',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/initializer.js',
            array('jquery', 'media-kit-builder-initializer'),
            MEDIA_KIT_BUILDER_VERSION,
            false // Load in header
        );
        
        // STEP 3: Enqueue main builder script
        wp_enqueue_script(
            'media-kit-builder',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder.js',
            array('jquery', 'media-kit-builder-initializer', 'media-kit-builder-initializer-full'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        // STEP 4: Enqueue WordPress adapter
        wp_enqueue_script(
            'media-kit-builder-wordpress',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder-wordpress.js',
            array('jquery', 'media-kit-builder'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        // Enqueue additional scripts
        wp_enqueue_script(
            'media-kit-builder-premium',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/premium-access-control.js',
            array('jquery', 'media-kit-builder-wordpress'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        wp_enqueue_script(
            'media-kit-builder-templates',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/section-templates.js',
            array('jquery', 'media-kit-builder-wordpress'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        wp_enqueue_script(
            'media-kit-builder-export',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/export.js',
            array('jquery', 'media-kit-builder-wordpress'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        // Enqueue debug helper if WP_DEBUG is enabled
        if (defined('WP_DEBUG') && WP_DEBUG) {
            wp_enqueue_script(
                'media-kit-builder-debug',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/debug-helper.js',
                array('jquery', 'media-kit-builder-wordpress'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
        }
        
        // CRITICAL: First ensure template manager is loaded
        wp_enqueue_script(
            'media-kit-builder-template-manager',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/template-manager.js',
            array('jquery', 'media-kit-builder-wordpress'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        // CRITICAL: Load builder exports to ensure all classes are properly exposed globally
        wp_enqueue_script(
            'media-kit-builder-exports',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder-exports.js',
            array('jquery', 'media-kit-builder-wordpress', 'media-kit-builder-premium', 'media-kit-builder-templates', 'media-kit-builder-template-manager'),
            MEDIA_KIT_BUILDER_VERSION,
            true
        );
        
        // Enqueue core builder styles
        wp_enqueue_style(
            'media-kit-builder',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/builder.css',
            array(),
            MEDIA_KIT_BUILDER_VERSION
        );
        
        // Enqueue component styles
        wp_enqueue_style(
            'media-kit-builder-components',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/components.css',
            array('media-kit-builder'),
            MEDIA_KIT_BUILDER_VERSION
        );
        
        // Enqueue WordPress admin compatibility styles
        wp_enqueue_style(
            'media-kit-builder-wp-admin',
            MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/wp-admin-compat.css',
            array('media-kit-builder', 'media-kit-builder-components'),
            MEDIA_KIT_BUILDER_VERSION
        );
		
// Temporarily load the performance validation script if the URL parameter is present
if (isset($_GET['test']) && $_GET['test'] === 'performance') {
    wp_enqueue_script(
        'media-kit-builder-performance-validation',
        MEDIA_KIT_BUILDER_PLUGIN_URL . 'tests/integration/performance-validation.js',
        array('media-kit-builder-exports'), // Depends on your main scripts
        MEDIA_KIT_BUILDER_VERSION,
        true // Load in the footer
    );
}
        
        // Pass data to JavaScript
        wp_localize_script('media-kit-builder-wordpress', 'mkbData', array(
            // Primary API - REST API
            'apiType' => 'rest',
            'restUrl' => rest_url('media-kit/v1/'),
            'restNonce' => wp_create_nonce('wp_rest'),
            
            // Legacy AJAX - kept for backward compatibility
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('media_kit_builder_nonce'),
            
            // User information
            'userId' => get_current_user_id(),
            'userCapabilities' => $this->get_user_capabilities(),
            'isAdmin' => current_user_can('manage_options'),
            'accessTier' => $this->get_user_access_tier(),
            
            // Plugin info
            'pluginUrl' => MEDIA_KIT_BUILDER_PLUGIN_URL,
            'assetsUrl' => MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/',
            'debugMode' => defined('WP_DEBUG') && WP_DEBUG
        ));
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_scripts() {
        // Only enqueue on pages with the shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'media_kit_builder')) {
            // Enqueue jQuery UI
            wp_enqueue_script('jquery-ui-core');
            wp_enqueue_script('jquery-ui-sortable');
            wp_enqueue_script('jquery-ui-draggable');
            wp_enqueue_script('jquery-ui-droppable');
            
            // Enqueue WordPress media uploader
            wp_enqueue_media();
            
            // Load polyfill.io for automatic browser polyfills
            wp_enqueue_script(
                'polyfill-io',
                'https://polyfill.io/v3/polyfill.min.js?features=default,Array.prototype.find,Promise,Element.prototype.closest',
                array(),
                null,
                false // Load in header
            );
            
            // Load cross-browser compatibility script before anything else
            wp_enqueue_script(
                'media-kit-builder-compatibility',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/compatibility.js',
                array('jquery'),
                MEDIA_KIT_BUILDER_VERSION,
                false // Load in header
            );
            
            // CRITICAL: First load the standalone initializer to set up the global namespace
            wp_enqueue_script(
                'media-kit-builder-initializer',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/standalone-initializer.js',
                array('jquery', 'media-kit-builder-compatibility'),
                MEDIA_KIT_BUILDER_VERSION,
                false // Load in header, not footer
            );
            
            // STEP 2: Load the regular initializer
            wp_enqueue_script(
                'media-kit-builder-initializer-full',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/initializer.js',
                array('jquery', 'media-kit-builder-initializer'),
                MEDIA_KIT_BUILDER_VERSION,
                false // Load in header
            );
            
            // STEP 3: Enqueue main builder script
            wp_enqueue_script(
                'media-kit-builder',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder.js',
                array('jquery', 'media-kit-builder-initializer', 'media-kit-builder-initializer-full'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            // STEP 4: Enqueue WordPress adapter
            wp_enqueue_script(
                'media-kit-builder-wordpress',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder-wordpress.js',
                array('jquery', 'media-kit-builder'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            // Enqueue additional scripts
            wp_enqueue_script(
                'media-kit-builder-premium',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/premium-access-control.js',
                array('jquery', 'media-kit-builder-wordpress'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            wp_enqueue_script(
                'media-kit-builder-templates',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/section-templates.js',
                array('jquery', 'media-kit-builder-wordpress'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            wp_enqueue_script(
                'media-kit-builder-export',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/export.js',
                array('jquery', 'media-kit-builder-wordpress'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            // CRITICAL: First ensure template manager is loaded for frontend
            wp_enqueue_script(
                'media-kit-builder-template-manager-frontend',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/template-manager.js',
                array('jquery', 'media-kit-builder-wordpress'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            // CRITICAL: Load builder exports for frontend
            wp_enqueue_script(
                'media-kit-builder-exports-frontend',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/builder-exports.js',
                array('jquery', 'media-kit-builder-wordpress', 'media-kit-builder-premium', 'media-kit-builder-templates', 'media-kit-builder-template-manager-frontend'),
                MEDIA_KIT_BUILDER_VERSION,
                true
            );
            
            // Enqueue core builder styles
            wp_enqueue_style(
                'media-kit-builder',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/builder.css',
                array(),
                MEDIA_KIT_BUILDER_VERSION
            );
            
            // Enqueue component styles
            wp_enqueue_style(
                'media-kit-builder-components',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/components.css',
                array('media-kit-builder'),
                MEDIA_KIT_BUILDER_VERSION
            );
            
            // Enqueue frontend styles for public-facing pages
            wp_enqueue_style(
                'media-kit-builder-frontend',
                MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/css/frontend.css',
                array('media-kit-builder', 'media-kit-builder-components'),
                MEDIA_KIT_BUILDER_VERSION
            );
            
            // Pass data to JavaScript
            wp_localize_script('media-kit-builder-wordpress', 'mkbData', array(
                // Primary API - REST API
                'apiType' => 'rest',
                'restUrl' => rest_url('media-kit/v1/'),
                'restNonce' => wp_create_nonce('wp_rest'),
                
                // Legacy AJAX - kept for backward compatibility
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('media_kit_builder_nonce'),
                
                // User information
                'userId' => get_current_user_id(),
                'userCapabilities' => $this->get_user_capabilities(),
                'isAdmin' => current_user_can('manage_options'),
                'accessTier' => $this->get_user_access_tier(),
                
                // Plugin info
                'pluginUrl' => MEDIA_KIT_BUILDER_PLUGIN_URL,
                'assetsUrl' => MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/',
                'debugMode' => defined('WP_DEBUG') && WP_DEBUG
            ));
        }
    }
    
    /**
     * Get user capabilities
     * @return array
     */
    private function get_user_capabilities() {
        $capabilities = array(
            'basic_components' => true
        );
        
        // Check if user is logged in
        if (is_user_logged_in()) {
            $capabilities['save_kit'] = true;
            
            // Check if user has premium access
            if ($this->has_premium_access()) {
                $capabilities['premium_components'] = true;
                $capabilities['premium_templates'] = true;
                $capabilities['export_pdf'] = true;
            }
            
            // Check if user has agency access
            if ($this->has_agency_access()) {
                $capabilities['white_label'] = true;
            }
        }
        
        return $capabilities;
    }
    
    /**
     * Get user access tier
     * @return string
     */
    private function get_user_access_tier() {
        // Default to guest
        $tier = 'guest';
        
        // Check if user is logged in
        if (is_user_logged_in()) {
            $tier = 'free';
            
            // Check if WP Fusion is active
            if (function_exists('wp_fusion')) {
                // Get user tags
                $user_tags = wp_fusion()->user->get_tags();
                
                // Check for agency tag
                if (in_array('agency', $user_tags)) {
                    $tier = 'agency';
                }
                // Check for pro tag
                else if (in_array('pro', $user_tags)) {
                    $tier = 'pro';
                }
            } else {
                // Check for custom capabilities or roles
                if (current_user_can('manage_options')) {
                    $tier = 'agency';
                } else if (current_user_can('edit_pages')) {
                    $tier = 'pro';
                }
            }
        }
        
        return $tier;
    }
    
    /**
     * Check if user has premium access
     * @return boolean
     */
    private function has_premium_access() {
        // Admin always has premium access
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check if WP Fusion is active
        if (function_exists('wp_fusion')) {
            // Get user tags
            $user_tags = wp_fusion()->user->get_tags();
            
            // Check for premium tags
            if (in_array('pro', $user_tags) || in_array('agency', $user_tags)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if user has agency access
     * @return boolean
     */
    private function has_agency_access() {
        // Admin always has agency access
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check if WP Fusion is active
        if (function_exists('wp_fusion')) {
            // Get user tags
            $user_tags = wp_fusion()->user->get_tags();
            
            // Check for agency tag
            if (in_array('agency', $user_tags)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Load initializer script in head
     * 
     * We use this method to ensure the initializer is loaded early, before any other scripts,
     * but we're careful not to output it on pages where the builder is being loaded properly.
     */
    public function load_initializer_in_head() {
        // Don't output on admin pages where we're already loading the builder
        if (is_admin() && function_exists('get_current_screen')) {
            $screen = get_current_screen();
            if ($screen && $screen->id === 'toplevel_page_media-kit-builder') {
                return;
            }
        }
        
        // Don't output on pages with the media kit shortcode
        global $post;
        if (!is_admin() && is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'media_kit_builder')) {
            return;
        }
        
        // Don't output on the custom builder URLs
        if (get_query_var('mkb_page')) {
            return;
        }
        
        // Output the compatibility and initializer scripts directly in the head for other pages
        echo '<script src="https://polyfill.io/v3/polyfill.min.js?features=default,Array.prototype.find,Promise,Element.prototype.closest"></script>';
        echo '<script src="' . MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/compatibility.js?ver=' . MEDIA_KIT_BUILDER_VERSION . '"></script>';
        echo '<script src="' . MEDIA_KIT_BUILDER_PLUGIN_URL . 'assets/js/standalone-initializer.js?ver=' . MEDIA_KIT_BUILDER_VERSION . '"></script>';
    }
    
    /**
     * Media Kit Builder shortcode
     * @param array $atts
     * @return string
     */
    public function media_kit_builder_shortcode($atts) {
        // Parse attributes
        $atts = shortcode_atts(array(
            'entry_key' => '',
            'formidable_key' => '',
            'post_id' => '',
            'template' => 'default'
        ), $atts);
        
        // Start output buffering
        ob_start();
        
        // Include builder template
        include MEDIA_KIT_BUILDER_PLUGIN_DIR . 'templates/builder.php';
        
        // Return buffered content
        return ob_get_clean();
    }
    
    /**
     * Initialize REST API
     */
    public function init_rest_api() {
        // Ensure our API class is loaded
        if (!class_exists('MKB_API_Endpoints')) {
            require_once MEDIA_KIT_BUILDER_PLUGIN_DIR . 'includes/core/class-api-endpoints.php';
            
            // Initialize the class if not already done
            MKB_API_Endpoints::instance();
        }
    }
    
    /**
     * AJAX handler for testing the connection
     */
    public function ajax_test_connection() {
        // Verify nonce for security (but don't die for test connection)
        // This allows the initial connection test to succeed even if nonce is missing
        $verified = false;
        if (isset($_REQUEST['nonce'])) {
            $verified = wp_verify_nonce($_REQUEST['nonce'], 'media_kit_builder_nonce');
        }
        
        wp_send_json_success(array(
            'message' => 'Connection successful!',
            'timestamp' => current_time('mysql'),
            'nonce_verified' => $verified
        ));
    }
}

// Initialize the plugin
function media_kit_builder() {
    return Media_Kit_Builder::instance();
}

// Start the plugin
media_kit_builder();
