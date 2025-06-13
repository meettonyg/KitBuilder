<?php
/**
 * Media Kit Builder - API Controller
 * 
 * Handles central API functionality and endpoint registration.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_API_Controller Class
 * 
 * Central API controller that registers and manages all endpoints
 */
class MKB_API_Controller {
    
    /**
     * Instance
     * @var MKB_API_Controller
     */
    private static $instance = null;
    
    /**
     * API namespace
     * @var string
     */
    protected $namespace = 'media-kit/v2';
    
    /**
     * API version
     * @var string
     */
    protected $version = '1.0.0';
    
    /**
     * Get instance
     * 
     * @return MKB_API_Controller
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
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('rest_api_init', array($this, 'register_routes'));
        
        // Register legacy AJAX endpoints to maintain compatibility
        add_action('wp_ajax_mkb_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_nopriv_mkb_test_connection', array($this, 'ajax_test_connection'));
        
        // Register all other AJAX hooks needed by the frontend
        $this->register_ajax_hooks();
    }
    
    /**
     * Register AJAX hooks for frontend compatibility
     */
    private function register_ajax_hooks() {
        // Components endpoints
        add_action('wp_ajax_mkb_get_components', array($this, 'ajax_get_components'));
        add_action('wp_ajax_nopriv_mkb_get_components', array($this, 'ajax_get_components'));
        
        // Templates endpoints
        add_action('wp_ajax_mkb_get_templates', array($this, 'ajax_get_templates'));
        add_action('wp_ajax_nopriv_mkb_get_templates', array($this, 'ajax_get_templates'));
        
        // Media kits endpoints
        add_action('wp_ajax_mkb_get_kits', array($this, 'ajax_get_kits'));
        add_action('wp_ajax_nopriv_mkb_get_kits', array($this, 'ajax_get_kits'));
        
        add_action('wp_ajax_mkb_create_kit', array($this, 'ajax_create_kit'));
        add_action('wp_ajax_nopriv_mkb_create_kit', array($this, 'ajax_create_kit'));
        
        add_action('wp_ajax_mkb_update_kit', array($this, 'ajax_update_kit'));
        add_action('wp_ajax_nopriv_mkb_update_kit', array($this, 'ajax_update_kit'));
    }
    
    /**
     * AJAX test connection endpoint
     * This is the most critical endpoint for frontend initialization
     */
    public function ajax_test_connection() {
        // The frontend is expecting a specific format, so we need to match it
        wp_send_json_success(array(
            'success' => true,
            'message' => 'Connection test successful',
            'timestamp' => gmdate('c'),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'plugin_version' => MKB_VERSION,
            'plugin_status' => 'active',
            'api_status' => 'available'
        ));
    }
    
    /**
     * AJAX get components endpoint
     */
    public function ajax_get_components() {
        // We'll delegate to the existing component registry system
        $component_registry = media_kit_builder()->get_system('components');
        
        if (!$component_registry) {
            wp_send_json_error('Component registry not available');
            return;
        }
        
        // Get components
        $components = $component_registry->get_components();
        $categories = $component_registry->get_categories();
        
        wp_send_json_success(array(
            'components' => $components,
            'categories' => $categories
        ));
    }
    
    /**
     * AJAX get templates endpoint
     */
    public function ajax_get_templates() {
        // Delegate to template manager
        $template_manager = media_kit_builder()->get_system('templates');
        
        if (!$template_manager) {
            wp_send_json_error('Template manager not available');
            return;
        }
        
        // Get templates
        $templates = $template_manager->get_templates();
        
        wp_send_json_success(array(
            'templates' => $templates
        ));
    }
    
    /**
     * AJAX get kits endpoint
     */
    public function ajax_get_kits() {
        // Get current user ID
        $user_id = get_current_user_id();
        
        // If user is logged in, get kits from database
        if ($user_id) {
            $kits = MKB_Media_Kit::get_all_for_user($user_id);
            wp_send_json_success(array('kits' => $kits));
            return;
        }
        
        // For guests, get kits from session
        $session_manager = media_kit_builder()->get_system('session');
        
        if (!$session_manager) {
            wp_send_json_error('Session manager not available');
            return;
        }
        
        $session_id = $session_manager->get_guest_session_id();
        $kits = $session_manager->get_guest_media_kits($session_id);
        
        wp_send_json_success(array('kits' => $kits));
    }
    
