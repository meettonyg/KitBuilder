<?php
/**
 * Media Kit Builder - API Endpoints
 * 
 * Handles REST API endpoints for Media Kit Builder.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_API_Endpoints Class
 * 
 * Registers and handles REST API endpoints for Media Kit Builder.
 */
class MKB_API_Endpoints {
    
    /**
     * Instance
     * @var MKB_API_Endpoints
     */
    private static $instance = null;
    
    /**
     * Get instance
     * 
     * @return MKB_API_Endpoints
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
        add_action('rest_api_init', array($this, 'register_endpoints'));
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_endpoints() {
        // Templates endpoints - ENHANCED
        register_rest_route('media-kit/v1', '/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_templates'),
            'permission_callback' => array($this, 'check_read_permission'),
            'args' => array(
                'category' => array(
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'search' => array(
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
        
        // Single template endpoint - NEW
        register_rest_route('media-kit/v1', '/templates/(?P<id>[\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_template'),
            'permission_callback' => array($this, 'check_read_permission'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_string($param) && !empty($param);
                    },
                ),
            ),
        ));
        
        // Components endpoints
        register_rest_route('media-kit/v1', '/components', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_components'),
            'permission_callback' => array($this, 'check_read_permission')
        ));
        
        // Media Kit endpoints
        register_rest_route('media-kit/v1', '/kits', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_kits'),
            'permission_callback' => array($this, 'check_read_permission')
        ));
        
        register_rest_route('media-kit/v1', '/kits', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_kit'),
            'permission_callback' => array($this, 'check_create_permission')
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[a-zA-Z0-9-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_kit'),
            'permission_callback' => array($this, 'check_read_permission'),
            'args' => array(
                'entry_key' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_string($param) && !empty($param);
                    }
                )
            )
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[a-zA-Z0-9-]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_kit'),
            'permission_callback' => array($this, 'check_edit_permission'),
            'args' => array(
                'entry_key' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_string($param) && !empty($param);
                    }
                )
            )
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[a-zA-Z0-9-]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_kit'),
            'permission_callback' => array($this, 'check_delete_permission'),
            'args' => array(
                'entry_key' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_string($param) && !empty($param);
                    }
                )
            )
        ));
        
        // Export endpoints
        register_rest_route('media-kit/v1', '/export/(?P<format>[a-z]+)', array(
            'methods' => 'POST',
            'callback' => array($this, 'export_kit'),
            'permission_callback' => array($this, 'check_export_permission'),
            'args' => array(
                'format' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return in_array($param, array('pdf', 'image', 'html'));
                    }
                )
            )
        ));
    }
    
    /**
     * Check read permission
     * 
     * @return bool
     */
    public function check_read_permission() {
        // Public templates and components are readable by all
        return true;
    }
    
    /**
     * Check create permission
     * 
     * @return bool
     */
    public function check_create_permission() {
        // Check if user can create media kits
        if (is_user_logged_in()) {
            return current_user_can('edit_posts');
        }
        
        // Allow guests to create temporary kits
        return true;
    }
    
    /**
     * Check edit permission
     * 
     * @param WP_REST_Request $request
     * @return bool
     */
    public function check_edit_permission($request) {
        $entry_key = $request['entry_key'];
        
        // Check if user is logged in
        if (is_user_logged_in()) {
            // Check if user owns this kit
            return $this->user_owns_kit($entry_key, get_current_user_id());
        }
        
        // Check if this is a guest kit and session matches
        return $this->check_guest_kit_permission($entry_key);
    }
    
    /**
     * Check delete permission
     * 
     * @param WP_REST_Request $request
     * @return bool
     */
    public function check_delete_permission($request) {
        $entry_key = $request['entry_key'];
        
        // Check if user is logged in
        if (is_user_logged_in()) {
            // Check if user owns this kit
            return $this->user_owns_kit($entry_key, get_current_user_id());
        }
        
        // Guests cannot delete kits
        return false;
    }
    
