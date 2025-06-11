<?php
/**
 * Media Kit Builder - Component Registry System
 * 
 * Handles drag-drop component management and registration.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Component_Registry Class
 * 
 * Core System #5: Component Registry System
 * Purpose: Drag-drop component management
 */
class MKB_Component_Registry {
    
    /**
     * Instance
     * @var MKB_Component_Registry
     */
    private static $instance = null;
    
    /**
     * Registered components
     * @var array
     */
    private $components = array();
    
    /**
     * Component categories
     * @var array
     */
    private $categories = array();
    
    /**
     * Premium components
     * @var array
     */
    private $premium_components = array();
    
    /**
     * Get instance
     * 
     * @return MKB_Component_Registry
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
        $this->register_default_components();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // AJAX endpoints
        add_action('wp_ajax_mkb_get_components', array($this, 'ajax_get_components'));
        add_action('wp_ajax_nopriv_mkb_get_components', array($this, 'ajax_get_components'));
        
        add_action('wp_ajax_mkb_render_component', array($this, 'ajax_render_component'));
        add_action('wp_ajax_nopriv_mkb_render_component', array($this, 'ajax_render_component'));
        
        add_action('wp_ajax_mkb_validate_component', array($this, 'ajax_validate_component'));
        add_action('wp_ajax_nopriv_mkb_validate_component', array($this, 'ajax_validate_component'));
        
        // Allow external registration
        add_action('mkb_register_components', array($this, 'allow_external_registration'));
    }
    
    /**
     * Register default components
     */
    private function register_default_components() {
        // Hero Section Component
        $this->register_component('hero', array(
            'name' => __('Hero Section', 'media-kit-builder'),
            'description' => __('Main profile section with photo, name, and title', 'media-kit-builder'),
            'category' => 'essential',
            'icon' => 'user',
            'premium' => false,
            'fields' => array(
                'guest_first_name' => array(
                    'type' => 'text',
                    'label' => __('First Name', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'guest_last_name' => array(
                    'type' => 'text',
                    'label' => __('Last Name', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'guest_title' => array(
                    'type' => 'text',
                    'label' => __('Professional Title', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'guest_tagline' => array(
                    'type' => 'text',
                    'label' => __('Tagline', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'guest_headshot' => array(
                    'type' => 'image',
                    'label' => __('Profile Photo', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'image'
                )
            ),
            'template' => $this->get_hero_template(),
            'styles' => $this->get_hero_styles()
        ));
        
        // Biography Component
        $this->register_component('biography', array(
            'name' => __('Biography', 'media-kit-builder'),
            'description' => __('Professional biography and background', 'media-kit-builder'),
            'category' => 'essential',
            'icon' => 'document-text',
            'premium' => false,
            'fields' => array(
                'guest_biography' => array(
                    'type' => 'wysiwyg',
                    'label' => __('Biography', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'wysiwyg',
                    'min_words' => 50,
                    'max_words' => 500
                )
            ),
            'template' => $this->get_biography_template(),
            'styles' => $this->get_biography_styles()
        ));
        
        // Topics Component
        $this->register_component('topics', array(
            'name' => __('Speaking Topics', 'media-kit-builder'),
            'description' => __('Areas of expertise and speaking topics', 'media-kit-builder'),
            'category' => 'essential',
            'icon' => 'chat-bubble-left-right',
            'premium' => false,
            'fields' => array(
                'guest_topic_1' => array(
                    'type' => 'text',
                    'label' => __('Topic 1', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text',
                    'maxlength' => 50
                ),
                'guest_topic_2' => array(
                    'type' => 'text',
                    'label' => __('Topic 2', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text',
                    'maxlength' => 50
                ),
                'guest_topic_3' => array(
                    'type' => 'text',
                    'label' => __('Topic 3', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text',
                    'maxlength' => 50
                ),
                'guest_topic_4' => array(
                    'type' => 'text',
                    'label' => __('Topic 4', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text',
                    'maxlength' => 50
                ),
                'guest_topic_5' => array(
                    'type' => 'text',
                    'label' => __('Topic 5', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text',
                    'maxlength' => 50
                )
            ),
            'template' => $this->get_topics_template(),
            'styles' => $this->get_topics_styles()
        ));
        
        // Social Media Component
        $this->register_component('social', array(
            'name' => __('Social Media', 'media-kit-builder'),
            'description' => __('Social media profiles and links', 'media-kit-builder'),
            'category' => 'essential',
            'icon' => 'share',
            'premium' => false,
            'fields' => array(
                'guest_facebook' => array(
                    'type' => 'url',
                    'label' => __('Facebook', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                ),
                'guest_twitter' => array(
                    'type' => 'url',
                    'label' => __('Twitter/X', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                ),
                'guest_linkedin' => array(
                    'type' => 'url',
                    'label' => __('LinkedIn', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                ),
                'guest_instagram' => array(
                    'type' => 'url',
                    'label' => __('Instagram', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                ),
                'guest_youtube' => array(
                    'type' => 'url',
                    'label' => __('YouTube', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                )
            ),
            'template' => $this->get_social_template(),
            'styles' => $this->get_social_styles()
        ));
        
        // Statistics Component
        $this->register_component('statistics', array(
            'name' => __('Key Statistics', 'media-kit-builder'),
            'description' => __('Important numbers and metrics', 'media-kit-builder'),
            'category' => 'content',
            'icon' => 'chart-bar',
            'premium' => false,
            'fields' => array(
                'stat_1_number' => array(
                    'type' => 'text',
                    'label' => __('Statistic 1 Number', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'stat_1_label' => array(
                    'type' => 'text',
                    'label' => __('Statistic 1 Label', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'stat_2_number' => array(
                    'type' => 'text',
                    'label' => __('Statistic 2 Number', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                ),
                'stat_2_label' => array(
                    'type' => 'text',
                    'label' => __('Statistic 2 Label', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                )
            ),
            'template' => $this->get_statistics_template(),
            'styles' => $this->get_statistics_styles()
        ));
        
        // Contact Component
        $this->register_component('contact', array(
            'name' => __('Contact Information', 'media-kit-builder'),
            'description' => __('Contact details and booking information', 'media-kit-builder'),
            'category' => 'content',
            'icon' => 'envelope',
            'premium' => false,
            'fields' => array(
                'contact_email' => array(
                    'type' => 'email',
                    'label' => __('Email Address', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'email'
                ),
                'contact_phone' => array(
                    'type' => 'tel',
                    'label' => __('Phone Number', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'phone'
                ),
                'contact_website' => array(
                    'type' => 'url',
                    'label' => __('Website', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'url'
                )
            ),
            'template' => $this->get_contact_template(),
            'styles' => $this->get_contact_styles()
        ));
        
        // Logo Grid Component (Premium)
        $this->register_component('logo_grid', array(
            'name' => __('Logo Grid', 'media-kit-builder'),
            'description' => __('Showcase client and partner logos', 'media-kit-builder'),
            'category' => 'media',
            'icon' => 'squares-2x2',
            'premium' => true,
            'fields' => array(
                'guest_carousel_images' => array(
                    'type' => 'gallery',
                    'label' => __('Logo Images', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'images',
                    'max_files' => 12
                )
            ),
            'template' => $this->get_logo_grid_template(),
            'styles' => $this->get_logo_grid_styles()
        ));
        
        // Video Component (Premium)
        $this->register_component('video', array(
            'name' => __('Video Introduction', 'media-kit-builder'),
            'description' => __('Embedded video player for introductions', 'media-kit-builder'),
            'category' => 'media',
            'icon' => 'video-camera',
            'premium' => true,
            'fields' => array(
                'video_url' => array(
                    'type' => 'url',
                    'label' => __('Video URL', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'video_url'
                ),
                'video_title' => array(
                    'type' => 'text',
                    'label' => __('Video Title', 'media-kit-builder'),
                    'required' => false,
                    'validation' => 'text'
                )
            ),
            'template' => $this->get_video_template(),
            'styles' => $this->get_video_styles()
        ));
        
        // Initialize categories
        $this->init_categories();
        
        // Allow external components to be registered
        do_action('mkb_register_components', $this);
    }
    
    /**
     * Initialize component categories
     */
    private function init_categories() {
        $this->categories = array(
            'essential' => array(
                'name' => __('Essential', 'media-kit-builder'),
                'description' => __('Core components for every media kit', 'media-kit-builder'),
                'icon' => 'star',
                'order' => 1
            ),
            'content' => array(
                'name' => __('Content', 'media-kit-builder'),
                'description' => __('Additional content components', 'media-kit-builder'),
                'icon' => 'document-text',
                'order' => 2
            ),
            'media' => array(
                'name' => __('Media', 'media-kit-builder'),
                'description' => __('Images, videos, and galleries', 'media-kit-builder'),
                'icon' => 'photo',
                'order' => 3
            ),
            'premium' => array(
                'name' => __('Premium', 'media-kit-builder'),
                'description' => __('Advanced components for Pro users', 'media-kit-builder'),
                'icon' => 'sparkles',
                'order' => 4
            )
        );
    }
    
    /**
     * Register a component
     * 
     * @param string $id
     * @param array $args
     * @return bool
     */
    public function register_component($id, $args) {
        if (empty($id) || isset($this->components[$id])) {
            return false;
        }
        
        $defaults = array(
            'name' => '',
            'description' => '',
            'category' => 'content',
            'icon' => 'squares-2x2',
            'premium' => false,
            'fields' => array(),
            'template' => '',
            'styles' => '',
            'scripts' => '',
            'dependencies' => array(),
            'version' => '1.0.0',
            'author' => '',
            'preview_image' => ''
        );
        
        $component = wp_parse_args($args, $defaults);
        $component['id'] = $id;
        
        // Validate required fields
        if (empty($component['name'])) {
            return false;
        }
        
        // Store component
        $this->components[$id] = $component;
        
        // Track premium components
        if ($component['premium']) {
            $this->premium_components[] = $id;
        }
        
        do_action('mkb_component_registered', $id, $component);
        
        return true;
    }
    
    /**
     * Get all components
     * 
     * @param array $args
     * @return array
     */
    public function get_components($args = array()) {
        $defaults = array(
            'category' => '',
            'premium' => null,
            'user_access' => true
        );
        
        $args = wp_parse_args($args, $defaults);
        $components = $this->components;
        
        // Filter by category
        if (!empty($args['category'])) {
            $components = array_filter($components, function($component) use ($args) {
                return $component['category'] === $args['category'];
            });
        }
        
        // Filter by premium status
        if ($args['premium'] !== null) {
            $components = array_filter($components, function($component) use ($args) {
                return $component['premium'] === (bool) $args['premium'];
            });
        }
        
        // Check user access
        if ($args['user_access']) {
            $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
            
            foreach ($components as $id => $component) {
                if ($component['premium'] && $wpfusion_reader) {
                    $components[$id]['can_access'] = $wpfusion_reader->can_access_feature('premium_components');
                } else {
                    $components[$id]['can_access'] = true;
                }
            }
        }
        
        return $components;
    }
    
    /**
     * Get single component
     * 
     * @param string $id
     * @return array|null
     */
    public function get_component($id) {
        return isset($this->components[$id]) ? $this->components[$id] : null;
    }
    
    /**
     * Render component
     * 
     * @param string $id
     * @param array $data
     * @param array $options
     * @return string
     */
    public function render_component($id, $data = array(), $options = array()) {
        $component = $this->get_component($id);
        
        if (!$component) {
            return '';
        }
        
        // Check access for premium components
        if ($component['premium']) {
            $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
            if ($wpfusion_reader && !$wpfusion_reader->can_access_feature('premium_components')) {
                return $this->render_upgrade_prompt($component);
            }
        }
        
        $defaults = array(
            'edit_mode' => false,
            'preview_mode' => false,
            'export_mode' => false
        );
        
        $options = wp_parse_args($options, $defaults);
        
        // Prepare template variables
        $template_vars = array(
            'component' => $component,
            'data' => $data,
            'options' => $options,
            'component_id' => $id,
            'unique_id' => uniqid('mkb_' . $id . '_')
        );
        
        // Render template
        $output = $this->render_template($component['template'], $template_vars);
        
        // Add component wrapper if in edit mode
        if ($options['edit_mode']) {
            $output = $this->wrap_editable_component($output, $id, $options);
        }
        
        return apply_filters('mkb_render_component', $output, $id, $data, $options);
    }
    
    /**
     * Validate component data
     * 
     * @param string $id
     * @param array $data
     * @return array
     */
    public function validate_component_data($id, $data) {
        $component = $this->get_component($id);
        $errors = array();
        
        if (!$component) {
            $errors[] = __('Component not found', 'media-kit-builder');
            return $errors;
        }
        
        foreach ($component['fields'] as $field_id => $field_config) {
            $value = $data[$field_id] ?? '';
            
            // Check required fields
            if ($field_config['required'] && empty($value)) {
                $errors[] = sprintf(
                    __('Field "%s" is required', 'media-kit-builder'),
                    $field_config['label']
                );
                continue;
            }
            
            // Validate field type
            $validation_result = $this->validate_field($value, $field_config);
            if ($validation_result !== true) {
                $errors[] = sprintf(
                    __('Field "%s": %s', 'media-kit-builder'),
                    $field_config['label'],
                    $validation_result
                );
            }
        }
        
        return $errors;
    }
    
    /**
     * AJAX: Get components
     */
    public function ajax_get_components() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $category = sanitize_text_field($_POST['category'] ?? '');
        $premium = isset($_POST['premium']) ? (bool) $_POST['premium'] : null;
        
        $components = $this->get_components(array(
            'category' => $category,
            'premium' => $premium,
            'user_access' => true
        ));
        
        $categories = $this->get_categories();
        
        wp_send_json_success(array(
            'components' => $components,
            'categories' => $categories
        ));
    }
    
    /**
     * AJAX: Render component
     */
    public function ajax_render_component() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $component_id = sanitize_text_field($_POST['component_id'] ?? '');
        $data = $_POST['data'] ?? array();
        $options = $_POST['options'] ?? array();
        
        if (empty($component_id)) {
            wp_send_json_error('Component ID required');
            return;
        }
        
        $rendered = $this->render_component($component_id, $data, $options);
        
        if ($rendered) {
            wp_send_json_success(array('html' => $rendered));
        } else {
            wp_send_json_error('Failed to render component');
        }
    }
    
    /**
     * AJAX: Validate component
     */
    public function ajax_validate_component() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $component_id = sanitize_text_field($_POST['component_id'] ?? '');
        $data = $_POST['data'] ?? array();
        
        if (empty($component_id)) {
            wp_send_json_error('Component ID required');
            return;
        }
        
        $errors = $this->validate_component_data($component_id, $data);
        
        if (empty($errors)) {
            wp_send_json_success('Validation passed');
        } else {
            wp_send_json_error(array(
                'message' => 'Validation failed',
                'errors' => $errors
            ));
        }
    }
    
    /**
     * Get component categories
     * 
     * @return array
     */
    public function get_categories() {
        return $this->categories;
    }
    
    /**
     * Get premium components
     * 
     * @return array
     */
    public function get_premium_components() {
        return $this->premium_components;
    }
    
    /**
     * Check if component is premium
     * 
     * @param string $id
     * @return bool
     */
    public function is_premium_component($id) {
        return in_array($id, $this->premium_components);
    }
    
    /**
     * Validate field
     * 
     * @param mixed $value
     * @param array $field_config
     * @return bool|string
     */
    private function validate_field($value, $field_config) {
        $validation = $field_config['validation'] ?? 'text';
        
        switch ($validation) {
            case 'email':
                return is_email($value) ? true : __('Invalid email address', 'media-kit-builder');
                
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL) ? true : __('Invalid URL', 'media-kit-builder');
                
            case 'phone':
                return preg_match('/^[\+]?[0-9\s\-\(\)]+$/', $value) ? true : __('Invalid phone number', 'media-kit-builder');
                
            case 'image':
                return $this->validate_image($value);
                
            case 'video_url':
                return $this->validate_video_url($value);
                
            case 'wysiwyg':
                return $this->validate_wysiwyg($value, $field_config);
                
            default:
                return $this->validate_text($value, $field_config);
        }
    }
    
    /**
     * Validate text field
     * 
     * @param string $value
     * @param array $field_config
     * @return bool|string
     */
    private function validate_text($value, $field_config) {
        if (isset($field_config['maxlength']) && strlen($value) > $field_config['maxlength']) {
            return sprintf(
                __('Text must be no more than %d characters', 'media-kit-builder'),
                $field_config['maxlength']
            );
        }
        
        return true;
    }
    
    /**
     * Validate WYSIWYG field
     * 
     * @param string $value
     * @param array $field_config
     * @return bool|string
     */
    private function validate_wysiwyg($value, $field_config) {
        $word_count = str_word_count(strip_tags($value));
        
        if (isset($field_config['min_words']) && $word_count < $field_config['min_words']) {
            return sprintf(
                __('Content must be at least %d words', 'media-kit-builder'),
                $field_config['min_words']
            );
        }
        
        if (isset($field_config['max_words']) && $word_count > $field_config['max_words']) {
            return sprintf(
                __('Content must be no more than %d words', 'media-kit-builder'),
                $field_config['max_words']
            );
        }
        
        return true;
    }
    
    /**
     * Validate image
     * 
     * @param mixed $value
     * @return bool|string
     */
    private function validate_image($value) {
        if (empty($value)) {
            return true;
        }
        
        if (is_numeric($value)) {
            $attachment = get_post($value);
            if ($attachment && strpos($attachment->post_mime_type, 'image/') === 0) {
                return true;
            }
        }
        
        return __('Invalid image', 'media-kit-builder');
    }
    
    /**
     * Validate video URL
     * 
     * @param string $value
     * @return bool|string
     */
    private function validate_video_url($value) {
        if (empty($value)) {
            return true;
        }
        
        // Check for YouTube, Vimeo, or other video platforms
        $video_patterns = array(
            '/youtube\.com\/watch\?v=/',
            '/youtu\.be\//',
            '/vimeo\.com\//',
            '/wistia\.com\//'
        );
        
        foreach ($video_patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        return __('Invalid video URL. Supported platforms: YouTube, Vimeo, Wistia', 'media-kit-builder');
    }
    
    /**
     * Render template
     * 
     * @param string $template
     * @param array $vars
     * @return string
     */
    private function render_template($template, $vars) {
        if (empty($template)) {
            return '';
        }
        
        // Extract variables for template
        extract($vars);
        
        // Start output buffering
        ob_start();
        
        // Evaluate template (simplified - in real implementation, use proper templating)
        eval('?>' . $template);
        
        return ob_get_clean();
    }
    
    /**
     * Wrap component for editing
     * 
     * @param string $content
     * @param string $component_id
     * @param array $options
     * @return string
     */
    private function wrap_editable_component($content, $component_id, $options) {
        return sprintf(
            '<div class="mkb-component-wrapper" data-component="%s" data-editable="true">%s</div>',
            esc_attr($component_id),
            $content
        );
    }
    
    /**
     * Render upgrade prompt for premium components
     * 
     * @param array $component
     * @return string
     */
    private function render_upgrade_prompt($component) {
        return sprintf(
            '<div class="mkb-upgrade-prompt">
                <h3>%s</h3>
                <p>%s</p>
                <button class="mkb-upgrade-btn">%s</button>
            </div>',
            sprintf(__('Upgrade to use %s', 'media-kit-builder'), $component['name']),
            __('This is a premium component. Upgrade to Pro to unlock advanced features.', 'media-kit-builder'),
            __('Upgrade Now', 'media-kit-builder')
        );
    }
    
    /**
     * Allow external component registration
     */
    public function allow_external_registration() {
        // This allows other plugins/themes to register components
        // Called via the mkb_register_components action hook
    }
    
    // Component template methods (simplified - would contain actual HTML templates)
    
    private function get_hero_template() {
        return '<div class="mkb-hero-section">
            <div class="mkb-hero-avatar">
                <?php if (!empty($data["guest_headshot"])): ?>
                    <img src="<?php echo wp_get_attachment_image_url($data["guest_headshot"], "medium"); ?>" alt="Profile Photo" />
                <?php endif; ?>
            </div>
            <h1 class="mkb-hero-name"><?php echo esc_html($data["guest_first_name"] . " " . $data["guest_last_name"]); ?></h1>
            <div class="mkb-hero-title"><?php echo esc_html($data["guest_title"]); ?></div>
            <div class="mkb-hero-tagline"><?php echo esc_html($data["guest_tagline"]); ?></div>
        </div>';
    }
    
    private function get_biography_template() {
        return '<div class="mkb-biography-section">
            <h2>About</h2>
            <div class="mkb-biography-content"><?php echo wp_kses_post($data["guest_biography"]); ?></div>
        </div>';
    }
    
    private function get_topics_template() {
        return '<div class="mkb-topics-section">
            <h2>Speaking Topics</h2>
            <div class="mkb-topics-grid">
                <?php for($i = 1; $i <= 5; $i++): ?>
                    <?php if (!empty($data["guest_topic_" . $i])): ?>
                        <div class="mkb-topic-item"><?php echo esc_html($data["guest_topic_" . $i]); ?></div>
                    <?php endif; ?>
                <?php endfor; ?>
            </div>
        </div>';
    }
    
    private function get_social_template() {
        return '<div class="mkb-social-section">
            <div class="mkb-social-links">
                <?php foreach(["facebook", "twitter", "linkedin", "instagram", "youtube"] as $platform): ?>
                    <?php if (!empty($data["guest_" . $platform])): ?>
                        <a href="<?php echo esc_url($data["guest_" . $platform]); ?>" class="mkb-social-link mkb-social-<?php echo $platform; ?>" target="_blank">
                            <span class="mkb-social-icon"></span>
                        </a>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>';
    }
    
    private function get_statistics_template() {
        return '<div class="mkb-statistics-section">
            <h2>Key Statistics</h2>
            <div class="mkb-stats-grid">
                <div class="mkb-stat-item">
                    <span class="mkb-stat-number"><?php echo esc_html($data["stat_1_number"]); ?></span>
                    <span class="mkb-stat-label"><?php echo esc_html($data["stat_1_label"]); ?></span>
                </div>
                <div class="mkb-stat-item">
                    <span class="mkb-stat-number"><?php echo esc_html($data["stat_2_number"]); ?></span>
                    <span class="mkb-stat-label"><?php echo esc_html($data["stat_2_label"]); ?></span>
                </div>
            </div>
        </div>';
    }
    
    private function get_contact_template() {
        return '<div class="mkb-contact-section">
            <h2>Contact Information</h2>
            <div class="mkb-contact-info">
                <?php if (!empty($data["contact_email"])): ?>
                    <div class="mkb-contact-item">
                        <span class="mkb-contact-icon">📧</span>
                        <a href="mailto:<?php echo esc_attr($data["contact_email"]); ?>"><?php echo esc_html($data["contact_email"]); ?></a>
                    </div>
                <?php endif; ?>
                <?php if (!empty($data["contact_phone"])): ?>
                    <div class="mkb-contact-item">
                        <span class="mkb-contact-icon">📱</span>
                        <a href="tel:<?php echo esc_attr($data["contact_phone"]); ?>"><?php echo esc_html($data["contact_phone"]); ?></a>
                    </div>
                <?php endif; ?>
                <?php if (!empty($data["contact_website"])): ?>
                    <div class="mkb-contact-item">
                        <span class="mkb-contact-icon">🌐</span>
                        <a href="<?php echo esc_url($data["contact_website"]); ?>" target="_blank"><?php echo esc_html($data["contact_website"]); ?></a>
                    </div>
                <?php endif; ?>
            </div>
        </div>';
    }
    
    private function get_logo_grid_template() {
        return '<div class="mkb-logo-grid-section">
            <h2>Featured Partners</h2>
            <div class="mkb-logo-grid">
                <?php if (!empty($data["guest_carousel_images"])): ?>
                    <?php $images = is_array($data["guest_carousel_images"]) ? $data["guest_carousel_images"] : array($data["guest_carousel_images"]); ?>
                    <?php foreach($images as $image_id): ?>
                        <div class="mkb-logo-item">
                            <img src="<?php echo wp_get_attachment_image_url($image_id, "medium"); ?>" alt="Partner Logo" />
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>';
    }
    
    private function get_video_template() {
        return '<div class="mkb-video-section">
            <h2><?php echo esc_html($data["video_title"] ?: "Video Introduction"); ?></h2>
            <div class="mkb-video-container">
                <?php if (!empty($data["video_url"])): ?>
                    <iframe src="<?php echo esc_url($data["video_url"]); ?>" width="100%" height="315" frameborder="0" allowfullscreen></iframe>
                <?php endif; ?>
            </div>
        </div>';
    }
    
    // Component styles methods (would return CSS)
    private function get_hero_styles() { return ''; }
    private function get_biography_styles() { return ''; }
    private function get_topics_styles() { return ''; }
    private function get_social_styles() { return ''; }
    private function get_statistics_styles() { return ''; }
    private function get_contact_styles() { return ''; }
    private function get_logo_grid_styles() { return ''; }
    private function get_video_styles() { return ''; }
}
