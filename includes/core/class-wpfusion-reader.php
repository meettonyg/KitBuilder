<?php
/**
 * Media Kit Builder - WP Fusion Tag Reader System
 * 
 * Reads user access from existing WP Fusion tags for feature gating.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_WPFusion_Reader Class
 * 
 * Core System #2: WP Fusion Tag Reader System
 * Purpose: Read user access from existing WP Fusion tags
 * Status: ✅ WP Fusion Already Configured (reads existing system)
 */
class MKB_WPFusion_Reader {
    
    /**
     * Instance
     * @var MKB_WPFusion_Reader
     */
    private static $instance = null;
    
    /**
     * WP Fusion available
     * @var bool
     */
    private $wpfusion_available = false;
    
    /**
     * User tags cache
     * @var array
     */
    private $user_tags_cache = array();
    
    /**
     * Tag access mapping
     * @var array
     */
    private $tag_access_map = array();
    
    /**
     * Cache expiry (5 minutes)
     * @var int
     */
    private $cache_expiry = 300;
    
    /**
     * Get instance
     * 
     * @return MKB_WPFusion_Reader
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
        $this->check_wpfusion_availability();
        $this->init_tag_access_mapping();
        $this->init_hooks();
    }
    
    /**
     * Check if WP Fusion is available
     */
    private function check_wpfusion_availability() {
        // Check if WP Fusion is active
        if (class_exists('WP_Fusion') || function_exists('wp_fusion')) {
            $this->wpfusion_available = true;
        } elseif (defined('WP_FUSION_VERSION')) {
            $this->wpfusion_available = true;
        } else {
            $this->wpfusion_available = false;
        }
        
        // Additional check for WP Fusion Lite
        if (class_exists('WP_Fusion_Lite')) {
            $this->wpfusion_available = true;
        }
    }
    
    /**
     * Initialize tag access mapping
     */
    private function init_tag_access_mapping() {
        /**
         * Define tag-based access levels
         * These map WP Fusion tags to Media Kit Builder features
         */
        $this->tag_access_map = apply_filters('mkb_tag_access_map', array(
            // Free tier - basic access
            'free_user' => array(
                'max_media_kits' => 1,
                'max_components' => 10,
                'templates' => array('basic'),
                'export_formats' => array('pdf_watermarked'),
                'storage_mb' => 50,
                'features' => array('basic_builder', 'guest_mode')
            ),
            
            // Pro tier - enhanced access
            'pro_user' => array(
                'max_media_kits' => 5,
                'max_components' => 50,
                'templates' => array('basic', 'professional', 'creative'),
                'export_formats' => array('pdf', 'png', 'html'),
                'storage_mb' => 500,
                'features' => array(
                    'advanced_builder', 
                    'custom_templates', 
                    'analytics', 
                    'social_sharing',
                    'priority_support'
                )
            ),
            
            // Agency tier - full access
            'agency_user' => array(
                'max_media_kits' => -1, // unlimited
                'max_components' => -1, // unlimited
                'templates' => array('all'),
                'export_formats' => array('pdf', 'png', 'html', 'svg', 'zip'),
                'storage_mb' => -1, // unlimited
                'features' => array(
                    'white_label',
                    'client_management',
                    'bulk_operations',
                    'advanced_analytics',
                    'custom_branding',
                    'api_access',
                    'priority_support'
                )
            ),
            
            // Enterprise tier - maximum access
            'enterprise_user' => array(
                'max_media_kits' => -1,
                'max_components' => -1,
                'templates' => array('all'),
                'export_formats' => array('all'),
                'storage_mb' => -1,
                'features' => array(
                    'white_label',
                    'multi_site',
                    'advanced_integrations',
                    'custom_development',
                    'dedicated_support',
                    'sla_guarantee'
                )
            )
        ));
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Clear cache when user tags are updated
        add_action('wp_fusion_user_tags_updated', array($this, 'clear_user_cache'));
        
        // AJAX endpoints for tag checking
        add_action('wp_ajax_mkb_check_user_access', array($this, 'ajax_check_user_access'));
        add_action('wp_ajax_nopriv_mkb_check_user_access', array($this, 'ajax_check_user_access'));
        
        // Cache cleanup
        add_action('wp_login', array($this, 'clear_user_cache_on_login'));
        add_action('wp_logout', array($this, 'clear_user_cache_on_logout'));
    }
    
