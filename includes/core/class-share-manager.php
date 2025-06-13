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