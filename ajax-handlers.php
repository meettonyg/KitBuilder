/**
 * Media Kit Builder - AJAX Handlers
 * 
 * This file contains the AJAX handlers for the Media Kit Builder.
 */

// Check if we're in WordPress environment
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Register AJAX hooks
 */
function media_kit_builder_register_ajax_hooks() {
    // Test AJAX connection
    add_action('wp_ajax_mkb_test_ajax', 'media_kit_builder_test_ajax');
    add_action('wp_ajax_nopriv_mkb_test_ajax', 'media_kit_builder_test_ajax');
    
    // Save media kit
    add_action('wp_ajax_mkb_save_kit', 'media_kit_builder_save_kit');
    add_action('wp_ajax_nopriv_mkb_save_kit', 'media_kit_builder_save_kit_unauthorized');
    
    // Load media kit
    add_action('wp_ajax_mkb_load_kit', 'media_kit_builder_load_kit');
    add_action('wp_ajax_nopriv_mkb_load_kit', 'media_kit_builder_load_kit_unauthorized');
    
    // Export media kit
    add_action('wp_ajax_mkb_export_kit', 'media_kit_builder_export_kit');
    add_action('wp_ajax_nopriv_mkb_export_kit', 'media_kit_builder_export_kit_unauthorized');
    
    // Report error
    add_action('wp_ajax_mkb_report_error', 'media_kit_builder_report_error');
    add_action('wp_ajax_nopriv_mkb_report_error', 'media_kit_builder_report_error');
}
add_action('init', 'media_kit_builder_register_ajax_hooks');

/**
 * Test AJAX connection
 */
function media_kit_builder_test_ajax() {
    // Check nonce if provided (but don't require it for the test)
    if (isset($_POST['nonce']) && !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce']);
    }
    
    // Return success
    wp_send_json_success([
        'message' => 'AJAX connection successful',
        'timestamp' => current_time('mysql'),
        'version' => MEDIA_KIT_BUILDER_VERSION ?? '1.0.0'
    ]);
}

/**
 * Save media kit
 */
function media_kit_builder_save_kit() {
    // Check nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce']);
    }
    
    // Check user permission
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['message' => 'You do not have permission to save media kits']);
    }
    
    // Check if data is provided
    if (!isset($_POST['data'])) {
        wp_send_json_error(['message' => 'No data provided']);
    }
    
    // Get data
    $data = json_decode(stripslashes($_POST['data']), true);
    if (!$data) {
        wp_send_json_error(['message' => 'Invalid data format']);
    }
    
    // Get entry key if editing existing kit
    $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
    
    // Get formidable key if provided
    $formidable_key = isset($_POST['formidable_key']) ? sanitize_text_field($_POST['formidable_key']) : null;
    
    // Get post ID if provided
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : null;
    
    // Get current user ID
    $user_id = get_current_user_id();
    
    // Save to database
    try {
        global $wpdb;
        
        // Table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            // Create table if it doesn't exist
            media_kit_builder_create_tables();
        }
        
        // Prepare data for database
        $kit_data = wp_json_encode($data);
        
        if ($entry_key) {
            // Update existing media kit
            $result = $wpdb->update(
                $table_name,
                [
                    'data' => $kit_data,
                    'modified' => current_time('mysql')
                ],
                [
                    'entry_key' => $entry_key,
                    'user_id' => $user_id
                ],
                ['%s', '%s'],
                ['%s', '%d']
            );
            
            if ($result === false) {
                wp_send_json_error(['message' => 'Failed to update media kit: ' . $wpdb->last_error]);
            }
        } else {
            // Create new entry key
            $entry_key = md5(uniqid($user_id, true));
            
            // Insert new media kit
            $result = $wpdb->insert(
                $table_name,
                [
                    'entry_key' => $entry_key,
                    'user_id' => $user_id,
                    'formidable_key' => $formidable_key,
                    'post_id' => $post_id,
                    'data' => $kit_data,
                    'created' => current_time('mysql'),
                    'modified' => current_time('mysql')
                ],
                ['%s', '%d', '%s', '%d', '%s', '%s', '%s']
            );
            
            if ($result === false) {
                wp_send_json_error(['message' => 'Failed to create media kit: ' . $wpdb->last_error]);
            }
        }
        
        // Return success
        wp_send_json_success([
            'message' => 'Media kit saved successfully',
            'entry_key' => $entry_key,
            'formidable_key' => $formidable_key,
            'post_id' => $post_id
        ]);
    } catch (Exception $e) {
        wp_send_json_error(['message' => 'Failed to save media kit: ' . $e->getMessage()]);
    }
}

/**
 * Unauthorized save media kit
 */
function media_kit_builder_save_kit_unauthorized() {
    wp_send_json_error(['message' => 'You must be logged in to save media kits']);
}

/**
 * Load media kit
 */
