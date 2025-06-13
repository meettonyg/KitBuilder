<?php
/**
 * Media Kit Builder - Media Kit Model
 * 
 * Represents a complete media kit in the builder.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Media_Kit Class
 * 
 * Complete media kit model
 */
class MKB_Media_Kit {
    /**
     * Media kit ID
     * @var string
     */
    protected $id;
    
    /**
     * Media kit title
     * @var string
     */
    protected $title;
    
    /**
     * Media kit sections
     * @var array
     */
    protected $sections;
    
    /**
     * Media kit settings
     * @var array
     */
    protected $settings;
    
    /**
     * Media kit metadata
     * @var array
     */
    protected $metadata;
    
    /**
     * Constructor
     * 
     * @param string $id Media kit ID
     * @param string $title Media kit title
     * @param array $sections Media kit sections
     * @param array $settings Media kit settings
     * @param array $metadata Media kit metadata
     */
    public function __construct($id = '', $title = '', $sections = array(), $settings = array(), $metadata = array()) {
        $this->id = !empty($id) ? sanitize_text_field($id) : 'media_kit_' . wp_generate_uuid4();
        $this->title = sanitize_text_field($title);
        $this->sections = $sections;
        $this->settings = $this->sanitize_settings($settings);
        
        $default_metadata = array(
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            'created_by' => get_current_user_id(),
            'version' => '1.0.0',
            'template_id' => ''
        );
        
        $this->metadata = wp_parse_args($metadata, $default_metadata);
    }
    
    /**
     * Create from array
     * 
     * @param array $data Media kit data
     * @return MKB_Media_Kit Media kit instance
     */
    public static function from_array($data) {
        $sections = array();
        
        // Create section objects from array data
        if (isset($data['sections']) && is_array($data['sections'])) {
            foreach ($data['sections'] as $section_data) {
                $sections[] = MKB_Section::from_array($section_data);
            }
        }
        
        return new self(
            isset($data['id']) ? $data['id'] : '',
            isset($data['title']) ? $data['title'] : '',
            $sections,
            isset($data['settings']) ? $data['settings'] : array(),
            isset($data['metadata']) ? $data['metadata'] : array()
        );
    }
    
    /**
     * Convert to array
     * 
     * @return array Media kit data as array
     */
    public function to_array() {
        $sections_data = array();
        
        // Convert section objects to arrays
        foreach ($this->sections as $section) {
            if ($section instanceof MKB_Section) {
                $sections_data[] = $section->to_array();
            } elseif (is_array($section)) {
                $sections_data[] = $section;
            }
        }
        
        return array(
            'id' => $this->id,
            'title' => $this->title,
            'sections' => $sections_data,
            'settings' => $this->settings,
            'metadata' => $this->metadata
        );
    }
    
    /**
     * Convert to JSON
     * 
     * @return string Media kit data as JSON
     */
    public function to_json() {
        return wp_json_encode($this->to_array());
    }
    
    /**
     * Validate media kit data
     * 
     * @return bool|WP_Error True if valid, WP_Error otherwise
     */
    public function validate() {
        $errors = array();
        
        if (empty($this->id)) {
            $errors[] = new WP_Error('missing_id', __('Media kit ID is required', 'media-kit-builder'));
        }
        
        if (empty($this->title)) {
            $errors[] = new WP_Error('missing_title', __('Media kit title is required', 'media-kit-builder'));
        }
        
        // Validate sections
        foreach ($this->sections as $section) {
            if ($section instanceof MKB_Section) {
                $section_validation = $section->validate();
                if ($section_validation !== true) {
                    $errors = array_merge($errors, $section_validation);
                }
            }
        }
        
        if (!empty($errors)) {
            return $errors;
        }
        
        return true;
    }
    
    /**
     * Save media kit to database
     * 
     * @param int $user_id User ID
     * @return bool|string False on failure, entry key on success
     */
    public function save($user_id = 0) {
        global $wpdb;
        
        // Validate before saving
        $validation = $this->validate();
        if ($validation !== true) {
            return false;
        }
        
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Check if table exists, create if it doesn't
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            $this->create_media_kits_table();
        }
        
        // Update metadata
        $this->metadata['updated_at'] = current_time('mysql');
        
        // Set user ID if not provided
        if (empty($user_id)) {
            $user_id = get_current_user_id();
        }
        
        // Prepare data for insertion
        $entry_key = $this->id;
        $data = array(
            'entry_key' => $entry_key,
            'user_id' => $user_id,
            'title' => $this->title,
            'data' => wp_json_encode($this->to_array()),
            'created' => $this->metadata['created_at'],
            'modified' => $this->metadata['updated_at']
        );
        
