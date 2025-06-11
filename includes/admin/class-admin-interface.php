<?php
/**
 * Media Kit Builder - Admin Interface
 * 
 * Handles WordPress admin interface integration and menu setup.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Admin_Interface Class
 * 
 * Manages admin interface and WordPress integration
 */
class MKB_Admin_Interface {
    
    /**
     * Instance
     * @var MKB_Admin_Interface
     */
    private static $instance = null;
    
    /**
     * Admin pages
     * @var array
     */
    private $admin_pages = array();
    
    /**
     * Get instance
     * 
     * @return MKB_Admin_Interface
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
        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Admin notices
        add_action('admin_notices', array($this, 'admin_notices'));
        
        // Settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Dashboard widgets
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widgets'));
        
        // Admin footer
        add_filter('admin_footer_text', array($this, 'admin_footer_text'));
        
        // Screen options
        add_filter('screen_settings', array($this, 'screen_settings'), 10, 2);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Main menu page
        $main_page = add_menu_page(
            __('Media Kit Builder', 'media-kit-builder'),
            __('Media Kit Builder', 'media-kit-builder'),
            'edit_posts',
            'media-kit-builder',
            array($this, 'admin_page_builder'),
            'dashicons-id-alt',
            30
        );
        
        // Builder submenu
        $builder_page = add_submenu_page(
            'media-kit-builder',
            __('Builder', 'media-kit-builder'),
            __('Builder', 'media-kit-builder'),
            'edit_posts',
            'media-kit-builder',
            array($this, 'admin_page_builder')
        );
        
        // Templates submenu
        $templates_page = add_submenu_page(
            'media-kit-builder',
            __('Templates', 'media-kit-builder'),
            __('Templates', 'media-kit-builder'),
            'edit_posts',
            'mkb-templates',
            array($this, 'admin_page_templates')
        );
        
        // Media Kits submenu
        $media_kits_page = add_submenu_page(
            'media-kit-builder',
            __('My Media Kits', 'media-kit-builder'),
            __('My Media Kits', 'media-kit-builder'),
            'edit_posts',
            'mkb-media-kits',
            array($this, 'admin_page_media_kits')
        );
        
        // Analytics submenu (premium)
        if ($this->user_can_access_analytics()) {
            $analytics_page = add_submenu_page(
                'media-kit-builder',
                __('Analytics', 'media-kit-builder'),
                __('Analytics', 'media-kit-builder'),
                'edit_posts',
                'mkb-analytics',
                array($this, 'admin_page_analytics')
            );
        }
        
        // Settings submenu
        $settings_page = add_submenu_page(
            'media-kit-builder',
            __('Settings', 'media-kit-builder'),
            __('Settings', 'media-kit-builder'),
            'manage_options',
            'mkb-settings',
            array($this, 'admin_page_settings')
        );
        
        // Store page hooks
        $this->admin_pages = array(
            'main' => $main_page,
            'builder' => $builder_page,
            'templates' => $templates_page,
            'media_kits' => $media_kits_page,
            'settings' => $settings_page
        );
        
        if (isset($analytics_page)) {
            $this->admin_pages['analytics'] = $analytics_page;
        }
        
        // Add help tabs
        add_action('load-' . $main_page, array($this, 'add_help_tabs'));
        add_action('load-' . $templates_page, array($this, 'add_help_tabs'));
        add_action('load-' . $settings_page, array($this, 'add_help_tabs'));
    }
    
    /**
     * Admin initialization
     */
    public function admin_init() {
        // Check if plugin is properly activated
        if (!get_option('mkb_activated')) {
            add_action('admin_notices', array($this, 'activation_notice'));
        }
        
        // Check system requirements
        $this->check_system_requirements();
        
        // Handle admin actions
        $this->handle_admin_actions();
    }
    