    /**
     * Check export permission
     * 
     * @param WP_REST_Request $request
     * @return bool
     */
    public function check_export_permission($request) {
        $format = $request['format'];
        
        // Check if user has access to this export format
        $access_tier = mkb_get_user_access_tier();
        
        // Define allowed export formats by tier
        $allowed_formats = array(
            'guest' => array('image'),
            'free' => array('image', 'pdf'),
            'pro' => array('image', 'pdf', 'html'),
            'agency' => array('image', 'pdf', 'html', 'wordpress'),
            'admin' => array('image', 'pdf', 'html', 'wordpress')
        );
        
        // Check if format is allowed for this tier
        return in_array($format, $allowed_formats[$access_tier]);
    }
    
    /**
     * Get templates - ENHANCED
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_templates($request) {
        try {
            $category = $request->get_param('category');
            $search = $request->get_param('search');
            
            // Get templates with caching
            $templates = $this->get_all_templates();
            
            // Filter by category if provided
            if (!empty($category) && 'all' !== $category) {
                $templates = array_filter($templates, function($template) use ($category) {
                    return isset($template['category']) && $template['category'] === $category;
                });
            }
            
            // Filter by search term if provided
            if (!empty($search)) {
                $search = strtolower($search);
                $templates = array_filter($templates, function($template) use ($search) {
                    $name = strtolower($template['name']);
                    $description = strtolower(isset($template['description']) ? $template['description'] : '');
                    return strpos($name, $search) !== false || strpos($description, $search) !== false;
                });
            }
            
            // Filter templates based on user access
            $filtered_templates = $this->filter_templates_by_access($templates);
            
            return new WP_REST_Response($filtered_templates, 200);
        } catch (Exception $e) {
            return new WP_Error('template_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get a single template by ID - NEW
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_template($request) {
        try {
            $template_id = $request->get_param('id');
            
            // Get all templates
            $templates = $this->get_all_templates();
            
            // Find the requested template
            if (!isset($templates[$template_id])) {
                return new WP_Error('template_not_found', 'Template not found', array('status' => 404));
            }
            
            $template = $templates[$template_id];
            
            // Check if user has access to this template
            if (isset($template['premium']) && $template['premium'] && !$this->user_has_premium_access()) {
                // Mark as locked but still return the template
                $template['locked'] = true;
            }
            
            return new WP_REST_Response($template, 200);
        } catch (Exception $e) {
            return new WP_Error('template_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get all templates with caching - NEW
     * 
     * @return array
     */
    private function get_all_templates() {
        // Check transient first for performance
        $templates = get_transient('mkb_templates');
        
        if (false === $templates) {
            // Get default templates
            $templates = $this->get_template_data();
            
            // Get custom templates if any
            $custom_templates = $this->get_custom_templates();
            
            // Merge templates
            if (!empty($custom_templates)) {
                $templates = array_merge($templates, $custom_templates);
            }
            
            // Set transient to cache templates for 1 hour
            set_transient('mkb_templates', $templates, HOUR_IN_SECONDS);
        }
        
        return $templates;
    }
    
    /**
     * Get custom templates from database - NEW
     * 
     * @return array
     */
    private function get_custom_templates() {
        global $wpdb;
        
        $templates = array();
        
        // Get custom templates from database if table exists
        $table_name = $wpdb->prefix . 'mkb_templates';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name) {
            $query = $wpdb->prepare(
                "SELECT * FROM $table_name WHERE status = %s",
                'active'
            );
            
            $results = $wpdb->get_results($query, ARRAY_A);
            
            if (!empty($results)) {
                foreach ($results as $row) {
                    $template_id = $row['template_id'];
                    $template_data = json_decode($row['template_data'], true);
                    
                    if (!empty($template_data) && is_array($template_data)) {
                        $templates[$template_id] = $template_data;
                    }
                }
            }
        }
        
