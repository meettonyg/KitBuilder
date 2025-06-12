<?php
/**
 * URL Router for Media Kit Builder
 * Handles custom URL routing and asset loading for the frontend builder.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Media_Kit_Builder_URL_Router {

    public function __construct() {
        // priority 10 is default, run after main query vars are setup
        add_action('init', array($this, 'add_rewrite_rules'), 10);
        add_filter('query_vars', array($this, 'add_query_vars'), 10, 1);
        // priority 5 to run early, before other template redirects
        add_action('template_redirect', array($this, 'handle_requests'), 5);
    }

    /**
     * Add custom rewrite rules for clean URLs.
     */
    public function add_rewrite_rules() {
        add_rewrite_rule('^media-kit-builder/new/?$', 'index.php?mkb_page=new', 'top');
        add_rewrite_rule('^media-kit-builder/preview/([^/]+)/?$', 'index.php?mkb_page=preview&mkb_entry_key=$matches[1]', 'top');
        add_rewrite_rule('^media-kit-builder/([^/]+)/?$', 'index.php?mkb_page=edit&mkb_entry_key=$matches[1]', 'top');
        add_rewrite_rule('^media-kit-builder/?$', 'index.php?mkb_page=gallery', 'top');
    }

    /**
     * Add custom query variables to WordPress.
     */
    public function add_query_vars($vars) {
        $vars[] = 'mkb_page';
        $vars[] = 'mkb_entry_key';
        return $vars;
    }

    /**
     * The core handler that intercepts requests for builder pages.
     */
    public function handle_requests() {
        global $wp_query;

        // Use get_query_var as it's the correct way to get a registered query variable
        $mkb_page = $wp_query->get('mkb_page');

        if (empty($mkb_page)) {
            return; // Not a media kit builder request.
        }

        switch ($mkb_page) {
            case 'new':
            case 'edit':
                $this->show_builder_page();
                break;
            case 'preview':
                $this->show_preview_page();
                break;
            case 'gallery':
                $this->show_gallery_page();
                break;
            default:
                // If the query var is set but doesn't match, it could be an entry key
                // Let's assume 'edit' for any non-specific match
                $this->show_builder_page();
                break;
        }
        
        // We are taking over the page, so exit to prevent standard WordPress template loading.
        exit;
    }
    
    /**
     * Enqueues all necessary scripts and styles for the builder application.
     * This is called directly from the show_builder_page method to ensure assets are loaded correctly.
     */
    private function enqueue_builder_assets() {
        $version = MKB_VERSION;
        $assets_url = MKB_PLUGIN_URL . 'assets/';

        // Enqueue CSS - load both builder.css and builder-v2.css to ensure complete styling
        wp_enqueue_style('mkb-builder-core-styles', $assets_url . 'css/builder.css', [], $version);
        wp_enqueue_style('mkb-builder-v2-styles', $assets_url . 'css/builder-v2.css', ['mkb-builder-core-styles'], $version);
        wp_enqueue_style('mkb-components-styles', $assets_url . 'css/components.css', ['mkb-builder-core-styles'], $version);
        wp_enqueue_style('mkb-wp-admin-compat', $assets_url . 'css/wp-admin-compat.css', ['mkb-builder-core-styles'], $version);

        // Enqueue JS with correct dependencies
        wp_enqueue_script('jquery');
        wp_enqueue_media();
        
        // Load initializer first
        wp_enqueue_script('mkb-standalone-initializer', $assets_url . 'js/standalone-initializer.js', ['jquery'], $version, false);

        wp_enqueue_script('mkb-core-builder', $assets_url . 'js/builder.js', ['jquery', 'mkb-standalone-initializer'], $version, true);
        wp_enqueue_script('mkb-section-templates', $assets_url . 'js/section-templates.js', ['jquery', 'mkb-core-builder'], $version, true);
        wp_enqueue_script('mkb-wp-adapter', $assets_url . 'js/builder-wordpress.js', ['mkb-core-builder', 'mkb-section-templates'], $version, true);
        wp_enqueue_script('mkb-template-manager', $assets_url . 'js/template-manager.js', ['mkb-wp-adapter'], $version, true);
        wp_enqueue_script('mkb-premium-access', $assets_url . 'js/premium-access-control.js', ['mkb-wp-adapter'], $version, true);

        // Localize script with data for the React app
        wp_localize_script('mkb-core-builder', 'mkbData', [
            'ajaxUrl'    => admin_url('admin-ajax.php'),
            'restUrl'    => rest_url('media-kit/v1/'),
            'nonce'      => wp_create_nonce('media_kit_builder_nonce'),
            'restNonce'  => wp_create_nonce('wp_rest'),
            'userId'     => get_current_user_id(),
            'isGuest'    => !is_user_logged_in(),
            'isAdmin'    => current_user_can('manage_options'),
            'pluginUrl'  => MKB_PLUGIN_URL,
            'accessTier' => function_exists('mkb_get_user_access_tier') ? mkb_get_user_access_tier() : 'guest',
            'entryKey'   => get_query_var('mkb_entry_key'),
            'debugMode'  => defined('WP_DEBUG') && WP_DEBUG,
            'assetsUrl'  => MKB_PLUGIN_URL . 'assets/',
        ]);
    }
    
    /**
     * Renders the main builder page by loading the builder template.
     */
    private function show_builder_page() {
        // This is the correct place to enqueue scripts for this specific page.
        $this->enqueue_builder_assets();
        
        $template_file = MKB_PLUGIN_DIR . 'templates/builder.php';

        if (file_exists($template_file)) {
            // These variables will be available inside the included template file.
            $entry_key = get_query_var('mkb_entry_key');
            $access_tier = function_exists('mkb_get_user_access_tier') ? mkb_get_user_access_tier() : 'guest';
            
            // Make sure we include both the builder.css and builder-v2.css to cover all styles
            include $template_file;
        } else {
            wp_die('Builder template is missing.');
        }
    }
    
    // Stubs for other pages - you can fill these in similarly
    private function show_preview_page() {
        // You would enqueue preview-specific assets here
        wp_die('Preview page is not yet implemented.');
    }

    private function show_gallery_page() {
        // You would enqueue gallery-specific assets here
        wp_die('Gallery page is not yet implemented.');
    }
}

// Initialize the URL router.
new Media_Kit_Builder_URL_Router();