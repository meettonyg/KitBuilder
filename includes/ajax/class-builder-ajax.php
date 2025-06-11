<?php
/**
 * Builder Ajax Handler
 * 
 * Handles all AJAX requests for the Media Kit Builder v2
 */

namespace MediaKitBuilder\Ajax;

class BuilderAjax {
    
    private $session_manager;
    private $export_manager;
    private $template_manager;
    
    public function __construct() {
        $this->session_manager = new \MediaKitBuilder\Core\SessionManager();
        $this->export_manager = new \MediaKitBuilder\Core\ExportEngine();
        $this->template_manager = new \MediaKitBuilder\Core\TemplateManager();
        
        $this->register_ajax_handlers();
    }
    
    /**
     * Register AJAX handlers
     */
    private function register_ajax_handlers() {
        // Session management
        add_action('wp_ajax_mkb_sync_session', [$this, 'sync_session']);
        add_action('wp_ajax_nopriv_mkb_sync_session', [$this, 'sync_session']);
        add_action('wp_ajax_mkb_migrate_guest_session', [$this, 'migrate_guest_session']);
        
        // Media kit operations - LEGACY HANDLER
        add_action('wp_ajax_mkb_save_media_kit', [$this, 'save_media_kit']);
        add_action('wp_ajax_nopriv_mkb_save_media_kit', [$this, 'save_media_kit']);
        
        // Media kit operations - NEW HANDLERS (for frontend compatibility)
        add_action('wp_ajax_create_media_kit', [$this, 'create_media_kit']);
        add_action('wp_ajax_nopriv_create_media_kit', [$this, 'create_media_kit']);
        add_action('wp_ajax_update_media_kit', [$this, 'update_media_kit']);
        add_action('wp_ajax_nopriv_update_media_kit', [$this, 'update_media_kit']);
        
        // Media kit operations - NEW VERSION v2.0 HANDLERS
        add_action('wp_ajax_mkb_create_media_kit', [$this, 'create_media_kit']);
        add_action('wp_ajax_nopriv_mkb_create_media_kit', [$this, 'create_media_kit']);
        add_action('wp_ajax_mkb_update_media_kit', [$this, 'update_media_kit']);
        add_action('wp_ajax_nopriv_mkb_update_media_kit', [$this, 'update_media_kit']);
        
        add_action('wp_ajax_mkb_load_media_kit', [$this, 'load_media_kit']);
        add_action('wp_ajax_nopriv_mkb_load_media_kit', [$this, 'load_media_kit']);
        
        // Regular ajax endpoints for wordpress integration
        add_action('wp_ajax_load_media_kit', [$this, 'load_media_kit']);
        add_action('wp_ajax_nopriv_load_media_kit', [$this, 'load_media_kit']);
        
        // Export operations
        add_action('wp_ajax_mkb_export_pdf', [$this, 'export_pdf']);
        add_action('wp_ajax_mkb_export_image', [$this, 'export_image']);
        add_action('wp_ajax_mkb_generate_public_link', [$this, 'generate_public_link']);
        add_action('wp_ajax_mkb_generate_embed_code', [$this, 'generate_embed_code']);
        
        // Template operations
        add_action('wp_ajax_mkb_save_user_template', [$this, 'save_user_template']);
        add_action('wp_ajax_mkb_load_templates', [$this, 'load_templates']);
    }
    
