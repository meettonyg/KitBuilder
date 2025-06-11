<?php
/**
 * Media Kit Builder - Builder State System
 * 
 * Handles real-time builder state management and auto-save functionality.
 * This is one of the 7 Core Systems following Direct Operations principle.
 * 
 * Updated to support section-based architecture while maintaining backward compatibility.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Builder_State Class
 * 
 * Core System #6: Builder State System
 * Purpose: Real-time builder state management
 */
class MKB_Builder_State {
    
    /**
     * Instance
     * @var MKB_Builder_State
     */
    private static $instance = null;
    
    /**
     * Auto-save interval (seconds)
     * @var int
     */
    private $auto_save_interval = 30;
    
    /**
     * Max undo states
     * @var int
     */
    private $max_undo_states = 50;
    
    /**
     * State cache
     * @var array
     */
    private $state_cache = array();
    
    /**
     * Current format version
     * @var string
     */
    private $format_version = '2.0';
    
    /**
     * Get instance
     * 
     * @return MKB_Builder_State
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // AJAX endpoints for state management
        add_action('wp_ajax_mkb_save_state', array($this, 'ajax_save_state'));
        add_action('wp_ajax_nopriv_mkb_save_state', array($this, 'ajax_save_state'));
        
        add_action('wp_ajax_mkb_load_state', array($this, 'ajax_load_state'));
        add_action('wp_ajax_nopriv_mkb_load_state', array($this, 'ajax_load_state'));
        
        add_action('wp_ajax_mkb_auto_save', array($this, 'ajax_auto_save'));
        add_action('wp_ajax_nopriv_mkb_auto_save', array($this, 'ajax_auto_save'));
        
        // Undo/Redo functionality
        add_action('wp_ajax_mkb_undo_state', array($this, 'ajax_undo_state'));
        add_action('wp_ajax_nopriv_mkb_undo_state', array($this, 'ajax_undo_state'));
        
        add_action('wp_ajax_mkb_redo_state', array($this, 'ajax_redo_state'));
        add_action('wp_ajax_nopriv_mkb_redo_state', array($this, 'ajax_redo_state'));
        
        // State validation and cleanup
        add_action('wp_ajax_mkb_validate_state', array($this, 'ajax_validate_state'));
        add_action('wp_ajax_nopriv_mkb_validate_state', array($this, 'ajax_validate_state'));
        
        // Section-specific endpoints
        add_action('wp_ajax_mkb_add_section', array($this, 'ajax_add_section'));
        add_action('wp_ajax_mkb_update_section', array($this, 'ajax_update_section'));
        add_action('wp_ajax_mkb_delete_section', array($this, 'ajax_delete_section'));
        add_action('wp_ajax_mkb_reorder_sections', array($this, 'ajax_reorder_sections'));
        
        // Cleanup hooks
        add_action('mkb_daily_cleanup', array($this, 'cleanup_old_states'));
        
        // Real-time collaboration prep
        add_action('wp_ajax_mkb_get_state_changes', array($this, 'ajax_get_state_changes'));
        add_action('wp_ajax_mkb_lock_component', array($this, 'ajax_lock_component'));
        add_action('wp_ajax_mkb_unlock_component', array($this, 'ajax_unlock_component'));
    }
    
    /**
     * Save builder state
     * 
     * @param int|string $context_id Media kit ID or guest session ID
     * @param array $state_data
     * @param array $options
     * @return bool
     */
    public function save_state($context_id, $state_data, $options = array()) {
        if (empty($context_id) || empty($state_data)) {
            return false;
        }
        
        $defaults = array(
            'type' => 'manual', // manual, auto, template_change, etc.
            'description' => '',
            'create_undo_point' => true,
            'validate' => true
        );
        
        $options = wp_parse_args($options, $defaults);
        
        // Ensure state data includes version
        if (!isset($state_data['version'])) {
            $state_data['version'] = $this->format_version;
        }
        
        // Migrate old format to new section-based format if needed
        $state_data = $this->migrate_state_if_needed($state_data);
        
        // Validate state data if requested
        if ($options['validate']) {
            $validation_result = $this->validate_state_data($state_data);
            if ($validation_result !== true) {
                return $validation_result; // Return validation errors
            }
        }
        
        // Create undo point before saving new state
        if ($options['create_undo_point']) {
            $this->create_undo_point($context_id);
        }
        
        // Prepare state record
        $state_record = array(
            'context_id' => $context_id,
            'state_data' => json_encode($state_data),
            'state_type' => $options['type'],
            'description' => $options['description'],
            'user_id' => get_current_user_id(),
            'session_id' => $this->get_session_id(),
            'created_at' => current_time('mysql'),
            'checksum' => $this->generate_state_checksum($state_data)
        );
        
        // Save to database or session storage
        if ($this->is_guest_session($context_id)) {
            $result = $this->save_guest_state($context_id, $state_record);
        } else {
            $result = $this->save_user_state($context_id, $state_record);
        }
        
        if ($result) {
            // Update cache
            $this->state_cache[$context_id] = $state_data;
            
            // Trigger hooks
            do_action('mkb_state_saved', $context_id, $state_data, $options);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Migrate state data from old format to section-based format
     * 
     * @param array $state_data
     * @return array
     */
    private function migrate_state_if_needed($state_data) {
        // Check if already in new format
        if (isset($state_data['version']) && $state_data['version'] >= '2.0') {
            return $state_data;
        }
        
        // Old format detected, migrate to section-based
        $migrated_data = array(
            'version' => $this->format_version,
            'theme' => $state_data['theme'] ?? array('id' => 'default'),
            'sections' => array(),
            'components' => array()
        );
        
        // Create a default section to hold all components
        $default_section = array(
            'id' => 'section-' . wp_generate_uuid4(),
            'type' => 'content',
            'layout' => 'full-width',
            'order' => 0,
            'settings' => array(),
            'components' => array()
        );
        
        // Move components into the default section
        if (isset($state_data['components']) && is_array($state_data['components'])) {
            foreach ($state_data['components'] as $component) {
                $component_id = $component['id'] ?? 'component-' . wp_generate_uuid4();
                $default_section['components'][] = $component_id;
                $migrated_data['components'][$component_id] = $component;
            }
        }
        
        $migrated_data['sections'][] = $default_section;
        
        // Copy over other data
        if (isset($state_data['settings'])) {
            $migrated_data['settings'] = $state_data['settings'];
        }
        
        if (isset($state_data['layout'])) {
            $migrated_data['layout'] = $state_data['layout'];
        }
        
        return $migrated_data;
    }
    
    /**
     * Load builder state
     * 
     * @param int|string $context_id
     * @return array|false
     */
    public function load_state($context_id) {
        if (empty($context_id)) {
            return false;
        }
        
        // Check cache first
        if (isset($this->state_cache[$context_id])) {
            return $this->state_cache[$context_id];
        }
        
        // Load from storage
        if ($this->is_guest_session($context_id)) {
            $state_data = $this->load_guest_state($context_id);
        } else {
            $state_data = $this->load_user_state($context_id);
        }
        
        if ($state_data) {
            // Migrate if needed
            $state_data = $this->migrate_state_if_needed($state_data);
            
            // Cache the result
            $this->state_cache[$context_id] = $state_data;
            
            do_action('mkb_state_loaded', $context_id, $state_data);
            
            return $state_data;
        }
        
        return false;
    }
    
    /**
     * Auto-save builder state
     * 
     * @param int|string $context_id
     * @param array $state_data
     * @return bool
     */
    public function auto_save($context_id, $state_data) {
        return $this->save_state($context_id, $state_data, array(
            'type' => 'auto',
            'description' => 'Auto-save',
            'create_undo_point' => false,
            'validate' => false // Skip validation for auto-save for performance
        ));
    }
    
    /**
     * Create undo point
     * 
     * @param int|string $context_id
     * @return bool
     */
    public function create_undo_point($context_id) {
        $current_state = $this->load_state($context_id);
        
        if (!$current_state) {
            return false;
        }
        
        // Get existing undo stack
        $undo_stack = $this->get_undo_stack($context_id);
        
        // Add current state to undo stack
        array_push($undo_stack, array(
            'state_data' => $current_state,
            'timestamp' => current_time('timestamp'),
            'checksum' => $this->generate_state_checksum($current_state)
        ));
        
        // Limit undo stack size
        if (count($undo_stack) > $this->max_undo_states) {
            array_shift($undo_stack);
        }
        
        // Save undo stack
        return $this->save_undo_stack($context_id, $undo_stack);
    }
    
    /**
     * Undo last change
     * 
     * @param int|string $context_id
     * @return array|false
     */
    public function undo($context_id) {
        $undo_stack = $this->get_undo_stack($context_id);
        $redo_stack = $this->get_redo_stack($context_id);
        
        if (empty($undo_stack)) {
            return false;
        }
        
        // Get current state for redo stack
        $current_state = $this->load_state($context_id);
        if ($current_state) {
            array_push($redo_stack, array(
                'state_data' => $current_state,
                'timestamp' => current_time('timestamp'),
                'checksum' => $this->generate_state_checksum($current_state)
            ));
            
            // Limit redo stack
            if (count($redo_stack) > $this->max_undo_states) {
                array_shift($redo_stack);
            }
        }
        
        // Get previous state
        $previous_state = array_pop($undo_stack);
        
        // Save stacks
        $this->save_undo_stack($context_id, $undo_stack);
        $this->save_redo_stack($context_id, $redo_stack);
        
        // Restore previous state
        $restore_result = $this->save_state($context_id, $previous_state['state_data'], array(
            'type' => 'undo',
            'description' => 'Undo operation',
            'create_undo_point' => false,
            'validate' => false
        ));
        
        if ($restore_result) {
            do_action('mkb_state_undone', $context_id, $previous_state['state_data']);
            return $previous_state['state_data'];
        }
        
        return false;
    }
    
    /**
     * Redo last undone change
     * 
     * @param int|string $context_id
     * @return array|false
     */
    public function redo($context_id) {
        $redo_stack = $this->get_redo_stack($context_id);
        
        if (empty($redo_stack)) {
            return false;
        }
        
        // Create undo point
        $this->create_undo_point($context_id);
        
        // Get next state
        $next_state = array_pop($redo_stack);
        
        // Save redo stack
        $this->save_redo_stack($context_id, $redo_stack);
        
        // Restore next state
        $restore_result = $this->save_state($context_id, $next_state['state_data'], array(
            'type' => 'redo',
            'description' => 'Redo operation',
            'create_undo_point' => false,
            'validate' => false
        ));
        
        if ($restore_result) {
            do_action('mkb_state_redone', $context_id, $next_state['state_data']);
            return $next_state['state_data'];
        }
        
        return false;
    }
    
    /**
     * Validate state data
     * 
     * @param array $state_data
     * @return bool|array
     */
    public function validate_state_data($state_data) {
        $errors = array();
        
        // Check format version
        if (!isset($state_data['version'])) {
            $errors[] = __('Missing state version', 'media-kit-builder');
        }
        
        // For new format, validate sections
        if (isset($state_data['version']) && $state_data['version'] >= '2.0') {
            // Check required fields
            $required_fields = array('sections', 'components');
            foreach ($required_fields as $field) {
                if (!isset($state_data[$field])) {
                    $errors[] = sprintf(__('Missing required field: %s', 'media-kit-builder'), $field);
                }
            }
            
            // Validate sections
            if (isset($state_data['sections']) && is_array($state_data['sections'])) {
                $section_types = array();
                
                foreach ($state_data['sections'] as $section) {
                    // Track section types for max instance validation
                    if (isset($section['type'])) {
                        if (!isset($section_types[$section['type']])) {
                            $section_types[$section['type']] = 0;
                        }
                        $section_types[$section['type']]++;
                    }
                    
                    // Load section model if available
                    if (class_exists('MKB_Section')) {
                        $section_obj = new MKB_Section($section);
                        $section_errors = $section_obj->validate();
                        $errors = array_merge($errors, $section_errors);
                    }
                }
                
                // Check section type limits
                if (class_exists('MKB_Section')) {
                    $allowed_types = MKB_Section::get_allowed_types();
                    foreach ($section_types as $type => $count) {
                        if (isset($allowed_types[$type])) {
                            $max = $allowed_types[$type]['max_instances'];
                            if ($max !== -1 && $count > $max) {
                                $errors[] = sprintf(
                                    __('Too many %s sections. Maximum %d allowed.', 'media-kit-builder'),
                                    $allowed_types[$type]['label'],
                                    $max
                                );
                            }
                        }
                    }
                }
            }
            
            // Validate components
            if (isset($state_data['components']) && is_array($state_data['components'])) {
                $component_registry = media_kit_builder()->get_system('components');
                
                foreach ($state_data['components'] as $component_id => $component) {
                    if (!isset($component['type'])) {
                        $errors[] = sprintf(__('Component %s missing type', 'media-kit-builder'), $component_id);
                        continue;
                    }
                    
                    // Check if component type is registered
                    if ($component_registry && !$component_registry->get_component($component['type'])) {
                        $errors[] = sprintf(__('Unknown component type: %s', 'media-kit-builder'), $component['type']);
                        continue;
                    }
                    
                    // Validate component data
                    if (isset($component['data']) && $component_registry) {
                        $component_errors = $component_registry->validate_component_data(
                            $component['type'], 
                            $component['data']
                        );
                        $errors = array_merge($errors, $component_errors);
                    }
                }
            }
            
            // Check total component limit
            $total_components = 0;
            if (isset($state_data['sections'])) {
                foreach ($state_data['sections'] as $section) {
                    if (isset($section['components'])) {
                        if (is_array($section['components']) && isset($section['components'][0])) {
                            // Single column
                            $total_components += count($section['components']);
                        } else {
                            // Multi-column
                            foreach ($section['components'] as $column_components) {
                                if (is_array($column_components)) {
                                    $total_components += count($column_components);
                                }
                            }
                        }
                    }
                }
            }
            
            if ($total_components > 100) {
                $errors[] = __('Too many components. Maximum 100 allowed across all sections.', 'media-kit-builder');
            }
            
        } else {
            // Old format validation (backward compatibility)
            $required_fields = array('components', 'settings', 'layout');
            foreach ($required_fields as $field) {
                if (!isset($state_data[$field])) {
                    $errors[] = sprintf(__('Missing required field: %s', 'media-kit-builder'), $field);
                }
            }
            
            // Check component limit
            if (isset($state_data['components']) && count($state_data['components']) > 100) {
                $errors[] = __('Too many components. Maximum 100 allowed.', 'media-kit-builder');
            }
        }
        
        // Validate settings if present
        if (isset($state_data['settings'])) {
            $settings_errors = $this->validate_settings($state_data['settings']);
            $errors = array_merge($errors, $settings_errors);
        }
        
        return empty($errors) ? true : $errors;
    }
    
    /**
     * Add a new section
     * 
     * @param int|string $context_id
     * @param array $section_data
     * @param int $position
     * @return array|false
     */
    public function add_section($context_id, $section_data, $position = null) {
        $state_data = $this->load_state($context_id);
        
        if (!$state_data) {
            return false;
        }
        
        // Ensure sections array exists
        if (!isset($state_data['sections'])) {
            $state_data['sections'] = array();
        }
        
        // Check if section type can be added
        if (class_exists('MKB_Section')) {
            if (!MKB_Section::can_add_type($section_data['type'], $state_data['sections'])) {
                return array('error' => __('Cannot add more sections of this type', 'media-kit-builder'));
            }
        }
        
        // Create section
        $section = new MKB_Section($section_data);
        
        // Add to sections array
        if ($position === null) {
            $state_data['sections'][] = $section->to_array();
        } else {
            array_splice($state_data['sections'], $position, 0, array($section->to_array()));
        }
        
        // Update section order
        foreach ($state_data['sections'] as $index => &$sec) {
            $sec['order'] = $index;
        }
        
        // Save updated state
        $this->save_state($context_id, $state_data, array(
            'type' => 'section_add',
            'description' => 'Added section'
        ));
        
        return $section->to_array();
    }
    
    /**
     * Update a section
     * 
     * @param int|string $context_id
     * @param string $section_id
     * @param array $updates
     * @return bool
     */
    public function update_section($context_id, $section_id, $updates) {
        $state_data = $this->load_state($context_id);
        
        if (!$state_data || !isset($state_data['sections'])) {
            return false;
        }
        
        foreach ($state_data['sections'] as &$section) {
            if ($section['id'] === $section_id) {
                // Update section data
                if (isset($updates['layout'])) {
                    $section_obj = new MKB_Section($section);
                    $section_obj->change_layout($updates['layout']);
                    $section = $section_obj->to_array();
                }
                
                if (isset($updates['settings'])) {
                    $section_obj = new MKB_Section($section);
                    $section_obj->update_settings($updates['settings']);
                    $section = $section_obj->to_array();
                }
                
                // Save updated state
                return $this->save_state($context_id, $state_data, array(
                    'type' => 'section_update',
                    'description' => 'Updated section'
                ));
            }
        }
        
        return false;
    }
    
    /**
     * Delete a section
     * 
     * @param int|string $context_id
     * @param string $section_id
     * @return bool
     */
    public function delete_section($context_id, $section_id) {
        $state_data = $this->load_state($context_id);
        
        if (!$state_data || !isset($state_data['sections'])) {
            return false;
        }
        
        // Remove section
        $state_data['sections'] = array_values(array_filter($state_data['sections'], function($section) use ($section_id) {
            return $section['id'] !== $section_id;
        }));
        
        // Update section order
        foreach ($state_data['sections'] as $index => &$section) {
            $section['order'] = $index;
        }
        
        // Save updated state
        return $this->save_state($context_id, $state_data, array(
            'type' => 'section_delete',
            'description' => 'Deleted section'
        ));
    }
    
    /**
     * Reorder sections
     * 
     * @param int|string $context_id
     * @param array $section_order Array of section IDs in new order
     * @return bool
     */
    public function reorder_sections($context_id, $section_order) {
        $state_data = $this->load_state($context_id);
        
        if (!$state_data || !isset($state_data['sections'])) {
            return false;
        }
        
        // Create map of sections by ID
        $sections_map = array();
        foreach ($state_data['sections'] as $section) {
            $sections_map[$section['id']] = $section;
        }
        
        // Reorder sections
        $new_sections = array();
        foreach ($section_order as $index => $section_id) {
            if (isset($sections_map[$section_id])) {
                $sections_map[$section_id]['order'] = $index;
                $new_sections[] = $sections_map[$section_id];
            }
        }
        
        $state_data['sections'] = $new_sections;
        
        // Save updated state
        return $this->save_state($context_id, $state_data, array(
            'type' => 'section_reorder',
            'description' => 'Reordered sections'
        ));
    }
    
    /**
     * Get state history
     * 
     * @param int|string $context_id
     * @param int $limit
     * @return array
     */
    public function get_state_history($context_id, $limit = 10) {
        if ($this->is_guest_session($context_id)) {
            return $this->get_guest_state_history($context_id, $limit);
        } else {
            return $this->get_user_state_history($context_id, $limit);
        }
    }
    
    /**
     * AJAX: Save state
     */
    public function ajax_save_state() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $state_data = $_POST['state_data'] ?? array();
        $options = $_POST['options'] ?? array();
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $result = $this->save_state($context_id, $state_data, $options);
        
        if ($result === true) {
            wp_send_json_success('State saved successfully');
        } elseif (is_array($result)) {
            wp_send_json_error(array(
                'message' => 'Validation failed',
                'errors' => $result
            ));
        } else {
            wp_send_json_error('Failed to save state');
        }
    }
    
    /**
     * AJAX: Load state
     */
    public function ajax_load_state() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $state_data = $this->load_state($context_id);
        
        if ($state_data) {
            wp_send_json_success($state_data);
        } else {
            wp_send_json_error('State not found');
        }
    }
    