    /**
     * Enqueue admin scripts and styles
     * 
     * @param string $hook
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our admin pages
        if (!$this->is_mkb_admin_page($hook)) {
            return;
        }
        
        // Admin styles
        wp_enqueue_style(
            'mkb-admin-styles',
            MKB_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            MKB_VERSION
        );
        
        // WordPress media uploader
        wp_enqueue_media();
        
        // CRITICAL: Deregister WordPress's built-in React to prevent conflicts
        wp_deregister_script('react');
        wp_deregister_script('react-dom');
        
        // Enqueue React 18 with proper dependencies
        $react_suffix = (defined('WP_DEBUG') && WP_DEBUG) ? 'development' : 'production.min';
        
        wp_enqueue_script(
            'mkb-react-18',
            "https://unpkg.com/react@18/umd/react.{$react_suffix}.js",
            array(),
            '18.2.0',
            true
        );
        
        wp_enqueue_script(
            'mkb-react-dom-18',
            "https://unpkg.com/react-dom@18/umd/react-dom.{$react_suffix}.js",
            array('mkb-react-18'),
            '18.2.0',
            true
        );
        
        // ES Module compatibility fix
        wp_enqueue_script(
            'mkb-es-module-fix',
            MKB_PLUGIN_URL . 'assets/js/es-module-fix.js',
            array('mkb-react-18', 'mkb-react-dom-18'),
            MKB_VERSION,
            true
        );
        
        // State management
        wp_enqueue_script(
            'mkb-state',
            MKB_PLUGIN_URL . 'assets/js/state.js',
            array('mkb-es-module-fix'),
            MKB_VERSION,
            true
        );
        
        // Components module
        wp_enqueue_script(
            'mkb-components',
            MKB_PLUGIN_URL . 'assets/js/components.js',
            array('mkb-state'),
            MKB_VERSION,
            true
        );
        
        // Main builder application
        wp_enqueue_script(
            'mkb-builder',
            MKB_BUILD_URL . 'builder.js',
            array('mkb-components'),
            MKB_VERSION,
            true
        );
        
        // Admin integration
        wp_enqueue_script(
            'mkb-admin-integration',
            MKB_PLUGIN_URL . 'assets/js/admin-integration.js',
            array('mkb-builder'),
            MKB_VERSION,
            true
        );
        
        // Debug helper (development only)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            wp_enqueue_script(
                'mkb-debug-helper',
                MKB_PLUGIN_URL . 'assets/js/debug-helper.js',
                array('mkb-admin-integration'),
                MKB_VERSION,
                true
            );
        }
        
        // Localize admin script
        wp_localize_script('mkb-admin-integration', 'mkbAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_admin_nonce'),
            'userId' => get_current_user_id(),
            'currentPage' => $hook,
            'strings' => array(
                'confirmDelete' => __('Are you sure you want to delete this?', 'media-kit-builder'),
                'processing' => __('Processing...', 'media-kit-builder'),
                'error' => __('An error occurred', 'media-kit-builder'),
                'success' => __('Operation completed successfully', 'media-kit-builder')
            ),
            'capabilities' => $this->get_user_capabilities(),
            'settings' => $this->get_admin_settings()
        ));
    }
    
    /**
     * Builder admin page
     */
    public function admin_page_builder() {
        $this->render_admin_page('builder', array(
            'title' => __('Media Kit Builder', 'media-kit-builder'),
            'description' => __('Create and edit your professional media kit', 'media-kit-builder')
        ));
    }
    
    /**
     * Templates admin page
     */
    public function admin_page_templates() {
        $template_manager = media_kit_builder()->get_system('templates');
        
        $templates = $template_manager->get_templates(array(
            'is_active' => true
        ));
        
        $categories = $template_manager->get_categories();
        
        $this->render_admin_page('templates', array(
            'title' => __('Media Kit Templates', 'media-kit-builder'),
            'description' => __('Choose from professional templates or create your own', 'media-kit-builder'),
            'templates' => $templates,
            'categories' => $categories
        ));
    }
    
