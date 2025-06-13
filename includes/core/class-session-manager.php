<?php
/**
 * Media Kit Builder - Session Management System
 * 
 * Handles guest session creation, persistence, and migration to user accounts.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Session_Manager Class
 * 
 * Core System #1: Session Management System
 * Purpose: Guest session handling and data persistence
 */
class MKB_Session_Manager {
    
    /**
     * Instance
     * @var MKB_Session_Manager
     */
    private static $instance = null;
    
    /**
     * Current session ID
     * @var string
     */
    private $current_session_id = null;
    
    /**
     * Session duration (7 days)
     * @var int
     */
    private $session_duration = 604800; // 7 * 24 * 60 * 60
    
    /**
     * Database table name
     * @var string
     */
    private $table_name;
    
    /**
     * Get instance
     * 
     * @return MKB_Session_Manager
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
        $this->table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $this->init_hooks();
        // We'll initialize the session via the 'init' hook instead of here
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Hook the session initialization to run after WordPress is fully loaded
        add_action('init', array($this, 'init_session'));
        
        // AJAX hooks for session management
        add_action('wp_ajax_mkb_create_guest_session', array($this, 'ajax_create_guest_session'));
        add_action('wp_ajax_nopriv_mkb_create_guest_session', array($this, 'ajax_create_guest_session'));
        
        add_action('wp_ajax_mkb_save_guest_data', array($this, 'ajax_save_guest_data'));
        add_action('wp_ajax_nopriv_mkb_save_guest_data', array($this, 'ajax_save_guest_data'));
        
        add_action('wp_ajax_mkb_migrate_guest_session', array($this, 'ajax_migrate_guest_session'));
        
        // REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_endpoints'));
        
        // User login/registration hooks
        add_action('wp_login', array($this, 'handle_user_login'), 10, 2);
        add_action('user_register', array($this, 'handle_user_registration'));
        
        // Cleanup hook
        add_action('mkb_cleanup_guest_sessions', array($this, 'cleanup_expired_sessions'));
        
        // Schedule cleanup if not already scheduled
        if (!wp_next_scheduled('mkb_cleanup_guest_sessions')) {
            wp_schedule_event(time(), 'hourly', 'mkb_cleanup_guest_sessions');
        }
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_rest_endpoints() {
        register_rest_route('media-kit/v1', '/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_create_session'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('media-kit/v1', '/sessions/(?P<session_id>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'rest_get_session'),
            'permission_callback' => '__return_true',
            'args' => array(
                'session_id' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                )
            )
        ));
        
        register_rest_route('media-kit/v1', '/sessions/(?P<session_id>[a-zA-Z0-9_-]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'rest_update_session'),
            'permission_callback' => '__return_true',
            'args' => array(
                'session_id' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                )
            )
        ));
        
        register_rest_route('media-kit/v1', '/sessions/migrate', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_migrate_session'),
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ));
    }
    
    /**
     * Initialize session
     */
    public function init_session() {
        // For logged-in users, we don't need guest sessions
        if (is_user_logged_in()) {
            return;
        }
        
        // Check for existing session in cookie
        $session_id = $this->get_session_from_cookie();
        
        if ($session_id && $this->is_valid_session($session_id)) {
            $this->current_session_id = $session_id;
        } else {
            // Create new session only when needed (not on every page load)
            $this->current_session_id = null;
        }
    }
    
