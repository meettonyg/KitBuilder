<?php
/**
 * Media Kit Builder - Component Model
 * 
 * Represents a component in the media kit builder.
 * This model aligns with the JavaScript component structure.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Component Class
 * 
 * Component data model that mirrors the JavaScript component structure
 */
class MKB_Component {
    /**
     * Component ID
     * @var string
     */
    protected $id;
    
    /**
     * Component type
     * @var string
     */
    protected $type;
    
    /**
     * Component content
     * @var array
     */
    protected $content;
    
    /**
     * Component styles
     * @var array
     */
    protected $styles;
    
    /**
     * Component metadata
     * @var array
     */
    protected $metadata;
    
    /**
     * Component constructor
     * 
     * @param string $id Component ID
     * @param string $type Component type
     * @param array $content Component content
     * @param array $styles Component styles
     * @param array $metadata Component metadata
     */
    public function __construct($id = '', $type = '', $content = array(), $styles = array(), $metadata = array()) {
        $this->id = !empty($id) ? sanitize_text_field($id) : 'component_' . wp_generate_uuid4();
        $this->type = sanitize_text_field($type);
        $this->content = $this->sanitize_content($content);
        $this->styles = $this->sanitize_styles($styles);
        
        $default_metadata = array(
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            'version' => '1.0.0'
        );
        
        $this->metadata = wp_parse_args($metadata, $default_metadata);
    }
    
    /**
     * Create from array
     * 
     * @param array $data Component data
     * @return MKB_Component Component instance
     */
    public static function from_array($data) {
        return new self(
            isset($data['id']) ? $data['id'] : '',
            isset($data['type']) ? $data['type'] : '',
            isset($data['content']) ? $data['content'] : array(),
            isset($data['styles']) ? $data['styles'] : array(),
            isset($data['metadata']) ? $data['metadata'] : array()
        );
    }
    
    /**
     * Convert to array
     * 
     * @return array Component data as array
     */
    public function to_array() {
        return array(
            'id' => $this->id,
            'type' => $this->type,
            'content' => $this->content,
            'styles' => $this->styles,
            'metadata' => $this->metadata
        );
    }
    
    /**
     * Convert to JSON
     * 
     * @return string Component data as JSON
     */
    public function to_json() {
        return wp_json_encode($this->to_array());
    }
    
    /**
     * Validate component data
     * 
     * @return bool|WP_Error True if valid, WP_Error otherwise
     */
    public function validate() {
        $errors = array();
        
        if (empty($this->id)) {
            $errors[] = new WP_Error('missing_id', __('Component ID is required', 'media-kit-builder'));
        }
        
        if (empty($this->type)) {
            $errors[] = new WP_Error('missing_type', __('Component type is required', 'media-kit-builder'));
        }
        
        // Get component registry
        $component_registry = media_kit_builder()->get_system('components');
        
        // Check if component type exists
        if ($component_registry && !$component_registry->get_component($this->type)) {
            $errors[] = new WP_Error('invalid_type', sprintf(__('Invalid component type: %s', 'media-kit-builder'), $this->type));
        }
        
        // Validate content based on component type
        if ($component_registry) {
            $component_definition = $component_registry->get_component($this->type);
            
            if ($component_definition && isset($component_definition['fields'])) {
                foreach ($component_definition['fields'] as $field_id => $field) {
                    // Check required fields
                    if (isset($field['required']) && $field['required'] && 
                        (!isset($this->content[$field_id]) || empty($this->content[$field_id]))) {
                        $errors[] = new WP_Error(
                            'missing_required_field',
                            sprintf(__('Required field missing: %s', 'media-kit-builder'), $field['label'])
                        );
                    }
                }
            }
        }
        
        if (!empty($errors)) {
            return $errors;
        }
        
        return true;
    }
    
    /**
     * Save component to database
     * 
     * @param int $media_kit_id Media kit ID
     * @return bool|int False on failure, component ID on success
     */
    public function save($media_kit_id = 0) {
        global $wpdb;
        
        // Validate before saving
        $validation = $this->validate();
        if ($validation !== true) {
            return false;
        }
        
        $table_name = $wpdb->prefix . 'mkb_components';
        
        // Check if table exists, create if it doesn't
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            $this->create_components_table();
        }
        
        // Update metadata
        $this->metadata['updated_at'] = current_time('mysql');
        
        // Prepare data for insertion
        $data = array(
            'component_id' => $this->id,
            'media_kit_id' => $media_kit_id,
            'type' => $this->type,
            'content' => wp_json_encode($this->content),
            'styles' => wp_json_encode($this->styles),
            'metadata' => wp_json_encode($this->metadata),
            'created' => $this->metadata['created_at'],
            'modified' => $this->metadata['updated_at']
        );
        
