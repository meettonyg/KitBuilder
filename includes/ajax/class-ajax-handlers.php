<?php
/**
 * Media Kit Builder - AJAX Handlers
 * 
 * Handles all AJAX requests for the Media Kit Builder.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_AJAX_Handlers Class
 * 
 * Handles all AJAX requests.
 */
class MKB_AJAX_Handlers {
    
    /**
     * Instance
     * @var MKB_AJAX_Handlers
     */
    private static $instance = null;
    
    /**
     * Get instance
     * 
     * @return MKB_AJAX_Handlers
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
        // Register AJAX handlers
        add_action('wp_ajax_mkb_test_ajax', array($this, 'test_ajax'));
        add_action('wp_ajax_nopriv_mkb_test_ajax', array($this, 'test_ajax'));
        
        add_action('wp_ajax_mkb_save_kit', array($this, 'save_kit'));
        add_action('wp_ajax_mkb_load_kit', array($this, 'load_kit'));
        add_action('wp_ajax_mkb_export_kit', array($this, 'export_kit'));
        add_action('wp_ajax_mkb_report_error', array($this, 'report_error'));
    }
    
    /**
     * Test AJAX connection
     */
    public function test_ajax() {
        // Check nonce for authenticated users
        if (is_user_logged_in()) {
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder')) {
                wp_send_json_error(array(
                    'message' => 'Invalid security token'
                ));
                return;
            }
        }
        
        // Return success
        wp_send_json_success(array(
            'message' => 'Connection successful',
            'timestamp' => current_time('mysql'),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'plugin_version' => MKB_VERSION
        ));
    }
    
    /**
     * Save media kit
     */
    public function save_kit() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        // Check user permission
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array(
                'message' => 'You do not have permission to save media kits'
            ));
            return;
        }
        
        // Get kit data
        $kit_data = isset($_POST['kit_data']) ? json_decode(stripslashes($_POST['kit_data']), true) : null;
        
        if (empty($kit_data)) {
            wp_send_json_error(array(
                'message' => 'No kit data provided'
            ));
            return;
        }
        
        // Get entry key if updating
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($kit_data);
        
        // Encode data
        $json_data = wp_json_encode($sanitized_data);
        
        if ($entry_key) {
            // Update existing kit
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
                wp_send_json_error(array(
                    'message' => 'Failed to update media kit: ' . $wpdb->last_error
                ));
                return;
            }
            
            wp_send_json_success(array(
                'message' => 'Media kit updated successfully',
                'entry_key' => $entry_key
            ));
        } else {
            // Create new entry key
            $entry_key = md5(uniqid(get_current_user_id(), true));
            
            // Insert new kit
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
                wp_send_json_error(array(
                    'message' => 'Failed to save media kit: ' . $wpdb->last_error
                ));
                return;
            }
            
            wp_send_json_success(array(
                'message' => 'Media kit saved successfully',
                'entry_key' => $entry_key
            ));
        }
    }
    
    /**
     * Load media kit
     */
    public function load_kit() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        // Get entry key
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        if (!$entry_key) {
            wp_send_json_error(array(
                'message' => 'No entry key provided'
            ));
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Get media kit
        $media_kit = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE entry_key = %s",
                $entry_key
            )
        );
        
        if (!$media_kit) {
            wp_send_json_error(array(
                'message' => 'Media kit not found'
            ));
            return;
        }
        
        // Check if user has permission to view this kit
        if ($media_kit->user_id !== get_current_user_id() && !current_user_can('edit_others_posts')) {
            wp_send_json_error(array(
                'message' => 'You do not have permission to view this media kit'
            ));
            return;
        }
        
        // Parse data
        $kit_data = json_decode($media_kit->data, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(array(
                'message' => 'Invalid media kit data: ' . json_last_error_msg()
            ));
            return;
        }
        
        wp_send_json_success(array(
            'message' => 'Media kit loaded successfully',
            'entry_key' => $media_kit->entry_key,
            'user_id' => $media_kit->user_id,
            'kit_data' => $kit_data,
            'created' => $media_kit->created,
            'modified' => $media_kit->modified
        ));
    }
    
    /**
     * Export media kit
     */
    public function export_kit() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        // Check user permission
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array(
                'message' => 'You do not have permission to export media kits'
            ));
            return;
        }
        
        // Get kit data
        $kit_data = isset($_POST['data']) ? json_decode(stripslashes($_POST['data']), true) : null;
        
        if (empty($kit_data)) {
            wp_send_json_error(array(
                'message' => 'No kit data provided'
            ));
            return;
        }
        
        // Get export format
        $format = isset($_POST['format']) ? sanitize_text_field($_POST['format']) : 'pdf';
        
        // Get entry key (optional)
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        // Determine filename
        $filename = 'media-kit-' . date('Y-m-d') . '.' . $format;
        
        // Export path in uploads directory
        $upload_dir = wp_upload_dir();
        $export_dir = $upload_dir['basedir'] . '/media-kits';
        
        // Create directory if it doesn't exist
        if (!file_exists($export_dir)) {
            wp_mkdir_p($export_dir);
        }
        
        // Generate file path
        $file_path = $export_dir . '/' . $filename;
        
        // Generate export file based on format
        switch ($format) {
            case 'pdf':
                // Generate PDF
                $export_engine = MKB_Export_Engine::instance();
                $result = $export_engine->export_pdf($kit_data, $file_path);
                break;
                
            case 'html':
                // Generate HTML
                $export_engine = MKB_Export_Engine::instance();
                $result = $export_engine->export_html($kit_data, $file_path);
                break;
                
            case 'image':
                // Generate image
                $export_engine = MKB_Export_Engine::instance();
                $result = $export_engine->export_image($kit_data, $file_path);
                break;
                
            default:
                wp_send_json_error(array(
                    'message' => 'Invalid export format: ' . $format
                ));
                return;
        }
        
        if (!$result) {
            wp_send_json_error(array(
                'message' => 'Failed to export media kit'
            ));
            return;
        }
        
        // Get URL to exported file
        $file_url = $upload_dir['baseurl'] . '/media-kits/' . $filename;
        
        wp_send_json_success(array(
            'message' => 'Media kit exported successfully',
            'url' => $file_url,
            'filename' => $filename,
            'format' => $format
        ));
    }
    
    /**
     * Report error
     */
    public function report_error() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        // Get error data
        $error_data = isset($_POST['error_data']) ? json_decode(stripslashes($_POST['error_data']), true) : null;
        
        if (empty($error_data)) {
            wp_send_json_error(array(
                'message' => 'No error data provided'
            ));
            return;
        }
        
        // Log error
        error_log('Media Kit Builder Error: ' . print_r($error_data, true));
        
        // Record error in database for admin reporting
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kit_errors';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => get_current_user_id(),
                'error_message' => isset($error_data['message']) ? sanitize_text_field($error_data['message']) : '',
                'error_stack' => isset($error_data['stack']) ? sanitize_textarea_field($error_data['stack']) : '',
                'user_agent' => isset($error_data['userAgent']) ? sanitize_text_field($error_data['userAgent']) : '',
                'url' => isset($error_data['url']) ? esc_url_raw($error_data['url']) : '',
                'timestamp' => current_time('mysql'),
                'data' => wp_json_encode($error_data)
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        wp_send_json_success(array(
            'message' => 'Error reported successfully'
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

// Initialize AJAX Handlers
MKB_AJAX_Handlers::instance();