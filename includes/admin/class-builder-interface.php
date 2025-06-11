<?php
/**
 * Builder Interface Class
 * 
 * Renders the Media Kit Builder v2 interface
 */

namespace MediaKitBuilder\Admin;

class BuilderInterface {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_enqueue_scripts', [$this, 'enqueue_builder_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_builder_assets']);
    }
    
    /**
     * Render the builder interface
     */
    public function render_builder($kit_id = null, $is_admin = true) {
        // Check permissions
        if ($is_admin && !current_user_can('edit_posts')) {
            wp_die(__('You do not have permission to access this page.', 'media-kit-builder'));
        }
        
        // Get user data
        $user_data = $this->get_user_data();
        
        // Output the builder container
        ?>
        <div id="media-kit-builder" 
             data-kit-id="<?php echo esc_attr($kit_id); ?>"
             data-api-url="<?php echo esc_url(admin_url('admin-ajax.php')); ?>"
             data-nonce="<?php echo wp_create_nonce('mkb_nonce'); ?>"
             data-user="<?php echo esc_attr(json_encode($user_data)); ?>"
             data-is-admin="<?php echo $is_admin ? 'true' : 'false'; ?>">
            <!-- Builder will be initialized here -->
            <div class="mkb-loading-screen">
                <div class="mkb-spinner"></div>
                <p><?php _e('Loading Media Kit Builder...', 'media-kit-builder'); ?></p>
            </div>
        </div>
        <?php
        
        // Add loading styles
        ?>
        <style>
            .mkb-loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1a1a1a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #fff;
                z-index: 9999;
            }
            
            .mkb-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid #404040;
                border-top: 3px solid #0ea5e9;
                border-radius: 50%;
                animation: mkb-spin 1s linear infinite;
                margin-bottom: 20px;
            }
            
            @keyframes mkb-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <?php
    }
    
    /**
     * Enqueue builder assets for admin
     */
    public function enqueue_builder_assets($hook) {
        // Only load on our builder pages
        if (!in_array($hook, ['media-kit_page_mkb-builder', 'toplevel_page_media-kit-builder'])) {
            return;
        }
        
        $this->enqueue_assets();
    }
    
    /**
     * Enqueue builder assets for frontend
     */
    public function enqueue_frontend_builder_assets() {
        // Only load on builder pages
        if (!is_page('media-kit-builder') && !$this->is_builder_route()) {
            return;
        }
        
        $this->enqueue_assets();
    }
    
    /**
     * Enqueue all builder assets
     */
    private function enqueue_assets() {
        $version = MKB_VERSION;
        $base_url = MKB_PLUGIN_URL . 'assets/';
        
        // Core styles
        wp_enqueue_style('mkb-builder', $base_url . 'css/builder.css', [], $version);
        wp_enqueue_style('mkb-components', $base_url . 'css/components.css', [], $version);
        
        // Google Fonts
        wp_enqueue_style('mkb-google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', [], null);
        
        // Core scripts
        wp_enqueue_script('mkb-drag-drop', $base_url . 'js/drag-drop.js', [], $version, true);
        wp_enqueue_script('mkb-templates', $base_url . 'js/templates.js', [], $version, true);
        wp_enqueue_script('mkb-export', $base_url . 'js/export.js', [], $version, true);
        wp_enqueue_script('mkb-session', $base_url . 'js/session.js', [], $version, true);
        wp_enqueue_script('mkb-builder', $base_url . 'js/builder.js', ['jquery', 'mkb-drag-drop', 'mkb-templates', 'mkb-export', 'mkb-session'], $version, true);
        
        // Optional: html2canvas for client-side image export
        wp_enqueue_script('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', [], '1.4.1', true);
        
        // Localize script
        wp_localize_script('mkb-builder', 'mkb_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_nonce'),
            'plugin_url' => MKB_PLUGIN_URL,
            'is_logged_in' => is_user_logged_in(),
            'strings' => [
                'save' => __('Save', 'media-kit-builder'),
                'saving' => __('Saving...', 'media-kit-builder'),
                'saved' => __('Saved', 'media-kit-builder'),
                'unsaved_changes' => __('Unsaved changes', 'media-kit-builder'),
                'loading' => __('Loading...', 'media-kit-builder'),
                'error' => __('An error occurred', 'media-kit-builder'),
                'confirm_delete' => __('Are you sure you want to delete this element?', 'media-kit-builder'),
                'confirm_template_switch' => __('Switching templates will replace your current content. Continue?', 'media-kit-builder'),
                'upgrade_required' => __('This is a premium feature. Upgrade to Pro to unlock.', 'media-kit-builder'),
            ]
        ]);
    }
    
    /**
     * Get user data for the builder
     */
    private function get_user_data() {
        $user_data = [
            'isGuest' => true,
            'id' => null,
            'name' => 'Guest',
            'email' => '',
            'isPro' => false,
            'canExportPDF' => false,
            'canWhiteLabel' => false,
            'availableTemplates' => ['modern', 'speaker'],
            'componentLimit' => 10
        ];
        
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            $user_id = $user->ID;
            
            $user_data = [
                'isGuest' => false,
                'id' => $user_id,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'isPro' => $this->check_user_is_pro($user_id),
                'canExportPDF' => true,
                'canWhiteLabel' => $this->check_user_can_white_label($user_id),
                'availableTemplates' => $this->get_user_templates($user_id),
                'componentLimit' => $this->get_component_limit($user_id)
            ];
        }
        
        return $user_data;
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
     * Check if user can white label
     */
    private function check_user_can_white_label($user_id) {
        // Check WP Fusion tags for agency level
        if (function_exists('wp_fusion')) {
            $tags = wp_fusion()->user->get_tags($user_id);
            $agency_tags = ['guestify_agency', 'guestify_whitelabel'];
            
            return !empty(array_intersect($tags, $agency_tags));
        }
        
        return false;
    }
    
    /**
     * Get available templates for user
     */
    private function get_user_templates($user_id) {
        $templates = ['modern', 'speaker']; // Free templates
        
        if ($this->check_user_is_pro($user_id)) {
            // Add premium templates
            $templates = array_merge($templates, ['creative', 'podcast', 'author']);
        }
        
        return $templates;
    }
    
    /**
     * Get component limit for user
     */
    private function get_component_limit($user_id) {
        if ($this->check_user_is_pro($user_id)) {
            return 100; // Pro users
        }
        
        return 20; // Free users
    }
    
    /**
     * Check if current route is a builder route
     */
    private function is_builder_route() {
        $current_url = $_SERVER['REQUEST_URI'];
        $builder_routes = [
            '/media-kit-builder/',
            '/media-kit/new',
            '/media-kit/edit/'
        ];
        
        foreach ($builder_routes as $route) {
            if (strpos($current_url, $route) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Render builder page template
     */
    public function render_builder_page() {
        // Get kit ID from URL if editing
        $kit_id = isset($_GET['kit_id']) ? sanitize_text_field($_GET['kit_id']) : null;
        
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title><?php echo $kit_id ? __('Edit Media Kit', 'media-kit-builder') : __('Create Media Kit', 'media-kit-builder'); ?> - <?php bloginfo('name'); ?></title>
            <?php wp_head(); ?>
        </head>
        <body class="mkb-builder-page">
            <?php $this->render_builder($kit_id, false); ?>
            <?php wp_footer(); ?>
        </body>
        </html>
        <?php
        exit;
    }
}

// Initialize
new BuilderInterface();