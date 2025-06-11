<?php
/**
 * Media Kit Builder - Activation Hooks
 * Handles plugin activation, deactivation, and uninstall procedures
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin activation callback
 */
function media_kit_builder_activate() {
    // Create database tables
    media_kit_builder_create_tables();
    
    // Set default options
    media_kit_builder_set_default_options();
    
    // CRITICAL: Flush rewrite rules for URL routing
    media_kit_builder_flush_rewrite_rules();
    
    // Schedule cleanup cron job
    media_kit_builder_schedule_cleanup();
    
    // Log activation
    error_log('Media Kit Builder v' . MKB_VERSION . ' activated');
}

/**
 * Plugin deactivation callback
 */
function media_kit_builder_deactivate() {
    // Clear scheduled events
    wp_clear_scheduled_hook('mkb_cleanup_guest_sessions');
    
    // Flush rewrite rules to clean up custom URLs
    flush_rewrite_rules();
    
    // Log deactivation
    error_log('Media Kit Builder deactivated');
}

/**
 * Create required database tables
 */
function media_kit_builder_create_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // Guest sessions table for anonymous users
    $table_name = $wpdb->prefix . 'mkb_guest_sessions';
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(255) NOT NULL,
        data longtext DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        expires_at datetime NOT NULL,
        last_activity datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        user_agent varchar(500) DEFAULT NULL,
        ip_address varchar(45) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY session_id (session_id),
        KEY expires_at (expires_at),
        KEY last_activity (last_activity),
        KEY created_at (created_at)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // User templates table (for saving custom templates)
    $table_name = $wpdb->prefix . 'mkb_user_templates';
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        template_name varchar(255) NOT NULL,
        template_data longtext NOT NULL,
        template_preview varchar(500) DEFAULT NULL,
        is_public tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY is_public (is_public),
        KEY created_at (created_at)
    ) $charset_collate;";
    
    dbDelta($sql);
    
    // Media kit analytics table (for tracking usage)
    $table_name = $wpdb->prefix . 'mkb_analytics';
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        entry_key varchar(255) NOT NULL,
        event_type varchar(100) NOT NULL,
        event_data longtext DEFAULT NULL,
        user_id bigint(20) DEFAULT NULL,
        session_id varchar(255) DEFAULT NULL,
        ip_address varchar(45) DEFAULT NULL,
        user_agent varchar(500) DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY entry_key (entry_key),
        KEY event_type (event_type),
        KEY user_id (user_id),
        KEY session_id (session_id),
        KEY created_at (created_at)
    ) $charset_collate;";
    
    dbDelta($sql);
}

/**
 * Set default plugin options
 */
function media_kit_builder_set_default_options() {
    // Plugin version
    add_option('mkb_version', MKB_VERSION);
    
    // Guest session settings
    add_option('mkb_guest_session_duration', 7); // 7 days
    add_option('mkb_auto_cleanup_enabled', true);
    add_option('mkb_max_guest_sessions_per_ip', 10);
    
    // Feature settings
    add_option('mkb_enable_analytics', true);
    add_option('mkb_enable_public_previews', true);
    add_option('mkb_watermark_free_exports', true);
    
    // Template settings
    add_option('mkb_default_template', 'business-simple');
    add_option('mkb_allow_custom_templates', true);
    
    // Export settings
    add_option('mkb_pdf_generation_enabled', true);
    add_option('mkb_max_exports_per_hour', 50);
    
    // WP Fusion integration settings
    add_option('mkb_wpfusion_enabled', function_exists('wp_fusion'));
    add_option('mkb_wpfusion_auto_sync', true);
    
    // Pods integration settings
    add_option('mkb_pods_enabled', function_exists('pods'));
    add_option('mkb_pods_sync_enabled', true);
    
    // Security settings
    add_option('mkb_rate_limit_enabled', true);
    add_option('mkb_require_login_for_edit', false);
    
    // Email notification settings
    add_option('mkb_admin_notifications', true);
    add_option('mkb_user_welcome_email', true);
}

/**
 * Flush rewrite rules for URL routing
 * CRITICAL: This enables the new clean URL system
 */
function media_kit_builder_flush_rewrite_rules() {
    // Make sure the URL router class is loaded
    if (file_exists(MKB_INCLUDES_DIR . 'class-url-router.php')) {
        require_once MKB_INCLUDES_DIR . 'class-url-router.php';
        
        // Initialize URL router to register rewrite rules
        if (class_exists('Media_Kit_Builder_URL_Router')) {
            $router = new Media_Kit_Builder_URL_Router();
        }
    }
    
    // Force WordPress to regenerate rewrite rules
    delete_option('rewrite_rules');
    flush_rewrite_rules();
    
    // Verify rewrite rules were added
    $rules = get_option('rewrite_rules');
    if (is_array($rules)) {
        $mkb_rules_count = 0;
        foreach ($rules as $pattern => $rule) {
            if (strpos($pattern, 'media-kit-builder') !== false) {
                $mkb_rules_count++;
            }
        }
        
        if ($mkb_rules_count >= 4) {
            error_log("Media Kit Builder: Successfully added {$mkb_rules_count} rewrite rules");
        } else {
            error_log("Media Kit Builder: Warning - Only {$mkb_rules_count} rewrite rules detected");
        }
    }
}

/**
 * Schedule cleanup cron job
 */