    /**
     * Media Kits admin page
     */
    public function admin_page_media_kits() {
        $user_media_kits = get_posts(array(
            'post_type' => 'mkb_media_kit',
            'post_status' => array('draft', 'publish'),
            'author' => get_current_user_id(),
            'posts_per_page' => -1,
            'orderby' => 'modified',
            'order' => 'DESC'
        ));
        
        $this->render_admin_page('media-kits', array(
            'title' => __('My Media Kits', 'media-kit-builder'),
            'description' => __('Manage your saved media kits', 'media-kit-builder'),
            'media_kits' => $user_media_kits
        ));
    }
    
    /**
     * Analytics admin page
     */
    public function admin_page_analytics() {
        if (!$this->user_can_access_analytics()) {
            wp_die(__('You do not have permission to access this page.', 'media-kit-builder'));
        }
        
        $analytics_data = $this->get_analytics_data();
        
        $this->render_admin_page('analytics', array(
            'title' => __('Analytics', 'media-kit-builder'),
            'description' => __('View usage statistics and insights', 'media-kit-builder'),
            'analytics' => $analytics_data
        ));
    }
    
    /**
     * Settings admin page
     */
    public function admin_page_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have permission to access this page.', 'media-kit-builder'));
        }
        
        $this->render_admin_page('settings', array(
            'title' => __('Media Kit Builder Settings', 'media-kit-builder'),
            'description' => __('Configure plugin settings and preferences', 'media-kit-builder')
        ));
    }
    
    /**
     * Render admin page
     * 
     * @param string $page
     * @param array $data
     */
    private function render_admin_page($page, $data = array()) {
        ?>
        <div class="wrap mkb-admin-page mkb-admin-page-<?php echo esc_attr($page); ?>">
            <h1 class="mkb-page-title">
                <?php echo esc_html($data['title'] ?? ''); ?>
                <?php if ($page === 'media-kits'): ?>
                    <a href="<?php echo admin_url('admin.php?page=media-kit-builder'); ?>" class="page-title-action">
                        <?php _e('Create New', 'media-kit-builder'); ?>
                    </a>
                <?php endif; ?>
            </h1>
            
            <?php if (!empty($data['description'])): ?>
                <p class="mkb-page-description"><?php echo esc_html($data['description']); ?></p>
            <?php endif; ?>
            
            <div id="mkb-builder-root" class="mkb-admin-container mkb-builder-container">
                <!-- React app will mount here -->
                <div class="mkb-loading-placeholder">
                    <div class="mkb-spinner"></div>
                    <p><?php _e('Loading...', 'media-kit-builder'); ?></p>
                </div>
            </div>
            
            <?php if ($page === 'media-kits' && !empty($data['media_kits'])): ?>
                <!-- Fallback table for when JavaScript is disabled -->
                <noscript>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Title', 'media-kit-builder'); ?></th>
                                <th><?php _e('Status', 'media-kit-builder'); ?></th>
                                <th><?php _e('Modified', 'media-kit-builder'); ?></th>
                                <th><?php _e('Actions', 'media-kit-builder'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($data['media_kits'] as $media_kit): ?>
                                <tr>
                                    <td>
                                        <strong>
                                            <a href="<?php echo admin_url('admin.php?page=media-kit-builder&edit=' . $media_kit->ID); ?>">
                                                <?php echo esc_html($media_kit->post_title); ?>
                                            </a>
                                        </strong>
                                    </td>
                                    <td><?php echo esc_html(ucfirst($media_kit->post_status)); ?></td>
                                    <td><?php echo esc_html(get_the_modified_date('Y/m/d g:i A', $media_kit)); ?></td>
                                    <td>
                                        <a href="<?php echo admin_url('admin.php?page=media-kit-builder&edit=' . $media_kit->ID); ?>">
                                            <?php _e('Edit', 'media-kit-builder'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </noscript>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        // General settings
        register_setting('mkb_settings', 'mkb_guest_session_duration');
        register_setting('mkb_settings', 'mkb_auto_cleanup_enabled');
        register_setting('mkb_settings', 'mkb_max_components_per_kit');
        register_setting('mkb_settings', 'mkb_default_template');
        register_setting('mkb_settings', 'mkb_allowed_file_types');
        register_setting('mkb_settings', 'mkb_max_file_size');
        
        // Export settings
        register_setting('mkb_export_settings', 'mkb_pdf_library');
        register_setting('mkb_export_settings', 'mkb_pdf_watermark_text');
        register_setting('mkb_export_settings', 'mkb_enable_watermark');
        
        // Advanced settings
        register_setting('mkb_advanced_settings', 'mkb_enable_analytics');
        register_setting('mkb_advanced_settings', 'mkb_cache_expiry');
        register_setting('mkb_advanced_settings', 'mkb_debug_mode');
    }
    
    /**
     * Admin notices
     */
    public function admin_notices() {
        // Show activation errors if any
        $activation_errors = get_option('mkb_activation_errors');
        if ($activation_errors) {
            echo '<div class="notice notice-error"><p>';
            echo '<strong>' . __('Media Kit Builder:', 'media-kit-builder') . '</strong> ';
            echo implode('<br>', $activation_errors);
            echo '</p></div>';
            delete_option('mkb_activation_errors');
        }
        
        // Show success messages
        if (isset($_GET['mkb_message'])) {
            $message = sanitize_text_field($_GET['mkb_message']);
            $messages = array(
                'template_saved' => __('Template saved successfully.', 'media-kit-builder'),
                'settings_saved' => __('Settings saved successfully.', 'media-kit-builder'),
                'export_queued' => __('Export queued successfully.', 'media-kit-builder')
            );
            
            if (isset($messages[$message])) {
                echo '<div class="notice notice-success is-dismissible"><p>';
                echo esc_html($messages[$message]);
                echo '</p></div>';
            }
        }
    }
    
    /**
     * Add dashboard widgets
     */
    public function add_dashboard_widgets() {
        if (current_user_can('edit_posts')) {
            wp_add_dashboard_widget(
                'mkb_dashboard_widget',
                __('Media Kit Builder', 'media-kit-builder'),
                array($this, 'dashboard_widget_content')
            );
        }
    }
    
    /**
     * Dashboard widget content
     */
    public function dashboard_widget_content() {
        $user_kits_count = count(get_posts(array(
            'post_type' => 'mkb_media_kit',
            'author' => get_current_user_id(),
            'post_status' => 'any',
            'posts_per_page' => -1
        )));
        
        ?>
        <div class="mkb-dashboard-widget">
            <div class="mkb-dashboard-stats">
                <div class="mkb-dashboard-stat">
                    <span class="mkb-stat-number"><?php echo $user_kits_count; ?></span>
                    <span class="mkb-stat-label"><?php _e('Media Kits', 'media-kit-builder'); ?></span>
                </div>
            </div>
            
            <div class="mkb-dashboard-actions">
                <a href="<?php echo admin_url('admin.php?page=media-kit-builder'); ?>" class="button button-primary">
                    <?php _e('Create Media Kit', 'media-kit-builder'); ?>
                </a>
                <a href="<?php echo admin_url('admin.php?page=mkb-templates'); ?>" class="button">
                    <?php _e('Browse Templates', 'media-kit-builder'); ?>
                </a>
            </div>
            
            <?php if ($user_kits_count > 0): ?>
                <div class="mkb-dashboard-recent">
                    <h4><?php _e('Recent Media Kits', 'media-kit-builder'); ?></h4>
                    <?php
                    $recent_kits = get_posts(array(
                        'post_type' => 'mkb_media_kit',
                        'author' => get_current_user_id(),
                        'posts_per_page' => 3,
                        'orderby' => 'modified',
                        'order' => 'DESC'
                    ));
                    
                    foreach ($recent_kits as $kit):
                    ?>
                        <div class="mkb-dashboard-recent-item">
                            <a href="<?php echo admin_url('admin.php?page=media-kit-builder&edit=' . $kit->ID); ?>">
                                <?php echo esc_html($kit->post_title); ?>
                            </a>
                            <span class="mkb-recent-date">
                                <?php echo human_time_diff(strtotime($kit->post_modified)); ?> <?php _e('ago', 'media-kit-builder'); ?>
                            </span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Add help tabs
     */
    public function add_help_tabs() {
        $screen = get_current_screen();
        
        $screen->add_help_tab(array(
            'id' => 'mkb_help_overview',
            'title' => __('Overview', 'media-kit-builder'),
            'content' => $this->get_help_content('overview')
        ));
        
        $screen->add_help_tab(array(
            'id' => 'mkb_help_getting_started',
            'title' => __('Getting Started', 'media-kit-builder'),
            'content' => $this->get_help_content('getting_started')
        ));
        
        $screen->add_help_tab(array(
            'id' => 'mkb_help_support',
            'title' => __('Support', 'media-kit-builder'),
            'content' => $this->get_help_content('support')
        ));
        
        $screen->set_help_sidebar($this->get_help_sidebar());
    }
    
    /**
     * Handle admin actions
     */
    private function handle_admin_actions() {
        if (!isset($_GET['action']) || !wp_verify_nonce($_GET['nonce'] ?? '', 'mkb_admin_action')) {
            return;
        }
        
        $action = sanitize_text_field($_GET['action']);
        
        switch ($action) {
            case 'clear_cache':
                if (current_user_can('manage_options')) {
                    $this->clear_all_caches();
                    wp_redirect(add_query_arg('mkb_message', 'cache_cleared', wp_get_referer()));
                    exit;
                }
                break;
                
            case 'run_cleanup':
                if (current_user_can('manage_options')) {
                    do_action('mkb_daily_cleanup');
                    wp_redirect(add_query_arg('mkb_message', 'cleanup_complete', wp_get_referer()));
                    exit;
                }
                break;
        }
    }
    
    /**
     * Check if current page is MKB admin page
     * 
     * @param string $hook
     * @return bool
     */
    private function is_mkb_admin_page($hook) {
        return strpos($hook, 'media-kit-builder') !== false || strpos($hook, 'mkb-') !== false;
    }
    
    /**
     * Get user capabilities for admin interface
     * 
     * @return array
     */
    private function get_user_capabilities() {
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        
        if ($wpfusion_reader) {
            return $wpfusion_reader->get_user_capabilities();
        }
        
        return array(
            'canEdit' => current_user_can('edit_posts'),
            'canManage' => current_user_can('manage_options'),
            'canUpload' => current_user_can('upload_files')
        );
    }
    
    /**
     * Get admin settings
     * 
     * @return array
     */
    private function get_admin_settings() {
        return array(
            'guestSessionDuration' => get_option('mkb_guest_session_duration', 7 * DAY_IN_SECONDS),
            'maxComponentsPerKit' => get_option('mkb_max_components_per_kit', 100),
            'defaultTemplate' => get_option('mkb_default_template', 'professional-business'),
            'enableAnalytics' => get_option('mkb_enable_analytics', true),
            'debugMode' => get_option('mkb_debug_mode', false)
        );
    }
    
    /**
     * Check if user can access analytics
     * 
     * @return bool
     */
    private function user_can_access_analytics() {
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        
        if ($wpfusion_reader) {
            return $wpfusion_reader->can_access_feature('analytics');
        }
        
        return current_user_can('manage_options');
    }
    
    /**
     * Get analytics data
     * 
     * @return array
     */
    private function get_analytics_data() {
        $session_manager = media_kit_builder()->get_system('session');
        $template_manager = media_kit_builder()->get_system('templates');
        $builder_state = media_kit_builder()->get_system('state');
        
        return array(
            'sessions' => $session_manager ? $session_manager->get_session_stats() : array(),
            'templates' => $template_manager ? $template_manager->get_template_stats() : array(),
            'states' => $builder_state ? $builder_state->get_state_stats() : array()
        );
    }
    
    /**
     * Check system requirements
     */
    private function check_system_requirements() {
        $requirements_met = true;
        
        // Check PHP version
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-warning"><p>';
                printf(
                    __('Media Kit Builder: PHP 7.4+ recommended. Current version: %s', 'media-kit-builder'),
                    PHP_VERSION
                );
                echo '</p></div>';
            });
            $requirements_met = false;
        }
        
        // Check memory limit
        $memory_limit = wp_convert_hr_to_bytes(ini_get('memory_limit'));
        if ($memory_limit > 0 && $memory_limit < 128 * 1024 * 1024) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-warning"><p>';
                printf(
                    __('Media Kit Builder: 128MB+ memory recommended. Current limit: %s', 'media-kit-builder'),
                    ini_get('memory_limit')
                );
                echo '</p></div>';
            });
        }
        
        return $requirements_met;
    }
    
    /**
     * Clear all caches
     */
    private function clear_all_caches() {
        // Clear template cache
        $template_manager = media_kit_builder()->get_system('templates');
        if ($template_manager) {
            $template_manager->clear_template_cache();
        }
        
        // Clear WordPress object cache
        wp_cache_flush();
        
        // Clear transients
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mkb_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mkb_%'");
    }
    
    /**
     * Get help content
     * 
     * @param string $section
     * @return string
     */
    private function get_help_content($section) {
        $content = array(
            'overview' => '<p>' . __('Media Kit Builder allows you to create professional media kits using a drag-and-drop interface. You can choose from pre-designed templates or create your own custom layout.', 'media-kit-builder') . '</p>',
            'getting_started' => '<p>' . __('To get started, choose a template from the Templates page or create a new media kit from scratch using the Builder. Add components by dragging them from the sidebar into your design.', 'media-kit-builder') . '</p>',
            'support' => '<p>' . __('For support and documentation, visit our website or contact our support team. We offer comprehensive guides and video tutorials to help you get the most out of Media Kit Builder.', 'media-kit-builder') . '</p>'
        );
        
        return $content[$section] ?? '';
    }
    
    /**
     * Get help sidebar
     * 
     * @return string
     */
    private function get_help_sidebar() {
        return '<p><strong>' . __('For more information:', 'media-kit-builder') . '</strong></p>' .
               '<p><a href="https://guestify.com/docs/" target="_blank">' . __('Documentation', 'media-kit-builder') . '</a></p>' .
               '<p><a href="https://guestify.com/support/" target="_blank">' . __('Support', 'media-kit-builder') . '</a></p>';
    }
    
    /**
     * Admin footer text
     * 
     * @param string $text
     * @return string
     */
    public function admin_footer_text($text) {
        $screen = get_current_screen();
        
        if ($this->is_mkb_admin_page($screen->base)) {
            return sprintf(
                __('Thank you for using <a href="%s" target="_blank">Media Kit Builder</a>. Version %s', 'media-kit-builder'),
                'https://guestify.com/',
                MKB_VERSION
            );
        }
        
        return $text;
    }
    
    /**
     * Screen settings
     * 
     * @param string $settings
     * @param WP_Screen $screen
     * @return string
     */
    public function screen_settings($settings, $screen) {
        if ($this->is_mkb_admin_page($screen->base)) {
            $settings .= '<h5>' . __('Media Kit Builder Settings', 'media-kit-builder') . '</h5>';
            $settings .= '<div class="mkb-screen-settings">';
            $settings .= '<label><input type="checkbox" id="mkb-debug-mode" /> ' . __('Debug Mode', 'media-kit-builder') . '</label>';
            $settings .= '</div>';
        }
        
        return $settings;
    }
    
    /**
     * Activation notice
     */
    public function activation_notice() {
        echo '<div class="notice notice-info"><p>';
        printf(
            __('Welcome to Media Kit Builder! <a href="%s">Get started</a> by creating your first media kit.', 'media-kit-builder'),
            admin_url('admin.php?page=media-kit-builder')
        );
        echo '</p></div>';
    }
}