        // Check if media kit already exists
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table_name WHERE entry_key = %s",
                $entry_key
            )
        );
        
        if ($existing) {
            // Update existing media kit
            $result = $wpdb->update(
                $table_name,
                $data,
                array('id' => $existing),
                array('%s', '%d', '%s', '%s', '%s', '%s'),
                array('%d')
            );
            
            if ($result !== false) {
                return $entry_key;
            }
        } else {
            // Insert new media kit
            $result = $wpdb->insert(
                $table_name,
                $data,
                array('%s', '%d', '%s', '%s', '%s', '%s')
            );
            
            if ($result) {
                return $entry_key;
            }
        }
        
        return false;
    }
    
    /**
     * Delete media kit from database
     * 
     * @param int $user_id User ID
     * @return bool True on success, false on failure
     */
    public function delete($user_id = 0) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Set user ID if not provided
        if (empty($user_id)) {
            $user_id = get_current_user_id();
        }
        
        // Delete media kit
        $result = $wpdb->delete(
            $table_name,
            array(
                'entry_key' => $this->id,
                'user_id' => $user_id
            ),
            array('%s', '%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Get media kit by ID
     * 
     * @param string $media_kit_id Media kit ID
     * @param int $user_id User ID
     * @return MKB_Media_Kit|false Media kit instance or false if not found
     */
    public static function get_by_id($media_kit_id, $user_id = 0) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Set user ID if not provided
        if (empty($user_id)) {
            $user_id = get_current_user_id();
        }
        
        // Get media kit data
        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE entry_key = %s AND user_id = %d",
                $media_kit_id,
                $user_id
            ),
            ARRAY_A
        );
        
        if (!$result) {
            return false;
        }
        
        // Parse data
        $data = json_decode($result['data'], true);
        
        if (!$data) {
            return false;
        }
        
        // Create media kit instance
        return self::from_array($data);
    }
    
    /**
     * Get all media kits for a user
     * 
     * @param int $user_id User ID
     * @return array Array of media kit summary data
     */
    public static function get_all_for_user($user_id = 0) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Set user ID if not provided
        if (empty($user_id)) {
            $user_id = get_current_user_id();
        }
        
        // Get all media kits for user
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT entry_key, title, created, modified FROM $table_name WHERE user_id = %d ORDER BY modified DESC",
                $user_id
            ),
            ARRAY_A
        );
        
        return $results ?: array();
    }
    
    /**
     * Create media kits table
     * 
     * @return bool True on success, false on failure
     */
    private function create_media_kits_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'media_kits';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            entry_key varchar(100) NOT NULL,
            user_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL,
            data longtext NOT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY entry_key (entry_key),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        return dbDelta($sql) ? true : false;
    }
    
    /**
     * Sanitize media kit settings
     * 
     * @param array $settings Media kit settings
     * @return array Sanitized settings
     */
    private function sanitize_settings($settings) {
        if (!is_array($settings)) {
            return array();
        }
        
        $default_settings = array(
            'theme' => 'default',
            'colors' => array(
                'primary' => '#0ea5e9',
                'secondary' => '#3b82f6',
                'background' => '#ffffff',
                'text' => '#333333'
            ),
            'typography' => array(
                'headingFont' => 'Inter',
                'bodyFont' => 'Inter',
                'baseSize' => '16px'
            ),
            'spacing' => array(
                'containerWidth' => '1200px',
                'sectionPadding' => '48px'
            ),
            'branding' => array(
                'logo' => '',
                'favicon' => ''
            ),
            'seo' => array(
                'title' => '',
                'description' => '',
                'keywords' => ''
            ),
            'sharing' => array(
                'image' => '',
                'title' => '',
                'description' => ''
            ),
            'visibility' => array(
                'isPublic' => true,
                'requiresPassword' => false,
                'password' => ''
            )
        );
        
        $settings = wp_parse_args($settings, $default_settings);
        
        // Sanitize specific settings
        if (isset($settings['theme'])) {
            $settings['theme'] = sanitize_text_field($settings['theme']);
        }
        
        if (isset($settings['colors']) && is_array($settings['colors'])) {
            foreach ($settings['colors'] as $key => $value) {
                $settings['colors'][$key] = sanitize_text_field($value);
            }
        }
        
        if (isset($settings['typography']) && is_array($settings['typography'])) {
            foreach ($settings['typography'] as $key => $value) {
                $settings['typography'][$key] = sanitize_text_field($value);
            }
        }
        
        if (isset($settings['spacing']) && is_array($settings['spacing'])) {
            foreach ($settings['spacing'] as $key => $value) {
                $settings['spacing'][$key] = sanitize_text_field($value);
            }
        }
        
        if (isset($settings['seo']) && is_array($settings['seo'])) {
            foreach ($settings['seo'] as $key => $value) {
                $settings['seo'][$key] = sanitize_text_field($value);
            }
        }
        
        if (isset($settings['sharing']) && is_array($settings['sharing'])) {
            foreach ($settings['sharing'] as $key => $value) {
                if ($key !== 'image') {
                    $settings['sharing'][$key] = sanitize_text_field($value);
                }
            }
        }
        
        if (isset($settings['visibility']) && is_array($settings['visibility'])) {
            if (isset($settings['visibility']['isPublic'])) {
                $settings['visibility']['isPublic'] = (bool) $settings['visibility']['isPublic'];
            }
            
            if (isset($settings['visibility']['requiresPassword'])) {
                $settings['visibility']['requiresPassword'] = (bool) $settings['visibility']['requiresPassword'];
            }
            
            if (isset($settings['visibility']['password'])) {
                $settings['visibility']['password'] = sanitize_text_field($settings['visibility']['password']);
            }
        }
        
        return $settings;
    }
    
    /**
     * Add section to media kit
     * 
     * @param MKB_Section|array $section Section instance or data
     * @param int $position Position to insert section
     * @return bool True on success, false on failure
     */
    public function add_section($section, $position = null) {
        // Convert array to section object if needed
        if (is_array($section)) {
            $section = MKB_Section::from_array($section);
        }
        
        if (!($section instanceof MKB_Section)) {
            return false;
        }
        
        // Insert at specific position or append
        if ($position !== null && $position >= 0 && $position <= count($this->sections)) {
            array_splice($this->sections, $position, 0, array($section));
        } else {
            $this->sections[] = $section;
        }
        
        // Update metadata
        $this->metadata['updated_at'] = current_time('mysql');
        
        return true;
    }
    
    /**
     * Remove section from media kit
     * 
     * @param string $section_id Section ID
     * @return bool True on success, false on failure
     */
    public function remove_section($section_id) {
        foreach ($this->sections as $key => $section) {
            if ($section instanceof MKB_Section && $section->id === $section_id) {
                unset($this->sections[$key]);
                $this->sections = array_values($this->sections); // Reindex array
                
                // Update metadata
                $this->metadata['updated_at'] = current_time('mysql');
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Move section to new position
     * 
     * @param string $section_id Section ID
     * @param int $new_position New position
     * @return bool True on success, false on failure
     */
    public function move_section($section_id, $new_position) {
        if ($new_position < 0 || $new_position >= count($this->sections)) {
            return false;
        }
        
        $section_index = -1;
        
        // Find section index
        foreach ($this->sections as $key => $section) {
            if ($section instanceof MKB_Section && $section->id === $section_id) {
                $section_index = $key;
                break;
            }
        }
        
        if ($section_index === -1) {
            return false;
        }
        
        // Remove section from current position
        $section = $this->sections[$section_index];
        unset($this->sections[$section_index]);
        $this->sections = array_values($this->sections); // Reindex array
        
        // Insert at new position
        array_splice($this->sections, $new_position, 0, array($section));
        
        // Update metadata
        $this->metadata['updated_at'] = current_time('mysql');
        
        return true;
    }
    
    /**
     * Get section by ID
     * 
     * @param string $section_id Section ID
     * @return MKB_Section|false Section instance or false if not found
     */
    public function get_section($section_id) {
        foreach ($this->sections as $section) {
            if ($section instanceof MKB_Section && $section->id === $section_id) {
                return $section;
            }
        }
        
        return false;
    }
    
    /**
     * Get media kit ID
     * 
     * @return string Media kit ID
     */
    public function get_id() {
        return $this->id;
    }
    
    /**
     * Get media kit title
     * 
     * @return string Media kit title
     */
    public function get_title() {
        return $this->title;
    }
    
    /**
     * Get media kit sections
     * 
     * @return array Media kit sections
     */
    public function get_sections() {
        return $this->sections;
    }
    
    /**
     * Get media kit settings
     * 
     * @return array Media kit settings
     */
    public function get_settings() {
        return $this->settings;
    }
    
    /**
     * Get media kit metadata
     * 
     * @return array Media kit metadata
     */
    public function get_metadata() {
        return $this->metadata;
    }
    
    /**
     * Set media kit title
     * 
     * @param string $title Media kit title
     * @return void
     */
    public function set_title($title) {
        $this->title = sanitize_text_field($title);
        $this->metadata['updated_at'] = current_time('mysql');
    }
    
    /**
     * Set media kit settings
     * 
     * @param array $settings Media kit settings
     * @return void
     */
    public function set_settings($settings) {
        $this->settings = $this->sanitize_settings($settings);
        $this->metadata['updated_at'] = current_time('mysql');
    }
    
    /**
     * Set media kit metadata
     * 
     * @param array $metadata Media kit metadata
     * @return void
     */
    public function set_metadata($metadata) {
        $this->metadata = wp_parse_args($metadata, $this->metadata);
        $this->metadata['updated_at'] = current_time('mysql');
    }
}