function media_kit_builder_load_kit() {
    // Check nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce']);
    }
    
    // Check user permission
    if (!current_user_can('read')) {
        wp_send_json_error(['message' => 'You do not have permission to load media kits']);
    }
    
    // Check if entry key is provided
    if (!isset($_POST['entry_key'])) {
        wp_send_json_error(['message' => 'No entry key provided']);
    }
    
    // Get entry key
    $entry_key = sanitize_text_field($_POST['entry_key']);
    
    // Get current user ID
    $user_id = get_current_user_id();
    
    // Load from database
    try {
        global $wpdb;
        
        // Table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Get media kit
        $media_kit = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE entry_key = %s AND user_id = %d",
                $entry_key,
                $user_id
            )
        );
        
        if (!$media_kit) {
            wp_send_json_error(['message' => 'Media kit not found']);
        }
        
        // Parse data
        $kit_data = json_decode($media_kit->data, true);
        
        if (!$kit_data) {
            wp_send_json_error(['message' => 'Invalid media kit data']);
        }
        
        // Return success
        wp_send_json_success([
            'message' => 'Media kit loaded successfully',
            'entry_key' => $media_kit->entry_key,
            'formidable_key' => $media_kit->formidable_key,
            'post_id' => $media_kit->post_id,
            'kit_data' => $kit_data
        ]);
    } catch (Exception $e) {
        wp_send_json_error(['message' => 'Failed to load media kit: ' . $e->getMessage()]);
    }
}

/**
 * Unauthorized load media kit
 */
function media_kit_builder_load_kit_unauthorized() {
    wp_send_json_error(['message' => 'You must be logged in to load media kits']);
}

/**
 * Export media kit
 */
function media_kit_builder_export_kit() {
    // Check nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'media_kit_builder_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce']);
    }
    
    // Check user permission
    if (!current_user_can('read')) {
        wp_send_json_error(['message' => 'You do not have permission to export media kits']);
    }
    
    // Check if data is provided
    if (!isset($_POST['data'])) {
        wp_send_json_error(['message' => 'No data provided']);
    }
    
    // Get data
    $data = json_decode(stripslashes($_POST['data']), true);
    if (!$data) {
        wp_send_json_error(['message' => 'Invalid data format']);
    }
    
    // Get format
    $format = isset($_POST['format']) ? sanitize_text_field($_POST['format']) : 'pdf';
    
    // Get entry key if provided
    $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
    
    // Export media kit
    try {
        // Create export directory if it doesn't exist
        $upload_dir = wp_upload_dir();
        $export_dir = $upload_dir['basedir'] . '/media-kits/exports';
        
        if (!file_exists($export_dir)) {
            wp_mkdir_p($export_dir);
        }
        
        // Create index.php to prevent directory listing
        if (!file_exists($export_dir . '/index.php')) {
            file_put_contents($export_dir . '/index.php', '<?php // Silence is golden');
        }
        
        // Create .htaccess to protect directory
        if (!file_exists($export_dir . '/.htaccess')) {
            file_put_contents($export_dir . '/.htaccess', 'Options -Indexes' . PHP_EOL . 'Deny from all');
        }
        
        // Generate filename
        $filename = 'media-kit-' . ($entry_key ?: uniqid()) . '.' . $format;
        $filepath = $export_dir . '/' . $filename;
        
        // Generate URL
        $file_url = $upload_dir['baseurl'] . '/media-kits/exports/' . $filename;
        
        // Export based on format
        switch ($format) {
            case 'pdf':
                // Export as PDF
                // Placeholder - replace with actual PDF generation code
                file_put_contents($filepath, 'PDF Export Placeholder');
                break;
                
            case 'html':
                // Export as HTML
                // Placeholder - replace with actual HTML generation code
                file_put_contents($filepath, '<html><body>HTML Export Placeholder</body></html>');
                break;
                
            case 'json':
                // Export as JSON
                file_put_contents($filepath, wp_json_encode($data));
                break;
                
            default:
                wp_send_json_error(['message' => 'Unsupported export format']);
                break;
        }
        
        // Return success
        wp_send_json_success([
            'message' => 'Media kit exported successfully',
            'format' => $format,
            'filename' => $filename,
            'url' => $file_url
        ]);
    } catch (Exception $e) {
        wp_send_json_error(['message' => 'Failed to export media kit: ' . $e->getMessage()]);
    }
}

/**
 * Unauthorized export media kit
 */
function media_kit_builder_export_kit_unauthorized() {
    wp_send_json_error(['message' => 'You must be logged in to export media kits']);
}

/**
 * Report error
 */
function media_kit_builder_report_error() {
    // Get error data
    $error_data = isset($_POST['error_data']) ? json_decode(stripslashes($_POST['error_data']), true) : null;
    
    if (!$error_data) {
        wp_send_json_error(['message' => 'No error data provided']);
    }
    
    // Log error
    error_log('Media Kit Builder Error: ' . wp_json_encode($error_data));
    
    // Return success
    wp_send_json_success(['message' => 'Error reported successfully']);
}

/**
 * Create database tables
 */
function media_kit_builder_create_tables() {
    global $wpdb;
    
    // Table name
    $table_name = $wpdb->prefix . 'media_kits';
    
    // Check if table exists
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        // Create table
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            entry_key varchar(255) NOT NULL,
            user_id bigint(20) NOT NULL,
            formidable_key varchar(255),
            post_id bigint(20),
            data longtext NOT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY entry_key (entry_key),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}