        return $templates;
    }
    
    /**
     * Clear templates cache - NEW
     */
    public function clear_templates_cache() {
        delete_transient('mkb_templates');
    }
    
    /**
     * Check if user has premium access - NEW
     * 
     * @return bool
     */
    private function user_has_premium_access() {
        // Admin always has access
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check access tier
        $access_tier = mkb_get_user_access_tier();
        
        return in_array($access_tier, array('pro', 'agency'));
    }
    
    /**
     * Get components
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_components($request) {
        // Get components data
        $components = $this->get_component_data();
        
        // Filter components based on user access
        $filtered_components = $this->filter_components_by_access($components);
        
        return new WP_REST_Response($filtered_components, 200);
    }
    
    /**
     * Get all kits for current user
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_kits($request) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // If user is logged in, get their kits
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            $query = $wpdb->prepare(
                "SELECT entry_key, title, created, modified FROM {$table_name} WHERE user_id = %d ORDER BY modified DESC",
                $user_id
            );
            
            $kits = $wpdb->get_results($query);
            
            return new WP_REST_Response(array(
                'success' => true,
                'kits' => $kits
            ), 200);
        } else {
            // For guests, check session and return any kits in the session
            $session_id = isset($_COOKIE['mkb_guest_session']) ? sanitize_text_field($_COOKIE['mkb_guest_session']) : '';
            
            if (empty($session_id)) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'kits' => array()
                ), 200);
            }
            
            // Get kits from guest session
            $session_table = $wpdb->prefix . 'mkb_guest_sessions';
            
            $query = $wpdb->prepare(
                "SELECT session_data FROM {$session_table} WHERE session_id = %s",
                $session_id
            );
            
            $session_data = $wpdb->get_var($query);
            
            if (empty($session_data)) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'kits' => array()
                ), 200);
            }
            
            $data = json_decode($session_data, true);
            $kits = isset($data['media_kit_data']) ? $data['media_kit_data'] : array();
            
            return new WP_REST_Response(array(
                'success' => true,
                'kits' => $kits
            ), 200);
        }
    }
    
    /**
     * Get single kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_kit($request) {
        $entry_key = $request['entry_key'];
        
        // If user is logged in, get kit from database
        if (is_user_logged_in()) {
            $data = $this->get_kit_from_db($entry_key);
            
            if ($data) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'data' => $data
                ), 200);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Kit not found'
                ), 404);
            }
        } else {
            // For guests, check session
            $data = $this->get_kit_from_session($entry_key);
            
            if ($data) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'data' => $data
                ), 200);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Kit not found in session'
                ), 404);
            }
        }
    }
    
    /**
     * Create new kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function create_kit($request) {
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'No data provided'
            ), 400);
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($data);
        
        // If user is logged in, save to database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            $result = $this->save_kit_to_db($sanitized_data, $user_id);
            
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Kit created successfully',
                    'entry_key' => $result['entry_key']
                ), 201);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Failed to create kit'
                ), 500);
            }
        } else {
            // For guests, save to session
            $result = $this->save_kit_to_session($sanitized_data);
            
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Kit created in session',
                    'entry_key' => $result['entry_key']
                ), 201);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Failed to create kit in session'
                ), 500);
            }
        }
    }
    
    /**
     * Update existing kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function update_kit($request) {
        $entry_key = $request['entry_key'];
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'No data provided'
            ), 400);
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($data);
        
        // If user is logged in, update in database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            $result = $this->update_kit_in_db($entry_key, $sanitized_data, $user_id);
            
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Kit updated successfully'
                ), 200);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Failed to update kit'
                ), 500);
            }
        } else {
            // For guests, update in session
            $result = $this->update_kit_in_session($entry_key, $sanitized_data);
            
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Kit updated in session'
                ), 200);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Failed to update kit in session'
                ), 500);
            }
        }
    }
    
    /**
     * Delete kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_kit($request) {
        $entry_key = $request['entry_key'];
        
        // If user is logged in, delete from database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            $result = $this->delete_kit_from_db($entry_key, $user_id);
            
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Kit deleted successfully'
                ), 200);
            } else {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Failed to delete kit'
                ), 500);
            }
        } else {
            // Guests cannot delete kits
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Unauthorized'
            ), 401);
        }
    }
    
    /**
     * Export kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function export_kit($request) {
        $format = $request['format'];
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'No data provided'
            ), 400);
        }
        
        // Get export engine
        $export_engine = MKB_Export_Engine::instance();
        
        // Export kit
        $result = $export_engine->export_kit($data, $format);
        
        if ($result) {
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Kit exported successfully',
                'url' => $result['url'],
                'filename' => $result['filename']
            ), 200);
        } else {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to export kit'
            ), 500);
        }
    }
    
    /**
     * Get template data
     * 
     * @return array
     */
    private function get_template_data() {
        // Default templates
        $templates = array(
            'hero-basic' => array(
                'name' => 'Basic Hero',
                'type' => 'hero',
                'layout' => 'full-width',
                'description' => 'Clean, centered hero with name and title',
                'premium' => false,
                'category' => 'hero',
                'components' => array(
                    array('type' => 'hero', 'content' => array('title' => 'Welcome', 'subtitle' => 'Your media kit'))
                )
            ),
            'content-bio' => array(
                'name' => 'Biography',
                'type' => 'content',
                'layout' => 'full-width',
                'description' => 'Bio section with text and image',
                'premium' => false,
                'category' => 'content',
                'components' => array(
                    array('type' => 'biography', 'content' => array('text' => 'Your biography here'))
                )
            ),
            'two-column-bio' => array(
                'name' => 'Bio with Image',
                'type' => 'content',
                'layout' => 'two-column',
                'description' => 'Two-column layout with bio and image',
                'premium' => false,
                'category' => 'content',
                'components' => array(
                    'left' => array(array('type' => 'biography', 'content' => array('text' => 'Your biography here'))),
                    'right' => array(array('type' => 'image', 'content' => array('url' => '')))
                )
            ),
            'three-column-topics' => array(
                'name' => 'Topics Grid',
                'type' => 'features',
                'layout' => 'three-column',
                'description' => 'Showcase your topics in a three-column grid',
                'premium' => false,
                'category' => 'features',
                'components' => array(
                    'left' => array(array('type' => 'topics', 'content' => array('topics' => array('Topic 1', 'Topic 4')))),
                    'center' => array(array('type' => 'topics', 'content' => array('topics' => array('Topic 2', 'Topic 5')))),
                    'right' => array(array('type' => 'topics', 'content' => array('topics' => array('Topic 3', 'Topic 6'))))
                )
            ),
            'gallery-premium' => array(
                'name' => 'Image Gallery',
                'type' => 'media',
                'layout' => 'three-column',
                'description' => 'Premium gallery for your media',
                'premium' => true,
                'category' => 'media',
                'components' => array(
                    'left' => array(array('type' => 'image', 'content' => array('url' => ''))),
                    'center' => array(array('type' => 'image', 'content' => array('url' => ''))),
                    'right' => array(array('type' => 'image', 'content' => array('url' => '')))
                )
            ),
            'contact-section' => array(
                'name' => 'Contact Info',
                'type' => 'contact',
                'layout' => 'full-width',
                'description' => 'Contact information with social links',
                'premium' => false,
                'category' => 'contact',
                'components' => array(
                    array('type' => 'social', 'content' => array('platforms' => array(
                        array('platform' => 'Email', 'link' => 'your@email.com'),
                        array('platform' => 'Twitter', 'link' => 'https://twitter.com/yourusername'),
                        array('platform' => 'LinkedIn', 'link' => 'https://linkedin.com/in/yourusername')
                    )))
                )
            )
        );
        
        // Allow plugins to modify templates
        return apply_filters('mkb_section_templates', $templates);
    }
    
    /**
     * Get component data
     * 
     * @return array
     */
    private function get_component_data() {
        // Default components
        $components = array(
            'biography' => array(
                'name' => 'Biography',
                'description' => 'Share your story and background',
                'premium' => false,
                'category' => 'content',
                'template' => 'biography'
            ),
            'topics' => array(
                'name' => 'Topics',
                'description' => 'List your areas of expertise',
                'premium' => false,
                'category' => 'content',
                'template' => 'topics'
            ),
            'questions' => array(
                'name' => 'Questions',
                'description' => 'Frequently asked questions',
                'premium' => false,
                'category' => 'content',
                'template' => 'questions'
            ),
            'social' => array(
                'name' => 'Social Media',
                'description' => 'Links to your social profiles',
                'premium' => false,
                'category' => 'contact',
                'template' => 'social'
            ),
            'logo' => array(
                'name' => 'Logo',
                'description' => 'Upload your logo or brand image',
                'premium' => false,
                'category' => 'branding',
                'template' => 'logo'
            ),
            'gallery' => array(
                'name' => 'Image Gallery',
                'description' => 'Showcase your work with images',
                'premium' => true,
                'category' => 'media',
                'template' => 'gallery'
            ),
            'testimonials' => array(
                'name' => 'Testimonials',
                'description' => 'Showcase what others say about you',
                'premium' => true,
                'category' => 'social-proof',
                'template' => 'testimonials'
            ),
            'stats' => array(
                'name' => 'Statistics',
                'description' => 'Highlight key metrics and numbers',
                'premium' => true,
                'category' => 'content',
                'template' => 'stats'
            )
        );
        
        // Allow plugins to modify components
        return apply_filters('mkb_components', $components);
    }
    
    /**
     * Filter templates by user access - ENHANCED
     * 
     * @param array $templates
     * @return array
     */
    private function filter_templates_by_access($templates) {
        $has_premium_access = $this->user_has_premium_access();
        
        // If user has premium access, return all templates
        if ($has_premium_access) {
            return $templates;
        }
        
        // Otherwise, mark premium templates as locked
        foreach ($templates as $key => $template) {
            if (isset($template['premium']) && $template['premium']) {
                $templates[$key]['locked'] = true;
            }
        }
        
        return $templates;
    }
    
    /**
     * Filter components by user access
     * 
     * @param array $components
     * @return array
     */
    private function filter_components_by_access($components) {
        $access_tier = mkb_get_user_access_tier();
        $has_premium = in_array($access_tier, array('pro', 'agency', 'admin'));
        
        // If user has premium access, return all components
        if ($has_premium) {
            return $components;
        }
        
        // Otherwise, mark premium components as locked
        foreach ($components as $key => $component) {
            if (isset($component['premium']) && $component['premium']) {
                $components[$key]['locked'] = true;
            }
        }
        
        return $components;
    }
    
    /**
     * Check if user owns a kit
     * 
     * @param string $entry_key
     * @param int $user_id
     * @return bool
     */
    private function user_owns_kit($entry_key, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Check if user owns this kit
        $query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name} WHERE entry_key = %s AND user_id = %d",
            $entry_key,
            $user_id
        );
        
        $count = $wpdb->get_var($query);
        
        return $count > 0;
    }
    
    /**
     * Check guest kit permission
     * 
     * @param string $entry_key
     * @return bool
     */
    private function check_guest_kit_permission($entry_key) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        // Get guest session from cookie
        $session_id = isset($_COOKIE['mkb_guest_session']) ? sanitize_text_field($_COOKIE['mkb_guest_session']) : '';
        
        if (empty($session_id)) {
            return false;
        }
        
        // Check if this kit belongs to the current guest session
        $query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name} WHERE session_id = %s AND session_data LIKE %s",
            $session_id,
            '%' . $wpdb->esc_like($entry_key) . '%'
        );
        
        $count = $wpdb->get_var($query);
        
        return $count > 0;
    }
    
    /**
     * Get kit from database
     * 
     * @param string $entry_key
     * @return array|false
     */
    private function get_kit_from_db($entry_key) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Get kit data
        $query = $wpdb->prepare(
            "SELECT data FROM {$table_name} WHERE entry_key = %s AND user_id = %d",
            $entry_key,
            get_current_user_id()
        );
        
        $data = $wpdb->get_var($query);
        
        if (empty($data)) {
            return false;
        }
        
        return json_decode($data, true);
    }
    
    /**
     * Get kit from session
     * 
     * @param string $entry_key
     * @return array|false
     */
    private function get_kit_from_session($entry_key) {
        // Get guest session
        $session_id = isset($_COOKIE['mkb_guest_session']) ? sanitize_text_field($_COOKIE['mkb_guest_session']) : '';
        
        if (empty($session_id)) {
            return false;
        }
        
        // Get session manager
        $session_manager = MKB_Session_Manager::instance();
        
        // Get session data
        $data = $session_manager->get_guest_data($session_id);
        
        if (empty($data) || !isset($data['media_kit_data'][$entry_key])) {
            return false;
        }
        
        return $data['media_kit_data'][$entry_key];
    }
    
    /**
     * Save kit to database
     * 
     * @param array $data
     * @param int $user_id
     * @return array|false
     */
    private function save_kit_to_db($data, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Prepare data for database
        $entry_key = 'mkb_' . wp_generate_uuid4();
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : 'Untitled Media Kit';
        $json_data = wp_json_encode($data);
        
        // Insert into database
        $result = $wpdb->insert(
            $table_name,
            array(
                'entry_key' => $entry_key,
                'user_id' => $user_id,
                'title' => $title,
                'data' => $json_data,
                'created' => current_time('mysql'),
                'modified' => current_time('mysql')
            ),
            array('%s', '%d', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            return array(
                'entry_key' => $entry_key,
                'title' => $title
            );
        }
        
        return false;
    }
    
    /**
     * Save kit to session
     * 
     * @param array $data
     * @return array|false
     */
    private function save_kit_to_session($data) {
        // Get session manager
        $session_manager = MKB_Session_Manager::instance();
        
        // Get session ID
        $session_id = $session_manager->get_guest_session_id();
        
        if (empty($session_id)) {
            return false;
        }
        
        // Generate entry key
        $entry_key = 'mkb_' . wp_generate_uuid4();
        
        // Get session data
        $session_data = $session_manager->get_guest_data($session_id);
        
        // Add kit to session data
        if (!isset($session_data['media_kit_data'])) {
            $session_data['media_kit_data'] = array();
        }
        
        $session_data['media_kit_data'][$entry_key] = $data;
        
        // Save session data
        $result = $session_manager->save_guest_data($session_id, $session_data);
        
        if ($result) {
            return array(
                'entry_key' => $entry_key,
                'title' => isset($data['title']) ? $data['title'] : 'Untitled Media Kit'
            );
        }
        
        return false;
    }
    
    /**
     * Update kit in database
     * 
     * @param string $entry_key
     * @param array $data
     * @param int $user_id
     * @return bool
     */
    private function update_kit_in_db($entry_key, $data, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Prepare data for database
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : 'Untitled Media Kit';
        $json_data = wp_json_encode($data);
        
        // Update in database
        $result = $wpdb->update(
            $table_name,
            array(
                'title' => $title,
                'data' => $json_data,
                'modified' => current_time('mysql')
            ),
            array(
                'entry_key' => $entry_key,
                'user_id' => $user_id
            ),
            array('%s', '%s', '%s'),
            array('%s', '%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Update kit in session
     * 
     * @param string $entry_key
     * @param array $data
     * @return bool
     */
    private function update_kit_in_session($entry_key, $data) {
        // Get session manager
        $session_manager = MKB_Session_Manager::instance();
        
        // Get session ID
        $session_id = isset($_COOKIE['mkb_guest_session']) ? sanitize_text_field($_COOKIE['mkb_guest_session']) : '';
        
        if (empty($session_id)) {
            return false;
        }
        
        // Get session data
        $session_data = $session_manager->get_guest_data($session_id);
        
        // Update kit in session data
        if (!isset($session_data['media_kit_data'])) {
            $session_data['media_kit_data'] = array();
        }
        
        $session_data['media_kit_data'][$entry_key] = $data;
        
        // Save session data
        return $session_manager->save_guest_data($session_id, $session_data);
    }
    
    /**
     * Delete kit from database
     * 
     * @param string $entry_key
     * @param int $user_id
     * @return bool
     */
    private function delete_kit_from_db($entry_key, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Delete from database
        $result = $wpdb->delete(
            $table_name,
            array(
                'entry_key' => $entry_key,
                'user_id' => $user_id
            ),
            array('%s', '%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Sanitize kit data
     * 
     * @param array $data
     * @return array
     */
    private function sanitize_kit_data($data) {
        if (!is_array($data)) {
            return array();
        }
        
        $sanitized = array();
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitize_kit_data($value);
            } elseif (is_string($value)) {
                // Allow HTML in content fields
                if (in_array($key, array('content', 'html', 'text'))) {
                    $sanitized[$key] = wp_kses_post($value);
                } else {
                    $sanitized[$key] = sanitize_text_field($value);
                }
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
}

// Initialize the API endpoints
MKB_API_Endpoints::instance();