    /**
     * Create new guest session
     * 
     * @return string Session ID
     */
    public function create_guest_session() {
        global $wpdb;
        
        $session_id = $this->generate_session_id();
        $expires = gmdate('Y-m-d H:i:s', time() + $this->session_duration);
        
        $result = $wpdb->insert(
            $this->table_name,
            array(
                'session_id' => $session_id,
                'session_data' => json_encode(array(
                    'created_at' => current_time('mysql'),
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                    'ip_address' => $this->get_client_ip(),
                    'media_kit_data' => array()
                )),
                'expires' => $expires,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            $this->current_session_id = $session_id;
            $this->set_session_cookie($session_id);
            
            do_action('mkb_guest_session_created', $session_id);
            
            return $session_id;
        }
        
        return false;
    }
    
    /**
     * Get current guest session ID
     * 
     * @return string|null
     */
    public function get_guest_session_id() {
        if (is_user_logged_in()) {
            return null;
        }
        
        if (!$this->current_session_id) {
            $this->current_session_id = $this->create_guest_session();
        }
        
        return $this->current_session_id;
    }
    
    /**
     * Save guest session data
     * 
     * @param string $session_id
     * @param array $data
     * @return bool
     */
    public function save_guest_data($session_id, $data) {
        global $wpdb;
        
        if (!$this->is_valid_session($session_id)) {
            return false;
        }
        
        // Get existing data
        $existing_data = $this->get_guest_data($session_id);
        
        // Merge with new data
        $updated_data = array_merge($existing_data, $data);
        
        $result = $wpdb->update(
            $this->table_name,
            array(
                'session_data' => json_encode($updated_data),
                'updated_at' => current_time('mysql')
            ),
            array('session_id' => $session_id),
            array('%s', '%s'),
            array('%s')
        );
        
        if ($result !== false) {
            do_action('mkb_guest_data_saved', $session_id, $data);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get guest session data
     * 
     * @param string $session_id
     * @return array
     */
    public function get_guest_data($session_id) {
        global $wpdb;
        
        if (!$this->is_valid_session($session_id)) {
            return array();
        }
        
        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT session_data FROM {$this->table_name} WHERE session_id = %s AND expires > %s",
                $session_id,
                current_time('mysql')
            )
        );
        
        if ($session && $session->session_data) {
            $data = json_decode($session->session_data, true);
            return is_array($data) ? $data : array();
        }
        
        return array();
    }
    
    /**
     * Migrate guest session to user account
     * 
     * @param string $session_id
     * @param int $user_id
     * @return bool
     */
    public function migrate_guest_session($session_id, $user_id) {
        if (!$this->is_valid_session($session_id) || !$user_id) {
            return false;
        }
        
        $guest_data = $this->get_guest_data($session_id);
        
        if (empty($guest_data)) {
            return false;
        }
        
        // Save guest data to user meta
        $migration_data = array(
            'guest_session_id' => $session_id,
            'migrated_at' => current_time('mysql'),
            'media_kit_data' => $guest_data['media_kit_data'] ?? array(),
            'migration_source' => 'guest_session'
        );
        
        $result = update_user_meta($user_id, 'mkb_migrated_data', $migration_data);
        
        if ($result) {
            // Mark session as migrated
            $this->mark_session_migrated($session_id, $user_id);
            
            // Clear guest session cookie
            $this->clear_session_cookie();
            
            do_action('mkb_guest_session_migrated', $session_id, $user_id, $guest_data);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Mark session as migrated
     * 
     * @param string $session_id
     * @param int $user_id
     * @return bool
     */
    private function mark_session_migrated($session_id, $user_id) {
        global $wpdb;
        
        $guest_data = $this->get_guest_data($session_id);
        $guest_data['migrated_to_user'] = $user_id;
        $guest_data['migrated_at'] = current_time('mysql');
        
        return $wpdb->update(
            $this->table_name,
            array(
                'session_data' => json_encode($guest_data),
                'updated_at' => current_time('mysql')
            ),
            array('session_id' => $session_id),
            array('%s', '%s'),
            array('%s')
        );
    }
    
    /**
     * Handle user login
     * 
     * @param string $user_login
     * @param WP_User $user
     */
    public function handle_user_login($user_login, $user) {
        // Get current guest session
        $session_id = $this->get_session_from_cookie();
        
        if ($session_id) {
            // Check if session is valid
            if ($this->is_valid_session($session_id)) {
                // Migrate session to user
                $this->migrate_guest_session($session_id, $user->ID);
            }
        }
    }
    
    /**
     * Handle user registration
     * 
     * @param int $user_id
     */
    public function handle_user_registration($user_id) {
        // Get current guest session
        $session_id = $this->get_session_from_cookie();
        
        if ($session_id) {
            // Check if session is valid
            if ($this->is_valid_session($session_id)) {
                // Migrate session to user
                $this->migrate_guest_session($session_id, $user_id);
            }
        }
    }
    
    /**
     * Cleanup expired sessions
     */
    public function cleanup_expired_sessions() {
        global $wpdb;
        
        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$this->table_name} WHERE expires < %s",
                current_time('mysql')
            )
        );
        
        if ($deleted > 0) {
            do_action('mkb_expired_sessions_cleaned', $deleted);
        }
        
        return $deleted;
    }
    
