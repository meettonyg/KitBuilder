<?php
/**
 * Media Kit Builder - Template Management System
 * 
 * Handles template storage, switching, and data persistence.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Template_Manager Class
 * 
 * Core System #4: Template Management System
 * Purpose: Template storage and switching
 */
class MKB_Template_Manager {
    
    /**
     * Instance
     * @var MKB_Template_Manager
     */
    private static $instance = null;
    
    /**
     * Templates table name
     * @var string
     */
    private $table_name;
    
    /**
     * Template cache
     * @var array
     */
    private $template_cache = array();
    
    /**
     * Cache expiry
     * @var int
     */
    private $cache_expiry = 3600; // 1 hour
    
    /**
     * Get instance
     * 
     * @return MKB_Template_Manager
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
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'mkb_templates';
        
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // AJAX endpoints
        add_action('wp_ajax_mkb_get_templates', array($this, 'ajax_get_templates'));
        add_action('wp_ajax_nopriv_mkb_get_templates', array($this, 'ajax_get_templates'));
        
        add_action('wp_ajax_mkb_get_template', array($this, 'ajax_get_template'));
        add_action('wp_ajax_nopriv_mkb_get_template', array($this, 'ajax_get_template'));
        
        add_action('wp_ajax_mkb_save_template', array($this, 'ajax_save_template'));
        add_action('wp_ajax_mkb_apply_template', array($this, 'ajax_apply_template'));
        add_action('wp_ajax_mkb_delete_template', array($this, 'ajax_delete_template'));
        
        // Cache management
        add_action('mkb_template_saved', array($this, 'clear_template_cache'));
        add_action('mkb_template_deleted', array($this, 'clear_template_cache'));
    }
    
    /**
     * Get all available templates
     * 
     * @param array $args
     * @return array
     */
    public function get_templates($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'category' => '',
            'is_system' => null,
            'is_active' => true,
            'user_id' => null,
            'search' => '',
            'orderby' => 'created_at',
            'order' => 'DESC',
            'limit' => -1,
            'offset' => 0
        );
        
        $args = wp_parse_args($args, $defaults);
        
        // Build cache key
        $cache_key = 'mkb_templates_' . md5(serialize($args));
        $cached = get_transient($cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        // Build query
        $where_conditions = array('1=1');
        $where_values = array();
        
        if (!empty($args['category'])) {
            $where_conditions[] = 'category = %s';
            $where_values[] = $args['category'];
        }
        
        if ($args['is_system'] !== null) {
            $where_conditions[] = 'is_system = %d';
            $where_values[] = (int) $args['is_system'];
        }
        
        if ($args['is_active'] !== null) {
            $where_conditions[] = 'is_active = %d';
            $where_values[] = (int) $args['is_active'];
        }
        
        if ($args['user_id'] !== null) {
            $where_conditions[] = 'author_id = %d';
            $where_values[] = (int) $args['user_id'];
        }
        
        if (!empty($args['search'])) {
            $where_conditions[] = '(name LIKE %s OR description LIKE %s)';
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // Build ORDER BY
        $allowed_orderby = array('id', 'name', 'category', 'created_at', 'updated_at');
        $orderby = in_array($args['orderby'], $allowed_orderby) ? $args['orderby'] : 'created_at';
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';
        
        // Build LIMIT
        $limit_clause = '';
        if ($args['limit'] > 0) {
            $limit_clause = $wpdb->prepare('LIMIT %d', $args['limit']);
            if ($args['offset'] > 0) {
                $limit_clause = $wpdb->prepare('LIMIT %d, %d', $args['offset'], $args['limit']);
            }
        }
        
        // Execute query
        $sql = "SELECT * FROM {$this->table_name} WHERE {$where_clause} ORDER BY {$orderby} {$order} {$limit_clause}";
        
        if (!empty($where_values)) {
            $sql = $wpdb->prepare($sql, $where_values);
        }
        
        $results = $wpdb->get_results($sql, ARRAY_A);
        
        // Process results
        $templates = array();
        foreach ($results as $template) {
            $templates[] = $this->process_template_data($template);
        }
        
        // Cache results
        set_transient($cache_key, $templates, $this->cache_expiry);
        
        return $templates;
    }
    
    /**
     * Get single template by ID or slug
     * 
     * @param int|string $template
     * @return array|null
     */
    public function get_template($template) {
        global $wpdb;
        
        if (empty($template)) {
            return null;
        }
        
        // Build cache key
        $cache_key = 'mkb_template_' . $template;
        $cached = get_transient($cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        // Determine if searching by ID or slug
        if (is_numeric($template)) {
            $sql = $wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE id = %d AND is_active = 1",
                $template
            );
        } else {
            $sql = $wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE slug = %s AND is_active = 1",
                $template
            );
        }
        
        $result = $wpdb->get_row($sql, ARRAY_A);
        
        if (!$result) {
            return null;
        }
        
        $template_data = $this->process_template_data($result);
        
        // Cache result
        set_transient($cache_key, $template_data, $this->cache_expiry);
        
        return $template_data;
    }
    