    /**
     * Get user tags from WP Fusion
     * 
     * @param int $user_id
     * @return array
     */
    public function get_user_tags($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        if (!$user_id) {
            return array();
        }
        
        // Check cache first
        $cache_key = 'mkb_user_tags_' . $user_id;
        $cached_tags = get_transient($cache_key);
        
        if ($cached_tags !== false) {
            return $cached_tags;
        }
        
        $tags = array();
        
        if ($this->wpfusion_available) {
            // Try different WP Fusion methods
            if (function_exists('wp_fusion')) {
                $tags = wp_fusion()->user->get_tags($user_id);
            } elseif (class_exists('WP_Fusion') && method_exists(WP_Fusion::instance()->user, 'get_tags')) {
                $tags = WP_Fusion::instance()->user->get_tags($user_id);
            } elseif (function_exists('wpf_get_tags')) {
                $tags = wpf_get_tags($user_id);
            } else {
                // Fallback: read from user meta directly
                $tags = get_user_meta($user_id, 'wp_fusion_tags', true);
            }
        }
        
        // Ensure we have an array
        if (!is_array($tags)) {
            $tags = array();
        }
        
        // Cache the result
        set_transient($cache_key, $tags, $this->cache_expiry);
        
        return $tags;
    }
    
    /**
     * Check if user has specific tag
     * 
     * @param string $tag
     * @param int $user_id
     * @return bool
     */
    public function user_has_tag($tag, $user_id = null) {
        $user_tags = $this->get_user_tags($user_id);
        
        // Handle both tag IDs and tag names
        if (is_numeric($tag)) {
            return in_array($tag, $user_tags);
        } else {
            return in_array($tag, $user_tags) || $this->tag_name_exists($tag, $user_tags);
        }
    }
    
    /**
     * Get user access level based on tags
     * 
     * @param int $user_id
     * @return string
     */
    public function get_user_access_level($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        if (!$user_id) {
            return 'guest';
        }
        
        $user_tags = $this->get_user_tags($user_id);
        
        // Check for highest access level first
        $access_levels = array('enterprise_user', 'agency_user', 'pro_user', 'free_user');
        
        foreach ($access_levels as $level) {
            if ($this->user_has_tag($level, $user_id)) {
                return $level;
            }
        }
        
        // Default to free if user is logged in but has no specific tags
        return 'free_user';
    }
    
    /**
     * Get user capabilities based on access level
     * 
     * @param int $user_id
     * @return array
     */
    public function get_user_capabilities($user_id = null) {
        $access_level = $this->get_user_access_level($user_id);
        
        if ($access_level === 'guest') {
            return array(
                'max_media_kits' => 1,
                'max_components' => 5,
                'templates' => array('basic'),
                'export_formats' => array('pdf_watermarked'),
                'storage_mb' => 10,
                'features' => array('guest_mode'),
                'session_duration' => 7 * DAY_IN_SECONDS
            );
        }
        
        return isset($this->tag_access_map[$access_level]) 
            ? $this->tag_access_map[$access_level] 
            : $this->tag_access_map['free_user'];
    }
    
    /**
     * Check if user can access feature
     * 
     * @param string $feature
     * @param int $user_id
     * @return bool
     */
    public function can_access_feature($feature, $user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        return isset($capabilities['features']) && in_array($feature, $capabilities['features']);
    }
    
    /**
     * Check if user can access template
     * 
     * @param string $template
     * @param int $user_id
     * @return bool
     */
    public function can_access_template($template, $user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        if (!isset($capabilities['templates'])) {
            return false;
        }
        
        $templates = $capabilities['templates'];
        
        // If 'all' is in templates, user can access any template
        if (in_array('all', $templates)) {
            return true;
        }
        
        return in_array($template, $templates);
    }
    
    /**
     * Check if user can export in format
     * 
     * @param string $format
     * @param int $user_id
     * @return bool
     */
    public function can_export_format($format, $user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        if (!isset($capabilities['export_formats'])) {
            return false;
        }
        
        $formats = $capabilities['export_formats'];
        
        // If 'all' is in formats, user can export any format
        if (in_array('all', $formats)) {
            return true;
        }
        
        return in_array($format, $formats);
    }
    