    /**
     * Sync session data
     */
    public function sync_session() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $session_data = json_decode(stripslashes($_POST['session_data'] ?? '{}'), true);
        $is_guest = filter_var($_POST['is_guest'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        try {
            $result = $this->session_manager->sync_session($session_id, $session_data, $is_guest);
            
            // Get user data if logged in
            $user_data = null;
            if (is_user_logged_in()) {
                $user = wp_get_current_user();
                $user_data = [
                    'id' => $user->ID,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                    'isPro' => $this->check_user_is_pro($user->ID)
                ];
            }
            
            wp_send_json_success([
                'session_id' => $result['session_id'],
                'user_data' => $user_data
            ]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Migrate guest session to user account
     */
    public function migrate_guest_session() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(['message' => 'Not logged in']);
        }
        
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $media_kit_data = json_decode(stripslashes($_POST['media_kit_data'] ?? '{}'), true);
        $user_id = get_current_user_id();
        
        try {
            $result = $this->session_manager->migrate_guest_session($session_id, $user_id, $media_kit_data);
            
            wp_send_json_success([
                'media_kit_id' => $result['media_kit_id'],
                'user_data' => [
                    'id' => $user_id,
                    'name' => wp_get_current_user()->display_name,
                    'email' => wp_get_current_user()->user_email,
                    'isPro' => $this->check_user_is_pro($user_id)
                ]
            ]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Save media kit - UPDATED for Phase 2 Fix
     */
    public function save_media_kit() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        $theme = sanitize_text_field($_POST['theme'] ?? 'blue');
        $content = wp_kses_post($_POST['content'] ?? '');
        $components = json_decode(stripslashes($_POST['components'] ?? '[]'), true);
        $metadata = json_decode(stripslashes($_POST['metadata'] ?? '{}'), true);
        
        // Enhanced logging for debugging
        error_log('💾 Media Kit Save Request: ' . json_encode([
            'kit_id' => $kit_id,
            'is_logged_in' => is_user_logged_in(),
            'user_id' => get_current_user_id(),
            'has_session_id' => !empty($_POST['session_id']),
            'is_new_kit' => empty($kit_id)
        ]));
        
        // For guests, save to session
        if (!is_user_logged_in()) {
            $session_id = sanitize_text_field($_POST['session_id'] ?? '');
            
            if (empty($session_id)) {
                error_log('❌ Guest save failed: No session ID provided');
                wp_send_json_error(['message' => 'Session ID required for guest users']);
                return;
            }
            
            try {
                $save_data = [
                    'theme' => $theme,
                    'content' => $content,
                    'components' => $components,
                    'metadata' => $metadata,
                    'last_saved' => current_time('mysql')
                ];
                
                $result = $this->session_manager->save_guest_media_kit($session_id, $save_data);
                
                error_log('✅ Guest media kit saved successfully: ' . $result['kit_id']);
                wp_send_json_success(['kit_id' => $result['kit_id']]);
                
            } catch (\Exception $e) {
                error_log('❌ Guest save failed: ' . $e->getMessage());
                wp_send_json_error(['message' => $e->getMessage()]);
            }
            
            return;
        }
        
        // For logged-in users, save to database
        $user_id = get_current_user_id();
        
        try {
            // Determine if this is a create or update operation
            $is_new_kit = empty($kit_id);
            
            if ($is_new_kit) {
                // CREATE new media kit
                error_log('🆕 Creating new media kit for user: ' . $user_id);
                
                $post_data = [
                    'post_type' => 'media_kit',
                    'post_status' => 'publish',
                    'post_author' => $user_id,
                    'post_title' => $this->get_kit_title($components),
                    'post_content' => '', // Store main content in meta
                    'meta_input' => [
                        '_mkb_theme' => $theme,
                        '_mkb_content' => $content,
                        '_mkb_components' => wp_json_encode($components),
                        '_mkb_metadata' => wp_json_encode($metadata),
                        '_mkb_version' => '2.0',
                        '_mkb_created_at' => current_time('mysql'),
                        '_mkb_updated_at' => current_time('mysql')
                    ]
                ];
                
                $kit_id = wp_insert_post($post_data);
                
                if (is_wp_error($kit_id)) {
                    error_log('❌ Failed to create new media kit: ' . $kit_id->get_error_message());
                    throw new \Exception('Failed to create media kit: ' . $kit_id->get_error_message());
                }
                
                error_log('✅ New media kit created successfully: ' . $kit_id);
                
            } else {
                // UPDATE existing media kit
                error_log('📝 Updating existing media kit: ' . $kit_id);
                
                // Verify the post exists and user has permission
                $existing_post = get_post(intval($kit_id));
                
                if (!$existing_post || $existing_post->post_type !== 'media_kit') {
                    error_log('❌ Media kit not found: ' . $kit_id);
                    throw new \Exception('Media kit not found');
                }
                
                if (!current_user_can('edit_post', $existing_post->ID)) {
                    error_log('❌ Permission denied for media kit: ' . $kit_id);
                    throw new \Exception('Permission denied');
                }
                
                // Update the post
                $post_data = [
                    'ID' => intval($kit_id),
                    'post_title' => $this->get_kit_title($components),
                    'meta_input' => [
                        '_mkb_theme' => $theme,
                        '_mkb_content' => $content,
                        '_mkb_components' => wp_json_encode($components),
                        '_mkb_metadata' => wp_json_encode($metadata),
                        '_mkb_version' => '2.0',
                        '_mkb_updated_at' => current_time('mysql')
                    ]
                ];
                
                $result = wp_update_post($post_data);
                
                if (is_wp_error($result)) {
                    error_log('❌ Failed to update media kit: ' . $result->get_error_message());
                    throw new \Exception('Failed to update media kit: ' . $result->get_error_message());
                }
                
                error_log('✅ Media kit updated successfully: ' . $kit_id);
            }
            
            // Return success with kit ID
            wp_send_json_success([
                'kit_id' => $kit_id,
                'message' => $is_new_kit ? 'Media kit created successfully' : 'Media kit updated successfully',
                'is_new' => $is_new_kit
            ]);
            
        } catch (\Exception $e) {
            error_log('💥 Media kit save error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Create new media kit - REQUIRED for new save system
     */
    public function create_media_kit() {
        // Allow both nonce types for compatibility
        if (isset($_POST['nonce'])) {
            if (strpos($_POST['nonce'], 'mkb_nonce') !== false) {
                check_ajax_referer('mkb_nonce', 'nonce');
            } else {
                check_ajax_referer('media_kit_builder_nonce', 'nonce');
            }
        } else {
            // For testing only - would remove in production
            error_log('⚠️ WARNING: No nonce provided in create_media_kit');
        }
        
        error_log('🆕 CREATE MEDIA KIT endpoint called');
        
        // Get data from request - support both formats
        if (isset($_POST['kit_data'])) {
            // New format (single JSON string)
            $user_id = intval($_POST['user_id'] ?? get_current_user_id());
            $access_tier = sanitize_text_field($_POST['access_tier'] ?? 'guest');
            $kit_data = $_POST['kit_data'] ?? '';
            $session_id = sanitize_text_field($_POST['session_id'] ?? '');
            
            error_log('🆕 CREATE request (new format): user_id=' . $user_id . ', tier=' . $access_tier);
            
            // Validate data
            if (empty($kit_data)) {
                wp_send_json_error(['message' => 'No data provided']);
                return;
            }
            
            $parsed_data = json_decode($kit_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error(['message' => 'Invalid JSON data: ' . json_last_error_msg()]);
                return;
            }
            
            error_log('📊 Parsed data: ' . json_encode([
                'has_theme' => isset($parsed_data['theme']),
                'has_components' => isset($parsed_data['components']),
                'has_sections' => isset($parsed_data['sections']),
            ]));
        } else {
            // Split parameters format 
            $user_id = intval($_POST['user_id'] ?? get_current_user_id());
            $access_tier = sanitize_text_field($_POST['access_tier'] ?? 'guest');
            $session_id = sanitize_text_field($_POST['session_id'] ?? '');
            
            // Enhanced logging for debugging
            error_log('🆕 CREATE parameters: ' . json_encode([
                'user_id' => $user_id,
                'access_tier' => $access_tier,
                'session_id' => !empty($session_id) ? 'present' : 'missing',
                'has_theme' => isset($_POST['theme']),
                'has_content' => isset($_POST['content']),
                'has_components' => isset($_POST['components']),
                'has_metadata' => isset($_POST['metadata']),
            ]));
            
            $theme = isset($_POST['theme']) ? json_decode(stripslashes($_POST['theme']), true) : [];
            $content = isset($_POST['content']) ? json_decode(stripslashes($_POST['content']), true) : [];
            $components = isset($_POST['components']) ? json_decode(stripslashes($_POST['components']), true) : [];
            $metadata = isset($_POST['metadata']) ? json_decode(stripslashes($_POST['metadata']), true) : [];
            
            // Construct data structure
            $parsed_data = [
                'theme' => $theme,
                'content' => $content,
                'components' => $components,
                'metadata' => $metadata,
                'version' => '2.0'
            ];
        }
        
        try {
            // For guests
            if (!is_user_logged_in() || $access_tier === 'guest') {
                if (empty($session_id)) {
                    $session_id = 'guest_' . time() . '_' . wp_generate_password(6, false);
                }
                
                $result = $this->session_manager->save_guest_media_kit($session_id, $parsed_data);
                
                wp_send_json_success([
                    'kit_id' => $result['kit_id'],
                    'entry_key' => $result['kit_id'], // For compatibility
                    'message' => 'Guest media kit created successfully',
                    'session_id' => $session_id
                ]);
                return;
            }
            
            // For logged-in users - create WordPress post
            $post_data = [
                'post_type' => 'media_kit',
                'post_status' => 'publish',
                'post_author' => $user_id,
                'post_title' => $this->get_kit_title($parsed_data['components'] ?? []),
                'post_content' => $parsed_data['content'] ?? '',
                'meta_input' => [
                    '_mkb_version' => '2.0',
                    '_mkb_theme' => wp_json_encode($parsed_data['theme'] ?? 'blue'),
                    '_mkb_components' => wp_json_encode($parsed_data['components'] ?? []),
                    '_mkb_sections' => wp_json_encode($parsed_data['sections'] ?? []),
                    '_mkb_metadata' => wp_json_encode($parsed_data['metadata'] ?? []),
                    '_mkb_created_at' => current_time('mysql'),
                    '_mkb_updated_at' => current_time('mysql')
                ]
            ];
            
            $post_id = wp_insert_post($post_data);
            
            if (is_wp_error($post_id)) {
                throw new \Exception('Failed to create post: ' . $post_id->get_error_message());
            }
            
            // Generate a unique entry key for compatibility
            $entry_key = 'mk_' . time() . '_' . wp_generate_password(8, false);
            update_post_meta($post_id, '_mkb_entry_key', $entry_key);
            
            error_log('✅ Created media kit with ID: ' . $post_id . ', entry_key: ' . $entry_key);
            
            wp_send_json_success([
                'kit_id' => $post_id,
                'entry_key' => $entry_key, // Return the unique entry key
                'message' => 'Media kit created successfully'
            ]);
            
        } catch (\Exception $e) {
            error_log('❌ Create failed: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Update existing media kit - REQUIRED for new save system
     */
    public function update_media_kit() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        // Handle both data formats
        if (isset($_POST['kit_data'])) {
            // New format (single JSON string)
            $entry_key = sanitize_text_field($_POST['entry_key'] ?? '');
            $kit_id = sanitize_text_field($_POST['kit_id'] ?? $entry_key);
            $kit_data = $_POST['kit_data'] ?? '';
            $session_id = sanitize_text_field($_POST['session_id'] ?? '');
            
            error_log('📝 UPDATE request (new format): entry_key=' . $entry_key);
            
            if (empty($entry_key) && empty($kit_id)) {
                wp_send_json_error('Missing kit ID or entry key');
                return;
            }
            
            // Use either entry_key or kit_id
            $identifier = !empty($entry_key) ? $entry_key : $kit_id;
            
            if (empty($kit_data)) {
                wp_send_json_error('Missing data');
                return;
            }
            
            $parsed_data = json_decode($kit_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error('Invalid JSON data: ' . json_last_error_msg());
                return;
            }
        } else {
            // Split parameters format
            $entry_key = sanitize_text_field($_POST['entry_key'] ?? '');
            $kit_id = sanitize_text_field($_POST['kit_id'] ?? $entry_key);
            $session_id = sanitize_text_field($_POST['session_id'] ?? '');
            $theme = isset($_POST['theme']) ? json_decode(stripslashes($_POST['theme']), true) : [];
            $content = isset($_POST['content']) ? json_decode(stripslashes($_POST['content']), true) : [];
            $components = isset($_POST['components']) ? json_decode(stripslashes($_POST['components']), true) : [];
            $metadata = isset($_POST['metadata']) ? json_decode(stripslashes($_POST['metadata']), true) : [];
            
            error_log('📝 UPDATE request (split format): entry_key=' . $entry_key . ' or kit_id=' . $kit_id);
            
            // Use either entry_key or kit_id
            $identifier = !empty($entry_key) ? $entry_key : $kit_id;
            
            if (empty($identifier)) {
                wp_send_json_error('Missing kit ID or entry key');
                return;
            }
            
            // Construct data structure
            $parsed_data = [
                'theme' => $theme,
                'content' => $content,
                'components' => $components,
                'metadata' => $metadata,
                'version' => '2.0'
            ];
        }
        
        try {
            // Handle guest updates
            if (strpos($identifier, 'guest_') === 0) {
                if (empty($session_id)) {
                    $session_id = $identifier;
                }
                
                $result = $this->session_manager->save_guest_media_kit($session_id, $parsed_data);
                
                wp_send_json_success([
                    'kit_id' => $identifier,
                    'entry_key' => $identifier, // For compatibility 
                    'message' => 'Guest media kit updated successfully'
                ]);
                return;
            }
            
            // Handle user post updates
            $post_id = intval($identifier);
            $existing_post = get_post($post_id);
            
            if (!$existing_post || $existing_post->post_type !== 'media_kit') {
                throw new \Exception('Media kit not found');
            }
            
            if (!current_user_can('edit_post', $post_id)) {
                throw new \Exception('Permission denied');
            }
            
            $update_data = [
                'ID' => $post_id,
                'post_title' => $this->get_kit_title($parsed_data['components'] ?? []),
                'post_content' => $parsed_data['content'] ?? '',
                'meta_input' => [
                    '_mkb_theme' => wp_json_encode($parsed_data['theme'] ?? 'blue'),
                    '_mkb_components' => wp_json_encode($parsed_data['components'] ?? []),
                    '_mkb_sections' => wp_json_encode($parsed_data['sections'] ?? []),
                    '_mkb_metadata' => wp_json_encode($parsed_data['metadata'] ?? []),
                    '_mkb_updated_at' => current_time('mysql')
                ]
            ];
            
            $result = wp_update_post($update_data);
            
            if (is_wp_error($result)) {
                throw new \Exception('Failed to update: ' . $result->get_error_message());
            }
            
            error_log('✅ Updated media kit ID: ' . $post_id);
            
            wp_send_json_success([
                'kit_id' => $post_id,
                'entry_key' => $post_id, // For compatibility
                'message' => 'Media kit updated successfully'
            ]);
            
        } catch (\Exception $e) {
            error_log('❌ Update failed: ' . $e->getMessage());
            wp_send_json_error($e->getMessage());
        }
    }
    
    /**
     * Load media kit
     */
    public function load_media_kit() {
        // Allow both nonce types
        if (isset($_POST['nonce'])) {
            if (strpos($_POST['nonce'], 'mkb_nonce') !== false) {
                check_ajax_referer('mkb_nonce', 'nonce');
            } else {
                check_ajax_referer('media_kit_builder_nonce', 'nonce');
            }
        }
        
        error_log('📥 LOAD MEDIA KIT endpoint called');
        
        // Check if this is a new media kit request
        if (isset($_POST['is_new']) && $_POST['is_new'] === 'true') {
            error_log('🆕 Loading NEW media kit template');
            
            // Return empty data structure for new kit
            wp_send_json_success([
                'message' => 'New media kit initialized',
                'is_new' => true,
                'kit_data' => json_encode([
                    'theme' => ['id' => 'modern-blue'],
                    'sections' => [],
                    'components' => []
                ])
            ]);
            return;
        }
        
        // For existing kits, get kit_id or entry_key
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        $entry_key = sanitize_text_field($_POST['entry_key'] ?? $kit_id);
        
        if (!$entry_key && !$kit_id) {
            error_log('❌ LOAD ERROR: No kit ID or entry key provided');
            wp_send_json_error(['message' => 'Missing kit ID or entry key']);
            return;
        }
        
        // Use either value provided
        $identifier = !empty($entry_key) ? $entry_key : $kit_id;
        error_log('🔍 Loading media kit with identifier: ' . $identifier);
        
        try {
            // Check if it's a guest kit
            if (strpos($identifier, 'guest_') === 0) {
                $session_id = sanitize_text_field($_POST['session_id'] ?? '');
                $data = $this->session_manager->load_guest_media_kit($session_id, $identifier);
                error_log('📂 Loaded guest media kit: ' . $identifier);
            } else {
                // If the identifier is a URL slug not a numeric ID, check if it's a new kit
                if (!is_numeric($identifier) && strpos($identifier, 'mk_') !== 0) {
                    error_log('🆕 URL slug detected without kit data - initializing new kit');
                    wp_send_json_success([
                        'message' => 'New media kit initialized with custom slug',
                        'is_new' => true,
                        'kit_data' => json_encode([
                            'theme' => ['id' => 'modern-blue'],
                            'sections' => [],
                            'components' => []
                        ])
                    ]);
                    return;
                }
                
                // Load from database
                $post = get_post(intval($identifier));
                
                if (!$post || $post->post_type !== 'media_kit') {
                    error_log('❌ Media kit not found: ' . $identifier);
                    
                    // If no kit found but it appears to be a new request, handle as new
                    if (strpos($identifier, 'huwcy') !== false || 
                        strpos($identifier, 'new') !== false) {
                        error_log('🆕 Handling as new kit with custom slug');
                        wp_send_json_success([
                            'message' => 'New media kit initialized with custom slug',
                            'is_new' => true,
                            'kit_data' => json_encode([
                                'theme' => ['id' => 'modern-blue'],
                                'sections' => [],
                                'components' => []
                            ])
                        ]);
                        return;
                    }
                    
                    throw new \Exception('Media kit not found');
                }
                
                // Check permissions
                if (!current_user_can('edit_post', $post->ID)) {
                    throw new \Exception('Permission denied');
                }
                
                $data = [
                    'theme' => get_post_meta($post->ID, '_mkb_theme', true),
                    'content' => get_post_meta($post->ID, '_mkb_content', true),
                    'components' => get_post_meta($post->ID, '_mkb_components', true),
                    'metadata' => get_post_meta($post->ID, '_mkb_metadata', true)
                ];
                
                error_log('📂 Loaded media kit from database: ' . $post->ID);
            }
            
            wp_send_json_success($data);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    // Duplicate update_media_kit method removed - using the implementation above
    
    /**
     * Export to PDF
     */
    public function export_pdf() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        $content = wp_kses_post($_POST['content'] ?? '');
        $styles = json_decode(stripslashes($_POST['styles'] ?? '{}'), true);
        $options = json_decode(stripslashes($_POST['options'] ?? '{}'), true);
        
        try {
            $pdf_url = $this->export_manager->generate_pdf($kit_id, $content, $styles, $options);
            
            wp_send_json_success(['url' => $pdf_url]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Export to image
     */
    public function export_image() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        $content = wp_kses_post($_POST['content'] ?? '');
        $styles = json_decode(stripslashes($_POST['styles'] ?? '{}'), true);
        $options = json_decode(stripslashes($_POST['options'] ?? '{}'), true);
        
        try {
            $image_url = $this->export_manager->generate_image($kit_id, $content, $styles, $options);
            
            wp_send_json_success(['url' => $image_url]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Generate public link
     */
    public function generate_public_link() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        
        try {
            // Generate public hash
            $hash = wp_generate_password(12, false);
            
            // Save hash to kit
            if (strpos($kit_id, 'guest_') === 0) {
                // Guest kit
                $this->session_manager->set_guest_kit_public_hash($kit_id, $hash);
            } else {
                // User kit
                update_post_meta(intval($kit_id), '_mkb_public_hash', $hash);
            }
            
            // Generate URL
            $url = home_url('/media-kit/view/' . $hash);
            
            wp_send_json_success(['url' => $url]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Generate embed code
     */
    public function generate_embed_code() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $kit_id = sanitize_text_field($_POST['kit_id'] ?? '');
        $options = json_decode(stripslashes($_POST['options'] ?? '{}'), true);
        
        try {
            // Get or generate public hash
            $hash = $this->get_or_create_public_hash($kit_id);
            
            // Generate embed URL
            $embed_url = home_url('/media-kit/embed/' . $hash);
            
            // Generate embed code
            $width = esc_attr($options['width'] ?? '100%');
            $height = esc_attr($options['height'] ?? '600px');
            
            $embed_code = sprintf(
                '<iframe src="%s" width="%s" height="%s" frameborder="0" style="border: none; max-width: 100%%;" allowfullscreen></iframe>',
                esc_url($embed_url),
                $width,
                $height
            );
            
            if ($options['responsive'] ?? false) {
                $embed_code = '<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">' .
                             '<iframe src="' . esc_url($embed_url) . '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>' .
                             '</div>';
            }
            
            wp_send_json_success(['code' => $embed_code]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Save user template
     */
    public function save_user_template() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(['message' => 'Must be logged in to save templates']);
        }
        
        $name = sanitize_text_field($_POST['name'] ?? '');
        $structure = json_decode(stripslashes($_POST['structure'] ?? '[]'), true);
        $theme = sanitize_text_field($_POST['theme'] ?? 'blue');
        $custom_styles = json_decode(stripslashes($_POST['customStyles'] ?? '{}'), true);
        
        try {
            $template_id = $this->template_manager->save_user_template(
                get_current_user_id(),
                $name,
                $structure,
                $theme,
                $custom_styles
            );
            
            wp_send_json_success(['template_id' => $template_id]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Load templates
     */
    public function load_templates() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        try {
            $templates = $this->template_manager->get_all_templates();
            
            // Add user templates if logged in
            if (is_user_logged_in()) {
                $user_templates = $this->template_manager->get_user_templates(get_current_user_id());
                $templates['user'] = $user_templates;
            }
            
            wp_send_json_success(['templates' => $templates]);
            
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Check if user has pro access
     */
    private function check_user_is_pro($user_id) {
        // Check WP Fusion tags
        if (function_exists('wp_fusion')) {
            $tags = wp_fusion()->user->get_tags($user_id);
            $pro_tags = ['guestify_pro', 'guestify_agency', 'guestify_lifetime'];
            
            return !empty(array_intersect($tags, $pro_tags));
        }
        
        // Fallback to user meta
        return get_user_meta($user_id, '_mkb_is_pro', true) === 'yes';
    }
    
    /**
     * Get kit title from components - ENHANCED for Phase 2 with new data format support
     */
    private function get_kit_title($components) {
        // Try to find hero component name in various formats
        if (is_array($components)) {
            foreach ($components as $component_id => $component) {
                if (is_array($component)) {
                    // New v2.0 format
                    if (($component['type'] ?? '') === 'hero') {
                        $content = $component['content'] ?? [];
                        
                        // Check various name fields
                        $name_fields = ['name', 'hero_name', 'full_name', 'displayName', 'title'];
                        foreach ($name_fields as $field) {
                            if (!empty($content[$field])) {
                                return sanitize_text_field($content[$field]) . ' - Media Kit';
                            }
                        }
                    }
                    
                    // Legacy format
                    if (($component['type'] ?? '') === 'hero' && !empty($component['data']['hero_name'])) {
                        return sanitize_text_field($component['data']['hero_name']) . ' - Media Kit';
                    }
                    
                    // Check for any name-like field in the component
                    if (is_array($component['content'] ?? [])) {
                        foreach ($component['content'] as $key => $value) {
                            if (strpos(strtolower($key), 'name') !== false && !empty($value) && is_string($value)) {
                                return sanitize_text_field($value) . ' - Media Kit';
                            }
                        }
                    }
                }
            }
        }
        
        // Try to extract from parsed data (if it's available in the global context)
        if (isset($_POST['kit_data'])) {
            $kit_data = json_decode($_POST['kit_data'], true);
            
            // Check legacy data
            if (isset($kit_data['legacyData']['hero_full_name']) && !empty($kit_data['legacyData']['hero_full_name'])) {
                return sanitize_text_field($kit_data['legacyData']['hero_full_name']) . ' - Media Kit';
            }
            
            // Check metadata
            if (isset($kit_data['metadata']['title']) && !empty($kit_data['metadata']['title'])) {
                return sanitize_text_field($kit_data['metadata']['title']);
            }
        }
        
        // Fallback: try to extract from metadata POST parameter
        if (isset($_POST['metadata'])) {
            $metadata = json_decode(stripslashes($_POST['metadata']), true);
            if (isset($metadata['legacyData']['hero_full_name']) && !empty($metadata['legacyData']['hero_full_name'])) {
                return sanitize_text_field($metadata['legacyData']['hero_full_name']) . ' - Media Kit';
            }
        }
        
        // Final fallback
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            return $user->display_name . ' - Media Kit';
        }
        
        return 'Media Kit - ' . date('Y-m-d');
    }
    
    /**
     * Get or create public hash for kit
     */
    // Duplicate create_media_kit method removed - using the implementation above
    
    private function get_or_create_public_hash($kit_id) {
        $hash = '';
        
        if (strpos($kit_id, 'guest_') === 0) {
            // Guest kit
            $hash = $this->session_manager->get_guest_kit_public_hash($kit_id);
        } else {
            // User kit
            $hash = get_post_meta(intval($kit_id), '_mkb_public_hash', true);
        }
        
        if (!$hash) {
            $hash = wp_generate_password(12, false);
            
            if (strpos($kit_id, 'guest_') === 0) {
                $this->session_manager->set_guest_kit_public_hash($kit_id, $hash);
            } else {
                update_post_meta(intval($kit_id), '_mkb_public_hash', $hash);
            }
        }
        
        return $hash;
    }
}

// Initialize
new BuilderAjax();