    /**
     * Save template
     * 
     * @param array $template_data
     * @return int|false Template ID on success, false on failure
     */
    public function save_template($template_data) {
        global $wpdb;
        
        if (empty($template_data['name'])) {
            return false;
        }
        
        // Prepare data
        $data = array(
            'name' => sanitize_text_field($template_data['name']),
            'description' => wp_kses_post($template_data['description'] ?? ''),
            'category' => sanitize_text_field($template_data['category'] ?? 'custom'),
            'template_data' => json_encode($template_data['data'] ?? array()),
            'is_system' => (int) ($template_data['is_system'] ?? 0),
            'is_active' => (int) ($template_data['is_active'] ?? 1),
            'author_id' => (int) ($template_data['author_id'] ?? get_current_user_id()),
            'updated_at' => current_time('mysql')
        );
        
        // Generate slug if not provided
        if (empty($template_data['slug'])) {
            $data['slug'] = $this->generate_unique_slug($data['name']);
        } else {
            $data['slug'] = $this->generate_unique_slug($template_data['slug'], $template_data['id'] ?? 0);
        }
        
        if (isset($template_data['id']) && $template_data['id'] > 0) {
            // Update existing template
            $template_id = (int) $template_data['id'];
            
            // Check permissions
            if (!$this->can_edit_template($template_id)) {
                return false;
            }
            
            $result = $wpdb->update(
                $this->table_name,
                $data,
                array('id' => $template_id),
                array('%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s'),
                array('%d')
            );
            
            if ($result !== false) {
                do_action('mkb_template_updated', $template_id, $data);
                return $template_id;
            }
        } else {
            // Create new template
            $data['created_at'] = current_time('mysql');
            
            $result = $wpdb->insert(
                $this->table_name,
                $data,
                array('%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s')
            );
            
            if ($result) {
                $template_id = $wpdb->insert_id;
                do_action('mkb_template_created', $template_id, $data);
                return $template_id;
            }
        }
        
        return false;
    }
    
