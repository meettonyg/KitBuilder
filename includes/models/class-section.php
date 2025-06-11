<?php
/**
 * Media Kit Builder - Section Model
 * 
 * Handles section data management for the builder.
 * Sections are containers that hold components with specific layouts.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Section Class
 * 
 * Represents a section in the media kit builder
 */
class MKB_Section {
    
    /**
     * Section ID
     * @var string
     */
    public $id;
    
    /**
     * Section type (hero|content|features|media|contact)
     * @var string
     */
    public $type;
    
    /**
     * Section layout (full-width|two-column|three-column|main-sidebar)
     * @var string
     */
    public $layout;
    
    /**
     * Section order position
     * @var int
     */
    public $order;
    
    /**
     * Section settings
     * @var array
     */
    public $settings;
    
    /**
     * Components in this section
     * @var array
     */
    public $components;
    
    /**
     * Section metadata
     * @var array
     */
    public $metadata;
    
    /**
     * Allowed section types
     * @var array
     */
    private static $allowed_types = array(
        'hero' => array(
            'label' => 'Hero/Introduction',
            'max_instances' => 1,
            'allowed_layouts' => array('full-width', 'two-column', 'main-sidebar'),
            'icon' => 'hero-icon'
        ),
        'content' => array(
            'label' => 'Content Block',
            'max_instances' => -1, // unlimited
            'allowed_layouts' => array('full-width', 'two-column', 'three-column', 'main-sidebar'),
            'icon' => 'content-icon'
        ),
        'features' => array(
            'label' => 'Features/Stats',
            'max_instances' => -1, // unlimited
            'allowed_layouts' => array('full-width', 'two-column', 'three-column'),
            'icon' => 'features-icon'
        ),
        'media' => array(
            'label' => 'Media Gallery',
            'max_instances' => 3,
            'allowed_layouts' => array('full-width', 'two-column', 'three-column'),
            'icon' => 'media-icon'
        ),
        'contact' => array(
            'label' => 'Contact/CTA',
            'max_instances' => 2,
            'allowed_layouts' => array('full-width', 'two-column'),
            'icon' => 'contact-icon'
        )
    );
    
    /**
     * Allowed layout types
     * @var array
     */
    private static $allowed_layouts = array(
        'full-width' => array(
            'label' => 'Full Width',
            'columns' => 1,
            'ratio' => array(100),
            'mobile_stack' => 'vertical'
        ),
        'two-column' => array(
            'label' => 'Two Column',
            'columns' => 2,
            'ratio' => array(50, 50),
            'mobile_stack' => 'vertical'
        ),
        'main-sidebar' => array(
            'label' => 'Main + Sidebar',
            'columns' => 2,
            'ratio' => array(66, 34),
            'mobile_stack' => 'vertical'
        ),
        'three-column' => array(
            'label' => 'Three Column',
            'columns' => 3,
            'ratio' => array(33, 34, 33),
            'mobile_stack' => 'vertical'
        )
    );
    
    /**
     * Constructor
     * 
     * @param array $data Section data
     */
    public function __construct($data = array()) {
        $defaults = array(
            'id' => $this->generate_id(),
            'type' => 'content',
            'layout' => 'full-width',
            'order' => 0,
            'settings' => array(),
            'components' => array(),
            'metadata' => array()
        );
        
        $data = wp_parse_args($data, $defaults);
        
        $this->id = sanitize_text_field($data['id']);
        $this->type = $this->validate_type($data['type']);
        $this->layout = $this->validate_layout($data['layout']);
        $this->order = intval($data['order']);
        $this->settings = $this->sanitize_settings($data['settings']);
        $this->components = $this->organize_components($data['components']);
        $this->metadata = $this->sanitize_metadata($data['metadata']);
    }
    
    /**
     * Generate unique section ID
     * 
     * @return string
     */
    private function generate_id() {
        return 'section-' . wp_generate_uuid4();
    }
    
    /**
     * Validate section type
     * 
     * @param string $type
     * @return string
     */
    private function validate_type($type) {
        return isset(self::$allowed_types[$type]) ? $type : 'content';
    }
    
    /**
     * Validate layout type
     * 
     * @param string $layout
     * @return string
     */
    private function validate_layout($layout) {
        if (!isset(self::$allowed_layouts[$layout])) {
            return 'full-width';
        }
        
        // Check if layout is allowed for this section type
        $type_config = self::$allowed_types[$this->type];
        if (!in_array($layout, $type_config['allowed_layouts'])) {
            return $type_config['allowed_layouts'][0];
        }
        
        return $layout;
    }
    
