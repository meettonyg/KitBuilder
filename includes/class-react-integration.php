<?php
/**
 * React Integration
 *
 * @package MediaKitBuilder
 */

defined('ABSPATH') || exit;

/**
 * React Integration class.
 */
class Guestify_React_Integration {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * React app configuration
     */
    private $config = array();
    
    /**
     * Asset versioning
     */
    private $version = '1.0.0';
    
    /**
     * Development mode flag
     */
    private $is_dev = false;

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
        $this->is_dev = defined('WP_DEBUG') && WP_DEBUG;
        $this->init();
    }

    /**
     * Initialize React integration
     */
    private function init() {
        // Setup configuration
        $this->setup_config();
        
        // Register hooks - React is now loaded in enqueue-scripts.php
        add_action('admin_footer', array($this, 'render_admin_builder'));
        add_action('wp_footer', array($this, 'render_frontend_builder'));
        
        // AJAX endpoints for React components
        add_action('wp_ajax_mkb_get_component_registry', array($this, 'get_component_registry'));
        add_action('wp_ajax_nopriv_mkb_get_component_registry', array($this, 'get_component_registry'));
        add_action('wp_ajax_mkb_get_component_template', array($this, 'get_component_template'));
        add_action('wp_ajax_mkb_get_component_design_panel', array($this, 'get_component_design_panel'));
        add_action('wp_ajax_mkb_get_template_gallery', array($this, 'get_template_gallery'));
        add_action('wp_ajax_mkb_apply_template', array($this, 'apply_template'));
        add_action('wp_ajax_mkb_analyze_template_migration', array($this, 'analyze_template_migration'));
        add_action('wp_ajax_mkb_get_user_capabilities', array($this, 'get_user_capabilities'));
        add_action('wp_ajax_mkb_performance_report', array($this, 'handle_performance_report'));
        
        // Shortcode support
        add_shortcode('media-kit-builder', array($this, 'shortcode_handler'));
        
        $this->log_message('React Integration initialized successfully');
    }

    /**
     * Setup configuration for React app
     */
    private function setup_config() {
        $current_user = wp_get_current_user();
        
        $this->config = array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_builder_nonce'),
            'userId' => $current_user->ID,
            'mediaKitId' => $this->get_current_media_kit_id(),
            'isGuest' => !is_user_logged_in(),
            'debug' => $this->is_dev,
            'userCapabilities' => $this->get_current_user_capabilities(),
            'restUrl' => rest_url('mkb/v1/'),
            'version' => $this->version,
            'buildDate' => date('c'),
            'performance' => array(
                'enabled' => $this->is_dev,
                'sampleRate' => $this->is_dev ? 1 : 0.1
            ),
            'features' => array(
                'dragDrop' => true,
                'templateSwitching' => true,
                'liveEditing' => true,
                'premiumFeatures' => current_user_can('manage_options'),
                'collaboration' => current_user_can('edit_others_posts')
            )
        );
    }

    /**
     * Render admin builder container
     */
    public function render_admin_builder() {
        if (!$this->should_render_admin_builder()) {
            return;
        }
        
        echo '<div id="mkb-builder-root"></div>';
    }

    /**
     * Render frontend builder container
     */
    public function render_frontend_builder() {
        if (!$this->should_render_frontend_builder()) {
            return;
        }
        
        echo '<div id="mkb-builder-root"></div>';
    }

    /**
     * Shortcode handler
     */
    public function shortcode_handler($atts = array()) {
        $atts = shortcode_atts(array(
            'user-id' => get_current_user_id(),
            'media-kit-id' => 0,
            'template' => '',
            'readonly' => false,
            'height' => '600px',
            'class' => ''
        ), $atts);
        
        $container_id = 'mkb-shortcode-' . uniqid();
        
        // Generate shortcode-specific config
        $shortcode_config = array_merge($this->config, array(
            'userId' => intval($atts['user-id']),
            'mediaKitId' => intval($atts['media-kit-id']),
            'template' => sanitize_text_field($atts['template']),
            'readonly' => filter_var($atts['readonly'], FILTER_VALIDATE_BOOLEAN),
            'shortcode' => true
        ));
        
        return sprintf(
            '<div id="%s" class="mkb-shortcode-container %s" style="height: %s;" data-user-id="%s" data-media-kit-id="%s">
                <div class="mkb-shortcode-loading">Loading Media Kit Builder...</div>
            </div>',
            esc_attr($container_id),
            esc_attr($atts['class']),
            esc_attr($atts['height']),
            esc_attr($atts['user-id']),
            esc_attr($atts['media-kit-id'])
        );
    }

    /**
     * AJAX: Get component registry
     */
    public function get_component_registry() {
        $this->verify_ajax_request();
        
        try {
            $component_registry = Guestify_Component_Registry::get_instance();
            $include_premium = !empty($_POST['include_premium']);
            
            $components = $component_registry->get_all_components($include_premium);
            $categories = $component_registry->get_component_categories();
            
            wp_send_json_success(array(
                'components' => $components,
                'categories' => $categories
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to get component registry',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Get component template
     */
    public function get_component_template() {
        $this->verify_ajax_request();
        
        try {
            $component_type = sanitize_text_field($_POST['component_type']);
            
            if (empty($component_type)) {
                throw new Exception('Component type is required');
            }
            
            $component_registry = Guestify_Component_Registry::get_instance();
            $template = $component_registry->get_component_template($component_type);
            
            wp_send_json_success(array(
                'template' => $template
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to get component template',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Get component design panel
     */
    public function get_component_design_panel() {
        $this->verify_ajax_request();
        
        try {
            $component_id = sanitize_text_field($_POST['component_id']);
            $component_type = sanitize_text_field($_POST['component_type']);
            
            if (empty($component_type)) {
                throw new Exception('Component type is required');
            }
            
            $component_registry = Guestify_Component_Registry::get_instance();
            $schema = $component_registry->get_component_design_schema($component_type);
            
            wp_send_json_success(array(
                'schema' => $schema
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to get design panel',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Get template gallery
     */
    public function get_template_gallery() {
        $this->verify_ajax_request();
        
        try {
            $template_manager = Guestify_Template_Manager::get_instance();
            $include_premium = !empty($_POST['include_premium']);
            
            $templates = $template_manager->get_template_gallery($include_premium);
            $categories = $template_manager->get_template_categories();
            
            wp_send_json_success(array(
                'templates' => $templates,
                'categories' => $categories
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to get template gallery',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Apply template
     */
    public function apply_template() {
        $this->verify_ajax_request();
        
        try {
            $template_id = sanitize_text_field($_POST['template_id']);
            $current_state = json_decode(stripslashes($_POST['current_state']), true);
            $migration_options = json_decode(stripslashes($_POST['migration_options']), true);
            
            $template_manager = Guestify_Template_Manager::get_instance();
            $migrated_state = $template_manager->apply_template(
                $template_id, 
                $current_state, 
                $migration_options
            );
            
            wp_send_json_success(array(
                'migratedState' => $migrated_state
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to apply template',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Analyze template migration
     */
    public function analyze_template_migration() {
        $this->verify_ajax_request();
        
        try {
            $template_id = sanitize_text_field($_POST['template_id']);
            $current_state = json_decode(stripslashes($_POST['current_state']), true);
            
            $template_manager = Guestify_Template_Manager::get_instance();
            $analysis = $template_manager->analyze_migration($template_id, $current_state);
            
            wp_send_json_success($analysis);
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to analyze migration',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Get user capabilities
     */
    public function get_user_capabilities() {
        $this->verify_ajax_request();
        
        try {
            $capabilities = $this->get_current_user_capabilities();
            $user_id = get_current_user_id();
            
            wp_send_json_success(array(
                'user_id' => $user_id,
                'capabilities' => $capabilities
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to get user capabilities',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * AJAX: Handle performance report
     */
    public function handle_performance_report() {
        $this->verify_ajax_request();
        
        try {
            $report = json_decode(stripslashes($_POST['report']), true);
            
            if (empty($report)) {
                throw new Exception('Invalid report data');
            }
            
            // Store performance report for analysis
            $this->store_performance_report($report);
            
            wp_send_json_success(array(
                'message' => 'Performance report received'
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Failed to process performance report',
                'error' => $e->getMessage()
            ));
        }
    }

    /**
     * Helper Methods
     */
    
    private function should_render_admin_builder() {
        $screen = get_current_screen();
        return $screen && strpos($screen->id, 'media-kit-builder') !== false;
    }

    private function should_render_frontend_builder() {
        global $post;
        return $post && has_shortcode($post->post_content, 'media-kit-builder');
    }

    private function get_current_media_kit_id() {
        if (isset($_GET['media_kit_id'])) {
            return intval($_GET['media_kit_id']);
        }
        
        // Get from user meta or create new
        $user_id = get_current_user_id();
        if ($user_id) {
            return get_user_meta($user_id, 'current_media_kit_id', true) ?: 0;
        }
        
        return 0;
    }

    private function get_current_user_capabilities() {
        if (!is_user_logged_in()) {
            return array(
                'can_save' => false,
                'can_publish' => false,
                'can_export' => false,
                'can_customize' => false,
                'premium_features' => false,
                'collaboration' => false
            );
        }
        
        return array(
            'can_save' => current_user_can('edit_posts'),
            'can_publish' => current_user_can('publish_posts'),
            'can_export' => current_user_can('export'),
            'can_customize' => true,
            'premium_features' => current_user_can('manage_options'),
            'collaboration' => current_user_can('edit_others_posts')
        );
    }

    private function store_performance_report($report) {
        // Store in WordPress options or custom table
        $option_key = 'mkb_performance_' . date('Y_m_d');
        $existing_reports = get_option($option_key, array());
        
        $existing_reports[] = array(
            'report' => $report,
            'user_id' => get_current_user_id(),
            'timestamp' => current_time('mysql'),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? ''
        );
        
        // Keep only last 100 reports per day
        if (count($existing_reports) > 100) {
            $existing_reports = array_slice($existing_reports, -100);
        }
        
        update_option($option_key, $existing_reports);
    }

    private function verify_ajax_request() {
        if (!check_ajax_referer('mkb_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array(
                'message' => 'Invalid security token',
                'error_code' => 'INVALID_NONCE'
            ));
            exit;
        }
    }

    private function log_message($message, $level = 'info') {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("React Integration [{$level}]: {$message}");
        }
    }
}

// Initialize the React Integration
function mkb_init_react_integration() {
    return Guestify_React_Integration::get_instance();
}

// Hook for WordPress initialization
add_action('init', 'mkb_init_react_integration');