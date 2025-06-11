<?php
/**
 * AJAX Handlers for Media Kit Builder
 * Handles all AJAX requests for data loading, saving, and management
 */

if (!defined('ABSPATH')) {
    exit;
}

class Media_Kit_Builder_AJAX_Handlers {
    
    public function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // AJAX actions for logged-in users
        add_action('wp_ajax_load_media_kit', array($this, 'load_media_kit_data'));
        add_action('wp_ajax_update_media_kit', array($this, 'update_media_kit'));
        add_action('wp_ajax_create_media_kit', array($this, 'create_media_kit'));
        add_action('wp_ajax_mkb_create_guest_session', array($this, 'create_guest_session'));
        add_action('wp_ajax_mkb_save_guest_data', array($this, 'save_guest_data'));
        add_action('wp_ajax_mkb_migrate_guest_data', array($this, 'migrate_guest_data'));
        add_action('wp_ajax_mkb_export_pdf', array($this, 'export_pdf'));
        add_action('wp_ajax_mkb_get_templates', array($this, 'get_templates'));
        
        // Legacy action names - redirect to new handlers
        add_action('wp_ajax_mkb_load_data', array($this, 'load_media_kit_data'));
        add_action('wp_ajax_mkb_save_data', array($this, 'save_media_kit_data'));
        