    /**
     * AJAX: Auto-save
     */
    public function ajax_auto_save() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $state_data = $_POST['state_data'] ?? array();
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $result = $this->auto_save($context_id, $state_data);
        
        if ($result) {
            wp_send_json_success(array(
                'message' => 'Auto-saved',
                'timestamp' => current_time('timestamp')
            ));
        } else {
            wp_send_json_error('Auto-save failed');
        }
    }
    
    /**
     * AJAX: Undo state
     */
    public function ajax_undo_state() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $state_data = $this->undo($context_id);
        
        if ($state_data) {
            wp_send_json_success($state_data);
        } else {
            wp_send_json_error('Nothing to undo');
        }
    }
    
    /**
     * AJAX: Redo state
     */
    public function ajax_redo_state() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $state_data = $this->redo($context_id);
        
        if ($state_data) {
            wp_send_json_success($state_data);
        } else {
            wp_send_json_error('Nothing to redo');
        }
    }
    
    /**
     * AJAX: Validate state
     */
    public function ajax_validate_state() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $state_data = $_POST['state_data'] ?? array();
        
        $validation_result = $this->validate_state_data($state_data);
        
        if ($validation_result === true) {
            wp_send_json_success('State is valid');
        } else {
            wp_send_json_error(array(
                'message' => 'State validation failed',
                'errors' => $validation_result
            ));
        }
    }
    
    /**
     * AJAX: Add section
     */
    public function ajax_add_section() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $section_data = $_POST['section_data'] ?? array();
        $position = isset($_POST['position']) ? intval($_POST['position']) : null;
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $result = $this->add_section($context_id, $section_data, $position);
        
        if (is_array($result) && !isset($result['error'])) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result['error'] ?? 'Failed to add section');
        }
    }
    
    /**
     * AJAX: Update section
     */
    public function ajax_update_section() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $section_id = sanitize_text_field($_POST['section_id'] ?? '');
        $updates = $_POST['updates'] ?? array();
        
        if (empty($context_id) || empty($section_id)) {
            wp_send_json_error('Context ID and Section ID required');
            return;
        }
        
        $result = $this->update_section($context_id, $section_id, $updates);
        
        if ($result) {
            wp_send_json_success('Section updated');
        } else {
            wp_send_json_error('Failed to update section');
        }
    }
    
    /**
     * AJAX: Delete section
     */
    public function ajax_delete_section() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $section_id = sanitize_text_field($_POST['section_id'] ?? '');
        
        if (empty($context_id) || empty($section_id)) {
            wp_send_json_error('Context ID and Section ID required');
            return;
        }
        
        $result = $this->delete_section($context_id, $section_id);
        
        if ($result) {
            wp_send_json_success('Section deleted');
        } else {
            wp_send_json_error('Failed to delete section');
        }
    }
    
    /**
     * AJAX: Reorder sections
     */
    public function ajax_reorder_sections() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $section_order = $_POST['section_order'] ?? array();
        
        if (empty($context_id) || empty($section_order)) {
            wp_send_json_error('Context ID and section order required');
            return;
        }
        
        $result = $this->reorder_sections($context_id, $section_order);
        
        if ($result) {
            wp_send_json_success('Sections reordered');
        } else {
            wp_send_json_error('Failed to reorder sections');
        }
    }
    
    /**
     * AJAX: Get state changes (for real-time collaboration)
     */
    public function ajax_get_state_changes() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $since_timestamp = intval($_POST['since'] ?? 0);
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $changes = $this->get_state_changes_since($context_id, $since_timestamp);
        
        wp_send_json_success($changes);
    }
    
    /**
     * Check if context is guest session
     * 
     * @param string $context_id
     * @return bool
     */
    private function is_guest_session($context_id) {
        return strpos($context_id, 'mkb_') === 0 || !is_numeric($context_id);
    }
    
    /**
     * Save guest state
     * 
     * @param string $session_id
     * @param array $state_record
     * @return bool
     */
    private function save_guest_state($session_id, $state_record) {
        $session_manager = media_kit_builder()->get_system('session');
        
        if (!$session_manager) {
            return false;
        }
        
        $session_data = $session_manager->get_guest_data($session_id);
        $session_data['builder_state'] = $state_record;
        
        return $session_manager->save_guest_data($session_id, $session_data);
    }
    
    /**
     * Load guest state
     * 
     * @param string $session_id
     * @return array|false
     */
    private function load_guest_state($session_id) {
        $session_manager = media_kit_builder()->get_system('session');
        
        if (!$session_manager) {
            return false;
        }
        
        $session_data = $session_manager->get_guest_data($session_id);
        
        if (isset($session_data['builder_state']['state_data'])) {
            return json_decode($session_data['builder_state']['state_data'], true);
        }
        
        return false;
    }
    
    /**
     * Save user state
     * 
     * @param int $media_kit_id
     * @param array $state_record
     * @return bool
     */
    private function save_user_state($media_kit_id, $state_record) {
        return update_post_meta($media_kit_id, '_mkb_builder_state', $state_record);
    }
    
    /**
     * Load user state
     * 
     * @param int $media_kit_id
     * @return array|false
     */
    private function load_user_state($media_kit_id) {
        $state_record = get_post_meta($media_kit_id, '_mkb_builder_state', true);
        
        if ($state_record && isset($state_record['state_data'])) {
            return json_decode($state_record['state_data'], true);
        }
        
        return false;
    }
    
    /**
     * Get undo stack
     * 
     * @param int|string $context_id
     * @return array
     */
    private function get_undo_stack($context_id) {
        if ($this->is_guest_session($context_id)) {
            $session_manager = media_kit_builder()->get_system('session');
            $session_data = $session_manager->get_guest_data($context_id);
            return $session_data['undo_stack'] ?? array();
        } else {
            return get_post_meta($context_id, '_mkb_undo_stack', true) ?: array();
        }
    }
    
    /**
     * Save undo stack
     * 
     * @param int|string $context_id
     * @param array $undo_stack
     * @return bool
     */
    private function save_undo_stack($context_id, $undo_stack) {
        if ($this->is_guest_session($context_id)) {
            $session_manager = media_kit_builder()->get_system('session');
            $session_data = $session_manager->get_guest_data($context_id);
            $session_data['undo_stack'] = $undo_stack;
            return $session_manager->save_guest_data($context_id, $session_data);
        } else {
            return update_post_meta($context_id, '_mkb_undo_stack', $undo_stack);
        }
    }
    
    /**
     * Get redo stack
     * 
     * @param int|string $context_id
     * @return array
     */
    private function get_redo_stack($context_id) {
        if ($this->is_guest_session($context_id)) {
            $session_manager = media_kit_builder()->get_system('session');
            $session_data = $session_manager->get_guest_data($context_id);
            return $session_data['redo_stack'] ?? array();
        } else {
            return get_post_meta($context_id, '_mkb_redo_stack', true) ?: array();
        }
    }
    
    /**
     * Save redo stack
     * 
     * @param int|string $context_id
     * @param array $redo_stack
     * @return bool
     */
    private function save_redo_stack($context_id, $redo_stack) {
        if ($this->is_guest_session($context_id)) {
            $session_manager = media_kit_builder()->get_system('session');
            $session_data = $session_manager->get_guest_data($context_id);
            $session_data['redo_stack'] = $redo_stack;
            return $session_manager->save_guest_data($context_id, $session_data);
        } else {
            return update_post_meta($context_id, '_mkb_redo_stack', $redo_stack);
        }
    }
    
    /**
     * Generate state checksum
     * 
     * @param array $state_data
     * @return string
     */
    private function generate_state_checksum($state_data) {
        return md5(json_encode($state_data));
    }
    
    /**
     * Get session ID
     * 
     * @return string
     */
    private function get_session_id() {
        $session_manager = media_kit_builder()->get_system('session');
        return $session_manager ? $session_manager->get_guest_session_id() : session_id();
    }
    
    /**
     * Validate settings
     * 
     * @param array $settings
     * @return array
     */
    private function validate_settings($settings) {
        $errors = array();
        
        // Validate colors
        if (isset($settings['colors'])) {
            foreach ($settings['colors'] as $key => $color) {
                if (!preg_match('/^#[a-f0-9]{6}$/i', $color)) {
                    $errors[] = sprintf(__('Invalid color format for %s', 'media-kit-builder'), $key);
                }
            }
        }
        
        // Validate fonts
        if (isset($settings['fonts'])) {
            $allowed_fonts = array('Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Georgia', 'Times New Roman');
            foreach ($settings['fonts'] as $key => $font) {
                if (!in_array($font, $allowed_fonts)) {
                    $errors[] = sprintf(__('Invalid font for %s', 'media-kit-builder'), $key);
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Get state changes since timestamp (for real-time collaboration)
     * 
     * @param int|string $context_id
     * @param int $timestamp
     * @return array
     */
    private function get_state_changes_since($context_id, $timestamp) {
        // This would be implemented for real-time collaboration
        // Return changes made by other users since the given timestamp
        return array();
    }
    
    /**
     * Get guest state history
     * 
     * @param string $session_id
     * @param int $limit
     * @return array
     */
    private function get_guest_state_history($session_id, $limit) {
        $session_manager = media_kit_builder()->get_system('session');
        $session_data = $session_manager->get_guest_data($session_id);
        
        $history = $session_data['state_history'] ?? array();
        
        // Sort by timestamp and limit
        usort($history, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        return array_slice($history, 0, $limit);
    }
    
    /**
     * Get user state history
     * 
     * @param int $media_kit_id
     * @param int $limit
     * @return array
     */
    private function get_user_state_history($media_kit_id, $limit) {
        $history = get_post_meta($media_kit_id, '_mkb_state_history', true) ?: array();
        
        // Sort by timestamp and limit
        usort($history, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        return array_slice($history, 0, $limit);
    }
    
    /**
     * Cleanup old states
     */
    public function cleanup_old_states() {
        global $wpdb;
        
        // Clean up old undo/redo stacks (older than 30 days)
        $cutoff_date = date('Y-m-d H:i:s', strtotime('-30 days'));
        
        // Clean up post meta
        $wpdb->query($wpdb->prepare(
            "DELETE pm FROM {$wpdb->postmeta} pm
             JOIN {$wpdb->posts} p ON pm.post_id = p.ID
             WHERE pm.meta_key IN ('_mkb_undo_stack', '_mkb_redo_stack', '_mkb_state_history')
             AND p.post_modified < %s",
            $cutoff_date
        ));
        
        do_action('mkb_states_cleaned_up');
    }
    
    /**
     * Get builder state statistics
     * 
     * @return array
     */
    public function get_state_stats() {
        global $wpdb;
        
        // Count active states
        $active_user_states = $wpdb->get_var(
            "SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key = '_mkb_builder_state'"
        );
        
        // Count guest sessions with states
        $session_manager = media_kit_builder()->get_system('session');
        $session_stats = $session_manager ? $session_manager->get_session_stats() : array();
        
        return array(
            'active_user_states' => (int) $active_user_states,
            'active_guest_states' => $session_stats['active'] ?? 0,
            'auto_save_interval' => $this->auto_save_interval,
            'max_undo_states' => $this->max_undo_states,
            'format_version' => $this->format_version
        );
    }
}