    /**
     * Sanitize section settings
     * 
     * @param array $settings
     * @return array
     */
    private function sanitize_settings($settings) {
        $defaults = array(
            'background' => array(
                'type' => 'color',
                'value' => '#ffffff'
            ),
            'padding' => array(
                'top' => '48px',
                'bottom' => '48px',
                'left' => '0',
                'right' => '0'
            ),
            'margin' => array(
                'top' => '0',
                'bottom' => '0'
            ),
            'mobile' => array(
                'hideOnMobile' => false,
                'stackOrder' => array() // For multi-column layouts
            ),
            'customClass' => '',
            'customId' => ''
        );
        
        $settings = wp_parse_args($settings, $defaults);
        
        // Sanitize background
        if (isset($settings['background'])) {
            $settings['background']['type'] = sanitize_text_field($settings['background']['type']);
            $settings['background']['value'] = sanitize_text_field($settings['background']['value']);
        }
        
        // Sanitize spacing
        foreach (array('padding', 'margin') as $spacing) {
            if (isset($settings[$spacing])) {
                foreach ($settings[$spacing] as $side => $value) {
                    $settings[$spacing][$side] = sanitize_text_field($value);
                }
            }
        }
        
        // Sanitize mobile settings
        if (isset($settings['mobile'])) {
            $settings['mobile']['hideOnMobile'] = (bool) $settings['mobile']['hideOnMobile'];
            if (is_array($settings['mobile']['stackOrder'])) {
                $settings['mobile']['stackOrder'] = array_map('sanitize_text_field', $settings['mobile']['stackOrder']);
            }
        }
        
        // Sanitize custom classes/IDs
        $settings['customClass'] = sanitize_html_class($settings['customClass']);
        $settings['customId'] = sanitize_html_class($settings['customId']);
        
        return $settings;
    }
    
    /**
     * Organize components based on layout
     * 
     * @param array $components
     * @return array
     */
    private function organize_components($components) {
        $layout_config = self::$allowed_layouts[$this->layout];
        
        if ($layout_config['columns'] === 1) {
            // Single column - simple array
            return is_array($components) ? array_values($components) : array();
        } else {
            // Multi-column - organize by column
            $organized = array();
            
            // Initialize columns
            for ($i = 0; $i < $layout_config['columns']; $i++) {
                $organized['column_' . ($i + 1)] = array();
            }
            
            // If components is already organized by column, use that
            if (is_array($components) && !isset($components[0])) {
                foreach ($organized as $column => $value) {
                    if (isset($components[$column])) {
                        $organized[$column] = is_array($components[$column]) ? $components[$column] : array();
                    }
                }
            } else {
                // Otherwise, distribute components evenly
                if (is_array($components)) {
                    $components = array_values($components);
                    $col_index = 0;
                    
                    foreach ($components as $component) {
                        $organized['column_' . ($col_index + 1)][] = $component;
                        $col_index = ($col_index + 1) % $layout_config['columns'];
                    }
                }
            }
            
            return $organized;
        }
    }
    
    /**
     * Sanitize metadata
     * 
     * @param array $metadata
     * @return array
     */
    private function sanitize_metadata($metadata) {
        $defaults = array(
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            'created_by' => get_current_user_id(),
            'template_id' => '',
            'version' => '1.0'
        );
        
        $metadata = wp_parse_args($metadata, $defaults);
        
        return array_map('sanitize_text_field', $metadata);
    }
    
    /**
     * Get section as array
     * 
     * @return array
     */
    public function to_array() {
        return array(
            'id' => $this->id,
            'type' => $this->type,
            'layout' => $this->layout,
            'order' => $this->order,
            'settings' => $this->settings,
            'components' => $this->components,
            'metadata' => $this->metadata
        );
    }
    
    /**
     * Get section as JSON
     * 
     * @return string
     */
    public function to_json() {
        return json_encode($this->to_array());
    }
    
    /**
     * Add component to section
     * 
     * @param string $component_id
     * @param int|string $column Column index or name
     * @param int $position Position within column
     * @return bool
     */
    public function add_component($component_id, $column = null, $position = null) {
        $layout_config = self::$allowed_layouts[$this->layout];
        
        if ($layout_config['columns'] === 1) {
            // Single column
            if ($position === null) {
                $this->components[] = $component_id;
            } else {
                array_splice($this->components, $position, 0, $component_id);
            }
        } else {
            // Multi-column
            if ($column === null) {
                $column = 'column_1';
            } elseif (is_numeric($column)) {
                $column = 'column_' . $column;
            }
            
            if (!isset($this->components[$column])) {
                return false;
            }
            
            if ($position === null) {
                $this->components[$column][] = $component_id;
            } else {
                array_splice($this->components[$column], $position, 0, $component_id);
            }
        }
        
        $this->metadata['updated_at'] = current_time('mysql');
        return true;
    }
    
