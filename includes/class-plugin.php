<?php
/**
 * Media Kit Builder Plugin Core Class
 * 
 * This class handles the core plugin functionality and coordinates
 * between all systems following the Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Plugin Class
 * 
 * Core plugin functionality coordinator
 */
class MKB_Plugin {
    
    /**
     * Plugin instance
     * @var MKB_Plugin
     */
    private static $instance = null;
    
    /**
     * Plugin data
     * @var array
     */
    private $plugin_data = array();
    
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
        $this->init_hooks();
        $this->load_plugin_data();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // WordPress hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'frontend_enqueue_scripts'));
        
        // Custom hooks
        add_action('mkb_daily_cleanup', array($this, 'daily_cleanup'));
        
        // Schedule cleanup if not already scheduled
        if (!wp_next_scheduled('mkb_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'mkb_daily_cleanup');
        }
        
        // Shortcodes
        add_shortcode('media_kit_builder', array($this, 'media_kit_builder_shortcode'));
    }
    
    /**
     * Load plugin data
     */
    private function load_plugin_data() {
        if (!function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        $this->plugin_data = get_plugin_data(MKB_PLUGIN_FILE);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Main menu page
        add_menu_page(
            __('Media Kit Builder', 'media-kit-builder'),
            __('Media Kit Builder', 'media-kit-builder'),
            'manage_options',
            'media-kit-builder',
            array($this, 'admin_page'),
            'dashicons-id-alt',
            30
        );
        
        // Submenu pages
        add_submenu_page(
            'media-kit-builder',
            __('Builder', 'media-kit-builder'),
            __('Builder', 'media-kit-builder'),
            'edit_posts',
            'media-kit-builder',
            array($this, 'admin_page')
        );
        
        add_submenu_page(
            'media-kit-builder',
            __('Templates', 'media-kit-builder'),
            __('Templates', 'media-kit-builder'),
            'edit_posts',
            'mkb-templates',
            array($this, 'templates_page')
        );
        
        add_submenu_page(
            'media-kit-builder',
            __('Settings', 'media-kit-builder'),
            __('Settings', 'media-kit-builder'),
            'manage_options',
            'mkb-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Admin page content
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <div id="mkb-builder-root" class="mkb-builder-container"></div>
        </div>
        <?php
    }
    
    /**
     * Templates page content
     */
    public function templates_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Media Kit Templates', 'media-kit-builder'); ?></h1>
            <div id="mkb-templates-root" class="mkb-templates-container"></div>
        </div>
        <?php
    }
    
    /**
     * Settings page content
     */
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Media Kit Builder Settings', 'media-kit-builder'); ?></h1>
            <div id="mkb-settings-root" class="mkb-settings-container"></div>
        </div>
        <?php
    }
    