    /**
     * AJAX create kit endpoint
     */
    public function ajax_create_kit() {
        // Get data from request
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (empty($data)) {
            wp_send_json_error('No data provided');
            return;
        }
        
        // Create media kit
        $media_kit = MKB_Media_Kit::from_array($data);
        
        // Get user ID
        $user_id = get_current_user_id();
        
        // If user is logged in, save to database
        if ($user_id) {
            $result = $media_kit->save($user_id);
            
            if ($result) {
                wp_send_json_success(array(
                    'id' => $result,
                    'message' => 'Media kit created successfully'
                ));
            } else {
                wp_send_json_error('Failed to create media kit');
            }
            
            return;
        }
        
        // For guests, save to session
        $session_manager = media_kit_builder()->get_system('session');
        
        if (!$session_manager) {
            wp_send_json_error('Session manager not available');
            return;
        }
        
        $session_id = $session_manager->get_guest_session_id();
        $result = $session_manager->save_guest_media_kit($session_id, $media_kit->to_array());
        
        if ($result) {
            wp_send_json_success(array(
                'id' => $media_kit->get_id(),
                'message' => 'Media kit saved to session'
            ));
        } else {
            wp_send_json_error('Failed to save media kit to session');
        }
    }
    
    /**
     * AJAX update kit endpoint
     */
    public function ajax_update_kit() {
        // Get data from request
        $id = isset($_POST['id']) ? sanitize_text_field($_POST['id']) : '';
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (empty($id) || empty($data)) {
            wp_send_json_error('ID and data are required');
            return;
        }
        
        // Get user ID
        $user_id = get_current_user_id();
        
        // If user is logged in, update in database
        if ($user_id) {
            // Get existing media kit
            $media_kit = MKB_Media_Kit::get_by_id($id, $user_id);
            
            if (!$media_kit) {
                wp_send_json_error('Media kit not found');
                return;
            }
            
            // Update media kit with new data
            $updated_media_kit = MKB_Media_Kit::from_array(array_merge(
                $media_kit->to_array(),
                $data
            ));
            
            // Save updated media kit
            $result = $updated_media_kit->save($user_id);
            
            if ($result) {
                wp_send_json_success(array(
                    'id' => $result,
                    'message' => 'Media kit updated successfully'
                ));
            } else {
                wp_send_json_error('Failed to update media kit');
            }
            
            return;
        }
        
        // For guests, update in session
        $session_manager = media_kit_builder()->get_system('session');
        
        if (!$session_manager) {
            wp_send_json_error('Session manager not available');
            return;
        }
        
        $session_id = $session_manager->get_guest_session_id();
        
        // Get existing media kit from session
        $existing_data = $session_manager->get_guest_media_kit($session_id, $id);
        
        if (!$existing_data) {
            wp_send_json_error('Media kit not found in session');
            return;
        }
        
        // Merge with new data
        $updated_data = array_merge($existing_data, $data);
        
        // Update in session
        $result = $session_manager->update_guest_media_kit($session_id, $id, $updated_data);
        
        if ($result) {
            wp_send_json_success(array(
                'id' => $id,
                'message' => 'Media kit updated in session'
            ));
        } else {
            wp_send_json_error('Failed to update media kit in session');
        }
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Load all endpoint classes
        $this->load_endpoint_classes();
        
        // Register component endpoints
        $component_endpoints = new MKB_Component_Endpoints($this);
        $component_endpoints->register_routes();
        
        // Register template endpoints
        $template_endpoints = new MKB_Template_Endpoints($this);
        $template_endpoints->register_routes();
        
        // Register media kit endpoints
        $media_kit_endpoints = new MKB_Media_Endpoints($this);
        $media_kit_endpoints->register_routes();
    }
    
    /**
     * Load all endpoint classes
     */
    private function load_endpoint_classes() {
        // Component endpoints
        require_once MKB_PLUGIN_DIR . 'includes/api/class-component-endpoints.php';
        
        // Template endpoints
        require_once MKB_PLUGIN_DIR . 'includes/api/class-template-endpoints.php';
        
        // Media endpoints
        require_once MKB_PLUGIN_DIR . 'includes/api/class-media-endpoints.php';
    }
    
    /**
     * Format API response
     * 
     * @param mixed $data Response data
     * @param int $status HTTP status code
     * @param string $message Response message
     * @return array Formatted response
     */
    public function format_response($data, $status = 200, $message = '') {
        return array(
            'success' => $status >= 200 && $status < 300,
            'data' => $data,
            'message' => $message,
            'meta' => array(
                'version' => $this->version,
                'timestamp' => time()
            )
        );
    }
    
    /**
     * Get API namespace
     * 
     * @return string API namespace
     */
    public function get_namespace() {
        return $this->namespace;
    }
}