        // Check if component already exists
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table_name WHERE component_id = %s AND media_kit_id = %d",
                $this->id,
                $media_kit_id
            )
        );
        
        if ($existing) {
            // Update existing component
            $result = $wpdb->update(
                $table_name,
                $data,
                array('id' => $existing),
                array('%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s'),
                array('%d')
            );
            
            if ($result !== false) {
                return $existing;
            }
        } else {
            // Insert new component
            $result = $wpdb->insert(
                $table_name,
                $data,
                array('%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s')
            );
            
            if ($result) {
                return $wpdb->insert_id;
            }
        }
        
        return false;
    }
    
    /**
     * Delete component from database
     * 
     * @param int $media_kit_id Media kit ID
     * @return bool True on success, false on failure
     */
    public function delete($media_kit_id = 0) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_components';
        
        // Delete component
        $result = $wpdb->delete(
            $table_name,
            array(
                'component_id' => $this->id,
                'media_kit_id' => $media_kit_id
            ),
            array('%s', '%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Get component by ID
     * 
     * @param string $component_id Component ID
     * @param int $media_kit_id Media kit ID
     * @return MKB_Component|false Component instance or false if not found
     */
    public static function get_by_id($component_id, $media_kit_id = 0) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_components';
        
        // Get component data
        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE component_id = %s AND media_kit_id = %d",
                $component_id,
                $media_kit_id
            ),
            ARRAY_A
        );
        
        if (!$result) {
            return false;
        }
        
        // Create component instance
        $component = new self(
            $result['component_id'],
            $result['type'],
            json_decode($result['content'], true),
            json_decode($result['styles'], true),
            json_decode($result['metadata'], true)
        );
        
        return $component;
    }
    
    /**
     * Get all components for a media kit
     * 
     * @param int $media_kit_id Media kit ID
     * @return array Array of MKB_Component instances
     */
    public static function get_all_for_media_kit($media_kit_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_components';
        
        // Get all components for media kit
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE media_kit_id = %d ORDER BY id ASC",
                $media_kit_id
            ),
            ARRAY_A
        );
        
        if (!$results) {
            return array();
        }
        
        $components = array();
        
        foreach ($results as $result) {
            $components[] = new self(
                $result['component_id'],
                $result['type'],
                json_decode($result['content'], true),
                json_decode($result['styles'], true),
                json_decode($result['metadata'], true)
            );
        }
        
        return $components;
    }
    
    /**
     * Create components table
     * 
     * @return bool True on success, false on failure
     */
    private function create_components_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mkb_components';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            component_id varchar(100) NOT NULL,
            media_kit_id bigint(20) NOT NULL,
            type varchar(100) NOT NULL,
            content longtext NOT NULL,
            styles longtext DEFAULT NULL,
            metadata longtext DEFAULT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY component_media_kit (component_id, media_kit_id),
            KEY media_kit_id (media_kit_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        return dbDelta($sql) ? true : false;
    }
    
    /**
     * Sanitize component content
     * 
     * @param array $content Component content
     * @return array Sanitized content
     */
    private function sanitize_content($content) {
        if (!is_array($content)) {
            return array();
        }
        
        $sanitized = array();
        
        foreach ($content as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitize_content($value);
            } elseif (is_string($value)) {
                // Allow HTML in text content fields
                if (in_array($key, array('text', 'html', 'description', 'bio', 'content'))) {
                    $sanitized[$key] = wp_kses_post($value);
                } else {
                    $sanitized[$key] = sanitize_text_field($value);
                }
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Sanitize component styles
     * 
     * @param array $styles Component styles
     * @return array Sanitized styles
     */
    private function sanitize_styles($styles) {
        if (!is_array($styles)) {
            return array();
        }
        
        $sanitized = array();
        
        foreach ($styles as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitize_styles($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = sanitize_text_field($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Get component ID
     * 
     * @return string Component ID
     */
    public function get_id() {
        return $this->id;
    }
    
    /**
     * Get component type
     * 
     * @return string Component type
     */
    public function get_type() {
        return $this->type;
    }
    
    /**
     * Get component content
     * 
     * @return array Component content
     */
    public function get_content() {
        return $this->content;
    }
    
    /**
     * Get component styles
     * 
     * @return array Component styles
     */
    public function get_styles() {
        return $this->styles;
    }
    
    /**
     * Get component metadata
     * 
     * @return array Component metadata
     */
    public function get_metadata() {
        return $this->metadata;
    }
    
    /**
     * Set component content
     * 
     * @param array $content Component content
     * @return void
     */
    public function set_content($content) {
        $this->content = $this->sanitize_content($content);
        $this->metadata['updated_at'] = current_time('mysql');
    }
    
    /**
     * Set component styles
     * 
     * @param array $styles Component styles
     * @return void
     */
    public function set_styles($styles) {
        $this->styles = $this->sanitize_styles($styles);
        $this->metadata['updated_at'] = current_time('mysql');
    }
    
    /**
     * Set component metadata
     * 
     * @param array $metadata Component metadata
     * @return void
     */
    public function set_metadata($metadata) {
        $this->metadata = wp_parse_args($metadata, $this->metadata);
        $this->metadata['updated_at'] = current_time('mysql');
    }
}
