<?php
/**
 * WordPress Enqueue Scripts Manager - Phase 3 Day 15 Completion
 * Manages asset loading and optimization for React Builder Integration
 * 
 * Handles conditional loading, caching, and performance optimization
 * Integrates with webpack build system and WordPress asset pipeline
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class Guestify_Enqueue_Manager {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Asset manifest for cache busting
     */
    private $asset_manifest = null;
    
    /**
     * Plugin directory paths
     */
    private $plugin_url;
    private $plugin_path;
    
    /**
     * Performance tracking
     */
    private $performance_data = array();

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
     * Constructor
     */
    private function __construct() {
        // Use WordPress constants if available, otherwise calculate
        if (defined('MKB_PLUGIN_URL')) {
            $this->plugin_url = MKB_PLUGIN_URL;
        } else {
            $this->plugin_url = plugin_dir_url(dirname(__FILE__) . '/../');
        }
        
        if (defined('MKB_PLUGIN_DIR')) {
            $this->plugin_path = MKB_PLUGIN_DIR;
        } else {
            $this->plugin_path = plugin_dir_path(dirname(__FILE__) . '/../');
        }
        
        $this->load_asset_manifest();
        $this->init();
    }

    /**
     * Initialize enqueue system
     */
    private function init() {
        // WordPress hooks
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'), 10);
        add_action('wp_enqueue_scripts', array($this, 'frontend_enqueue_scripts'), 10);
        add_action('enqueue_block_editor_assets', array($this, 'block_editor_enqueue_scripts'), 10);
        
        // Optimization hooks
        add_action('wp_head', array($this, 'add_preload_links'), 1);
        add_action('wp_footer', array($this, 'add_performance_monitoring'), 999);
        add_filter('script_loader_tag', array($this, 'add_script_attributes'), 10, 3);
        add_filter('style_loader_tag', array($this, 'add_style_attributes'), 10, 4);
        
        // Asset optimization
        add_action('wp_print_scripts', array($this, 'optimize_script_loading'));
        add_action('wp_print_styles', array($this, 'optimize_style_loading'));
    }

    /**
     * Load asset manifest for production builds
     */
    private function load_asset_manifest() {
        $manifest_path = $this->plugin_path . 'app/build/asset-manifest.json';
        
        if (file_exists($manifest_path)) {
            $manifest_content = file_get_contents($manifest_path);
            $this->asset_manifest = json_decode($manifest_content, true);
        }
    }

    /**
     * Admin script enqueuing
     */
    public function admin_enqueue_scripts($hook) {
        // Only load on media kit builder pages
        if (!$this->should_load_on_admin_page($hook)) {
            return;
        }

        $start_time = microtime(true);
        
        // Core React application
        $this->enqueue_react_core();
        
        // WordPress admin integration
        $this->enqueue_admin_integration();
        
        // Component libraries
        $this->enqueue_component_libraries();
        
        // Admin-specific styles
        $this->enqueue_admin_styles();
        
        // Localization and configuration
        $this->localize_admin_scripts();
        
        // Track performance
        $this->performance_data['admin_enqueue_time'] = (microtime(true) - $start_time) * 1000;
    }

    /**
     * Frontend script enqueuing
     */
    public function frontend_enqueue_scripts() {
        // Only load when needed
        if (!$this->should_load_on_frontend()) {
            return;
        }

        $start_time = microtime(true);
        
        // Core React application
        $this->enqueue_react_core();
        
        // Frontend-specific components
        $this->enqueue_frontend_components();
        
        // Frontend styles
        $this->enqueue_frontend_styles();
        
        // Localization
        $this->localize_frontend_scripts();
        
        // Track performance
        $this->performance_data['frontend_enqueue_time'] = (microtime(true) - $start_time) * 1000;
    }

    /**
     * Block editor script enqueuing
     */
    public function block_editor_enqueue_scripts() {
        // Media Kit Builder block
        $this->enqueue_block_editor_integration();
    }

    /**
     * Enqueue React core application
     */
    private function enqueue_react_core() {
        $is_dev = defined('WP_DEBUG') && WP_DEBUG;
        
        // Enqueue React and ReactDOM from CDN if not available
        $this->enqueue_react_dependencies();
        
        // ES Module compatibility script (load before React modules)
        wp_enqueue_script(
            'mkb-es-module-fix',
            $this->plugin_url . 'assets/js/es-module-fix.js',
            array(),
            $this->get_file_version('assets/js/es-module-fix.js'),
            false // Load in header
        );
        
        // State management (load first as dependency)
        wp_enqueue_script(
            'mkb-state',
            $this->get_asset_url('js/state.js'),
            array('mkb-es-module-fix'),
            $this->get_asset_version('js/state.js'),
            true
        );

        // Component registry (depends on state)
        wp_enqueue_script(
            'mkb-components',
            $this->get_asset_url('js/components.js'),
            array('mkb-state'),
            $this->get_asset_version('js/components.js'),
            true
        );

        // Main builder application (depends on components and state)
        wp_enqueue_script(
            'mkb-builder-app',
            $this->get_asset_url('js/builder.js'),
            array('mkb-components', 'mkb-state'),
            $this->get_asset_version('js/builder.js'),
            true
        );

        // Main CSS (check if exists before enqueuing)
        $css_path = $this->plugin_path . 'app/build/css/builder.css';
        if (file_exists($css_path)) {
            wp_enqueue_style(
                'mkb-builder-css',
                $this->get_asset_url('css/builder.css'),
                array(),
                $this->get_asset_version('css/builder.css')
            );
        }
    }
    
    /**
     * Enqueue React dependencies
     */
    private function enqueue_react_dependencies() {
        // Check if React is already loaded by another plugin/theme
        if (!wp_script_is('react', 'registered') && !wp_script_is('react', 'enqueued')) {
            wp_enqueue_script(
                'react',
                'https://unpkg.com/react@18/umd/react.development.js',
                array(),
                '18.2.0',
                false
            );
            
            wp_enqueue_script(
                'react-dom',
                'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
                array('react'),
                '18.2.0',
                false
            );
        }
    }

    /**
     * Enqueue admin integration scripts
     */
    private function enqueue_admin_integration() {
        // WordPress admin compatibility
        wp_enqueue_script('jquery');
        wp_enqueue_script('wp-api');
        wp_enqueue_media();
        
        // Admin-specific functionality (load after React modules)
        wp_enqueue_script(
            'mkb-admin-integration',
            $this->plugin_url . 'assets/js/admin-integration.js',
            array('mkb-builder-app', 'jquery', 'react', 'react-dom'),
            $this->get_file_version('assets/js/admin-integration.js'),
            true
        );
        
        // Debug helper in development mode
        if (defined('WP_DEBUG') && WP_DEBUG) {
            wp_enqueue_script(
                'mkb-debug-helper',
                $this->plugin_url . 'assets/js/debug-helper.js',
                array('mkb-admin-integration'),
                $this->get_file_version('assets/js/debug-helper.js'),
                true
            );
        }
    }

    /**
     * Enqueue component libraries
     */
    private function enqueue_component_libraries() {
        // Drag and drop library
        wp_enqueue_script(
            'mkb-drag-drop',
            $this->plugin_url . 'assets/js/drag-drop-integration.js',
            array('mkb-builder-app'),
            $this->get_file_version('assets/js/drag-drop-integration.js'),
            true
        );

        // Template system
        wp_enqueue_script(
            'mkb-template-system',
            $this->plugin_url . 'assets/js/template-system.js',
            array('mkb-builder-app'),
            $this->get_file_version('assets/js/template-system.js'),
            true
        );
    }

    /**
     * Enqueue admin styles
     */
    private function enqueue_admin_styles() {
        wp_enqueue_style(
            'mkb-admin-styles',
            $this->plugin_url . 'assets/css/admin.css',
            array('mkb-builder-css'),
            $this->get_file_version('assets/css/admin.css')
        );

        // WordPress admin compatibility styles
        wp_enqueue_style(
            'mkb-wp-admin-compat',
            $this->plugin_url . 'assets/css/wp-admin-compat.css',
            array('mkb-admin-styles'),
            $this->get_file_version('assets/css/wp-admin-compat.css')
        );
    }

    /**
     * Enqueue frontend components
     */
    private function enqueue_frontend_components() {
        // Public viewer component
        wp_enqueue_script(
            'mkb-public-viewer',
            $this->plugin_url . 'assets/js/public-viewer.js',
            array('mkb-builder-app'),
            $this->get_file_version('assets/js/public-viewer.js'),
            true
        );
    }

    /**
     * Enqueue frontend styles
     */
    private function enqueue_frontend_styles() {
        wp_enqueue_style(
            'mkb-frontend-styles',
            $this->plugin_url . 'assets/css/frontend.css',
            array('mkb-builder-css'),
            $this->get_file_version('assets/css/frontend.css')
        );
    }

    /**
     * Enqueue block editor integration
     */
    private function enqueue_block_editor_integration() {
        wp_enqueue_script(
            'mkb-block-editor',
            $this->plugin_url . 'assets/js/block-editor.js',
            array('wp-blocks', 'wp-element', 'wp-editor'),
            $this->get_file_version('assets/js/block-editor.js'),
            true
        );
    }

    /**
     * Localize admin scripts
     */
    private function localize_admin_scripts() {
        $config = $this->get_localization_config();
        
        // Add admin-specific config
        $config['isAdmin'] = true;
        $config['adminUrl'] = admin_url();
        $config['currentScreen'] = get_current_screen();
        $config['userCapabilities'] = $this->get_admin_capabilities();
        
        wp_localize_script('mkb-builder-app', 'mkbConfig', $config);
    }

    /**
     * Localize frontend scripts
     */
    private function localize_frontend_scripts() {
        $config = $this->get_localization_config();
        
        // Add frontend-specific config
        $config['isAdmin'] = false;
        $config['isPublic'] = true;
        $config['readonly'] = !current_user_can('edit_posts');
        
        wp_localize_script('mkb-builder-app', 'mkbConfig', $config);
    }

    /**
     * Get base localization configuration
     */
    private function get_localization_config() {
        $current_user = wp_get_current_user();
        
        return array(
            // Core settings
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('mkb/v1/'),
            'nonce' => wp_create_nonce('mkb_builder_nonce'),
            'version' => MKB_VERSION,
            'buildDate' => defined('MKB_BUILD_DATE') ? MKB_BUILD_DATE : date('c'),
            
            // User context
            'userId' => $current_user->ID,
            'isLoggedIn' => is_user_logged_in(),
            'userDisplayName' => $current_user->display_name,
            
            // Plugin context
            'pluginUrl' => $this->plugin_url,
            'mediaKitId' => $this->get_current_media_kit_id(),
            
            // Feature flags
            'features' => array(
                'dragDrop' => true,
                'templateSwitching' => true,
                'liveEditing' => true,
                'premiumFeatures' => current_user_can('manage_options'),
                'collaboration' => current_user_can('edit_others_posts'),
                'analytics' => defined('WP_DEBUG') && WP_DEBUG
            ),
            
            // Performance settings
            'performance' => array(
                'enableTracking' => defined('WP_DEBUG') && WP_DEBUG,
                'sampleRate' => defined('WP_DEBUG') && WP_DEBUG ? 1 : 0.1,
                'memoryLimit' => ini_get('memory_limit'),
                'timeLimit' => ini_get('max_execution_time')
            ),
            
            // Debug settings
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'debugInfo' => array(
                'wpVersion' => get_bloginfo('version'),
                'phpVersion' => PHP_VERSION,
                'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'timestamp' => current_time('c')
            )
        );
    }

    /**
     * Add preload links for critical resources
     */
    public function add_preload_links() {
        if (!$this->should_add_preload_links()) {
            return;
        }

        // Preload critical CSS
        echo '<link rel="preload" href="' . esc_url($this->get_asset_url('css/builder.css')) . '" as="style">' . "\n";
        
        // Preload critical JS
        echo '<link rel="preload" href="' . esc_url($this->get_asset_url('js/vendors.js')) . '" as="script">' . "\n";
        echo '<link rel="preload" href="' . esc_url($this->get_asset_url('js/builder.js')) . '" as="script">' . "\n";
        
        // DNS prefetch for external resources
        echo '<link rel="dns-prefetch" href="//fonts.googleapis.com">' . "\n";
        echo '<link rel="dns-prefetch" href="//fonts.gstatic.com">' . "\n";
    }

    /**
     * Add performance monitoring
     */
    public function add_performance_monitoring() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $monitoring_script = "
        <script>
        (function() {
            if (typeof mkbConfig === 'undefined' || !mkbConfig.performance.enableTracking) {
                return;
            }
            
            // Track script loading performance
            window.mkbPerformance = {
                start: performance.now(),
                scripts: {},
                styles: {},
                enqueueData: " . json_encode($this->performance_data) . "
            };
            
            // Monitor resource loading
            window.addEventListener('load', function() {
                var loadTime = performance.now() - window.mkbPerformance.start;
                console.log('MKB Total Load Time:', loadTime + 'ms');
                
                if (mkbConfig.features.analytics) {
                    // Send performance data to analytics endpoint
                    fetch(mkbConfig.ajaxUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: 'action=mkb_performance_report&nonce=' + mkbConfig.nonce + 
                              '&data=' + encodeURIComponent(JSON.stringify({
                                  loadTime: loadTime,
                                  enqueueTime: " . json_encode($this->performance_data) . ",
                                  userAgent: navigator.userAgent,
                                  url: window.location.href
                              }))
                    });
                }
            });
        })();
        </script>";
        
        echo $monitoring_script;
    }

    /**
     * Add script attributes (async, defer, etc.)
     */
    public function add_script_attributes($tag, $handle, $src) {
        // Add defer to non-critical scripts
        $deferred_scripts = array(
            'mkb-admin-integration',
            'mkb-drag-drop',
            'mkb-template-system',
            'mkb-public-viewer',
            'mkb-block-editor'
        );
        
        if (in_array($handle, $deferred_scripts)) {
            $tag = str_replace(' src', ' defer src', $tag);
        }
        
        // Add async to analytics scripts
        $async_scripts = array(
            'mkb-analytics'
        );
        
        if (in_array($handle, $async_scripts)) {
            $tag = str_replace(' src', ' async src', $tag);
        }
        
        return $tag;
    }

    /**
     * Add style attributes
     */
    public function add_style_attributes($html, $handle, $href, $media) {
        // Add critical CSS inline for above-the-fold content
        $critical_styles = array('mkb-builder-css');
        
        if (in_array($handle, $critical_styles)) {
            // Add media query for print
            $html = str_replace("media='all'", "media='all' onload=\"this.media='all'\"", $html);
        }
        
        return $html;
    }

    /**
     * Optimize script loading order
     */
    public function optimize_script_loading() {
        global $wp_scripts;
        
        // Ensure React dependencies load in correct order
        $react_deps = array(
            'mkb-state',
            'mkb-components',
            'mkb-builder-app'
        );
        
        foreach ($react_deps as $index => $handle) {
            if (isset($wp_scripts->registered[$handle])) {
                // Adjust priority to ensure loading order
                $wp_scripts->registered[$handle]->extra['group'] = $index;
            }
        }
    }

    /**
     * Optimize style loading order
     */
    public function optimize_style_loading() {
        global $wp_styles;
        
        // Ensure critical styles load first
        $critical_styles = array('mkb-builder-css', 'mkb-admin-styles');
        
        foreach ($critical_styles as $handle) {
            if (isset($wp_styles->registered[$handle])) {
                // Move to front of queue
                $wp_styles->registered[$handle]->extra['group'] = 0;
            }
        }
    }

    /**
     * Helper Methods
     */

    private function should_load_on_admin_page($hook) {
        $valid_hooks = array(
            'toplevel_page_media-kit-builder',
            'media-kit-builder_page_mkb-templates',
            'media-kit-builder_page_mkb-settings',
            'post.php',
            'post-new.php'
        );
        
        return in_array($hook, $valid_hooks) || $this->is_media_kit_edit_page();
    }

    private function should_load_on_frontend() {
        global $post;
        
        if ($post && has_shortcode($post->post_content, 'media-kit-builder')) {
            return true;
        }
        
        $load_on_pages = array('media-kit-builder', 'create-media-kit');
        return is_page($load_on_pages);
    }

    private function should_add_preload_links() {
        return $this->should_load_on_frontend() || 
               (is_admin() && $this->should_load_on_admin_page(get_current_screen()->id ?? ''));
    }

    private function is_media_kit_edit_page() {
        global $post;
        return $post && $post->post_type === 'media_kit';
    }

    private function get_asset_url($asset_path) {
        // Check manifest first for production builds
        if ($this->asset_manifest && isset($this->asset_manifest[$asset_path])) {
            return $this->plugin_url . 'app/build/' . $this->asset_manifest[$asset_path];
        }
        
        // Fallback to direct path
        return $this->plugin_url . 'app/build/' . $asset_path;
    }

    private function get_asset_version($asset_path) {
        // Use manifest hash if available
        if ($this->asset_manifest && isset($this->asset_manifest[$asset_path])) {
            return substr(md5($this->asset_manifest[$asset_path]), 0, 8);
        }
        
        // Fallback to file modification time
        $file_path = $this->plugin_path . 'app/build/' . $asset_path;
        if (file_exists($file_path)) {
            return filemtime($file_path);
        }
        
        return MKB_VERSION;
    }

    private function get_file_version($file_path) {
        $full_path = $this->plugin_path . $file_path;
        if (file_exists($full_path)) {
            return filemtime($full_path);
        }
        return MKB_VERSION;
    }

    private function get_current_media_kit_id() {
        if (isset($_GET['media_kit_id'])) {
            return intval($_GET['media_kit_id']);
        }
        
        $user_id = get_current_user_id();
        if ($user_id) {
            return get_user_meta($user_id, 'current_media_kit_id', true) ?: 0;
        }
        
        return 0;
    }

    private function get_admin_capabilities() {
        return array(
            'manage_options' => current_user_can('manage_options'),
            'edit_posts' => current_user_can('edit_posts'),
            'publish_posts' => current_user_can('publish_posts'),
            'upload_files' => current_user_can('upload_files'),
            'edit_others_posts' => current_user_can('edit_others_posts'),
            'delete_posts' => current_user_can('delete_posts')
        );
    }
}

// Initialize the Enqueue Manager
function mkb_init_enqueue_manager() {
    return Guestify_Enqueue_Manager::get_instance();
}

// Hook for early WordPress initialization
add_action('init', 'mkb_init_enqueue_manager', 5);