function media_kit_builder_schedule_cleanup() {
    // Schedule daily cleanup of expired guest sessions
    if (!wp_next_scheduled('mkb_cleanup_guest_sessions')) {
        wp_schedule_event(time(), 'daily', 'mkb_cleanup_guest_sessions');
    }
    
    // Schedule weekly analytics cleanup
    if (!wp_next_scheduled('mkb_cleanup_analytics')) {
        wp_schedule_event(time(), 'weekly', 'mkb_cleanup_analytics');
    }
}

/**
 * Check if plugin can be activated
 */
function media_kit_builder_check_activation_requirements() {
    $errors = array();
    
    // Check PHP version
    if (version_compare(PHP_VERSION, '7.4', '<')) {
        $errors[] = 'PHP 7.4 or higher is required.';
    }
    
    // Check WordPress version
    global $wp_version;
    if (version_compare($wp_version, '5.0', '<')) {
        $errors[] = 'WordPress 5.0 or higher is required.';
    }
    
    // Check for required plugins
    if (!class_exists('FrmEntry')) {
        $errors[] = 'Formidable Forms plugin is required.';
    }
    
    // Check database permissions
    global $wpdb;
    $test_table = $wpdb->prefix . 'mkb_test_table';
    $result = $wpdb->query("CREATE TABLE $test_table (id int)");
    if ($result === false) {
        $errors[] = 'Database permissions insufficient to create tables.';
    } else {
        $wpdb->query("DROP TABLE $test_table");
    }
    
    // Check file permissions
    if (!is_writable(WP_CONTENT_DIR)) {
        $errors[] = 'WordPress content directory is not writable.';
    }
    
    return $errors;
}

/**
 * Handle activation errors
 */
function media_kit_builder_activation_error($errors) {
    $error_message = '<div class="error"><p>';
    $error_message .= '<strong>Media Kit Builder activation failed:</strong><br>';
    $error_message .= implode('<br>', $errors);
    $error_message .= '</p></div>';
    
    echo $error_message;
    
    // Deactivate the plugin
    deactivate_plugins(MKB_PLUGIN_BASENAME);
}

/**
 * Run activation checks and procedures
 */
function media_kit_builder_run_activation() {
    // Check requirements
    $errors = media_kit_builder_check_activation_requirements();
    
    if (!empty($errors)) {
        add_action('admin_notices', function() use ($errors) {
            media_kit_builder_activation_error($errors);
        });
        return false;
    }
    
    // Run activation
    media_kit_builder_activate();
    
    // Show success message
    add_action('admin_notices', function() {
        echo '<div class="notice notice-success"><p>';
        echo '<strong>Media Kit Builder activated successfully!</strong><br>';
        echo 'You can now visit <a href="' . home_url('/media-kit-builder/') . '" target="_blank">';
        echo home_url('/media-kit-builder/') . '</a> to see the template gallery.';
        echo '</p></div>';
    });
    
    return true;
}

/**
 * Create initial demo content (optional)
 */
function media_kit_builder_create_demo_content() {
    // Only create demo content if no existing entries
    if (!class_exists('FrmEntry')) {
        return;
    }
    
    global $wpdb;
    $existing_entries = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}frm_items WHERE form_id = %d",
        515
    ));
    
    if ($existing_entries > 0) {
        return; // Don't create demo content if entries exist
    }
    
    // Create a sample media kit entry for demonstration
    $demo_data = array(
        8517 => 'John Demo Speaker',           // Full Name
        10388 => 'Technology Expert',          // Title
        8045 => 'Experienced technology leader with expertise in digital transformation and emerging technologies. Available for speaking engagements, podcasts, and corporate training.',
        8498 => 'Digital Transformation',      // Topic 1
        8499 => 'Artificial Intelligence',     // Topic 2
        8500 => 'Cybersecurity',              // Topic 3
        8036 => 'https://twitter.com/johndemo', // Twitter
        8038 => 'https://linkedin.com/in/johndemo' // LinkedIn
    );
    
    $entry_id = FrmEntry::create(array(
        'form_id' => 515,
        'values' => $demo_data,
        'user_id' => 0 // Demo entry not associated with user
    ));
    
    if ($entry_id) {
        error_log('Media Kit Builder: Created demo content with entry ID ' . $entry_id);
    }
}

// Hook activation/deactivation functions
register_activation_hook(MKB_PLUGIN_FILE, 'media_kit_builder_run_activation');
register_deactivation_hook(MKB_PLUGIN_FILE, 'media_kit_builder_deactivate');

// Add cleanup hooks
add_action('mkb_cleanup_guest_sessions', 'media_kit_builder_cleanup_expired_sessions');
add_action('mkb_cleanup_analytics', 'media_kit_builder_cleanup_old_analytics');

/**
 * Cleanup expired guest sessions
 */
function media_kit_builder_cleanup_expired_sessions() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'mkb_guest_sessions';
    
    $deleted = $wpdb->query($wpdb->prepare(
        "DELETE FROM $table_name WHERE expires_at < %s",
        current_time('mysql')
    ));
    
    if ($deleted > 0) {
        error_log("Media Kit Builder: Cleaned up {$deleted} expired guest sessions");
    }
}

/**
 * Cleanup old analytics data (keep 90 days)
 */
function media_kit_builder_cleanup_old_analytics() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'mkb_analytics';
    
    $cutoff_date = date('Y-m-d H:i:s', strtotime('-90 days'));
    
    $deleted = $wpdb->query($wpdb->prepare(
        "DELETE FROM $table_name WHERE created_at < %s",
        $cutoff_date
    ));
    
    if ($deleted > 0) {
        error_log("Media Kit Builder: Cleaned up {$deleted} old analytics records");
    }
}