    /**
     * Get user's media kit limit
     * 
     * @param int $user_id
     * @return int (-1 for unlimited)
     */
    public function get_media_kit_limit($user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        return $capabilities['max_media_kits'] ?? 1;
    }
    
    /**
     * Get user's component limit
     * 
     * @param int $user_id
     * @return int (-1 for unlimited)
     */
    public function get_component_limit($user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        return $capabilities['max_components'] ?? 5;
    }
    
    /**
     * Get user's storage limit in MB
     * 
     * @param int $user_id
     * @return int (-1 for unlimited)
     */
    public function get_storage_limit($user_id = null) {
        $capabilities = $this->get_user_capabilities($user_id);
        
        return $capabilities['storage_mb'] ?? 10;
    }
    
    /**
     * Check if tag name exists in user tags
     * 
     * @param string $tag_name
     * @param array $user_tags
     * @return bool
     */
    private function tag_name_exists($tag_name, $user_tags) {
        if (!$this->wpfusion_available) {
            return false;
        }
        
        // Get all available tags and check names
        $all_tags = $this->get_all_tags();
        
        foreach ($user_tags as $user_tag) {
            if (isset($all_tags[$user_tag]) && $all_tags[$user_tag] === $tag_name) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get all available tags from WP Fusion
     * 
     * @return array
     */
    public function get_all_tags() {
        static $all_tags = null;
        
        if ($all_tags !== null) {
            return $all_tags;
        }
        
        $all_tags = array();
        
        if ($this->wpfusion_available) {
            if (function_exists('wp_fusion')) {
                $all_tags = wp_fusion()->settings->get('available_tags', array());
            } elseif (class_exists('WP_Fusion')) {
                $all_tags = WP_Fusion::instance()->settings->get('available_tags', array());
            }
        }
        
        return $all_tags;
    }
    
    /**
     * AJAX: Check user access
     */
    public function ajax_check_user_access() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $feature = sanitize_text_field($_POST['feature'] ?? '');
        $user_id = get_current_user_id();
        
        if (!$feature) {
            wp_send_json_error('Feature not specified');
            return;
        }
        
        $can_access = $this->can_access_feature($feature, $user_id);
        $access_level = $this->get_user_access_level($user_id);
        $capabilities = $this->get_user_capabilities($user_id);
        
        wp_send_json_success(array(
            'can_access' => $can_access,
            'access_level' => $access_level,
            'capabilities' => $capabilities,
            'user_tags' => $this->get_user_tags($user_id)
        ));
    }
    
    /**
     * Clear user cache
     * 
     * @param int $user_id
     */
    public function clear_user_cache($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        if ($user_id) {
            delete_transient('mkb_user_tags_' . $user_id);
        }
    }
    
    /**
     * Clear cache on login
     * 
     * @param string $user_login
     * @param WP_User $user
     */
    public function clear_user_cache_on_login($user_login, $user = null) {
        if ($user && isset($user->ID)) {
            $this->clear_user_cache($user->ID);
        }
    }
    
    /**
     * Clear cache on logout
     */
    public function clear_user_cache_on_logout() {
        $user_id = get_current_user_id();
        if ($user_id) {
            $this->clear_user_cache($user_id);
        }
    }
    
    /**
     * Check if WP Fusion is available
     * 
     * @return bool
     */
    public function is_wpfusion_available() {
        return $this->wpfusion_available;
    }
    
    /**
     * Get WP Fusion status for debugging
     * 
     * @return array
     */
    public function get_wpfusion_status() {
        return array(
            'available' => $this->wpfusion_available,
            'wp_fusion_class' => class_exists('WP_Fusion'),
            'wp_fusion_function' => function_exists('wp_fusion'),
            'wp_fusion_lite' => class_exists('WP_Fusion_Lite'),
            'wp_fusion_version' => defined('WP_FUSION_VERSION') ? WP_FUSION_VERSION : 'not_defined',
            'cache_expiry' => $this->cache_expiry,
            'tag_access_map_count' => count($this->tag_access_map)
        );
    }
}
