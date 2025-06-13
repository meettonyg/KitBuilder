<?php
/**
 * Media Kit Builder - Share Manager System
 * 
 * Handles sharing and embedding functionality for media kits.
 * This is part of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Share_Manager Class
 * 
 * Core System: Share Manager System
 * Purpose: Manage sharing and embedding of media kits
 */
class MKB_Share_Manager {
    
    /**
     * Instance
     * @var MKB_Share_Manager
     */
    private static $instance = null;
    
    /**
     * Share links table
     * @var string
     */
    private $share_links_table;
    
    /**
     * Embed code settings
     * @var array
     */
    private $embed_defaults;
    
    /**
     * Get instance
     * 
     * @return MKB_Share_Manager
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
        global $wpdb;
        $this->share_links_table = $wpdb->prefix . 'mkb_share_links';
        
        $this->embed_defaults = array(
            'width' => '100%',
            'height' => '600px',
            'responsive' => true,
            'theme' => 'light',
            'show_footer' => true
        );
        
        $this->init_hooks();
        $this->ensure_tables_exist();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // AJAX endpoints
        add_action('wp_ajax_mkb_generate_share_link', array($this, 'ajax_generate_share_link'));
        add_action('wp_ajax_nopriv_mkb_generate_share_link', array($this, 'ajax_generate_share_link'));
        
        add_action('wp_ajax_mkb_generate_embed_code', array($this, 'ajax_generate_embed_code'));
        add_action('wp_ajax_nopriv_mkb_generate_embed_code', array($this, 'ajax_generate_embed_code'));
        
        // REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Shortcode for displaying shared media kits
        add_shortcode('media_kit_shared', array($this, 'shared_media_kit_shortcode'));
        
        // Public view handler
        add_action('init', array($this, 'handle_public_view_request'));
        
        // Cleanup old share links
        add_action('mkb_daily_cleanup', array($this, 'cleanup_old_share_links'));
    }
    
    /**
     * Ensure required tables exist
     */
    private function ensure_tables_exist() {
        global $wpdb;
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->share_links_table}'") != $this->share_links_table) {
            $this->create_tables();
        }
    }
    
    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE {$this->share_links_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            share_id varchar(255) NOT NULL,
            context_id varchar(255) NOT NULL,
            user_id bigint(20) DEFAULT NULL,
            guest_session_id varchar(255) DEFAULT NULL,
            title varchar(255) DEFAULT NULL,
            description text DEFAULT NULL,
            access_type varchar(50) NOT NULL DEFAULT 'public',
            password varchar(255) DEFAULT NULL,
            expiry_date datetime DEFAULT NULL,
            view_count bigint(20) NOT NULL DEFAULT 0,
            last_viewed datetime DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY share_id (share_id),
            KEY context_id (context_id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('media-kit/v1', '/share', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_generate_share_link'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('media-kit/v1', '/embed', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_generate_embed_code'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('media-kit/v1', '/share/(?P<share_id>[a-zA-Z0-9-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'rest_get_shared_media_kit'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Handle public view request for shared media kits
     */
    public function handle_public_view_request() {
        // Check if this is a media kit share request
        if (isset($_GET['mkb_share'])) {
            $share_id = sanitize_text_field($_GET['mkb_share']);
            
            // Get share information
            $share_info = $this->get_share_link_info($share_id);
            
            if (!$share_info) {
                wp_die('This shared media kit link is invalid or has expired.');
                return;
            }
            
            // Check if password protected
            if ($share_info->access_type === 'password') {
                // If password is submitted, verify it
                if (isset($_POST['mkb_share_password'])) {
                    $submitted_password = sanitize_text_field($_POST['mkb_share_password']);
                    
                    if (!wp_check_password($submitted_password, $share_info->password)) {
                        wp_die('Incorrect password. Please try again.');
                    }
                    
                    // Set a cookie to remember the password
                    setcookie('mkb_share_' . $share_id, md5($submitted_password), time() + 86400, '/');
                }
                // If password not submitted and no valid cookie, show password form
                elseif (!isset($_COOKIE['mkb_share_' . $share_id]) || 
                        $_COOKIE['mkb_share_' . $share_id] !== md5($share_info->password)) {
                    $this->display_password_form($share_id, $share_info);
                    exit;
                }
            }
            
            // Check for expiry
            if ($share_info->expiry_date && strtotime($share_info->expiry_date) < time()) {
                wp_die('This shared media kit link has expired.');
                return;
            }
            
            // Increment view count
            $this->increment_view_count($share_id);
            
            // Load and display the shared media kit
            $this->display_shared_media_kit($share_info);
            exit;
        }
    }
    
    /**
     * Generate share link
     * 
     * @param string $context_id Context ID (media kit ID)
     * @param array $options Share options
     * @return array|false Share information or false on failure
     */
    public function generate_share_link($context_id, $options = array()) {
        if (empty($context_id)) {
            return false;
        }
        
        global $wpdb;
        
        // Check if we already have a share link for this context
        $existing_share = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->share_links_table} WHERE context_id = %s",
            $context_id
        ));
        
        // Default options
        $defaults = array(
            'title' => '',
            'description' => '',
            'access_type' => 'public', // public, password, private
            'password' => '',
            'expiry_days' => 0, // 0 = never expires
            'regenerate' => false
        );
        
        $options = wp_parse_args($options, $defaults);
        
        // If we found an existing share and not regenerating, return it
        if ($existing_share && !$options['regenerate']) {
            return $this->format_share_response($existing_share);
        }
        
        // Generate a unique share ID
        $share_id = $this->generate_unique_share_id();
        
        // Calculate expiry date
        $expiry_date = null;
        if ($options['expiry_days'] > 0) {
            $expiry_date = date('Y-m-d H:i:s', strtotime("+{$options['expiry_days']} days"));
        }
        
        // Get user ID if logged in
        $user_id = get_current_user_id();
        $guest_session_id = $user_id ? null : $this->get_guest_session_id();
        
        // Hash password if provided
        if ($options['access_type'] === 'password' && !empty($options['password'])) {
            $options['password'] = wp_hash_password($options['password']);
        } else {
            $options['password'] = '';
        }
        
        // Prepare data
        $data = array(
            'share_id' => $share_id,
            'context_id' => $context_id,
            'user_id' => $user_id ?: null,
            'guest_session_id' => $guest_session_id,
            'title' => sanitize_text_field($options['title']),
            'description' => sanitize_textarea_field($options['description']),
            'access_type' => sanitize_text_field($options['access_type']),
            'password' => $options['password'],
            'expiry_date' => $expiry_date,
            'view_count' => 0,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        
        // If we found an existing share and we're regenerating, update it
        if ($existing_share && $options['regenerate']) {
            $wpdb->update(
                $this->share_links_table,
                $data,
                array('id' => $existing_share->id)
            );
            
            $share_data = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->share_links_table} WHERE id = %d",
                $existing_share->id
            ));
        } else {
            // Insert new share
            $wpdb->insert(
                $this->share_links_table,
                $data
            );
            
            $share_data = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->share_links_table} WHERE share_id = %s",
                $share_id
            ));
        }
        
        if (!$share_data) {
            return false;
        }
        
        return $this->format_share_response($share_data);
    }
    
    /**
     * Generate a unique share ID
     * 
     * @return string Unique share ID
     */
    private function generate_unique_share_id() {
        $characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        $share_id = '';
        
        for ($i = 0; $i < 10; $i++) {
            $share_id .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        // Check if share ID already exists
        global $wpdb;
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->share_links_table} WHERE share_id = %s",
            $share_id
        ));
        
        // If it exists, generate a new one
        if ($exists) {
            return $this->generate_unique_share_id();
        }
        
        return $share_id;
    }
    
    /**
     * Get guest session ID
     * 
     * @return string Guest session ID
     */
    private function get_guest_session_id() {
        if (isset($_COOKIE['mkb_guest_session'])) {
            return sanitize_text_field($_COOKIE['mkb_guest_session']);
        }
        
        return '';
    }
    
    /**
     * Format share response
     * 
     * @param object $share_data Share data
     * @return array Formatted share response
     */
    private function format_share_response($share_data) {
        $site_url = site_url();
        $share_url = add_query_arg('mkb_share', $share_data->share_id, $site_url);
        
        return array(
            'share_id' => $share_data->share_id,
            'context_id' => $share_data->context_id,
            'title' => $share_data->title,
            'description' => $share_data->description,
            'access_type' => $share_data->access_type,
            'requires_password' => $share_data->access_type === 'password',
            'expiry_date' => $share_data->expiry_date,
            'view_count' => $share_data->view_count,
            'last_viewed' => $share_data->last_viewed,
            'created_at' => $share_data->created_at,
            'updated_at' => $share_data->updated_at,
            'share_url' => $share_url,
            'embed_code' => $this->generate_embed_code($share_data->share_id)
        );
    }
    
    /**
     * Get share link info
     * 
     * @param string $share_id Share ID
     * @return object|false Share information or false if not found
     */
    public function get_share_link_info($share_id) {
        global $wpdb;
        
        $share_info = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->share_links_table} WHERE share_id = %s",
            $share_id
        ));
        
        if (!$share_info) {
            return false;
        }
        
        return $share_info;
    }
    
    /**
     * Increment view count for a share link
     * 
     * @param string $share_id Share ID
     * @return bool True on success, false on failure
     */
    private function increment_view_count($share_id) {
        global $wpdb;
        
        $result = $wpdb->query($wpdb->prepare(
            "UPDATE {$this->share_links_table} SET view_count = view_count + 1, last_viewed = %s WHERE share_id = %s",
            current_time('mysql'),
            $share_id
        ));
        
        return $result !== false;
    }
    
    /**
     * Display password form for password-protected media kits
     * 
     * @param string $share_id Share ID
     * @param object $share_info Share information
     */
    private function display_password_form($share_id, $share_info) {
        // Output HTML for password form
        include(MKB_PLUGIN_DIR . 'templates/share-password-form.php');
    }
    
    /**
     * Display shared media kit
     * 
     * @param object $share_info Share information
     */
    private function display_shared_media_kit($share_info) {
        // Get the media kit data
        $context_id = $share_info->context_id;
        
        // Get media kit data based on context ID
        $media_kit_data = $this->get_media_kit_data($context_id);
        
        if (!$media_kit_data) {
            wp_die('The media kit could not be found.');
            return;
        }
        
        // Output HTML for shared media kit
        include(MKB_PLUGIN_DIR . 'templates/shared-media-kit.php');
    }
    
    /**
     * Get media kit data
     * 
     * @param string $context_id Context ID (media kit ID)
     * @return array|false Media kit data or false if not found
     */
    private function get_media_kit_data($context_id) {
        global $wpdb;
        
        // Get from media_kits table
        $table_name = $wpdb->prefix . 'media_kits';
        $data = $wpdb->get_var($wpdb->prepare(
            "SELECT data FROM {$table_name} WHERE entry_key = %s",
            $context_id
        ));
        
        if ($data) {
            return json_decode($data, true);
        }
        
        return false;
    }
    
    /**
     * Generate embed code
     * 
     * @param string $share_id Share ID
     * @param array $options Embed options
     * @return string Embed code HTML
     */
    public function generate_embed_code($share_id, $options = array()) {
        if (empty($share_id)) {
            return '';
        }
        
        $options = wp_parse_args($options, $this->embed_defaults);
        
        $site_url = site_url();
        $embed_url = add_query_arg(array(
            'mkb_share' => $share_id,
            'embed' => '1'
        ), $site_url);
        
        // Generate iframe HTML
        $iframe_html = sprintf(
            '<iframe src="%s" width="%s" height="%s" frameborder="0" allowfullscreen></iframe>',
            esc_url($embed_url),
            esc_attr($options['width']),
            esc_attr($options['height'])
        );
        
        // Add responsive wrapper if needed
        if ($options['responsive']) {
            $iframe_html = sprintf(
                '<div style="position: relative; padding-bottom: 56.25%%; height: 0; overflow: hidden; max-width: 100%%;">%s</div>',
                str_replace(
                    '<iframe',
                    '<iframe style="position: absolute; top: 0; left: 0; width: 100%%; height: 100%%;"',
                    $iframe_html
                )
            );
        }
        
        return $iframe_html;
    }
    
    /**
     * AJAX: Generate share link
     */
    public function ajax_generate_share_link() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = isset($_POST['context_id']) ? sanitize_text_field($_POST['context_id']) : '';
        $options = isset($_POST['options']) ? $_POST['options'] : array();
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID is required');
            return;
        }
        
        $share_link = $this->generate_share_link($context_id, $options);
        
        if ($share_link) {
            wp_send_json_success($share_link);
        } else {
            wp_send_json_error('Failed to generate share link');
        }
    }
    
    /**
     * AJAX: Generate embed code
     */
    public function ajax_generate_embed_code() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $share_id = isset($_POST['share_id']) ? sanitize_text_field($_POST['share_id']) : '';
        $options = isset($_POST['options']) ? $_POST['options'] : array();
        
        if (empty($share_id)) {
            wp_send_json_error('Share ID is required');
            return;
        }
        
        $embed_code = $this->generate_embed_code($share_id, $options);
        
        if ($embed_code) {
            wp_send_json_success(array('embed_code' => $embed_code));
        } else {
            wp_send_json_error('Failed to generate embed code');
        }
    }
    
    /**
     * REST: Generate share link
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_generate_share_link($request) {
        $context_id = $request->get_param('context_id');
        $options = $request->get_param('options');
        
        if (empty($context_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Context ID is required'
            ), 400);
        }
        
        $share_link = $this->generate_share_link($context_id, $options);
        
        if ($share_link) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => $share_link
            ), 200);
        } else {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to generate share link'
            ), 500);
        }
    }
    
    /**
     * REST: Generate embed code
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_generate_embed_code($request) {
        $share_id = $request->get_param('share_id');
        $options = $request->get_param('options');
        
        if (empty($share_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Share ID is required'
            ), 400);
        }
        
        $embed_code = $this->generate_embed_code($share_id, $options);
        
        if ($embed_code) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => array('embed_code' => $embed_code)
            ), 200);
        } else {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to generate embed code'
            ), 500);
        }
    }
    
    /**
     * REST: Get shared media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_get_shared_media_kit($request) {
        $share_id = $request->get_param('share_id');
        
        if (empty($share_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Share ID is required'
            ), 400);
        }
        
        // Get share information
        $share_info = $this->get_share_link_info($share_id);
        
        if (!$share_info) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Share link not found'
            ), 404);
        }
        
        // Check for password protection
        if ($share_info->access_type === 'password') {
            $password = $request->get_param('password');
            
            if (empty($password) || !wp_check_password($password, $share_info->password)) {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Password required',
                    'requires_password' => true
                ), 403);
            }
        }
        
        // Check for expiry
        if ($share_info->expiry_date && strtotime($share_info->expiry_date) < time()) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Share link has expired'
            ), 410);
        }
        
        // Increment view count
        $this->increment_view_count($share_id);
        
        // Get media kit data
        $media_kit_data = $this->get_media_kit_data($share_info->context_id);
        
        if (!$media_kit_data) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Media kit not found'
            ), 404);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'data' => $media_kit_data,
            'share_info' => array(
                'title' => $share_info->title,
                'description' => $share_info->description,
                'view_count' => $share_info->view_count,
                'created_at' => $share_info->created_at
            )
        ), 200);
    }
    
    /**
     * Shared media kit shortcode
     * 
     * @param array $atts Shortcode attributes
     * @return string Shortcode output
     */
    public function shared_media_kit_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'width' => '100%',
            'height' => '600px'
        ), $atts, 'media_kit_shared');
        
        if (empty($atts['id'])) {
            return '<p>Error: Share ID is required.</p>';
        }
        
        // Get share information
        $share_info = $this->get_share_link_info($atts['id']);
        
        if (!$share_info) {
            return '<p>Error: Invalid or expired share ID.</p>';
        }
        
        // Check for expiry
        if ($share_info->expiry_date && strtotime($share_info->expiry_date) < time()) {
            return '<p>Error: This shared media kit has expired.</p>';
        }
        
        // Generate iframe code
        $iframe_code = $this->generate_embed_code($atts['id'], array(
            'width' => $atts['width'],
            'height' => $atts['height']
        ));
        
        return $iframe_code;
    }
    
    /**
     * Cleanup old share links
     */
    public function cleanup_old_share_links() {
        global $wpdb;
        
        // Delete expired share links
        $wpdb->query("DELETE FROM {$this->share_links_table} WHERE expiry_date IS NOT NULL AND expiry_date < NOW()");
        
        // Get general settings
        $general_settings = get_option('mkb_general_settings', array());
        $max_share_age = isset($general_settings['share_link_max_age']) ? intval($general_settings['share_link_max_age']) : 90;
        
        if ($max_share_age > 0) {
            // Delete share links older than max_share_age days
            $cutoff_date = date('Y-m-d H:i:s', strtotime("-{$max_share_age} days"));
            
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$this->share_links_table} WHERE created_at < %s",
                $cutoff_date
            ));
        }
    }
}