    /**
     * REST API: Create session
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_create_session($request) {
        // Create new guest session
        $session_id = $this->create_guest_session();
        
        if ($session_id) {
            return new WP_REST_Response(
                array(
                    'success' => true,
                    'session_id' => $session_id,
                    'expires' => time() + $this->session_duration
                ),
                200
            );
        } else {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'Failed to create guest session'
                ),
                500
            );
        }
    }
    
    /**
     * REST API: Get session
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_get_session($request) {
        $session_id = $request['session_id'];
        
        // Get session data
        $data = $this->get_guest_data($session_id);
        
        if (!empty($data)) {
            return new WP_REST_Response(
                array(
                    'success' => true,
                    'data' => $data
                ),
                200
            );
        } else {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'Session not found or expired'
                ),
                404
            );
        }
    }
    
    /**
     * REST API: Update session
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_update_session($request) {
        $session_id = $request['session_id'];
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'No data provided'
                ),
                400
            );
        }
        
        // Sanitize data
        $data = $this->sanitize_guest_data($data);
        
        // Save data
        $result = $this->save_guest_data($session_id, $data);
        
        if ($result) {
            return new WP_REST_Response(
                array(
                    'success' => true,
                    'message' => 'Session data updated successfully'
                ),
                200
            );
        } else {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'Failed to update session data'
                ),
                500
            );
        }
    }
    
    /**
     * REST API: Migrate session
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function rest_migrate_session($request) {
        if (!is_user_logged_in()) {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'User not logged in'
                ),
                401
            );
        }
        
        $session_id = $request['session_id'];
        $user_id = get_current_user_id();
        
        // Migrate session
        $result = $this->migrate_guest_session($session_id, $user_id);
        
        if ($result) {
            return new WP_REST_Response(
                array(
                    'success' => true,
                    'message' => 'Session migrated successfully'
                ),
                200
            );
        } else {
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'message' => 'Failed to migrate session'
                ),
                500
            );
        }
    }
    
    /**
     * AJAX: Create guest session
     */
    public function ajax_create_guest_session() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $session_id = $this->create_guest_session();
        
        if ($session_id) {
            wp_send_json_success(array(
                'session_id' => $session_id,
                'expires' => time() + $this->session_duration
            ));
        } else {
            wp_send_json_error('Failed to create guest session');
        }
    }
    
    /**
     * AJAX: Save guest data
     */
    public function ajax_save_guest_data() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $data = $_POST['data'] ?? array();
        
        // Sanitize data
        $data = $this->sanitize_guest_data($data);
        
        if ($this->save_guest_data($session_id, $data)) {
            wp_send_json_success('Data saved successfully');
        } else {
            wp_send_json_error('Failed to save data');
        }
    }
    
    /**
     * AJAX: Migrate guest session
     */
    public function ajax_migrate_guest_session() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error('User not logged in');
            return;
        }
        
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $user_id = get_current_user_id();
        
        if ($this->migrate_guest_session($session_id, $user_id)) {
            wp_send_json_success('Session migrated successfully');
        } else {
            wp_send_json_error('Failed to migrate session');
        }
    }
    
    /**
     * Generate unique session ID
     * 
     * @return string
     */
    private function generate_session_id() {
        return 'mkb_' . wp_generate_uuid4();
    }
    
    /**
     * Check if session is valid
     * 
     * @param string $session_id
     * @return bool
     */
    private function is_valid_session($session_id) {
        if (empty($session_id)) {
            return false;
        }
        
        global $wpdb;
        
        $session = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} WHERE session_id = %s AND expires > %s",
                $session_id,
                current_time('mysql')
            )
        );
        
        return $session > 0;
    }
    
    /**
     * Get session from cookie
     * 
     * @return string|null
     */
    private function get_session_from_cookie() {
        return isset($_COOKIE['mkb_guest_session']) ? sanitize_text_field($_COOKIE['mkb_guest_session']) : null;
    }
    
    /**
     * Set session cookie
     * 
     * @param string $session_id
     */
    private function set_session_cookie($session_id) {
        $expires = time() + $this->session_duration;
        setcookie('mkb_guest_session', $session_id, $expires, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
    }
    
    /**
     * Clear session cookie
     */
    private function clear_session_cookie() {
        setcookie('mkb_guest_session', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
    }
    
    /**
     * Get client IP address
     * 
     * @return string
     */
    private function get_client_ip() {
        $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR');
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Sanitize guest data
     * 
     * @param array $data
     * @return array
     */
    private function sanitize_guest_data($data) {
        if (!is_array($data)) {
            return array();
        }
        
        $sanitized = array();
        
        foreach ($data as $key => $value) {
            $key = sanitize_key($key);
            
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitize_guest_data($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = wp_kses_post($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Get session statistics
     * 
     * @return array
     */
    public function get_session_stats() {
        global $wpdb;
        
        $total_sessions = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}");
        $active_sessions = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} WHERE expires > %s",
                current_time('mysql')
            )
        );
        $migrated_sessions = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE session_data LIKE '%migrated_to_user%'"
        );
        
        return array(
            'total' => (int) $total_sessions,
            'active' => (int) $active_sessions,
            'migrated' => (int) $migrated_sessions,
            'expired' => (int) $total_sessions - (int) $active_sessions
        );
    }
}

// Initialize the session manager
MKB_Session_Manager::instance();