    /**
     * Enqueue admin scripts
     */
    public function admin_enqueue_scripts($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'media-kit-builder') === false && strpos($hook, 'mkb-') === false) {
            return;
        }
        
        $this->enqueue_react();
        $this->enqueue_builder_assets();
    }
    
    /**
     * Enqueue frontend scripts
     */
    public function frontend_enqueue_scripts() {
        // Only load when needed
        if (!$this->needs_builder_on_frontend()) {
            return;
        }
        
        $this->enqueue_react();
        $this->enqueue_builder_assets();
    }
    
    /**
     * Enqueue React dependencies
     */
    private function enqueue_react() {
        $react_mode = (defined('WP_DEBUG') && WP_DEBUG) ? 'development' : 'production.min';
        
        // React
        wp_enqueue_script(
            'mkb-react',
            "https://unpkg.com/react@18/umd/react.{$react_mode}.js",
            array(),
            '18.2.0',
            true
        );
        
        // React DOM
        wp_enqueue_script(
            'mkb-react-dom',
            "https://unpkg.com/react-dom@18/umd/react-dom.{$react_mode}.js",
            array('mkb-react'),
            '18.2.0',
            true
        );
    }
    
    /**
     * Enqueue builder assets
     */
    private function enqueue_builder_assets() {
        // Main builder script - check if built version exists, fallback to dev
        $builder_script = file_exists(MKB_BUILD_DIR . 'builder.js') 
            ? MKB_BUILD_URL . 'builder.js'
            : MKB_APP_URL . 'src/builder.js';
            
        wp_enqueue_script(
            'mkb-builder',
            $builder_script,
            array('mkb-react', 'mkb-react-dom', 'jquery'),
            MKB_VERSION,
            true
        );
        
        // Builder styles
        $builder_style = file_exists(MKB_BUILD_DIR . 'builder.css')
            ? MKB_BUILD_URL . 'builder.css'
            : MKB_APP_URL . 'src/builder.css';
            
        wp_enqueue_style(
            'mkb-builder-styles',
            $builder_style,
            array(),
            MKB_VERSION
        );
        
        // Localize script with all necessary data
        wp_localize_script('mkb-builder', 'mkbConfig', $this->get_script_config());
        
        // Add inline script to ensure proper initialization
        wp_add_inline_script('mkb-builder', $this->get_initialization_script(), 'after');
    }
    
    /**
     * Get script configuration
     * 
     * @return array
     */
    private function get_script_config() {
        $session_manager = media_kit_builder()->get_system('session');
        
        return array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_nonce'),
            'pluginUrl' => MKB_PLUGIN_URL,
            'buildUrl' => MKB_BUILD_URL,
            'appUrl' => MKB_APP_URL,
            'version' => MKB_VERSION,
            'debug' => (defined('WP_DEBUG') && WP_DEBUG),
            'userId' => get_current_user_id(),
            'isGuest' => !is_user_logged_in(),
            'guestSessionId' => $session_manager ? $session_manager->get_guest_session_id() : null,
            'isAdmin' => is_admin(),
            'currentScreen' => $this->get_current_screen(),
            'userCapabilities' => $this->get_user_capabilities(),
            'wpFusionTags' => $this->get_wpfusion_tags(),
            'strings' => array(
                'loading' => __('Loading...', 'media-kit-builder'),
                'saving' => __('Saving...', 'media-kit-builder'),
                'saved' => __('Saved', 'media-kit-builder'),
                'error' => __('Error', 'media-kit-builder'),
                'success' => __('Success', 'media-kit-builder')
            )
        );
    }
    
    /**
     * Get initialization script
     * 
     * @return string
     */
    private function get_initialization_script() {
        return "
        // Media Kit Builder Initialization
        jQuery(document).ready(function($) {
            console.log('🚀 Media Kit Builder initializing...');
            
            // Wait for React to be available
            function waitForReact(callback, attempts = 0) {
                if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && ReactDOM.createRoot) {
                    console.log('✅ React loaded successfully');
                    callback();
                } else if (attempts < 50) {
                    setTimeout(() => waitForReact(callback, attempts + 1), 100);
                } else {
                    console.error('❌ React failed to load');
                }
            }
            
            // Initialize builder when React is ready
            waitForReact(function() {
                if (typeof window.MediaKitBuilder !== 'undefined') {
                    console.log('✅ MediaKitBuilder found, initializing...');
                    
                    // Find mount points and initialize
                    const builderRoot = document.getElementById('mkb-builder-root');
                    const templatesRoot = document.getElementById('mkb-templates-root');
                    const settingsRoot = document.getElementById('mkb-settings-root');
                    
                    if (builderRoot) {
                        window.MediaKitBuilder.mount(builderRoot, {
                            mode: 'builder',
                            config: window.mkbConfig || {}
                        });
                    }
                    
                    if (templatesRoot) {
                        window.MediaKitBuilder.mount(templatesRoot, {
                            mode: 'templates',
                            config: window.mkbConfig || {}
                        });
                    }
                    
                    if (settingsRoot) {
                        window.MediaKitBuilder.mount(settingsRoot, {
                            mode: 'settings',
                            config: window.mkbConfig || {}
                        });
                    }
                } else {
                    console.error('❌ MediaKitBuilder not found');
                }
            });
        });
        ";
    }
    
    /**
     * Get current screen identifier
     * 
     * @return string
     */
    private function get_current_screen() {
        if (is_admin()) {
            $screen = get_current_screen();
            if ($screen && strpos($screen->id, 'media-kit-builder') !== false) {
                return 'builder';
            }
            if ($screen && strpos($screen->id, 'mkb-templates') !== false) {
                return 'templates';
            }
            if ($screen && strpos($screen->id, 'mkb-settings') !== false) {
                return 'settings';
            }
        }
        return 'frontend';
    }
    
    /**
     * Get user capabilities for access control
     * 
     * @return array
     */
    private function get_user_capabilities() {
        if (!is_user_logged_in()) {
            return array('guest' => true);
        }
        
        $current_user = wp_get_current_user();
        
        return array(
            'canEdit' => current_user_can('edit_posts'),
            'canManage' => current_user_can('manage_options'),
            'canPublish' => current_user_can('publish_posts'),
            'canUpload' => current_user_can('upload_files'),
            'roles' => $current_user->roles
        );
    }
    
    /**
     * Get WP Fusion tags for access control
     * 
     * @return array
     */
    private function get_wpfusion_tags() {
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        
        if ($wpfusion_reader) {
            return $wpfusion_reader->get_user_tags();
        }
        
        return array();
    }
    
    /**
     * Check if builder is needed on frontend
     * 
     * @return bool
     */
    private function needs_builder_on_frontend() {
        global $post;
        
        // Check for shortcode
        if ($post && has_shortcode($post->post_content, 'media_kit_builder')) {
            return true;
        }
        
        // Check for Gutenberg block
        if ($post && has_block('media-kit-builder/builder', $post)) {
            return true;
        }
        
        // Check for query parameter (for direct links)
        if (isset($_GET['mkb_builder']) && $_GET['mkb_builder'] === '1') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Media Kit Builder shortcode
     * 
     * @param array $atts
     * @return string
     */
    public function media_kit_builder_shortcode($atts) {
        $atts = shortcode_atts(array(
            'mode' => 'builder',
            'template' => '',
            'user_id' => '',
            'guest_session' => ''
        ), $atts);
        
        $container_id = 'mkb-builder-' . uniqid();
        
        // Enqueue scripts if not already done
        $this->enqueue_react();
        $this->enqueue_builder_assets();
        
        // Add inline script for this specific instance
        wp_add_inline_script('mkb-builder', "
            jQuery(document).ready(function() {
                if (typeof window.MediaKitBuilder !== 'undefined') {
                    const container = document.getElementById('{$container_id}');
                    if (container) {
                        window.MediaKitBuilder.mount(container, {
                            mode: '{$atts['mode']}',
                            template: '{$atts['template']}',
                            userId: '{$atts['user_id']}',
                            guestSession: '{$atts['guest_session']}',
                            config: window.mkbConfig || {}
                        });
                    }
                }
            });
        ");
        
        return "<div id='{$container_id}' class='mkb-shortcode-container'></div>";
    }
    
    /**
     * Daily cleanup task
     */
    public function daily_cleanup() {
        $session_manager = media_kit_builder()->get_system('session');
        
        if ($session_manager) {
            $session_manager->cleanup_expired_sessions();
        }
        
        do_action('mkb_daily_cleanup_complete');
    }
    
    /**
     * Get plugin data
     * 
     * @param string $key
     * @return mixed
     */
    public function get_plugin_data($key = null) {
        if ($key) {
            return isset($this->plugin_data[$key]) ? $this->plugin_data[$key] : null;
        }
        
        return $this->plugin_data;
    }
}
