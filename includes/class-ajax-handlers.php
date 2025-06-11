<?php
/**
 * AJAX Handlers
 *
 * @package MediaKitBuilder
 */

defined('ABSPATH') || exit;

/**
 * AJAX Handlers class.
 */
class MKB_AJAX_Handlers {

    /**
     * Initialize the class
     */
    public function __construct() {
        // Register AJAX actions
        add_action('wp_ajax_mkb_load_kit', [$this, 'load_media_kit']);
        add_action('wp_ajax_mkb_save_kit', [$this, 'save_media_kit']);
        add_action('wp_ajax_mkb_verify_nonce', [$this, 'verify_nonce']);
        add_action('wp_ajax_mkb_test_ajax', [$this, 'test_ajax']);
        
        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_action('init', [$this, 'log_debug_info']);
        }
    }
    
    /**
     * Log debug information
     */
    public function log_debug_info() {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MKB AJAX: Debug information');
            error_log('MKB AJAX: Current nonce: ' . wp_create_nonce('media_kit_builder_nonce'));
            error_log('MKB AJAX: Current user: ' . get_current_user_id());
        }
    }

    /**
     * Load media kit data
     */
    public function load_media_kit() {
        // Verify nonce with detailed error
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
            $error_message = 'Invalid security token. Received: ' . (isset($_POST['nonce']) ? substr($_POST['nonce'], 0, 5) . '...' : 'none');
            error_log('MKB AJAX Error: ' . $error_message);
            wp_send_json_error(['message' => $error_message]);
            return;
        }

        // Get entry key
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : '';
        
        if (empty($entry_key)) {
            wp_send_json_error(['message' => 'Entry key is required']);
            return;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // First try to find the media kit directly
        $media_kit = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE entry_key = %s", $entry_key)
        );
        
        // If not found, check if it's a Formidable entry key
        if (!$media_kit) {
            error_log('MKB: Media kit not found directly. Checking Formidable entry: ' . $entry_key);
            
            // This might be a Formidable entry key - try to find the associated media kit
            $formidable_table = $wpdb->prefix . 'frm_items';
            $post_id = $wpdb->get_var(
                $wpdb->prepare("SELECT post_id FROM $formidable_table WHERE id = %s", $entry_key)
            );
            
            if ($post_id) {
                error_log('MKB: Found Formidable post ID: ' . $post_id);
                
                // Look for media kit with this post_id
                $media_kit = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM $table_name WHERE post_id = %d", $post_id)
                );
                
                // If not found, create a new media kit for this post
                if (!$media_kit) {
                    error_log('MKB: Creating new media kit for post ID: ' . $post_id);
                    
                    $new_entry_key = 'mkb_' . time() . '_' . wp_generate_password(8, false);
                    
                    $wpdb->insert(
                        $table_name,
                        [
                            'entry_key' => $new_entry_key,
                            'post_id' => $post_id,
                            'user_id' => get_current_user_id(),
                            'access_tier' => 'free',
                            'kit_data' => '{"components":[],"sections":[]}',
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql')
                        ],
                        ['%s', '%d', '%d', '%s', '%s', '%s', '%s']
                    );
                    
                    // Get the newly created media kit
                    $media_kit = $wpdb->get_row(
                        $wpdb->prepare("SELECT * FROM $table_name WHERE entry_key = %s", $new_entry_key)
                    );
                    
                    // Store the connection in post meta
                    update_post_meta($post_id, 'mkb_entry_key', $new_entry_key);
                }
            }
        }
        
        if (!$media_kit) {
            wp_send_json_error(['message' => 'Media kit not found for key: ' . $entry_key]);
            return;
        }
        
        // Parse JSON data
        $kit_data = json_decode($media_kit->kit_data, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(['message' => 'Invalid media kit data: ' . json_last_error_msg()]);
            return;
        }
        
        wp_send_json_success([
            'kit_data' => $kit_data,
            'entry_key' => $media_kit->entry_key,
            'formidable_key' => $entry_key, // Return the original key for reference
            'user_id' => $media_kit->user_id,
            'post_id' => $media_kit->post_id,
            'access_tier' => $media_kit->access_tier,
            'created_at' => $media_kit->created_at,
            'updated_at' => $media_kit->updated_at
        ]);
    }

    /**
     * Save media kit data
     */
    public function save_media_kit() {
        // Verify nonce with detailed error
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
            $error_message = 'Invalid security token. Received: ' . (isset($_POST['nonce']) ? substr($_POST['nonce'], 0, 5) . '...' : 'none');
            error_log('MKB AJAX Error: ' . $error_message);
            wp_send_json_error(['message' => $error_message]);
            return;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Get data from request
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : '';
        $formidable_key = isset($_POST['formidable_key']) ? sanitize_text_field($_POST['formidable_key']) : '';
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : get_current_user_id();
        $access_tier = isset($_POST['access_tier']) ? sanitize_text_field($_POST['access_tier']) : 'free';
        $kit_data = isset($_POST['kit_data']) ? $_POST['kit_data'] : '{}';
        
        // Validate JSON
        $decoded_data = json_decode($kit_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(['message' => 'Invalid JSON data: ' . json_last_error_msg()]);
            return;
        }
        
        // Current time
        $now = current_time('mysql');
        
        // Get post_id from Formidable key if not provided
        if (!$post_id && $formidable_key) {
            error_log('MKB: Looking up post ID for Formidable key: ' . $formidable_key);
            
            $formidable_table = $wpdb->prefix . 'frm_items';
            $post_id = $wpdb->get_var(
                $wpdb->prepare("SELECT post_id FROM $formidable_table WHERE id = %s", $formidable_key)
            );
            
            if ($post_id) {
                error_log('MKB: Found post ID: ' . $post_id . ' for Formidable key: ' . $formidable_key);
            }
        }
        
        if (empty($entry_key)) {
            // CREATE NEW MEDIA KIT
            $entry_key = 'mkb_' . time() . '_' . wp_generate_password(8, false);
            
            $result = $wpdb->insert(
                $table_name,
                [
                    'entry_key' => $entry_key,
                    'post_id' => $post_id,
                    'user_id' => $user_id,
                    'access_tier' => $access_tier,
                    'kit_data' => $kit_data,
                    'created_at' => $now,
                    'updated_at' => $now
                ],
                ['%s', '%d', '%d', '%s', '%s', '%s', '%s']
            );
            
            if ($result === false) {
                wp_send_json_error(['message' => 'Failed to create media kit: ' . $wpdb->last_error]);
                return;
            }
            
            // If we have a post_id, store the connection
            if ($post_id) {
                error_log('MKB: Storing connection - post ID: ' . $post_id . ' to entry key: ' . $entry_key);
                update_post_meta($post_id, 'mkb_entry_key', $entry_key);
            }
            
            wp_send_json_success([
                'message' => 'Media kit created successfully',
                'entry_key' => $entry_key,
                'formidable_key' => $formidable_key,
                'post_id' => $post_id
            ]);
        } else {
            // UPDATE EXISTING MEDIA KIT
            // Check if kit exists
            $exists = $wpdb->get_var(
                $wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE entry_key = %s", $entry_key)
            );
            
            if (!$exists) {
                wp_send_json_error(['message' => 'Media kit not found for update: ' . $entry_key]);
                return;
            }
            
            $update_data = [
                'kit_data' => $kit_data,
                'updated_at' => $now
            ];
            
            // Update post_id if provided
            if ($post_id) {
                $update_data['post_id'] = $post_id;
            }
            
            $result = $wpdb->update(
                $table_name,
                $update_data,
                ['entry_key' => $entry_key],
                ['%s', '%s', '%d'],
                ['%s']
            );
            
            if ($result === false) {
                wp_send_json_error(['message' => 'Failed to update media kit: ' . $wpdb->last_error]);
                return;
            }
            
            wp_send_json_success([
                'message' => 'Media kit updated successfully',
                'entry_key' => $entry_key,
                'formidable_key' => $formidable_key,
                'post_id' => $post_id
            ]);
        }
    }
    
    /**
     * Verify nonce endpoint for testing
     */
    public function verify_nonce() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
            return;
        }
        
        wp_send_json_success(['message' => 'Nonce verified successfully']);
    }
    
    /**
     * Test AJAX endpoint
     */
    public function test_ajax() {
        // This endpoint can be used to test AJAX connectivity
        // It doesn't verify the nonce to help debug nonce issues
        
        $test_data = isset($_POST['test_data']) ? sanitize_text_field($_POST['test_data']) : '';
        $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : 'none';
        
        wp_send_json_success([
            'message' => 'AJAX test successful',
            'received_data' => $test_data,
            'user_id' => get_current_user_id(),
            'nonce_valid' => wp_verify_nonce($nonce, 'media_kit_builder_nonce'),
            'timestamp' => current_time('mysql')
        ]);
    }
}

// Initialize class
new MKB_AJAX_Handlers();