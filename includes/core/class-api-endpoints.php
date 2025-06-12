<?php
/**
 * Media Kit Builder - API Endpoints
 * 
 * Registers all REST API endpoints for the Media Kit Builder.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_API_Endpoints Class
 * 
 * Handles REST API registrations and callbacks.
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
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // Templates endpoint
        register_rest_route('media-kit/v1', '/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_templates'),
            'permission_callback' => function() {
                // Allow public access to templates, but consider permissions
                // for premium content based on user capabilities
                return true;
            }
        ));
        
        // Media Kits endpoints
        register_rest_route('media-kit/v1', '/kits', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_kit'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_kit'),
            'permission_callback' => function() {
                return current_user_can('read');
            }
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[\w-]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_kit'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_rest_route('media-kit/v1', '/kits/(?P<entry_key>[\w-]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_kit'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        // Single template endpoint
        register_rest_route('media-kit/v1', '/templates/(?P<id>[\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_template'),
            'permission_callback' => function() {
                return true;
            },
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_string($param);
                    }
                )
            )
        ));
        
        // Create/update template endpoint (POST)
        register_rest_route('media-kit/v1', '/templates', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_template'),
            'permission_callback' => function() {
                // Only logged in users can save templates
                return is_user_logged_in();
            }
        ));
        
        // Delete template endpoint
        register_rest_route('media-kit/v1', '/templates/(?P<id>[\d]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_template'),
            'permission_callback' => function() {
                return is_user_logged_in();
            },
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                )
            )
        ));
    }
    
    /**
     * Get all templates
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_templates($request) {
        // Get query parameters
        $category = sanitize_text_field($request->get_param('category') ?? '');
        $search = sanitize_text_field($request->get_param('search') ?? '');
        $user_only = (bool) ($request->get_param('user_only') ?? false);
        
        $args = array(
            'category' => $category,
            'search' => $search,
            'is_active' => true
        );
        
        if ($user_only && is_user_logged_in()) {
            $args['user_id'] = get_current_user_id();
            $args['is_system'] = 0;
        }
        
        // Get templates from the Template Manager
        $template_manager = MKB_Template_Manager::instance();
        $templates = $template_manager->get_templates($args);
        
        // If no templates from database, return default templates
        if (empty($templates)) {
            $templates = $this->get_default_templates();
        }
        
        // Check user permissions for premium templates
        $templates = $this->filter_templates_by_permissions($templates);
        
        return rest_ensure_response($templates);
    }
    
    /**
     * Get single template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_template($request) {
        $template_id = $request->get_param('id');
        
        // Get template from the Template Manager
        $template_manager = MKB_Template_Manager::instance();
        $template = $template_manager->get_template($template_id);
        
        if (!$template) {
            // If not found in database, check default templates
            $default_templates = $this->get_default_templates();
            $template = isset($default_templates[$template_id]) ? $default_templates[$template_id] : null;
        }
        
        if (!$template) {
            return new WP_Error(
                'template_not_found',
                __('Template not found', 'media-kit-builder'),
                array('status' => 404)
            );
        }
        
        // Check permission for premium templates
        if ($template['premium'] && !$this->user_has_premium_access()) {
            $template['premium_restricted'] = true;
        }
        
        return rest_ensure_response($template);
    }
    
    /**
     * Save template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function save_template($request) {
        $template_data = $request->get_json_params();
        
        if (empty($template_data['name'])) {
            return new WP_Error(
                'missing_name',
                __('Template name is required', 'media-kit-builder'),
                array('status' => 400)
            );
        }
        
        // Save template using Template Manager
        $template_manager = MKB_Template_Manager::instance();
        $template_id = $template_manager->save_template($template_data);
        
        if (!$template_id) {
            return new WP_Error(
                'save_failed',
                __('Failed to save template', 'media-kit-builder'),
                array('status' => 500)
            );
        }
        
        // Get the saved template
        $template = $template_manager->get_template($template_id);
        
        return rest_ensure_response(array(
            'template_id' => $template_id,
            'template' => $template,
            'message' => __('Template saved successfully', 'media-kit-builder')
        ));
    }
    
    /**
     * Delete template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_template($request) {
        $template_id = (int) $request->get_param('id');
        
        // Delete template using Template Manager
        $template_manager = MKB_Template_Manager::instance();
        $result = $template_manager->delete_template($template_id);
        
        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Failed to delete template', 'media-kit-builder'),
                array('status' => 500)
            );
        }
        
        return rest_ensure_response(array(
            'message' => __('Template deleted successfully', 'media-kit-builder')
        ));
    }
    
    /**
     * Get default templates
     * 
     * @return array
     */
    private function get_default_templates() {
        // Default templates for when database has no templates
        $templates = array(
            'basic-content' => array(
                'id' => 'basic-content',
                'name' => 'Basic Content Section',
                'slug' => 'basic-content',
                'type' => 'content',
                'layout' => 'full-width',
                'description' => 'Simple content section with title and text',
                'premium' => false,
                'components' => array(
                    array(
                        'type' => 'bio',
                        'content' => array(
                            'title' => 'About Me',
                            'text' => 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.'
                        )
                    )
                )
            ),
            'basic-hero' => array(
                'id' => 'basic-hero',
                'name' => 'Simple Hero Section',
                'slug' => 'basic-hero',
                'type' => 'hero',
                'layout' => 'full-width',
                'description' => 'Basic hero section with name and title',
                'premium' => false,
                'components' => array(
                    array(
                        'type' => 'hero',
                        'content' => array(
                            'name' => 'Your Name',
                            'title' => 'Your Professional Title',
                            'bio' => 'Add a short introduction about yourself'
                        )
                    )
                )
            ),
            'two-column-bio' => array(
                'id' => 'two-column-bio',
                'name' => 'Two Column Bio',
                'slug' => 'two-column-bio',
                'type' => 'content',
                'layout' => 'two-column',
                'description' => 'Biography with image',
                'premium' => false,
                'components' => array(
                    'left' => array(
                        array(
                            'type' => 'bio',
                            'content' => array(
                                'title' => 'About Me',
                                'text' => 'Your professional biography goes here...'
                            )
                        )
                    ),
                    'right' => array(
                        array(
                            'type' => 'image',
                            'content' => array(
                                'url' => '',
                                'alt' => 'Profile Image'
                            )
                        )
                    )
                )
            ),
            'social-links' => array(
                'id' => 'social-links',
                'name' => 'Social Links',
                'slug' => 'social-links',
                'type' => 'contact',
                'layout' => 'full-width',
                'description' => 'Social media links',
                'premium' => false,
                'components' => array(
                    array(
                        'type' => 'social',
                        'content' => array()
                    )
                )
            )
        );
        
        // Add a few premium templates
        $templates['premium-features'] = array(
            'id' => 'premium-features',
            'name' => 'Premium Features Section',
            'slug' => 'premium-features',
            'type' => 'features',
            'layout' => 'three-column',
            'description' => 'Showcase your top features or services',
            'premium' => true,
            'components' => array(
                'left' => array(
                    array(
                        'type' => 'feature',
                        'content' => array(
                            'title' => 'Feature 1',
                            'description' => 'Description of feature 1'
                        )
                    )
                ),
                'center' => array(
                    array(
                        'type' => 'feature',
                        'content' => array(
                            'title' => 'Feature 2',
                            'description' => 'Description of feature 2'
                        )
                    )
                ),
                'right' => array(
                    array(
                        'type' => 'feature',
                        'content' => array(
                            'title' => 'Feature 3',
                            'description' => 'Description of feature 3'
                        )
                    )
                )
            )
        );
        
        $templates['premium-gallery'] = array(
            'id' => 'premium-gallery',
            'name' => 'Premium Media Gallery',
            'slug' => 'premium-gallery',
            'type' => 'media',
            'layout' => 'full-width',
            'description' => 'Showcase your work with this premium gallery',
            'premium' => true,
            'components' => array(
                array(
                    'type' => 'gallery',
                    'content' => array(
                        'title' => 'My Work',
                        'images' => array()
                    )
                )
            )
        );
        
        return $templates;
    }
    
    /**
     * Filter templates by user permissions
     * 
     * @param array $templates
     * @return array
     */
    private function filter_templates_by_permissions($templates) {
        $has_premium_access = $this->user_has_premium_access();
        
        foreach ($templates as &$template) {
            // If template is premium and user doesn't have access
            if (isset($template['premium']) && $template['premium'] && !$has_premium_access) {
                $template['premium_restricted'] = true;
            }
        }
        
        return $templates;
    }
    
    /**
     * Check if user has premium access
     * 
     * @return bool
     */
    private function user_has_premium_access() {
        // Check if user has premium access through WP Fusion tags
        if (function_exists('MKB_WPFusion_Reader') && method_exists('MKB_WPFusion_Reader', 'instance')) {
            $wpfusion_reader = MKB_WPFusion_Reader::instance();
            
            if (method_exists($wpfusion_reader, 'has_access')) {
                return $wpfusion_reader->has_access('premium_templates');
            }
        }
        
        // Alternative checks for premium access
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return false;
        }
        
        // Check for premium roles
        $user = get_userdata($user_id);
        $premium_roles = array('administrator', 'editor', 'premium_member');
        
        foreach ($premium_roles as $role) {
            if (in_array($role, (array) $user->roles)) {
                return true;
            }
        }
        
        // Check for premium access meta
        $has_premium = get_user_meta($user_id, 'mkb_premium_access', true);
        return $has_premium === 'yes';
    }
    
    /**
     * Save Kit (Create)
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function save_kit($request) {
        // Get kit data from request
        $kit_data = $request->get_json_params();
        
        if (empty($kit_data)) {
            return new WP_Error(
                'missing_data',
                __('No kit data provided', 'media-kit-builder'),
                array('status' => 400)
            );
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($kit_data);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Create new entry key
        $entry_key = md5(uniqid(get_current_user_id(), true));
        
        // Encode data
        $json_data = wp_json_encode($sanitized_data);
        
        // Insert into database
        $result = $wpdb->insert(
            $table_name,
            array(
                'entry_key' => $entry_key,
                'user_id' => get_current_user_id(),
                'data' => $json_data,
                'created' => current_time('mysql'),
                'modified' => current_time('mysql'),
            ),
            array('%s', '%d', '%s', '%s', '%s')
        );
        
        if ($result === false) {
            return new WP_Error(
                'db_error',
                __('Failed to save media kit: ' . $wpdb->last_error, 'media-kit-builder'),
                array('status' => 500)
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'entry_key' => $entry_key,
            'message' => __('Media kit saved successfully', 'media-kit-builder')
        ));
    }
    
    /**
     * Get Kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_kit($request) {
        $entry_key = $request->get_param('entry_key');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Get media kit
        $media_kit = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE entry_key = %s AND user_id = %d",
                $entry_key,
                get_current_user_id()
            )
        );
        
        if (!$media_kit) {
            return new WP_Error(
                'not_found',
                __('Media kit not found', 'media-kit-builder'),
                array('status' => 404)
            );
        }
        
        // Parse data
        $kit_data = json_decode($media_kit->data, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error(
                'invalid_data',
                __('Invalid media kit data: ' . json_last_error_msg(), 'media-kit-builder'),
                array('status' => 500)
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'entry_key' => $media_kit->entry_key,
            'data' => $kit_data
        ));
    }
    
    /**
     * Update Kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function update_kit($request) {
        $entry_key = $request->get_param('entry_key');
        $kit_data = $request->get_json_params();
        
        if (empty($kit_data)) {
            return new WP_Error(
                'missing_data',
                __('No kit data provided', 'media-kit-builder'),
                array('status' => 400)
            );
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($kit_data);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Encode data
        $json_data = wp_json_encode($sanitized_data);
        
        // Update in database
        $result = $wpdb->update(
            $table_name,
            array(
                'data' => $json_data,
                'modified' => current_time('mysql'),
            ),
            array(
                'entry_key' => $entry_key,
                'user_id' => get_current_user_id()
            ),
            array('%s', '%s'),
            array('%s', '%d')
        );
        
        if ($result === false) {
            return new WP_Error(
                'db_error',
                __('Failed to update media kit: ' . $wpdb->last_error, 'media-kit-builder'),
                array('status' => 500)
            );
        } else if ($result === 0) {
            return new WP_Error(
                'not_found',
                __('Media kit not found or no changes made', 'media-kit-builder'),
                array('status' => 404)
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'entry_key' => $entry_key,
            'message' => __('Media kit updated successfully', 'media-kit-builder')
        ));
    }
    
    /**
     * Delete Kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_kit($request) {
        $entry_key = $request->get_param('entry_key');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Delete from database
        $result = $wpdb->delete(
            $table_name,
            array(
                'entry_key' => $entry_key,
                'user_id' => get_current_user_id()
            ),
            array('%s', '%d')
        );
        
        if ($result === false) {
            return new WP_Error(
                'db_error',
                __('Failed to delete media kit: ' . $wpdb->last_error, 'media-kit-builder'),
                array('status' => 500)
            );
        } else if ($result === 0) {
            return new WP_Error(
                'not_found',
                __('Media kit not found', 'media-kit-builder'),
                array('status' => 404)
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Media kit deleted successfully', 'media-kit-builder')
        ));
    }
    
    /**
     * Sanitize kit data
     * 
     * @param array $data Data to sanitize
     * @return array Sanitized data
     */
    private function sanitize_kit_data($data) {
        // Deep sanitization of all fields
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    $data[$key] = $this->sanitize_kit_data($value);
                } else if (is_string($value)) {
                    // Allow certain HTML in content fields
                    if (in_array($key, array('content', 'html', 'text'))) {
                        $data[$key] = wp_kses_post($value);
                    } else {
                        $data[$key] = sanitize_text_field($value);
                    }
                }
            }
        }
        
        return $data;
    }
}

// Initialize API Endpoints
MKB_API_Endpoints::instance();
