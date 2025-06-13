<?php
/**
 * Media Kit Builder - Template Endpoints
 * 
 * Handles REST API endpoints for templates.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Template_Endpoints Class
 * 
 * Registers and handles REST API endpoints for templates
 */
class MKB_Template_Endpoints {
    
    /**
     * API Controller
     * @var MKB_API_Controller
     */
    protected $api_controller;
    
    /**
     * Constructor
     * 
     * @param MKB_API_Controller $api_controller API Controller
     */
    public function __construct($api_controller) {
        $this->api_controller = $api_controller;
    }
    
    /**
     * Register routes
     */
    public function register_routes() {
        $namespace = $this->api_controller->get_namespace();
        
        register_rest_route($namespace, '/templates', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_templates'),
                'permission_callback' => array($this->api_controller, 'check_read_permission'),
                'args' => array(
                    'category' => array(
                        'required' => false,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'search' => array(
                        'required' => false,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            )
        ));
        
        register_rest_route($namespace, '/templates/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_template'),
                'permission_callback' => array($this->api_controller, 'check_read_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return is_string($param) && !empty($param);
                        },
                    ),
                ),
            )
        ));
        
        // Admin-only: create/update/delete templates
        register_rest_route($namespace, '/templates', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_template'),
                'permission_callback' => function() {
                    return current_user_can('manage_options');
                },
                'args' => $this->get_template_schema()
            )
        ));
        
        register_rest_route($namespace, '/templates/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_template'),
                'permission_callback' => function() {
                    return current_user_can('manage_options');
                },
                'args' => $this->get_template_schema()
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_template'),
                'permission_callback' => function() {
                    return current_user_can('manage_options');
                }
            )
        ));
        
        // Template categories
        register_rest_route($namespace, '/templates/categories', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_template_categories'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            )
        ));
    }
    
    /**
     * Get templates
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_templates($request) {
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
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $filtered_templates,
                200,
                __('Templates retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get a single template by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_template($request) {
        $template_id = $request['id'];
        
        // Get all templates
        $templates = $this->get_all_templates();
        
        // Find the requested template
        if (!isset($templates[$template_id])) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Template not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        $template = $templates[$template_id];
        
        // Check if user has access to this template
        if (isset($template['premium']) && $template['premium'] && !$this->user_has_premium_access()) {
            // Mark as locked but still return the template
            $template['locked'] = true;
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $template,
                200,
                __('Template retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Create a new template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function create_template($request) {
        $data = $request->get_params();
        
        if (empty($data['name'])) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Template name is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Generate template ID from name if not provided
        if (empty($data['id'])) {
            $data['id'] = sanitize_title($data['name']) . '-' . substr(md5(uniqid()), 0, 6);
        }
        
        // Get existing templates
        $templates = $this->get_all_templates();
        
        // Check if template ID already exists
        if (isset($templates[$data['id']])) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Template ID already exists', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Save template
        $result = $this->save_template($data);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to create template', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Clear templates cache
        $this->clear_templates_cache();
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $data,
                201,
                __('Template created successfully', 'media-kit-builder')
            ),
            201
        );
    }
    
    /**
     * Update an existing template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function update_template($request) {
        $template_id = $request['id'];
        $data = $request->get_params();
        
        // Get existing templates
        $templates = $this->get_all_templates();
        
        // Check if template exists
        if (!isset($templates[$template_id])) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Template not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        // Merge with existing template data
        $data = array_merge($templates[$template_id], $data);
        $data['id'] = $template_id; // Ensure ID doesn't change
        
        // Save template
        $result = $this->save_template($data);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to update template', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Clear templates cache
        $this->clear_templates_cache();
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $data,
                200,
                __('Template updated successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Delete a template
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_template($request) {
        $template_id = $request['id'];
        
        // Get existing templates
        $templates = $this->get_all_templates();
        
        // Check if template exists
        if (!isset($templates[$template_id])) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Template not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        // Check if it's a built-in template
        if (isset($templates[$template_id]['built_in']) && $templates[$template_id]['built_in']) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Cannot delete built-in templates', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Delete template
        $result = $this->delete_template_from_db($template_id);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to delete template', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Clear templates cache
        $this->clear_templates_cache();
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                array(),
                200,
                __('Template deleted successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get template categories
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_template_categories($request) {
        $categories = array(
            'all' => array(
                'name' => __('All Templates', 'media-kit-builder'),
                'slug' => 'all',
                'count' => 0
            ),
            'hero' => array(
                'name' => __('Hero Sections', 'media-kit-builder'),
                'slug' => 'hero',
                'count' => 0
            ),
            'content' => array(
                'name' => __('Content Blocks', 'media-kit-builder'),
                'slug' => 'content',
                'count' => 0
            ),
            'features' => array(
                'name' => __('Features & Stats', 'media-kit-builder'),
                'slug' => 'features',
                'count' => 0
            ),
            'media' => array(
                'name' => __('Media Galleries', 'media-kit-builder'),
                'slug' => 'media',
                'count' => 0
            ),
            'contact' => array(
                'name' => __('Contact Sections', 'media-kit-builder'),
                'slug' => 'contact',
                'count' => 0
            )
        );
        
        // Get templates
        $templates = $this->get_all_templates();
        
        // Count templates in each category
        foreach ($templates as $template) {
            $template_category = isset($template['category']) ? $template['category'] : 'content';
            
            if (isset($categories[$template_category])) {
                $categories[$template_category]['count']++;
            }
            
            $categories['all']['count']++;
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $categories,
                200,
                __('Template categories retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get all templates with caching
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
     * Get default template data
     * 
     * @return array
     */
    private function get_template_data() {
        // Default templates
        $templates = array(
            'hero-basic' => array(
                'id' => 'hero-basic',
                'name' => __('Basic Hero', 'media-kit-builder'),
                'description' => __('Clean, centered hero with name and title', 'media-kit-builder'),
                'category' => 'hero',
                'premium' => false,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'hero',
                        'layout' => 'full-width',
                        'components' => array(
                            array(
                                'type' => 'hero',
                                'content' => array(
                                    'title' => __('Welcome', 'media-kit-builder'),
                                    'subtitle' => __('Your media kit', 'media-kit-builder')
                                )
                            )
                        )
                    )
                )
            ),
            'content-bio' => array(
                'id' => 'content-bio',
                'name' => __('Biography', 'media-kit-builder'),
                'description' => __('Bio section with text and image', 'media-kit-builder'),
                'category' => 'content',
                'premium' => false,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'content',
                        'layout' => 'full-width',
                        'components' => array(
                            array(
                                'type' => 'biography',
                                'content' => array(
                                    'text' => __('Your biography here', 'media-kit-builder')
                                )
                            )
                        )
                    )
                )
            ),
            'two-column-bio' => array(
                'id' => 'two-column-bio',
                'name' => __('Bio with Image', 'media-kit-builder'),
                'description' => __('Two-column layout with bio and image', 'media-kit-builder'),
                'category' => 'content',
                'premium' => false,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'content',
                        'layout' => 'two-column',
                        'components' => array(
                            'column_1' => array(
                                array(
                                    'type' => 'biography',
                                    'content' => array(
                                        'text' => __('Your biography here', 'media-kit-builder')
                                    )
                                )
                            ),
                            'column_2' => array(
                                array(
                                    'type' => 'image',
                                    'content' => array(
                                        'url' => ''
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            'three-column-topics' => array(
                'id' => 'three-column-topics',
                'name' => __('Topics Grid', 'media-kit-builder'),
                'description' => __('Showcase your topics in a three-column grid', 'media-kit-builder'),
                'category' => 'features',
                'premium' => false,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'features',
                        'layout' => 'three-column',
                        'components' => array(
                            'column_1' => array(
                                array(
                                    'type' => 'topics',
                                    'content' => array(
                                        'topics' => array(__('Topic 1', 'media-kit-builder'), __('Topic 4', 'media-kit-builder'))
                                    )
                                )
                            ),
                            'column_2' => array(
                                array(
                                    'type' => 'topics',
                                    'content' => array(
                                        'topics' => array(__('Topic 2', 'media-kit-builder'), __('Topic 5', 'media-kit-builder'))
                                    )
                                )
                            ),
                            'column_3' => array(
                                array(
                                    'type' => 'topics',
                                    'content' => array(
                                        'topics' => array(__('Topic 3', 'media-kit-builder'), __('Topic 6', 'media-kit-builder'))
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            'gallery-premium' => array(
                'id' => 'gallery-premium',
                'name' => __('Image Gallery', 'media-kit-builder'),
                'description' => __('Premium gallery for your media', 'media-kit-builder'),
                'category' => 'media',
                'premium' => true,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'media',
                        'layout' => 'three-column',
                        'components' => array(
                            'column_1' => array(
                                array(
                                    'type' => 'image',
                                    'content' => array(
                                        'url' => ''
                                    )
                                )
                            ),
                            'column_2' => array(
                                array(
                                    'type' => 'image',
                                    'content' => array(
                                        'url' => ''
                                    )
                                )
                            ),
                            'column_3' => array(
                                array(
                                    'type' => 'image',
                                    'content' => array(
                                        'url' => ''
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            'contact-section' => array(
                'id' => 'contact-section',
                'name' => __('Contact Info', 'media-kit-builder'),
                'description' => __('Contact information with social links', 'media-kit-builder'),
                'category' => 'contact',
                'premium' => false,
                'built_in' => true,
                'thumbnail' => '',
                'sections' => array(
                    array(
                        'type' => 'contact',
                        'layout' => 'full-width',
                        'components' => array(
                            array(
                                'type' => 'social',
                                'content' => array(
                                    'platforms' => array(
                                        array(
                                            'platform' => 'Email',
                                            'link' => 'your@email.com'
                                        ),
                                        array(
                                            'platform' => 'Twitter',
                                            'link' => 'https://twitter.com/yourusername'
                                        ),
                                        array(
                                            'platform' => 'LinkedIn',
                                            'link' => 'https://linkedin.com/in/yourusername'
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
        
        // Allow plugins to modify templates
        return apply_filters('mkb_section_templates', $templates);
    }
    
    /**
     * Get custom templates from database
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
     * Save template to database
     * 
     * @param array $template_data Template data
     * @return bool True on success, false on failure
     */
    private function save_template($template_data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_templates';
        
        // Create table if it doesn't exist
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") !== $table_name) {
            $charset_collate = $wpdb->get_charset_collate();
            
            $sql = "CREATE TABLE $table_name (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                template_id varchar(100) NOT NULL,
                template_data longtext NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'active',
                created datetime NOT NULL,
                modified datetime NOT NULL,
                PRIMARY KEY  (id),
                UNIQUE KEY template_id (template_id)
            ) $charset_collate;";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
        
        $template_id = $template_data['id'];
        
        // Check if template already exists
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table_name WHERE template_id = %s",
                $template_id
            )
        );
        
        if ($existing) {
            // Update existing template
            $result = $wpdb->update(
                $table_name,
                array(
                    'template_data' => wp_json_encode($template_data),
                    'modified' => current_time('mysql')
                ),
                array('template_id' => $template_id),
                array('%s', '%s'),
                array('%s')
            );
            
            return $result !== false;
        } else {
            // Insert new template
            $result = $wpdb->insert(
                $table_name,
                array(
                    'template_id' => $template_id,
                    'template_data' => wp_json_encode($template_data),
                    'status' => 'active',
                    'created' => current_time('mysql'),
                    'modified' => current_time('mysql')
                ),
                array('%s', '%s', '%s', '%s', '%s')
            );
            
            return $result !== false;
        }
    }
    
    /**
     * Delete template from database
     * 
     * @param string $template_id Template ID
     * @return bool True on success, false on failure
     */
    private function delete_template_from_db($template_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_templates';
        
        // Delete template
        $result = $wpdb->delete(
            $table_name,
            array('template_id' => $template_id),
            array('%s')
        );
        
        return $result !== false;
    }
    
    /**
     * Clear templates cache
     */
    public function clear_templates_cache() {
        delete_transient('mkb_templates');
    }
    
    /**
     * Filter templates by user access
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
     * Check if user has premium access
     * 
     * @return bool
     */
    private function user_has_premium_access() {
        // Admin always has access
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check access using WP Fusion if available
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        if ($wpfusion_reader) {
            return $wpfusion_reader->can_access_feature('premium_components');
        }
        
        // Default to false for safety
        return false;
    }
    
    /**
     * Get template schema
     * 
     * @return array
     */
    private function get_template_schema() {
        return array(
            'id' => array(
                'required' => false,
                'type' => 'string',
                'description' => __('Template ID', 'media-kit-builder')
            ),
            'name' => array(
                'required' => true,
                'type' => 'string',
                'description' => __('Template name', 'media-kit-builder')
            ),
            'description' => array(
                'required' => false,
                'type' => 'string',
                'description' => __('Template description', 'media-kit-builder')
            ),
            'category' => array(
                'required' => false,
                'type' => 'string',
                'description' => __('Template category', 'media-kit-builder'),
                'enum' => array('hero', 'content', 'features', 'media', 'contact')
            ),
            'premium' => array(
                'required' => false,
                'type' => 'boolean',
                'description' => __('Whether this is a premium template', 'media-kit-builder')
            ),
            'thumbnail' => array(
                'required' => false,
                'type' => 'string',
                'description' => __('Template thumbnail URL', 'media-kit-builder')
            ),
            'sections' => array(
                'required' => true,
                'type' => 'array',
                'description' => __('Template sections', 'media-kit-builder')
            )
        );
    }
}
