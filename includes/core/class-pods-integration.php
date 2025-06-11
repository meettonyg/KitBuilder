<?php
/**
 * Media Kit Builder - Pods Integration System
 * 
 * Handles custom field management through Pods Framework.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Pods_Integration Class
 * 
 * Core System #3: Pods Integration System
 * Purpose: Custom field management
 */
class MKB_Pods_Integration {
    
    /**
     * Instance
     * @var MKB_Pods_Integration
     */
    private static $instance = null;
    
    /**
     * Pods available
     * @var bool
     */
    private $pods_available = false;
    
    /**
     * Field mappings
     * @var array
     */
    private $field_mappings = array();
    
    /**
     * Post type name
     * @var string
     */
    private $post_type = 'mkb_media_kit';
    
    /**
     * Get instance
     * 
     * @return MKB_Pods_Integration
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
        $this->check_pods_availability();
        $this->init_field_mappings();
        $this->init_hooks();
        
        if ($this->pods_available) {
            $this->setup_pods_post_type();
        }
    }
    
    /**
     * Check if Pods is available
     */
    private function check_pods_availability() {
        $this->pods_available = function_exists('pods') || class_exists('Pods');
    }
    
    /**
     * Initialize field mappings
     */
    private function init_field_mappings() {
        /**
         * Map component fields to Pods fields
         * Based on the architecture document field mappings
         */
        $this->field_mappings = apply_filters('mkb_pods_field_mappings', array(
            // Hero/Profile Section
            'hero' => array(
                'guest_first_name' => array(
                    'type' => 'text',
                    'label' => __('First Name', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_last_name' => array(
                    'type' => 'text',
                    'label' => __('Last Name', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_full_name' => array(
                    'type' => 'text',
                    'label' => __('Full Name', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_title' => array(
                    'type' => 'text',
                    'label' => __('Position/Title', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_organization' => array(
                    'type' => 'text',
                    'label' => __('Organization', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_headshot' => array(
                    'type' => 'file',
                    'label' => __('Head Shot (Primary)', 'media-kit-builder'),
                    'file_type' => 'images',
                    'required' => false
                ),
                'guest_tagline' => array(
                    'type' => 'text',
                    'label' => __('Tagline', 'media-kit-builder'),
                    'required' => false
                )
            ),
            
            // Biography Component
            'biography' => array(
                'guest_biography' => array(
                    'type' => 'wysiwyg',
                    'label' => __('Bio (300-500 words)', 'media-kit-builder'),
                    'wysiwyg_allowed_html_tags' => 'strong em a ul ol li p br',
                    'required' => false
                ),
                'guest_ai_bio' => array(
                    'type' => 'wysiwyg',
                    'label' => __('AI Bio', 'media-kit-builder'),
                    'readonly' => true,
                    'required' => false
                )
            ),
            
            // Topics Component
            'topics' => array(
                'guest_topic_1' => array(
                    'type' => 'text',
                    'label' => __('Topic 1', 'media-kit-builder'),
                    'maxlength' => 50,
                    'required' => false
                ),
                'guest_topic_2' => array(
                    'type' => 'text',
                    'label' => __('Topic 2', 'media-kit-builder'),
                    'maxlength' => 50,
                    'required' => false
                ),
                'guest_topic_3' => array(
                    'type' => 'text',
                    'label' => __('Topic 3', 'media-kit-builder'),
                    'maxlength' => 50,
                    'required' => false
                ),
                'guest_topic_4' => array(
                    'type' => 'text',
                    'label' => __('Topic 4', 'media-kit-builder'),
                    'maxlength' => 50,
                    'required' => false
                ),
                'guest_topic_5' => array(
                    'type' => 'text',
                    'label' => __('Topic 5', 'media-kit-builder'),
                    'maxlength' => 50,
                    'required' => false
                )
            ),
            
            // Social Media Component
            'social' => array(
                'guest_facebook' => array(
                    'type' => 'website',
                    'label' => __('Facebook', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_twitter' => array(
                    'type' => 'website',
                    'label' => __('Twitter', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_instagram' => array(
                    'type' => 'website',
                    'label' => __('Instagram', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_linkedin' => array(
                    'type' => 'website',
                    'label' => __('LinkedIn', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_youtube' => array(
                    'type' => 'website',
                    'label' => __('YouTube', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_pinterest' => array(
                    'type' => 'website',
                    'label' => __('Pinterest', 'media-kit-builder'),
                    'required' => false
                ),
                'guest_tiktok' => array(
                    'type' => 'website',
                    'label' => __('TikTok', 'media-kit-builder'),
                    'required' => false
                )
            ),
            
            // Logo Carousel Component
            'logos' => array(
                'guest_logo' => array(
                    'type' => 'file',
                    'label' => __('Logo', 'media-kit-builder'),
                    'file_type' => 'images',
                    'required' => false
                ),
                'guest_carousel_images' => array(
                    'type' => 'file',
                    'label' => __('Carousel Images', 'media-kit-builder'),
                    'file_type' => 'images',
                    'file_format_type' => 'multi',
                    'file_limit' => 12,
                    'required' => false
                )
            ),
            
            // Questions Component (25 fields)
            'questions' => $this->generate_question_fields()
        ));
    }
    
    /**
     * Generate question fields (1-25)
     * 
     * @return array
     */
    private function generate_question_fields() {
        $questions = array();
        
        for ($i = 1; $i <= 25; $i++) {
            $questions["guest_question_{$i}"] = array(
                'type' => 'text',
                'label' => sprintf(__('Question %d', 'media-kit-builder'), $i),
                'maxlength' => 200,
                'required' => false
            );
        }
        
        return $questions;
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Post type registration
        add_action('init', array($this, 'register_post_type'), 5);
        
        // AJAX endpoints
        add_action('wp_ajax_mkb_save_pods_data', array($this, 'ajax_save_pods_data'));
        add_action('wp_ajax_nopriv_mkb_save_pods_data', array($this, 'ajax_save_pods_data'));
        
        add_action('wp_ajax_mkb_get_pods_data', array($this, 'ajax_get_pods_data'));
        add_action('wp_ajax_nopriv_mkb_get_pods_data', array($this, 'ajax_get_pods_data'));
        
        // Pods setup
        if ($this->pods_available) {
            add_action('init', array($this, 'setup_pods_fields'), 20);
        }
    }
    
    /**
     * Register custom post type
     */
    public function register_post_type() {
        $labels = array(
            'name' => __('Media Kits', 'media-kit-builder'),
            'singular_name' => __('Media Kit', 'media-kit-builder'),
            'menu_name' => __('Media Kits', 'media-kit-builder'),
            'add_new' => __('Add New', 'media-kit-builder'),
            'add_new_item' => __('Add New Media Kit', 'media-kit-builder'),
            'edit_item' => __('Edit Media Kit', 'media-kit-builder'),
            'new_item' => __('New Media Kit', 'media-kit-builder'),
            'view_item' => __('View Media Kit', 'media-kit-builder'),
            'search_items' => __('Search Media Kits', 'media-kit-builder'),
            'not_found' => __('No media kits found', 'media-kit-builder'),
            'not_found_in_trash' => __('No media kits found in trash', 'media-kit-builder')
        );
        
        $args = array(
            'labels' => $labels,
            'public' => true,
            'publicly_queryable' => true,
            'show_ui' => true,
            'show_in_menu' => false, // Hide from admin menu (we have custom menu)
            'query_var' => true,
            'rewrite' => array('slug' => 'media-kit'),
            'capability_type' => 'post',
            'has_archive' => true,
            'hierarchical' => false,
            'menu_position' => null,
            'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt'),
            'show_in_rest' => true,
            'rest_base' => 'media-kits'
        );
        
        register_post_type($this->post_type, $args);
    }
    
    /**
     * Setup Pods post type and fields
     */
    public function setup_pods_post_type() {
        if (!$this->pods_available) {
            return;
        }
        
        // Check if Pods post type already exists
        if (!$this->pods_post_type_exists()) {
            $this->create_pods_post_type();
        }
        
        // Setup fields
        $this->setup_pods_fields();
    }
    
    /**
     * Check if Pods post type exists
     * 
     * @return bool
     */
    private function pods_post_type_exists() {
        if (!function_exists('pods_api')) {
            return false;
        }
        
        $api = pods_api();
        $pod = $api->load_pod(array('name' => $this->post_type));
        
        return !empty($pod);
    }
    
    /**
     * Create Pods post type
     */
    private function create_pods_post_type() {
        if (!function_exists('pods_api')) {
            return;
        }
        
        $api = pods_api();
        
        $params = array(
            'name' => $this->post_type,
            'label' => __('Media Kits', 'media-kit-builder'),
            'type' => 'post_type',
            'storage' => 'meta',
            'public' => '1',
            'show_ui' => '1',
            'supports_title' => '1',
            'supports_editor' => '1'
        );
        
        $api->save_pod($params);
    }
    
    /**
     * Setup Pods fields
     */
    public function setup_pods_fields() {
        if (!function_exists('pods_api')) {
            return;
        }
        
        $api = pods_api();
        
        foreach ($this->field_mappings as $component => $fields) {
            foreach ($fields as $field_name => $field_config) {
                $this->create_pods_field($api, $field_name, $field_config);
            }
        }
    }
    
    /**
     * Create individual Pods field
     * 
     * @param object $api
     * @param string $field_name
     * @param array $field_config
     */
    private function create_pods_field($api, $field_name, $field_config) {
        // Check if field already exists
        $existing_field = $api->load_field(array(
            'pod' => $this->post_type,
            'name' => $field_name
        ));
        
        if (!empty($existing_field)) {
            return; // Field already exists
        }
        
        $params = array(
            'pod' => $this->post_type,
            'name' => $field_name,
            'label' => $field_config['label'],
            'type' => $field_config['type'],
            'required' => $field_config['required'] ?? false
        );
        
        // Add type-specific configurations
        switch ($field_config['type']) {
            case 'text':
                if (isset($field_config['maxlength'])) {
                    $params['maxlength'] = $field_config['maxlength'];
                }
                break;
                
            case 'wysiwyg':
                if (isset($field_config['wysiwyg_allowed_html_tags'])) {
                    $params['wysiwyg_allowed_html_tags'] = $field_config['wysiwyg_allowed_html_tags'];
                }
                break;
                
            case 'file':
                $params['file_format_type'] = $field_config['file_format_type'] ?? 'single';
                $params['file_type'] = $field_config['file_type'] ?? 'images';
                if (isset($field_config['file_limit'])) {
                    $params['file_limit'] = $field_config['file_limit'];
                }
                break;
                
            case 'website':
                $params['website_format'] = 'normal';
                break;
        }
        
        $api->save_field($params);
    }
    
    /**
     * Save data to Pods
     * 
     * @param int $post_id
     * @param array $data
     * @return bool
     */
    public function save_data($post_id, $data) {
        if (!$this->pods_available || !$post_id) {
            return false;
        }
        
        $pod = pods($this->post_type, $post_id);
        
        if (!$pod || !$pod->exists()) {
            return false;
        }
        
        // Sanitize and validate data
        $sanitized_data = $this->sanitize_data($data);
        
        try {
            $result = $pod->save($sanitized_data);
            
            if ($result) {
                do_action('mkb_pods_data_saved', $post_id, $sanitized_data);
                return true;
            }
        } catch (Exception $e) {
            error_log('MKB Pods save error: ' . $e->getMessage());
        }
        
        return false;
    }
    
    /**
     * Get data from Pods
     * 
     * @param int $post_id
     * @param array $fields
     * @return array
     */
    public function get_data($post_id, $fields = null) {
        if (!$this->pods_available || !$post_id) {
            return array();
        }
        
        $pod = pods($this->post_type, $post_id);
        
        if (!$pod || !$pod->exists()) {
            return array();
        }
        
        $data = array();
        
        if ($fields === null) {
            // Get all mapped fields
            $fields = array();
            foreach ($this->field_mappings as $component => $component_fields) {
                $fields = array_merge($fields, array_keys($component_fields));
            }
        }
        
        foreach ($fields as $field) {
            $value = $pod->field($field);
            if ($value !== null) {
                $data[$field] = $value;
            }
        }
        
        return $data;
    }
    
    /**
     * Create new media kit post
     * 
     * @param array $args
     * @return int|false Post ID on success, false on failure
     */
    public function create_media_kit($args = array()) {
        $defaults = array(
            'post_type' => $this->post_type,
            'post_status' => 'draft',
            'post_title' => __('New Media Kit', 'media-kit-builder'),
            'post_author' => get_current_user_id()
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $post_id = wp_insert_post($args);
        
        if ($post_id && !is_wp_error($post_id)) {
            do_action('mkb_media_kit_created', $post_id);
            return $post_id;
        }
        
        return false;
    }
    
    /**
     * AJAX: Save Pods data
     */
    public function ajax_save_pods_data() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id'] ?? 0);
        $data = $_POST['data'] ?? array();
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
            return;
        }
        
        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        if ($this->save_data($post_id, $data)) {
            wp_send_json_success('Data saved successfully');
        } else {
            wp_send_json_error('Failed to save data');
        }
    }
    
    /**
     * AJAX: Get Pods data
     */
    public function ajax_get_pods_data() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id'] ?? 0);
        $fields = $_POST['fields'] ?? null;
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
            return;
        }
        
        // Check permissions
        if (!current_user_can('read_post', $post_id)) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $data = $this->get_data($post_id, $fields);
        
        wp_send_json_success($data);
    }
    
    /**
     * Sanitize data before saving
     * 
     * @param array $data
     * @return array
     */
    private function sanitize_data($data) {
        $sanitized = array();
        
        foreach ($data as $field => $value) {
            $field_config = $this->get_field_config($field);
            
            if (!$field_config) {
                continue; // Skip unknown fields
            }
            
            switch ($field_config['type']) {
                case 'text':
                    $sanitized[$field] = sanitize_text_field($value);
                    break;
                    
                case 'wysiwyg':
                    $sanitized[$field] = wp_kses_post($value);
                    break;
                    
                case 'website':
                    $sanitized[$field] = esc_url_raw($value);
                    break;
                    
                case 'file':
                    if (is_array($value)) {
                        $sanitized[$field] = array_map('intval', $value);
                    } else {
                        $sanitized[$field] = intval($value);
                    }
                    break;
                    
                default:
                    $sanitized[$field] = sanitize_text_field($value);
                    break;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Get field configuration
     * 
     * @param string $field_name
     * @return array|null
     */
    private function get_field_config($field_name) {
        foreach ($this->field_mappings as $component => $fields) {
            if (isset($fields[$field_name])) {
                return $fields[$field_name];
            }
        }
        
        return null;
    }
    
    /**
     * Get field mappings
     * 
     * @param string $component
     * @return array
     */
    public function get_field_mappings($component = null) {
        if ($component) {
            return $this->field_mappings[$component] ?? array();
        }
        
        return $this->field_mappings;
    }
    
    /**
     * Check if Pods is available
     * 
     * @return bool
     */
    public function is_pods_available() {
        return $this->pods_available;
    }
    
    /**
     * Get Pods status for debugging
     * 
     * @return array
     */
    public function get_pods_status() {
        return array(
            'available' => $this->pods_available,
            'pods_function' => function_exists('pods'),
            'pods_class' => class_exists('Pods'),
            'pods_api_function' => function_exists('pods_api'),
            'post_type' => $this->post_type,
            'post_type_exists' => post_type_exists($this->post_type),
            'pods_post_type_exists' => $this->pods_post_type_exists(),
            'field_mappings_count' => count($this->field_mappings, COUNT_RECURSIVE)
        );
    }
}
