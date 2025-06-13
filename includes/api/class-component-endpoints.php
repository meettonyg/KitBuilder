<?php
/**
 * Media Kit Builder - Component Endpoints
 * 
 * Handles REST API endpoints for components.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Component_Endpoints Class
 * 
 * Registers and handles REST API endpoints for components
 */
class MKB_Component_Endpoints {
    
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
        
        register_rest_route($namespace, '/components', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_components'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_component'),
                'permission_callback' => array($this->api_controller, 'check_create_permission'),
                'args' => $this->get_component_schema()
            )
        ));
        
        register_rest_route($namespace, '/components/(?P<id>[a-zA-Z0-9-_]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_component'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_component'),
                'permission_callback' => array($this->api_controller, 'check_edit_permission'),
                'args' => $this->get_component_schema()
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_component'),
                'permission_callback' => array($this->api_controller, 'check_delete_permission')
            )
        ));
        
        register_rest_route($namespace, '/components/types', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_component_types'),
                'permission_callback' => array($this->api_controller, 'check_read_permission')
            )
        ));
        
        register_rest_route($namespace, '/components/validate', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'validate_component'),
                'permission_callback' => array($this->api_controller, 'check_read_permission'),
                'args' => $this->get_component_schema()
            )
        ));
    }
    
    /**
     * Get components
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_components($request) {
        $media_kit_id = $request->get_param('media_kit_id');
        
        if (empty($media_kit_id)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Media kit ID is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Get components for media kit
        $components = MKB_Component::get_all_for_media_kit($media_kit_id);
        
        // Convert to array
        $component_data = array();
        foreach ($components as $component) {
            $component_data[] = $component->to_array();
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $component_data,
                200,
                __('Components retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get component
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_component($request) {
        $component_id = $request['id'];
        $media_kit_id = $request->get_param('media_kit_id');
        
        if (empty($media_kit_id)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Media kit ID is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Get component
        $component = MKB_Component::get_by_id($component_id, $media_kit_id);
        
        if (!$component) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Component not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $component->to_array(),
                200,
                __('Component retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Create component
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function create_component($request) {
        $data = $request->get_params();
        $media_kit_id = $request->get_param('media_kit_id');
        
        if (empty($media_kit_id)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Media kit ID is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Create component
        $component = MKB_Component::from_array($data);
        
        // Validate component
        $validation = $component->validate();
        if ($validation !== true) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $validation,
                    400,
                    __('Component validation failed', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Save component
        $result = $component->save($media_kit_id);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to create component', 'media-kit-builder')
                ),
                500
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $component->to_array(),
                201,
                __('Component created successfully', 'media-kit-builder')
            ),
            201
        );
    }
    
    /**
     * Update component
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function update_component($request) {
        $component_id = $request['id'];
        $data = $request->get_params();
        $media_kit_id = $request->get_param('media_kit_id');
        
        if (empty($media_kit_id)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Media kit ID is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Get existing component
        $component = MKB_Component::get_by_id($component_id, $media_kit_id);
        
        if (!$component) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Component not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        // Update component with new data
        if (isset($data['content'])) {
            $component->set_content($data['content']);
        }
        
        if (isset($data['styles'])) {
            $component->set_styles($data['styles']);
        }
        
        if (isset($data['metadata'])) {
            $component->set_metadata($data['metadata']);
        }
        
        // Validate component
        $validation = $component->validate();
        if ($validation !== true) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $validation,
                    400,
                    __('Component validation failed', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Save component
        $result = $component->save($media_kit_id);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to update component', 'media-kit-builder')
                ),
                500
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $component->to_array(),
                200,
                __('Component updated successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Delete component
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function delete_component($request) {
        $component_id = $request['id'];
        $media_kit_id = $request->get_param('media_kit_id');
        
        if (empty($media_kit_id)) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    400,
                    __('Media kit ID is required', 'media-kit-builder')
                ),
                400
            );
        }
        
        // Get component
        $component = MKB_Component::get_by_id($component_id, $media_kit_id);
        
        if (!$component) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    404,
                    __('Component not found', 'media-kit-builder')
                ),
                404
            );
        }
        
        // Delete component
        $result = $component->delete($media_kit_id);
        
        if (!$result) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Failed to delete component', 'media-kit-builder')
                ),
                500
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                array(),
                200,
                __('Component deleted successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get component types
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_component_types($request) {
        // Get component registry
        $component_registry = media_kit_builder()->get_system('components');
        
        if (!$component_registry) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    array(),
                    500,
                    __('Component registry not available', 'media-kit-builder')
                ),
                500
            );
        }
        
        // Get component types
        $types = $component_registry->get_components();
        
        // Filter types based on user access
        $filtered_types = array();
        
        foreach ($types as $id => $type) {
            // Add can_access property
            if (isset($type['premium']) && $type['premium']) {
                $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
                $type['can_access'] = $wpfusion_reader ? $wpfusion_reader->can_access_feature('premium_components') : false;
            } else {
                $type['can_access'] = true;
            }
            
            $filtered_types[$id] = $type;
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                $filtered_types,
                200,
                __('Component types retrieved successfully', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Validate component
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function validate_component($request) {
        $data = $request->get_params();
        
        // Create component
        $component = MKB_Component::from_array($data);
        
        // Validate component
        $validation = $component->validate();
        
        if ($validation !== true) {
            return new WP_REST_Response(
                $this->api_controller->format_response(
                    $validation,
                    400,
                    __('Component validation failed', 'media-kit-builder')
                ),
                400
            );
        }
        
        return new WP_REST_Response(
            $this->api_controller->format_response(
                array('valid' => true),
                200,
                __('Component validation passed', 'media-kit-builder')
            ),
            200
        );
    }
    
    /**
     * Get component schema
     * 
     * @return array
     */
    public function get_component_schema() {
        return array(
            'type' => array(
                'required' => true,
                'type' => 'string',
                'description' => __('Component type', 'media-kit-builder')
            ),
            'content' => array(
                'required' => true,
                'type' => 'object',
                'description' => __('Component content', 'media-kit-builder')
            ),
            'styles' => array(
                'required' => false,
                'type' => 'object',
                'description' => __('Component styles', 'media-kit-builder')
            ),
            'metadata' => array(
                'required' => false,
                'type' => 'object',
                'description' => __('Component metadata', 'media-kit-builder')
            ),
            'media_kit_id' => array(
                'required' => true,
                'type' => 'string',
                'description' => __('Media kit ID', 'media-kit-builder')
            )
        );
    }
}