    /**
     * Delete template
     * 
     * @param int $template_id
     * @return bool
     */
    public function delete_template($template_id) {
        global $wpdb;
        
        if (!$template_id || !$this->can_edit_template($template_id)) {
            return false;
        }
        
        // Don't delete system templates
        $template = $this->get_template($template_id);
        if ($template && $template['is_system']) {
            return false;
        }
        
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $template_id),
            array('%d')
        );
        
        if ($result) {
            do_action('mkb_template_deleted', $template_id);
            return true;
        }
        
        return false;
    }
    
    /**
     * Apply template to media kit
     * 
     * @param int $template_id
     * @param int $media_kit_id
     * @param bool $preserve_content
     * @return bool
     */
    public function apply_template($template_id, $media_kit_id, $preserve_content = true) {
        $template = $this->get_template($template_id);
        
        if (!$template || !$media_kit_id) {
            return false;
        }
        
        $template_data = $template['data'];
        
        if ($preserve_content) {
            // Get existing content and merge with template
            $existing_data = $this->get_media_kit_data($media_kit_id);
            $template_data = $this->merge_template_with_content($template_data, $existing_data);
        }
        
        // Save merged data to media kit
        $result = $this->save_media_kit_data($media_kit_id, $template_data);
        
        if ($result) {
            // Update media kit meta
            update_post_meta($media_kit_id, '_mkb_template_id', $template_id);
            update_post_meta($media_kit_id, '_mkb_template_applied_at', current_time('mysql'));
            
            do_action('mkb_template_applied', $template_id, $media_kit_id, $template_data);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get template categories
     * 
     * @return array
     */
    public function get_categories() {
        global $wpdb;
        
        $cache_key = 'mkb_template_categories';
        $cached = get_transient($cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        $categories = $wpdb->get_col(
            "SELECT DISTINCT category FROM {$this->table_name} WHERE is_active = 1 ORDER BY category ASC"
        );
        
        $categories_with_labels = array();
        foreach ($categories as $category) {
            $categories_with_labels[$category] = $this->get_category_label($category);
        }
        
        set_transient($cache_key, $categories_with_labels, $this->cache_expiry);
        
        return $categories_with_labels;
    }
    
    /**
     * AJAX: Get templates
     */
    public function ajax_get_templates() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $category = sanitize_text_field($_POST['category'] ?? '');
        $search = sanitize_text_field($_POST['search'] ?? '');
        $user_only = (bool) ($_POST['user_only'] ?? false);
        
        $args = array(
            'category' => $category,
            'search' => $search
        );
        
        if ($user_only && is_user_logged_in()) {
            $args['user_id'] = get_current_user_id();
            $args['is_system'] = 0;
        }
        
        $templates = $this->get_templates($args);
        
        wp_send_json_success($templates);
    }
    
    /**
     * AJAX: Get single template
     */
    public function ajax_get_template() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $template_id = sanitize_text_field($_POST['template_id'] ?? '');
        
        if (empty($template_id)) {
            wp_send_json_error('Template ID required');
            return;
        }
        
        $template = $this->get_template($template_id);
        
        if ($template) {
            wp_send_json_success($template);
        } else {
            wp_send_json_error('Template not found');
        }
    }
    
    /**
     * AJAX: Save template
     */
    public function ajax_save_template() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error('Authentication required');
            return;
        }
        
        $template_data = $_POST['template'] ?? array();
        
        if (empty($template_data['name'])) {
            wp_send_json_error('Template name required');
            return;
        }
        
        $template_id = $this->save_template($template_data);
        
        if ($template_id) {
            wp_send_json_success(array(
                'template_id' => $template_id,
                'message' => 'Template saved successfully'
            ));
        } else {
            wp_send_json_error('Failed to save template');
        }
    }
    
    /**
     * AJAX: Apply template
     */
    public function ajax_apply_template() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $template_id = (int) ($_POST['template_id'] ?? 0);
        $media_kit_id = (int) ($_POST['media_kit_id'] ?? 0);
        $preserve_content = (bool) ($_POST['preserve_content'] ?? true);
        
        if (!$template_id || !$media_kit_id) {
            wp_send_json_error('Template ID and Media Kit ID required');
            return;
        }
        
        // Check permissions
        if (!current_user_can('edit_post', $media_kit_id)) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $result = $this->apply_template($template_id, $media_kit_id, $preserve_content);
        
        if ($result) {
            wp_send_json_success('Template applied successfully');
        } else {
            wp_send_json_error('Failed to apply template');
        }
    }
    
    /**
     * AJAX: Delete template
     */
    public function ajax_delete_template() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $template_id = (int) ($_POST['template_id'] ?? 0);
        
        if (!$template_id) {
            wp_send_json_error('Template ID required');
            return;
        }
        
        $result = $this->delete_template($template_id);
        
        if ($result) {
            wp_send_json_success('Template deleted successfully');
        } else {
            wp_send_json_error('Failed to delete template');
        }
    }
    
    /**
     * Process template data
     * 
     * @param array $template
     * @return array
     */
    private function process_template_data($template) {
        // Decode JSON data
        if (isset($template['template_data'])) {
            $template['data'] = json_decode($template['template_data'], true);
            unset($template['template_data']);
        }
        
        // Add computed fields
        $template['category_label'] = $this->get_category_label($template['category']);
        $template['author_name'] = $this->get_author_name($template['author_id']);
        $template['can_edit'] = $this->can_edit_template($template['id']);
        
        return $template;
    }
    
    /**
     * Generate unique slug
     * 
     * @param string $text
     * @param int $exclude_id
     * @return string
     */
    private function generate_unique_slug($text, $exclude_id = 0) {
        global $wpdb;
        
        $slug = sanitize_title($text);
        $original_slug = $slug;
        $counter = 1;
        
        while ($this->slug_exists($slug, $exclude_id)) {
            $slug = $original_slug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Check if slug exists
     * 
     * @param string $slug
     * @param int $exclude_id
     * @return bool
     */
    private function slug_exists($slug, $exclude_id = 0) {
        global $wpdb;
        
        $sql = "SELECT COUNT(*) FROM {$this->table_name} WHERE slug = %s";
        $params = array($slug);
        
        if ($exclude_id > 0) {
            $sql .= " AND id != %d";
            $params[] = $exclude_id;
        }
        
        $count = $wpdb->get_var($wpdb->prepare($sql, $params));
        
        return $count > 0;
    }
    
    /**
     * Check if user can edit template
     * 
     * @param int $template_id
     * @return bool
     */
    private function can_edit_template($template_id) {
        if (!is_user_logged_in()) {
            return false;
        }
        
        if (current_user_can('manage_options')) {
            return true;
        }
        
        $template = $this->get_template($template_id);
        
        if (!$template) {
            return false;
        }
        
        // Can't edit system templates
        if ($template['is_system']) {
            return false;
        }
        
        // Can edit own templates
        return $template['author_id'] == get_current_user_id();
    }
    
    /**
     * Get category label
     * 
     * @param string $category
     * @return string
     */
    private function get_category_label($category) {
        $labels = array(
            'business' => __('Business', 'media-kit-builder'),
            'creative' => __('Creative', 'media-kit-builder'),
            'health' => __('Health & Wellness', 'media-kit-builder'),
            'technology' => __('Technology', 'media-kit-builder'),
            'author' => __('Author & Speaker', 'media-kit-builder'),
            'custom' => __('Custom', 'media-kit-builder')
        );
        
        return $labels[$category] ?? ucfirst($category);
    }
    
    /**
     * Get author name
     * 
     * @param int $author_id
     * @return string
     */
    private function get_author_name($author_id) {
        if (!$author_id) {
            return __('System', 'media-kit-builder');
        }
        
        $user = get_user_by('id', $author_id);
        return $user ? $user->display_name : __('Unknown', 'media-kit-builder');
    }
    
    /**
     * Merge template with existing content
     * 
     * @param array $template_data
     * @param array $existing_data
     * @return array
     */
    private function merge_template_with_content($template_data, $existing_data) {
        // Start with template as base
        $merged = $template_data;
        
        // Preserve content fields
        $content_fields = array('components', 'content', 'media', 'text');
        
        foreach ($content_fields as $field) {
            if (isset($existing_data[$field]) && !empty($existing_data[$field])) {
                $merged[$field] = $existing_data[$field];
            }
        }
        
        return apply_filters('mkb_merge_template_content', $merged, $template_data, $existing_data);
    }
    
    /**
     * Get media kit data
     * 
     * @param int $media_kit_id
     * @return array
     */
    private function get_media_kit_data($media_kit_id) {
        // This would integrate with the Pods system or post meta
        $data = get_post_meta($media_kit_id, '_mkb_data', true);
        return is_array($data) ? $data : array();
    }
    
    /**
     * Save media kit data
     * 
     * @param int $media_kit_id
     * @param array $data
     * @return bool
     */
    private function save_media_kit_data($media_kit_id, $data) {
        return update_post_meta($media_kit_id, '_mkb_data', $data);
    }
    
    /**
     * Clear template cache
     */
    public function clear_template_cache() {
        global $wpdb;
        
        // Delete all template-related transients
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mkb_template%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mkb_template%'");
    }
    
    /**
     * Get template statistics
     * 
     * @return array
     */
    public function get_template_stats() {
        global $wpdb;
        
        $total = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}");
        $system = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name} WHERE is_system = 1");
        $custom = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name} WHERE is_system = 0");
        $active = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name} WHERE is_active = 1");
        
        return array(
            'total' => (int) $total,
            'system' => (int) $system,
            'custom' => (int) $custom,
            'active' => (int) $active,
            'inactive' => (int) $total - (int) $active
        );
    }
}
