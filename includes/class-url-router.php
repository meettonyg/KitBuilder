<?php
/**
 * URL Router for Media Kit Builder
 * Handles custom URL routing for clean, SEO-friendly URLs
 */

if (!defined('ABSPATH')) {
    exit;
}

class Media_Kit_Builder_URL_Router {
    
    public function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        add_action('init', array($this, 'add_rewrite_rules'), 10);
        add_filter('query_vars', array($this, 'add_query_vars'), 10);
        add_action('template_redirect', array($this, 'handle_requests'), 5);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // CRITICAL: Also register query vars on init to ensure they're available
        add_action('init', array($this, 'register_query_vars'), 5);
    }
    
    /**
     * Add custom rewrite rules
     */
    public function add_rewrite_rules() {
        // Gallery page: /media-kit-builder/
        add_rewrite_rule(
            '^media-kit-builder/?$',
            'index.php?mkb_page=gallery',
            'top'
        );
        
        // New media kit: /media-kit-builder/new
        add_rewrite_rule(
            '^media-kit-builder/new/?$',
            'index.php?mkb_page=new',
            'top'
        );
        
        // Preview page: /media-kit-builder/preview/[entry_key]
        add_rewrite_rule(
            '^media-kit-builder/preview/([^/]+)/?$',
            'index.php?mkb_page=preview&mkb_entry_key=$matches[1]',
            'top'
        );
        
        // Edit page: /media-kit-builder/[entry_key]
        add_rewrite_rule(
            '^media-kit-builder/([^/]+)/?$',
            'index.php?mkb_page=edit&mkb_entry_key=$matches[1]',
            'top'
        );
    }
    
    /**
     * Add custom query variables
     */
    public function add_query_vars($vars) {
        $vars[] = 'mkb_page';
        $vars[] = 'mkb_entry_key';
        return $vars;
    }
    
    /**
     * Register query vars directly (backup method)
     */
    public function register_query_vars() {
        global $wp;
        $wp->add_query_var('mkb_page');
        $wp->add_query_var('mkb_entry_key');
        
        // Debug: Log that query vars are being registered
        error_log('MKB: Registering query vars - mkb_page and mkb_entry_key');
    }
    
    /**
     * Handle custom page requests
     */
    public function handle_requests() {
        $mkb_page = get_query_var('mkb_page');
        
        // Debug logging
        error_log('MKB: handle_requests called - mkb_page: ' . ($mkb_page ? $mkb_page : 'NOT SET'));
        error_log('MKB: Current URL: ' . $_SERVER['REQUEST_URI']);
        
        if (!$mkb_page) {
            error_log('MKB: No mkb_page query var found, exiting handle_requests');
            return;
        }
        
        error_log('MKB: Processing mkb_page: ' . $mkb_page);
        
        switch ($mkb_page) {
            case 'gallery':
                error_log('MKB: Loading gallery page');
                $this->show_gallery_page();
                break;
                
            case 'new':
                error_log('MKB: Loading new media kit page');
                $this->show_new_media_kit_page();
                break;
                
            case 'edit':
                error_log('MKB: Loading edit page');
                $this->show_edit_page();
                break;
                
            case 'preview':
                error_log('MKB: Loading preview page');
                $this->show_preview_page();
                break;
                
            default:
                error_log('MKB: Unknown mkb_page: ' . $mkb_page);
                $this->show_404();
                break;
        }
        
        exit;
    }
    
    /**
     * Show template gallery page
     */
    private function show_gallery_page() {
        $user_id = get_current_user_id();
        $access_tier = $this->get_user_access_tier($user_id);
        
        // Set page data
        $page_data = array(
            'page_title' => 'Choose a Media Kit Template - Guestify',
            'body_class' => 'mkb-gallery-page',
            'user_id' => $user_id,
            'access_tier' => $access_tier,
            'is_logged_in' => is_user_logged_in()
        );
        
        $this->load_template('gallery', $page_data);
    }
    
    /**
     * Show new media kit creation page
     */
    private function show_new_media_kit_page() {
        $user_id = get_current_user_id();
        $access_tier = $this->get_user_access_tier($user_id);
        
        // Check if user can create new media kits
        if (!$this->user_can_create_media_kit($user_id)) {
            $this->show_access_denied();
            return;
        }
        
        $page_data = array(
            'page_title' => 'Create New Media Kit - Guestify',
            'body_class' => 'mkb-builder-page',
            'user_id' => $user_id,
            'access_tier' => $access_tier,
            'entry_key' => 'new',
            'is_new' => true,
            'builder_data' => $this->get_default_media_kit_data()
        );
        
        $this->load_template('builder', $page_data);
    }
    
    /**
     * Show edit page for existing media kit
     */
    private function show_edit_page() {
        $entry_key = get_query_var('mkb_entry_key');
        $user_id = get_current_user_id();
        
        if (!$entry_key) {
            $this->show_404();
            return;
        }
        
        // Get Formidable entry
        $entry = $this->get_formidable_entry_by_key($entry_key);
        
        if (!$entry) {
            $this->show_404();
            return;
        }
        
        // Check access permissions
        if (!$this->user_can_edit_entry($user_id, $entry)) {
            $this->show_access_denied();
            return;
        }
        
        $access_tier = $this->get_user_access_tier($user_id);
        
        $page_data = array(
            'page_title' => 'Edit Media Kit - Guestify',
            'body_class' => 'mkb-builder-page',
            'user_id' => $user_id,
            'access_tier' => $access_tier,
            'entry_key' => $entry_key,
            'entry_id' => $entry->id,
            'is_new' => false,
            'can_edit' => true
        );
        
        $this->load_template('builder', $page_data);
    }
    
    /**
     * Show public preview page
     */
    private function show_preview_page() {
        $entry_key = get_query_var('mkb_entry_key');
        
        if (!$entry_key) {
            $this->show_404();
            return;
        }
        
        $entry = $this->get_formidable_entry_by_key($entry_key);
        
        if (!$entry) {
            $this->show_404();
            return;
        }
        
        // Check if preview is public or requires access
        if (!$this->is_preview_public($entry)) {
            $this->show_access_denied();
            return;
        }
        
        $page_data = array(
            'page_title' => 'Media Kit Preview - Guestify',
            'body_class' => 'mkb-preview-page',
            'entry_key' => $entry_key,
            'entry_id' => $entry->id,
            'is_preview' => true
        );
        
        $this->load_template('preview', $page_data);
    }
    
    /**
     * Load template file
     */
    private function load_template($template_name, $data = array()) {
        // Use the predefined plugin directory constant for accurate path
        $template_file = MKB_PLUGIN_DIR . "templates/{$template_name}.php";
        
        // Debug template path
        error_log("MKB: load_template called for: " . $template_name);
        error_log("MKB: Looking for template: " . $template_file);
        error_log("MKB: File exists: " . (file_exists($template_file) ? 'YES' : 'NO'));
        
        if (!file_exists($template_file)) {
            error_log("MKB: Template not found: " . $template_file);
            $this->show_template_not_found($template_name, $template_file);
            return;
        }
        
        error_log("MKB: Template found, loading: " . $template_file);
        
        // Make data available to template
        extract($data);
        
        // Disable WordPress admin bar for cleaner preview
        show_admin_bar(false);
        
        // Start output buffering
        ob_start();
        
        // Include the template
        include $template_file;
        
        // Get content and clean buffer
        $content = ob_get_clean();
        
        error_log("MKB: Template loaded successfully, content length: " . strlen($content));
        
        // Output the content
        echo $content;
    }
    
    /**
     * Show template not found error
     */
    private function show_template_not_found($template_name, $template_file) {
        status_header(500);
        
        echo '<!DOCTYPE html><html><head><title>Template Error</title></head><body>';
        echo '<div style="max-width: 600px; margin: 100px auto; padding: 40px; text-align: center; font-family: Arial, sans-serif;">';
        echo '<h1 style="color: #dc3545; margin-bottom: 20px;">Template Not Found</h1>';
        echo '<p style="font-size: 16px; color: #666; margin-bottom: 20px;">';
        echo 'The template "' . esc_html($template_name) . '" could not be found.</p>';
        echo '<p style="font-size: 14px; color: #999; margin-bottom: 30px;">';
        echo 'Expected location: ' . esc_html($template_file) . '</p>';
        echo '<a href="' . home_url('/media-kit-builder/') . '" ';
        echo 'style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">';
        echo 'Return to Gallery</a>';
        echo '</div></body></html>';
    }
    
    /**
     * Get user access tier based on WP Fusion tags
     */
    private function get_user_access_tier($user_id) {
        if (!$user_id) {
            return 'guest';
        }
        
        if (!function_exists('wp_fusion')) {
            return 'free'; // Default if WP Fusion not available
        }
        
        // Get user tags
        $user_tags = wp_fusion()->user->get_tags($user_id);
        
        if (!$user_tags || !is_array($user_tags)) {
            return 'free';
        }
        
        // CORRECT WP FUSION TAG MAPPINGS (from project documentation)
        $tier_tags = array(
            'agency' => array(
                'white_label_access',       // White-label branding capability
                'agency_tier',              // Agency-level access
                'unlimited_templates',      // Access to all templates
                'custom_branding',          // Custom branding options
                'advanced_analytics'        // Advanced analytics access
            ),
            'pro' => array(
                'premium_access',           // Premium component access
                'pro_tier',                 // Pro-level access
                'custom_templates',         // Can save custom templates
                'advanced_export',          // Advanced export options
                'premium_components',       // Access to premium components
                'video_components',         // Video embedding capability
                'analytics_basic'           // Basic analytics access
            ),
            'free' => array(
                'basic_access',             // Basic component access
                'free_tier',                // Free-level access
                'watermarked_export',       // Exports include watermark
                'standard_templates',       // Access to standard templates
                'basic_components'          // Basic component library
            )
        );
        
        // Check for agency tier first (highest priority)
        if (array_intersect($tier_tags['agency'], $user_tags)) {
            return 'agency';
        }
        
        // Check for pro tier
        if (array_intersect($tier_tags['pro'], $user_tags)) {
            return 'pro';
        }
        
        // Check for free tier tags (explicit free tier)
        if (array_intersect($tier_tags['free'], $user_tags)) {
            return 'free';
        }
        
        // Default to free if no specific tags found
        return 'free';
    }
    
    /**
     * Check if user can create new media kits
     */
    private function user_can_create_media_kit($user_id) {
        if (!$user_id) {
            return true; // Allow guests to create
        }
        
        $access_tier = $this->get_user_access_tier($user_id);
        
        // All tiers can create media kits
        return in_array($access_tier, array('free', 'pro', 'agency', 'guest'));
    }
    
    /**
     * Check if user can edit specific entry
     */
    private function user_can_edit_entry($user_id, $entry) {
        // Guests can't edit existing entries
        if (!$user_id) {
            return false;
        }
        
        // User can edit their own entries
        if ($entry->user_id == $user_id) {
            return true;
        }
        
        // Admins can edit any entry
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Agency users can edit entries they have access to
        if ($this->get_user_access_tier($user_id) === 'agency') {
            return $this->agency_can_access_entry($user_id, $entry);
        }
        
        return false;
    }
    
    /**
     * Check if preview is publicly accessible
     */
    private function is_preview_public($entry) {
        // Get entry settings to check if preview is public
        // This could be stored in entry meta or determined by user settings
        
        // For now, assume all previews are public unless marked private
        $is_private = get_post_meta($entry->id, '_mkb_private_preview', true);
        
        return !$is_private;
    }
    
    /**
     * Check if agency user can access specific entry
     */
    private function agency_can_access_entry($user_id, $entry) {
        // This would implement agency-specific access logic
        // For example, checking if the entry belongs to a client under this agency
        
        // Get agency's client list from WP Fusion or custom meta
        $agency_clients = get_user_meta($user_id, '_mkb_agency_clients', true);
        
        if (!$agency_clients || !is_array($agency_clients)) {
            return false;
        }
        
        return in_array($entry->user_id, $agency_clients);
    }
    
    /**
     * Get default data for new media kits
     */
    private function get_default_media_kit_data() {
        $user_id = get_current_user_id();
        $user_data = array();
        
        if ($user_id) {
            $user = get_userdata($user_id);
            $user_data = array(
                'hero_full_name' => $user->display_name,
                'hero_first_name' => get_user_meta($user_id, 'first_name', true),
                'hero_last_name' => get_user_meta($user_id, 'last_name', true),
                'social_linkedin' => get_user_meta($user_id, 'linkedin', true),
                'social_twitter' => get_user_meta($user_id, 'twitter', true),
            );
        }
        
        return array_merge(array(
            'hero_title' => 'Professional Speaker & Expert',
            'bio_text' => 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.',
            'topic_1' => 'Leadership',
            'topic_2' => 'Innovation',
            'topic_3' => 'Growth Strategy',
            'question_1' => 'What inspired you to become an expert in your field?',
            'question_2' => 'What advice would you give to someone starting out?',
            'question_3' => 'What\'s the biggest challenge in your industry today?'
        ), $user_data);
    }
    
    /**
     * Helper functions
     */
    
    private function get_formidable_entry_by_key($entry_key) {
        if (!class_exists('FrmEntry')) {
            return false;
        }
        
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}frm_items WHERE item_key = %s",
            $entry_key
        ));
    }
    
    private function show_404() {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        include get_404_template();
    }
    
    private function show_access_denied() {
        status_header(403);
        
        $message = '
        <div style="max-width: 600px; margin: 100px auto; padding: 40px; text-align: center; font-family: Arial, sans-serif;">
            <h1 style="color: #dc3545; margin-bottom: 20px;">Access Denied</h1>
            <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
                You don\'t have permission to access this media kit.
            </p>
            <a href="' . home_url('/media-kit-builder/') . '" 
               style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Template Gallery
            </a>
        </div>';
        
        echo $message;
    }
    
    /**
     * Enqueue assets for media kit builder pages
     */
    public function enqueue_assets() {
        $mkb_page = get_query_var('mkb_page');
        
        if (!$mkb_page) {
            return;
        }
        
        // Use the predefined plugin URL constant for accurate paths
        $plugin_url = MKB_PLUGIN_URL;
        
        // Common styles and scripts
        wp_enqueue_script('jquery');
        
        // Page-specific assets
        switch ($mkb_page) {
            case 'gallery':
                wp_enqueue_style(
                    'mkb-gallery-css',
                    $plugin_url . 'assets/css/gallery.css',
                    array(),
                    MKB_VERSION
                );
                wp_enqueue_script(
                    'mkb-gallery-js',
                    $plugin_url . 'assets/js/gallery.js',
                    array('jquery'),
                    MKB_VERSION,
                    true
                );
                break;
                
            case 'edit':
            case 'new':
                wp_enqueue_style(
                    'mkb-builder-css',
                    $plugin_url . 'assets/css/builder-v2.css',
                    array(),
                    MKB_VERSION
                );
                wp_enqueue_script(
                    'mkb-builder-js',
                    $plugin_url . 'assets/js/builder-wordpress.js',
                    array('jquery'),
                    MKB_VERSION,
                    true
                );
                
                // Localize script with AJAX data
                wp_localize_script('mkb-builder-js', 'mkb_ajax', array(
                    'ajax_url' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce('mkb_nonce'),
                    'entry_key' => get_query_var('mkb_entry_key'),
                    'user_id' => get_current_user_id(),
                    'is_logged_in' => is_user_logged_in()
                ));
                break;
                
            case 'preview':
                wp_enqueue_style(
                    'mkb-preview-css',
                    $plugin_url . 'assets/css/preview.css',
                    array(),
                    MKB_VERSION
                );
                wp_enqueue_script(
                    'mkb-preview-js',
                    $plugin_url . 'assets/js/preview.js',
                    array('jquery'),
                    MKB_VERSION,
                    true
                );
                break;
        }
    }
    
    /**
     * Get user's media kits
     */
    public function get_user_media_kits($user_id) {
        if (!$user_id || !class_exists('FrmEntry')) {
            return array();
        }
        
        global $wpdb;
        
        $entries = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}frm_items 
             WHERE user_id = %d AND form_id = 515 
             ORDER BY created_date DESC",
            $user_id
        ));
        
        return $entries;
    }
    
    /**
     * Create new media kit entry
     */
    public function create_new_media_kit($user_id, $template_id = 'default') {
        if (!class_exists('FrmEntry')) {
            return false;
        }
        
        $default_data = $this->get_default_media_kit_data();
        
        // Add template-specific data
        if ($template_id !== 'default') {
            $template_data = $this->get_template_data($template_id);
            $default_data = array_merge($default_data, $template_data);
        }
        
        // Create Formidable entry
        $entry_id = FrmEntry::create(array(
            'form_id' => 515, // Your Formidable Form ID
            'values' => $this->map_builder_data_to_formidable($default_data),
            'user_id' => $user_id
        ));
        
        if ($entry_id) {
            // Get the entry key for the new entry
            $entry = $wpdb->get_row($wpdb->prepare(
                "SELECT item_key FROM {$wpdb->prefix}frm_items WHERE id = %d",
                $entry_id
            ));
            
            return $entry ? $entry->item_key : false;
        }
        
        return false;
    }
    
    private function get_template_data($template_id) {
        $templates = array(
            'business-simple' => array(
                'hero_title' => 'Business Professional',
                'bio_text' => 'Experienced business leader with a track record of driving growth and innovation.',
                'topic_1' => 'Leadership',
                'topic_2' => 'Strategy',
                'topic_3' => 'Growth'
            ),
            'creative-basic' => array(
                'hero_title' => 'Creative Professional',
                'bio_text' => 'Creative expert specializing in innovative design and brand development.',
                'topic_1' => 'Design',
                'topic_2' => 'Branding',
                'topic_3' => 'Innovation'
            ),
            'tech-advanced' => array(
                'hero_title' => 'Technology Expert',
                'bio_text' => 'Technology leader with expertise in digital transformation and emerging technologies.',
                'topic_1' => 'Digital Transformation',
                'topic_2' => 'AI & Machine Learning',
                'topic_3' => 'Cybersecurity'
            )
        );
        
        return isset($templates[$template_id]) ? $templates[$template_id] : array();
    }
    
    private function map_builder_data_to_formidable($builder_data) {
        // This would map the builder data format to Formidable field format
        // Using the field mappings we defined in the AJAX handler
        
        $field_mapping = array(
            'hero_full_name' => 8517,
            'hero_title' => 10388,
            'bio_text' => 8045,
            'topic_1' => 8498,
            'topic_2' => 8499,
            'topic_3' => 8500
            // Add more mappings as needed
        );
        
        $formidable_data = array();
        foreach ($field_mapping as $builder_field => $formidable_field_id) {
            if (isset($builder_data[$builder_field])) {
                $formidable_data[$formidable_field_id] = $builder_data[$builder_field];
            }
        }
        
        return $formidable_data;
    }
}

// Initialize the URL router
new Media_Kit_Builder_URL_Router();
