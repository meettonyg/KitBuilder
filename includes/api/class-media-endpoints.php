<?php
/**
 * Media Kit Builder - Media Endpoints
 * 
 * Handles REST API endpoints for media kits.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Media_Endpoints Class
 * 
 * Registers and handles REST API endpoints for media kits and related operations
 */
class MKB_Media_Endpoints {
    
    /**
     * API Controller
     * @var MKB_API_Controller
     */
    protected $api_controller;
    
    /**
     * Constructor
     * 
     * @param MKB_API_Controller $api_controller API Controller
     */
    public function __construct($api_controller) {
        $this->api_controller = $api_controller;
    }
    
    /**
     * Register routes
     */
    public function register_routes() {
        $namespace = $this->api_controller->get_namespace();
        
        // Media kit endpoints
        register_rest_route($namespace, '/kits', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_kits'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_kit'),
                'permission_callback' => array($this->api_controller, 'check_create_permission'),
                'args' => $this->get_media_kit_schema()
            )
        ));
        
        register_rest_route($namespace, '/kits/(?P<id>[a-zA-Z0-9_-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_kit'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_kit'),
                'permission_callback' => array($this->api_controller, 'check_edit_permission'),
                'args' => $this->get_media_kit_schema()
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_kit'),
                'permission_callback' => array($this->api_controller, 'check_delete_permission')
            )
        ));
        
        // Share/publish endpoints
        register_rest_route($namespace, '/kits/(?P<id>[a-zA-Z0-9_-]+)/share', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'share_kit'),
                'permission_callback' => array($this->api_controller, 'check_edit_permission')
            )
        ));
        
        // Export endpoints
        register_rest_route($namespace, '/export/(?P<format>[a-z]+)', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'export_kit'),
                'permission_callback' => function() {
                    return is_user_logged_in();
                },
                'args' => array(
                    'format' => array(
                        'required' => true,
                        'type' => 'string',
                        'enum' => array('pdf', 'image', 'html'),
                        'validate_callback' => function($param) {
                            return in_array($param, array('pdf', 'image', 'html'));
                        }
                    )
                )
            )
        ));
    }
    
    /**
     * Get all media kits
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_kits($request) {
        // If user is logged in, get their kits
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $kits = MKB_Media_Kit::get_all_for_user($user_id);
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $kits,
                    200,
                    __('Media kits retrieved successfully', 'media-kit-builder')
                ),
                200
            );
        } else {
            // For guests, check session and return any kits in the session
            $session_manager = media_kit_builder()->get_system('session');
            
            if (!$session_manager) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Session manager not available', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            $session_id = $session_manager->get_guest_session_id();
            
            if (empty($session_id)) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        200,
                        __('No guest session found', 'media-kit-builder')
                    ),
                    200
                );
            }
            
            $guest_kits = $session_manager->get_guest_media_kits($session_id);
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $guest_kits,
                    200,
                    __('Guest media kits retrieved successfully', 'media-kit-builder')
                ),
                200
            );
        }
    }
    
    /**
     * Get a single media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_kit($request) {
        $kit_id = $request['id'];
        
        // If user is logged in, get kit from database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $media_kit = MKB_Media_Kit::get_by_id($kit_id, $user_id);
            
            if (!$media_kit) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Media kit not found', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $media_kit->to_array(),
                    200,
                    __('Media kit retrieved successfully', 'media-kit-builder')
                ),
                200
            );
        } else {
            // For guests, check session
            $session_manager = media_kit_builder()->get_system('session');
            
            if (!$session_manager) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Session manager not available', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            $session_id = $session_manager->get_guest_session_id();
            
            if (empty($session_id)) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Guest session not found', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            $kit_data = $session_manager->get_guest_media_kit($session_id, $kit_id);
            
            if (!$kit_data) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Media kit not found in guest session', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $kit_data,
                    200,
                    __('Media kit retrieved successfully', 'media-kit-builder')
                ),
                200
            );
        }
    }
    
    /**
     * Create a new media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function create_kit($request) {
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('No data provided', 'media-kit-builder')
                ),
                400
            );
        }
        
        // If user is logged in, save to database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            // Create media kit object
            $media_kit = MKB_Media_Kit::from_array($data);
            
            // Validate media kit
            $validation = $media_kit->validate();
            if ($validation !== true) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        $validation,
                        400,
                        __('Media kit validation failed', 'media-kit-builder')
                    ),
                    400
                );
            }
            
            // Save media kit
            $entry_key = $media_kit->save($user_id);
            
            if (!$entry_key) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Failed to create media kit', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(
                        'id' => $entry_key,
                        'title' => $media_kit->get_title()
                    ),
                    201,
                    __('Media kit created successfully', 'media-kit-builder')
                ),
                201
            );
        } else {
            // For guests, save to session
            $session_manager = media_kit_builder()->get_system('session');
            
            if (!$session_manager) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Session manager not available', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            $session_id = $session_manager->get_guest_session_id();
            
            if (empty($session_id)) {
                // Create a new session
                $session_id = $session_manager->create_guest_session();
                
                if (empty($session_id)) {
                    return new WP_REST_Response(
                        $this->api_controller->format_response(
                            array(),
                            500,
                            __('Failed to create guest session', 'media-kit-builder')
                        ),
                        500
                    );
                }
            }
            
            // Create media kit object
            $media_kit = MKB_Media_Kit::from_array($data);
            
            // Save to session
            $result = $session_manager->save_guest_media_kit($session_id, $media_kit->to_array());
            
            if (!$result) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Failed to save media kit to guest session', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(
                        'id' => $media_kit->get_id(),
                        'title' => $media_kit->get_title()
                    ),
                    201,
                    __('Media kit saved to guest session', 'media-kit-builder')
                ),
                201
            );
        }
    }
    
    /**
     * Update an existing media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function update_kit($request) {
        $kit_id = $request['id'];
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('No data provided', 'media-kit-builder')
                ),
                400
            );
        }
        
        // If user is logged in, update in database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            // Get existing media kit
            $media_kit = MKB_Media_Kit::get_by_id($kit_id, $user_id);
            
            if (!$media_kit) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Media kit not found', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            // Update with new data (create a new object with merged data)
            $updated_media_kit = MKB_Media_Kit::from_array(array_merge(
                $media_kit->to_array(),
                $data
            ));
            
            // Validate media kit
            $validation = $updated_media_kit->validate();
            if ($validation !== true) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        $validation,
                        400,
                        __('Media kit validation failed', 'media-kit-builder')
                    ),
                    400
                );
            }
            
            // Save media kit
            $result = $updated_media_kit->save($user_id);
            
            if (!$result) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Failed to update media kit', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(
                        'id' => $result,
                        'title' => $updated_media_kit->get_title()
                    ),
                    200,
                    __('Media kit updated successfully', 'media-kit-builder')
                ),
                200
            );
        } else {
            // For guests, update in session
            $session_manager = media_kit_builder()->get_system('session');
            
            if (!$session_manager) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Session manager not available', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            $session_id = $session_manager->get_guest_session_id();
            
            if (empty($session_id)) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Guest session not found', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            // Get existing media kit from session
            $existing_data = $session_manager->get_guest_media_kit($session_id, $kit_id);
            
            if (!$existing_data) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Media kit not found in guest session', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            // Merge with new data
            $updated_data = array_merge($existing_data, $data);
            
            // Update media kit in session
            $result = $session_manager->update_guest_media_kit($session_id, $kit_id, $updated_data);
            
            if (!$result) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Failed to update media kit in guest session', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(
                        'id' => $kit_id,
                        'title' => $updated_data['title'] ?? $existing_data['title']
                    ),
                    200,
                    __('Media kit updated in guest session', 'media-kit-builder')
                ),
                200
            );
        }
    }
    
    /**
     * Delete a media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_kit($request) {
        $kit_id = $request['id'];
        
        // If user is logged in, delete from database
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            
            // Get existing media kit
            $media_kit = MKB_Media_Kit::get_by_id($kit_id, $user_id);
            
            if (!$media_kit) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        404,
                        __('Media kit not found', 'media-kit-builder')
                    ),
                    404
                );
            }
            
            // Delete media kit
            $result = $media_kit->delete($user_id);
            
            if (!$result) {
                return new WP_REST_Response(
                    $this->api_controller->format_response(
                        array(),
                        500,
                        __('Failed to delete media kit', 'media-kit-builder')
                    ),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    200,
                    __('Media kit deleted successfully', 'media-kit-builder')
                ),
                200
            );
        } else {
            // Guests shouldn't be able to delete, but we can implement session deletion if needed
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    401,
                    __('Unauthorized', 'media-kit-builder')
                ),
                401
            );
        }
    }
    
    /**
     * Share/publish a media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function share_kit($request) {
        $kit_id = $request['id'];
        $share_options = $request->get_json_params();
        
        // Only logged in users can share
        if (!is_user_logged_in()) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    401,
                    __('Unauthorized', 'media-kit-builder')
                ),
                401
            );
        }
        
        $user_id = get_current_user_id();
        
        // Get existing media kit
        $media_kit = MKB_Media_Kit::get_by_id($kit_id, $user_id);
        
        if (!$media_kit) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Media kit not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        // Get share manager
        $share_manager = media_kit_builder()->get_system('share');
        
        if (!$share_manager) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Share manager not available', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Generate share URL
        $share_url = $share_manager->generate_share_url($kit_id, $share_options);
        
        if (empty($share_url)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to generate share URL', 'media-kit-builder')
                ),
                500
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                array(
                    'share_url' => $share_url,
                    'expires' => isset($share_options['expires']) ? $share_options['expires'] : null
                ),
                200,
                __('Media kit shared successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Export a media kit
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function export_kit($request) {
        $format = $request['format'];
        $data = $request->get_json_params();
        
        if (empty($data)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('No data provided', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Check user access for this export format
        $can_access = $this->check_export_permission($format);
        
        if (!$can_access) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    403,
                    __('You do not have permission to use this export format', 'media-kit-builder')
                ),
                403
            );
        }
        
        // Get export engine
        $export_engine = media_kit_builder()->get_system('export');
        
        if (!$export_engine) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Export engine not available', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Export kit
        $result = $export_engine->export_kit($data, $format);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to export media kit', 'media-kit-builder')
                ),
                500
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                array(
                    'url' => $result['url'],
                    'filename' => $result['filename']
                ),
                200,
                __('Media kit exported successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Check if user has permission to use the export format
     * 
     * @param string $format Export format
     * @return bool
     */
    private function check_export_permission($format) {
        // Admin always has access
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check access tier if WP Fusion is available
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        
        if ($wpfusion_reader) {
            $access_tier = $wpfusion_reader->get_user_access_tier();
            
            // Define allowed export formats by tier
            $allowed_formats = array(
                'guest' => array('image'),
                'free' => array('image', 'pdf'),
                'pro' => array('image', 'pdf', 'html'),
                'agency' => array('image', 'pdf', 'html', 'wordpress')
            );
            
            if (isset($allowed_formats[$access_tier])) {
                return in_array($format, $allowed_formats[$access_tier]);
            }
        }
        
        // Default to basic formats for regular users
        return in_array($format, array('image', 'pdf'));
    }
    
    /**
     * Get media kit schema
     * 
     * @return array
     */
    private function get_media_kit_schema() {
        return array(
            'title' => array(
                'required' => true,
                'type' => 'string',
                'description' => __('Media kit title', 'media-kit-builder')
            ),
            'sections' => array(
                'required' => false,
                'type' => 'array',
                'description' => __('Media kit sections', 'media-kit-builder')
            ),
            'settings' => array(
                'required' => false,
                'type' => 'object',
                'description' => __('Media kit settings', 'media-kit-builder')
            ),
            'metadata' => array(
                'required' => false,
                'type' => 'object',
                'description' => __('Media kit metadata', 'media-kit-builder')
            )
        );
    }
}