    /**
     * Remove component from section
     * 
     * @param string $component_id
     * @return bool
     */
    public function remove_component($component_id) {
        $layout_config = self::$allowed_layouts[$this->layout];
        
        if ($layout_config['columns'] === 1) {
            $key = array_search($component_id, $this->components);
            if ($key !== false) {
                array_splice($this->components, $key, 1);
                $this->metadata['updated_at'] = current_time('mysql');
                return true;
            }
        } else {
            foreach ($this->components as $column => &$components) {
                $key = array_search($component_id, $components);
                if ($key !== false) {
                    array_splice($components, $key, 1);
                    $this->metadata['updated_at'] = current_time('mysql');
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Move component within or between columns
     * 
     * @param string $component_id
     * @param int|string $target_column
     * @param int $target_position
     * @return bool
     */
    public function move_component($component_id, $target_column = null, $target_position = null) {
        // First, remove the component
        $this->remove_component($component_id);
        
        // Then add it to the new position
        return $this->add_component($component_id, $target_column, $target_position);
    }
    
    /**
     * Get component count
     * 
     * @return int
     */
    public function get_component_count() {
        $layout_config = self::$allowed_layouts[$this->layout];
        
        if ($layout_config['columns'] === 1) {
            return count($this->components);
        } else {
            $count = 0;
            foreach ($this->components as $column_components) {
                $count += count($column_components);
            }
            return $count;
        }
    }
    
    /**
     * Change section layout
     * 
     * @param string $new_layout
     * @return bool
     */
    public function change_layout($new_layout) {
        if (!isset(self::$allowed_layouts[$new_layout])) {
            return false;
        }
        
        // Check if layout is allowed for this section type
        $type_config = self::$allowed_types[$this->type];
        if (!in_array($new_layout, $type_config['allowed_layouts'])) {
            return false;
        }
        
        // Get all components in a flat array
        $all_components = array();
        $layout_config = self::$allowed_layouts[$this->layout];
        
        if ($layout_config['columns'] === 1) {
            $all_components = $this->components;
        } else {
            foreach ($this->components as $column_components) {
                $all_components = array_merge($all_components, $column_components);
            }
        }
        
        // Update layout
        $this->layout = $new_layout;
        
        // Reorganize components for new layout
        $this->components = $this->organize_components($all_components);
        $this->metadata['updated_at'] = current_time('mysql');
        
        return true;
    }
    
    /**
     * Update section settings
     * 
     * @param array $new_settings
     * @return bool
     */
    public function update_settings($new_settings) {
        $this->settings = $this->sanitize_settings(
            wp_parse_args($new_settings, $this->settings)
        );
        $this->metadata['updated_at'] = current_time('mysql');
        return true;
    }
    
    /**
     * Validate section data
     * 
     * @return array Validation errors
     */
    public function validate() {
        $errors = array();
        
        // Validate type
        if (!isset(self::$allowed_types[$this->type])) {
            $errors[] = sprintf(__('Invalid section type: %s', 'media-kit-builder'), $this->type);
        }
        
        // Validate layout
        if (!isset(self::$allowed_layouts[$this->layout])) {
            $errors[] = sprintf(__('Invalid layout type: %s', 'media-kit-builder'), $this->layout);
        }
        
        // Validate component count
        if ($this->get_component_count() > 50) {
            $errors[] = __('Too many components in section. Maximum 50 allowed per section.', 'media-kit-builder');
        }
        
        return $errors;
    }
    
    /**
     * Get allowed section types
     * 
     * @return array
     */
    public static function get_allowed_types() {
        return self::$allowed_types;
    }
    
    /**
     * Get allowed layouts
     * 
     * @return array
     */
    public static function get_allowed_layouts() {
        return self::$allowed_layouts;
    }
    
    /**
     * Check if section type can have multiple instances
     * 
     * @param string $type
     * @param array $existing_sections
     * @return bool
     */
    public static function can_add_type($type, $existing_sections = array()) {
        if (!isset(self::$allowed_types[$type])) {
            return false;
        }
        
        $config = self::$allowed_types[$type];
        
        // Unlimited instances allowed
        if ($config['max_instances'] === -1) {
            return true;
        }
        
        // Count existing instances of this type
        $count = 0;
        foreach ($existing_sections as $section) {
            if ($section['type'] === $type) {
                $count++;
            }
        }
        
        return $count < $config['max_instances'];
    }
}