        // AJAX actions for non-logged-in users (guests)
        add_action('wp_ajax_nopriv_load_media_kit', array($this, 'load_media_kit_data'));
        add_action('wp_ajax_nopriv_update_media_kit', array($this, 'update_media_kit'));
        add_action('wp_ajax_nopriv_create_media_kit', array($this, 'create_media_kit'));
        add_action('wp_ajax_nopriv_mkb_create_guest_session', array($this, 'create_guest_session'));
        add_action('wp_ajax_nopriv_mkb_save_guest_data', array($this, 'save_guest_data'));
        add_action('wp_ajax_nopriv_mkb_get_templates', array($this, 'get_templates'));
        add_action('wp_ajax_nopriv_mkb_export_pdf', array($this, 'export_pdf'));
    }
    
    /**
     * Load media kit data for editing
     */
    public function load_media_kit_data() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mkb_nonce')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        $kit_id = isset($_POST['kit_id']) ? sanitize_text_field($_POST['kit_id']) : 
                 (isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : '');
                 
        $is_new = isset($_POST['is_new']) && $_POST['is_new'] === 'true';
        $user_id = get_current_user_id();
        
        // If this is a new kit request, return empty template
        if ($is_new) {
            wp_send_json_success(array(
                'is_new' => true,
                'data' => array(
                    'kit_data' => json_encode($this->get_default_template_data())
                ),
                'access_tier' => $this->get_user_access_tier($user_id),
                'can_edit' => true
            ));
            return;
        }
        
        // Get Formidable entry by key
        $entry = $this->get_formidable_entry_by_key($kit_id);
        
        if (!$entry) {
            wp_send_json_error(array(
                'message' => 'Media kit not found',
                'is_new' => true
            ));
            return;
        }
        
        // Check if user has access to this entry
        if ($user_id && !$this->user_can_edit_entry($user_id, $entry)) {
            wp_send_json_error(array(
                'message' => 'Access denied'
            ));
            return;
        }
        
        // Get mapped data from Formidable entry
        $data = $this->map_formidable_data_to_builder($entry);
        
        // If user is logged in, also get Pods data
        if ($user_id) {
            $pods_data = $this->get_pods_data_for_user($user_id);
            $data = array_merge($data, $pods_data);
        }
        
        // Get user access tier
        $access_tier = $this->get_user_access_tier($user_id);
        
        wp_send_json_success(array(
            'data' => array(
                'kit_data' => json_encode($data)
            ),
            'access_tier' => $access_tier,
            'entry_id' => $entry->id,
            'can_edit' => true
        ));
    }
    
    /**
     * Save media kit data (legacy method)
     */
    public function save_media_kit_data() {
        // Determine if creating or updating based on entry_key presence
        if (isset($_POST['entry_key']) && !empty($_POST['entry_key'])) {
            $this->update_media_kit();
        } else {
            $this->create_media_kit();
        }
    }
    
    /**
     * Create a new media kit
     */
    public function create_media_kit() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mkb_nonce')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : get_current_user_id();
        $access_tier = isset($_POST['access_tier']) ? sanitize_text_field($_POST['access_tier']) : 'guest';
        $kit_data = isset($_POST['kit_data']) ? $_POST['kit_data'] : '{}'; // Will be sanitized in mapping function
        
        // Create entry with entry key
        $entry_key = 'mk_' . time() . '_' . wp_generate_password(8, false);
        
        // Parse kit data
        $kit_data_array = json_decode($kit_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(array(
                'message' => 'Invalid JSON data'
            ));
            return;
        }
        
        // Extract data for Formidable
        $formidable_data = array();
        if (isset($kit_data_array['content'])) {
            $formidable_data = $kit_data_array['content'];
        } else if (isset($kit_data_array['metadata']['legacyData'])) {
            $formidable_data = $kit_data_array['metadata']['legacyData'];
        }
        
        // Create Formidable entry
        $entry_id = $this->create_formidable_entry($user_id, $formidable_data, $entry_key);
        
        if (!$entry_id) {
            wp_send_json_error(array(
                'message' => 'Failed to create media kit'
            ));
            return;
        }
        
        // If user is logged in, also create Pods entry
        if ($user_id > 0) {
            $this->create_pods_entry_for_user($user_id, $formidable_data);
        }
        
        // Return success with new entry key
        wp_send_json_success(array(
            'entry_key' => $entry_key,
            'kit_id' => $entry_key,
            'message' => 'Media kit created successfully'
        ));
    }
    
    /**
     * Update an existing media kit
     */
    public function update_media_kit() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mkb_nonce')) {
            wp_send_json_error(array(
                'message' => 'Invalid security token'
            ));
            return;
        }
        
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : '';
        $kit_data = isset($_POST['kit_data']) ? $_POST['kit_data'] : '{}'; // Will be sanitized in mapping function
        $user_id = get_current_user_id();
        
        if (empty($entry_key)) {
            wp_send_json_error(array(
                'message' => 'No entry key provided'
            ));
            return;
        }
        
        // Get Formidable entry
        $entry = $this->get_formidable_entry_by_key($entry_key);
        
        if (!$entry) {
            wp_send_json_error(array(
                'message' => 'Media kit not found'
            ));
            return;
        }
        
        // Check access
        if ($user_id && !$this->user_can_edit_entry($user_id, $entry)) {
            wp_send_json_error(array(
                'message' => 'Access denied'
            ));
            return;
        }
        
        // Parse kit data
        $kit_data_array = json_decode($kit_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(array(
                'message' => 'Invalid JSON data'
            ));
            return;
        }
        
        // Extract data for Formidable
        $formidable_data = array();
        if (isset($kit_data_array['content'])) {
            $formidable_data = $kit_data_array['content'];
        } else if (isset($kit_data_array['metadata']['legacyData'])) {
            $formidable_data = $kit_data_array['metadata']['legacyData'];
        }
        
        // Map and save to Formidable
        $formidable_success = $this->save_to_formidable($entry->id, $formidable_data);
        
        // If user is logged in, also save to Pods
        $pods_success = true;
        if ($user_id) {
            $pods_success = $this->save_to_pods($user_id, $formidable_data);
        }
        
        if ($formidable_success && $pods_success) {
            wp_send_json_success(array(
                'message' => 'Media kit updated successfully'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to update media kit'
            ));
        }
    }
    
    /**
     * Create guest session for anonymous users
     */
    public function create_guest_session() {
        // Generate unique session ID
        $session_id = $this->generate_session_id();
        
        // Set expiry (7 days)
        $expiry = time() + (7 * 24 * 60 * 60);
        
        // Store in database
        global $wpdb;
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'session_id' => $session_id,
                'data' => '{}',
                'created_at' => current_time('mysql'),
                'expires_at' => date('Y-m-d H:i:s', $expiry),
                'last_activity' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            wp_send_json_success(array(
                'session_id' => $session_id,
                'expires_at' => $expiry
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to create guest session'
            ));
        }
    }
    
    /**
     * Save guest data to session
     */
    public function save_guest_data() {
        $session_id = isset($_POST['session_id']) ? sanitize_text_field($_POST['session_id']) : '';
        $data = isset($_POST['data']) ? $_POST['data'] : '';
        
        if (!$session_id) {
            wp_send_json_error(array(
                'message' => 'Invalid session'
            ));
            return;
        }
        
        // Update guest session data
        global $wpdb;
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $result = $wpdb->update(
            $table_name,
            array(
                'data' => wp_json_encode($data),
                'last_activity' => current_time('mysql')
            ),
            array('session_id' => $session_id),
            array('%s', '%s'),
            array('%s')
        );
        
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => 'Guest data saved'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to save guest data'
            ));
        }
    }
    
    /**
     * Migrate guest data to user account after registration
     */
    public function migrate_guest_data() {
        if (!is_user_logged_in()) {
            wp_send_json_error(array(
                'message' => 'User not logged in'
            ));
            return;
        }
        
        $session_id = isset($_POST['session_id']) ? sanitize_text_field($_POST['session_id']) : '';
        $user_id = get_current_user_id();
        
        // Get guest session data
        global $wpdb;
        $table_name = $wpdb->prefix . 'mkb_guest_sessions';
        
        $session = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE session_id = %s",
            $session_id
        ));
        
        if (!$session) {
            wp_send_json_error(array(
                'message' => 'Guest session not found'
            ));
            return;
        }
        
        $guest_data = json_decode($session->data, true);
        
        // Generate entry key
        $entry_key = 'mk_' . time() . '_' . wp_generate_password(8, false);
        
        // Create new Formidable entry for user
        $entry_id = $this->create_formidable_entry($user_id, $guest_data, $entry_key);
        
        if ($entry_id) {
            // Create Pods entry
            $this->create_pods_entry_for_user($user_id, $guest_data);
            
            // Clean up guest session
            $wpdb->delete($table_name, array('session_id' => $session_id), array('%s'));
            
            wp_send_json_success(array(
                'entry_key' => $entry_key,
                'kit_id' => $entry_key,
                'redirect_url' => home_url("/media-kit-builder/$entry_key")
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to migrate guest data'
            ));
        }
    }
    
    /**
     * Export media kit to PDF
     */
    public function export_pdf() {
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : '';
        $user_id = get_current_user_id();
        
        // Get access tier to determine watermarking
        $access_tier = $this->get_user_access_tier($user_id);
        
        // Get media kit data
        $entry = $this->get_formidable_entry_by_key($entry_key);
        if (!$entry) {
            wp_send_json_error(array(
                'message' => 'Media kit not found'
            ));
            return;
        }
        
        $data = $this->map_formidable_data_to_builder($entry);
        
        // Generate PDF (this would use a PDF library like TCPDF or DomPDF)
        $pdf_url = $this->generate_pdf($data, $access_tier);
        
        if ($pdf_url) {
            wp_send_json_success(array('pdf_url' => $pdf_url));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to generate PDF'
            ));
        }
    }
    
    /**
     * Get available templates
     */
    public function get_templates() {
        $user_id = get_current_user_id();
        $access_tier = $this->get_user_access_tier($user_id);
        
        $templates = array(
            'free' => array(
                array(
                    'id' => 'business-simple',
                    'name' => 'Business Simple',
                    'category' => 'business',
                    'preview' => 'business-simple-preview.jpg',
                    'tier' => 'free'
                ),
                array(
                    'id' => 'creative-basic',
                    'name' => 'Creative Basic',
                    'category' => 'creative',
                    'preview' => 'creative-basic-preview.jpg',
                    'tier' => 'free'
                ),
                array(
                    'id' => 'health-wellness',
                    'name' => 'Health & Wellness',
                    'category' => 'health',
                    'preview' => 'health-wellness-preview.jpg',
                    'tier' => 'free'
                )
            ),
            'pro' => array(
                array(
                    'id' => 'business-premium',
                    'name' => 'Business Premium',
                    'category' => 'business',
                    'preview' => 'business-premium-preview.jpg',
                    'tier' => 'pro'
                ),
                array(
                    'id' => 'tech-advanced',
                    'name' => 'Tech Advanced',
                    'category' => 'tech',
                    'preview' => 'tech-advanced-preview.jpg',
                    'tier' => 'pro'
                )
            ),
            'agency' => array(
                array(
                    'id' => 'white-label-corporate',
                    'name' => 'White Label Corporate',
                    'category' => 'corporate',
                    'preview' => 'white-label-corporate-preview.jpg',
                    'tier' => 'agency'
                )
            )
        );
        
        // Filter templates based on access tier
        $available_templates = $templates['free'];
        
        if (in_array($access_tier, array('pro', 'agency'))) {
            $available_templates = array_merge($available_templates, $templates['pro']);
        }
        
        if ($access_tier === 'agency') {
            $available_templates = array_merge($available_templates, $templates['agency']);
        }
        
        wp_send_json_success($available_templates);
    }
    
    /**
     * Get default template data for new media kits
     */
    private function get_default_template_data() {
        return array(
            'theme' => array(
                'id' => 'modern-blue',
                'customizations' => array()
            ),
            'content' => array(
                'hero_full_name' => 'Your Name',
                'hero_title' => 'Your Professional Title',
                'bio_text' => 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.',
                'topic_1' => 'Leadership',
                'topic_2' => 'Innovation', 
                'topic_3' => 'Strategy',
                'topic_4' => 'Growth'
            ),
            'components' => array(
                'hero-1' => array(
                    'type' => 'hero',
                    'content' => array(
                        'name' => 'Your Name',
                        'title' => 'Your Professional Title',
                        'bio' => 'Add your professional biography here.'
                    ),
                    'styles' => array()
                ),
                'topics-1' => array(
                    'type' => 'topics',
                    'content' => array(
                        'items' => array(
                            'Leadership',
                            'Innovation',
                            'Strategy',
                            'Growth'
                        )
                    ),
                    'styles' => array()
                ),
                'social-1' => array(
                    'type' => 'social',
                    'content' => array(
                        'links' => array(
                            array('platform' => 'Twitter', 'url' => '#'),
                            array('platform' => 'LinkedIn', 'url' => '#'),
                            array('platform' => 'Instagram', 'url' => '#')
                        )
                    ),
                    'styles' => array()
                )
            ),
            'sections' => array(
                array(
                    'id' => 'section-hero-1',
                    'type' => 'hero',
                    'layout' => 'full-width',
                    'order' => 0,
                    'settings' => array(
                        'background' => array('type' => 'color', 'value' => '#ffffff'),
                        'padding' => array('top' => '48px', 'bottom' => '48px')
                    ),
                    'components' => array('hero-1')
                ),
                array(
                    'id' => 'section-content-1',
                    'type' => 'content',
                    'layout' => 'full-width',
                    'order' => 1,
                    'settings' => array(
                        'background' => array('type' => 'color', 'value' => '#ffffff'),
                        'padding' => array('top' => '48px', 'bottom' => '48px')
                    ),
                    'components' => array('topics-1')
                ),
                array(
                    'id' => 'section-contact-1',
                    'type' => 'contact',
                    'layout' => 'full-width',
                    'order' => 2,
                    'settings' => array(
                        'background' => array('type' => 'color', 'value' => '#ffffff'),
                        'padding' => array('top' => '48px', 'bottom' => '48px')
                    ),
                    'components' => array('social-1')
                )
            ),
            'metadata' => array(
                'version' => '2.0'
            )
        );
    }
    
    /**
     * Map Formidable entry data to builder format
     */
    private function map_formidable_data_to_builder($entry) {
        // CORRECT FIELD MAPPINGS (from project documentation)
        $field_mapping = array(
            // Hero/Profile Section
            'hero_first_name' => 8029,      // First Name [8029] → guest_first_name
            'hero_last_name' => 8176,       // Last Name [8176] → guest_last_name
            'hero_full_name' => 8517,       // Full Name [8517] → guest_full_name
            'hero_title' => 10388,          // Position/Title [10388] → guest_title
            'hero_organization' => 8032,    // Organization [8032] → guest_organization
            'hero_headshot' => 8046,        // Head Shot (Primary) [8046] → guest_headshot
            'hero_tagline' => 8489,         // Tagline [8489] → guest_tagline
            
            // Biography Section
            'bio_text' => 8045,             // Bio (300-500 words) [8045] → guest_biography
            'bio_ai' => 10077,              // AI Bio [10077] → guest_ai_bio (read-only)
            
            // Topics (Individual Fields)
            'topic_1' => 8498,              // Topic 1 [8498] → guest_topic_1
            'topic_2' => 8499,              // Topic 2 [8499] → guest_topic_2
            'topic_3' => 8500,              // Topic 3 [8500] → guest_topic_3
            'topic_4' => 8501,              // Topic 4 [8501] → guest_topic_4
            'topic_5' => 8502,              // Topic 5 [8502] → guest_topic_5
            
            // Social Media Links
            'social_facebook' => 8035,      // Facebook [8035] → guest_facebook
            'social_twitter' => 8036,       // Twitter [8036] → guest_twitter
            'social_instagram' => 8037,     // Instagram [8037] → guest_instagram
            'social_linkedin' => 8038,      // LinkedIn [8038] → guest_linkedin
            'social_youtube' => 8381,       // YouTube [8381] → guest_youtube
            'social_pinterest' => 8382,     // Pinterest [8382] → guest_pinterest
            'social_tiktok' => 8383,        // TikTok [8383] → guest_tiktok
            
            // Media/Logo Section
            'logo_primary' => 8047,         // Logo [8047] → guest_logo
            'carousel_images' => 10423,     // Carousel Images [10423] → guest_carousel_images
            
            // Interview Questions (1-25)
            'question_1' => 8505,   'question_2' => 8506,   'question_3' => 8507,   'question_4' => 8508,   'question_5' => 8509,
            'question_6' => 8510,   'question_7' => 8511,   'question_8' => 8512,   'question_9' => 8513,   'question_10' => 8514,
            'question_11' => 8515,  'question_12' => 8516,  'question_13' => 8518,  'question_14' => 8519,  'question_15' => 8520,
            'question_16' => 8521,  'question_17' => 8522,  'question_18' => 8523,  'question_19' => 8524,  'question_20' => 8525,
            'question_21' => 8526,  'question_22' => 8527,  'question_23' => 8528,  'question_24' => 8529,  'question_25' => 10384
        );
        
        $mapped_data = array();
        
        // Get entry meta values
        $entry_values = $this->get_formidable_entry_values($entry->id);
        
        // Map each field
        foreach ($field_mapping as $builder_field => $formidable_field_id) {
            if (isset($entry_values[$formidable_field_id])) {
                $mapped_data[$builder_field] = $entry_values[$formidable_field_id];
            }
        }
        
        return $mapped_data;
    }
    
    /**
     * Save data to Formidable entry
     */
    private function save_to_formidable($entry_id, $data) {
        // Reverse mapping - from builder fields to Formidable field IDs
        $field_mapping = array(
            // Hero/Profile Section
            8029 => 'hero_first_name',      // First Name
            8176 => 'hero_last_name',       // Last Name
            8517 => 'hero_full_name',       // Full Name
            10388 => 'hero_title',          // Position/Title
            8032 => 'hero_organization',    // Organization
            8046 => 'hero_headshot',        // Head Shot
            8489 => 'hero_tagline',         // Tagline
            
            // Biography Section
            8045 => 'bio_text',             // Bio text
            
            // Topics
            8498 => 'topic_1',              // Topic 1
            8499 => 'topic_2',              // Topic 2
            8500 => 'topic_3',              // Topic 3
            8501 => 'topic_4',              // Topic 4
            8502 => 'topic_5',              // Topic 5
            
            // Social Media
            8035 => 'social_facebook',      // Facebook
            8036 => 'social_twitter',       // Twitter
            8037 => 'social_instagram',     // Instagram
            8038 => 'social_linkedin',      // LinkedIn
            8381 => 'social_youtube',       // YouTube
            8382 => 'social_pinterest',     // Pinterest
            8383 => 'social_tiktok',        // TikTok
            
            // Media
            8047 => 'logo_primary',         // Logo
            10423 => 'carousel_images',     // Carousel Images
        );
        
        // Add question mappings
        for ($i = 1; $i <= 25; $i++) {
            $question_fields = array(
                1 => 8505,  2 => 8506,  3 => 8507,  4 => 8508,  5 => 8509,
                6 => 8510,  7 => 8511,  8 => 8512,  9 => 8513,  10 => 8514,
                11 => 8515, 12 => 8516, 13 => 8518, 14 => 8519, 15 => 8520,
                16 => 8521, 17 => 8522, 18 => 8523, 19 => 8524, 20 => 8525,
                21 => 8526, 22 => 8527, 23 => 8528, 24 => 8529, 25 => 10384
            );
            if (isset($question_fields[$i])) {
                $field_mapping[$question_fields[$i]] = "question_$i";
            }
        }
        
        // Prepare values for Formidable
        $formidable_values = array();
        foreach ($field_mapping as $formidable_field_id => $builder_field) {
            if (isset($data[$builder_field])) {
                $formidable_values[$formidable_field_id] = sanitize_text_field($data[$builder_field]);
            }
        }
        
        // Update Formidable entry
        if (class_exists('FrmEntry')) {
            $result = FrmEntry::update($entry_id, array('values' => $formidable_values));
            return $result !== false;
        }
        
        return false;
    }
    
    /**
     * Create a new Formidable entry with entry key
     */
    private function create_formidable_entry($user_id, $data, $entry_key) {
        if (!class_exists('FrmEntry')) {
            return false;
        }
        
        // Map data to Formidable fields using the reverse field mapping
        $field_mapping = array(
            // Hero/Profile Section
            8029 => 'hero_first_name',      // First Name
            8176 => 'hero_last_name',       // Last Name
            8517 => 'hero_full_name',       // Full Name
            10388 => 'hero_title',          // Position/Title
            8032 => 'hero_organization',    // Organization
            8046 => 'hero_headshot',        // Head Shot
            8489 => 'hero_tagline',         // Tagline
            
            // Biography Section
            8045 => 'bio_text',             // Bio text
            
            // Topics
            8498 => 'topic_1',              // Topic 1
            8499 => 'topic_2',              // Topic 2
            8500 => 'topic_3',              // Topic 3
            8501 => 'topic_4',              // Topic 4
            8502 => 'topic_5',              // Topic 5
            
            // Social Media
            8035 => 'social_facebook',      // Facebook
            8036 => 'social_twitter',       // Twitter
            8037 => 'social_instagram',     // Instagram
            8038 => 'social_linkedin',      // LinkedIn
            8381 => 'social_youtube',       // YouTube
            8382 => 'social_pinterest',     // Pinterest
            8383 => 'social_tiktok',        // TikTok
            
            // Media
            8047 => 'logo_primary',         // Logo
            10423 => 'carousel_images',     // Carousel Images
        );
        
        // Add question mappings
        for ($i = 1; $i <= 25; $i++) {
            $question_fields = array(
                1 => 8505,  2 => 8506,  3 => 8507,  4 => 8508,  5 => 8509,
                6 => 8510,  7 => 8511,  8 => 8512,  9 => 8513,  10 => 8514,
                11 => 8515, 12 => 8516, 13 => 8518, 14 => 8519, 15 => 8520,
                16 => 8521, 17 => 8522, 18 => 8523, 19 => 8524, 20 => 8525,
                21 => 8526, 22 => 8527, 23 => 8528, 24 => 8529, 25 => 10384
            );
            if (isset($question_fields[$i])) {
                $field_mapping[$question_fields[$i]] = "question_$i";
            }
        }
        
        // Prepare values for Formidable
        $formidable_values = array();
        foreach ($field_mapping as $formidable_field_id => $builder_field) {
            if (isset($data[$builder_field])) {
                $formidable_values[$formidable_field_id] = sanitize_text_field($data[$builder_field]);
            }
        }
        
        // Create entry
        $entry_id = FrmEntry::create(array(
            'form_id' => 515, // Your Formidable Form ID
            'item_key' => $entry_key,
            'values' => $formidable_values,
            'user_id' => $user_id > 0 ? $user_id : null
        ));
        
        return $entry_id;
    }
    
    /**
     * Save data to Pods
     */
    private function save_to_pods($user_id, $data) {
        if (!function_exists('pods')) {
            return false;
        }
        
        // Get user's guest post
        $guest_post_id = get_user_meta($user_id, 'guest_post_id', true);
        
        if (!$guest_post_id) {
            // Create new guest post
            $guest_post_id = $this->create_guest_post_for_user($user_id);
        }
        
        if (!$guest_post_id) {
            return false;
        }
        
        // Map builder data to Pods fields
        $pods_data = array(
            'guest_first_name' => $data['hero_first_name'] ?? '',
            'guest_last_name' => $data['hero_last_name'] ?? '',
            'guest_full_name' => $data['hero_full_name'] ?? '',
            'guest_title' => $data['hero_title'] ?? '',
            'guest_organization' => $data['hero_organization'] ?? '',
            'guest_tagline' => $data['hero_tagline'] ?? '',
            'guest_biography' => $data['bio_text'] ?? '',
            'guest_topic_1' => $data['topic_1'] ?? '',
            'guest_topic_2' => $data['topic_2'] ?? '',
            'guest_topic_3' => $data['topic_3'] ?? '',
            'guest_topic_4' => $data['topic_4'] ?? '',
            'guest_topic_5' => $data['topic_5'] ?? '',
            'guest_facebook' => $data['social_facebook'] ?? '',
            'guest_twitter' => $data['social_twitter'] ?? '',
            'guest_instagram' => $data['social_instagram'] ?? '',
            'guest_linkedin' => $data['social_linkedin'] ?? '',
            'guest_youtube' => $data['social_youtube'] ?? '',
            'guest_pinterest' => $data['social_pinterest'] ?? '',
            'guest_tiktok' => $data['social_tiktok'] ?? ''
        );
        
        // Save to Pods
        $pod = pods('guests', $guest_post_id);
        return $pod->save($pods_data);
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
        
        // Check for agency tier first (highest priority)
        $agency_tags = array('white_label_access', 'agency_tier', 'unlimited_templates');
        if (array_intersect($agency_tags, $user_tags)) {
            return 'agency';
        }
        
        // Check for pro tier
        $pro_tags = array('premium_access', 'pro_tier', 'custom_templates', 'advanced_export');
        if (array_intersect($pro_tags, $user_tags)) {
            return 'pro';
        }
        
        // Default to free
        return 'free';
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
    
    private function get_formidable_entry_values($entry_id) {
        if (!class_exists('FrmEntryMeta')) {
            return array();
        }
        
        global $wpdb;
        $values = $wpdb->get_results($wpdb->prepare(
            "SELECT field_id, meta_value FROM {$wpdb->prefix}frm_item_metas WHERE item_id = %d",
            $entry_id
        ));
        
        $mapped_values = array();
        foreach ($values as $value) {
            $mapped_values[$value->field_id] = $value->meta_value;
        }
        
        return $mapped_values;
    }
    
    private function user_can_edit_entry($user_id, $entry) {
        // Check if user created this entry or has admin capabilities
        return $entry->user_id == $user_id || current_user_can('manage_options');
    }
    
    private function generate_session_id() {
        return wp_generate_password(32, false);
    }
    
    private function get_entry_key_by_id($entry_id) {
        global $wpdb;
        $entry = $wpdb->get_row($wpdb->prepare(
            "SELECT item_key FROM {$wpdb->prefix}frm_items WHERE id = %d",
            $entry_id
        ));
        
        return $entry ? $entry->item_key : false;
    }
    
    private function create_guest_post_for_user($user_id) {
        if (!function_exists('pods')) {
            return false;
        }
        
        // Create new guest post
        $post_id = wp_insert_post(array(
            'post_type' => 'guests',
            'post_status' => 'publish',
            'post_author' => $user_id,
            'post_title' => 'Guest Profile ' . $user_id
        ));
        
        if ($post_id) {
            update_user_meta($user_id, 'guest_post_id', $post_id);
        }
        
        return $post_id;
    }
    
    private function generate_pdf($data, $access_tier) {
        // This would integrate with a PDF generation library
        // For now, return a placeholder URL
        return home_url('/wp-content/uploads/media-kits/sample.pdf');
    }
    
    private function get_pods_data_for_user($user_id) {
        if (!function_exists('pods')) {
            return array();
        }
        
        $guest_post_id = get_user_meta($user_id, 'guest_post_id', true);
        if (!$guest_post_id) {
            return array();
        }
        
        $pod = pods('guests', $guest_post_id);
        if (!$pod) {
            return array();
        }
        
        // Return Pods data
        return array(
            'pods_bio' => $pod->field('guest_biography'),
            'pods_topics' => array(
                $pod->field('guest_topic_1'),
                $pod->field('guest_topic_2'),
                $pod->field('guest_topic_3'),
                $pod->field('guest_topic_4'),
                $pod->field('guest_topic_5')
            )
        );
    }
    
    private function create_pods_entry_for_user($user_id, $guest_data) {
        if (!function_exists('pods')) {
            return false;
        }
        
        // Create guest post and save Pods data
        $guest_post_id = $this->create_guest_post_for_user($user_id);
        
        if ($guest_post_id) {
            $pod = pods('guests', $guest_post_id);
            return $pod->save($guest_data);
        }
        
        return false;
    }
}

// Initialize the AJAX handlers
new Media_Kit_Builder_AJAX_Handlers();
