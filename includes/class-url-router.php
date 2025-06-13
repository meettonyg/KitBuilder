<?php
/**
 * URL Router for Media Kit Builder
 * Handles custom URL routing and asset loading for the frontend builder.
 *
 * @version 2.0 - Revised for complete environment isolation and correct asset loading.
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
        
        // Set a flag to prevent canonical redirects which can interfere with custom URLs
        remove_action('wp_head', 'rel_canonical');

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
        
        // This is critical: We stop WordPress from loading the theme after our page is rendered.
        exit;
    }
    
    /**
     * Enqueues all necessary scripts and styles for the builder application.
     * This function defines the precise loading order for all assets.
     */
    private function enqueue_builder_assets() {
        $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.0';
        $assets_url = MKB_PLUGIN_URL . 'assets/';

        // --- STYLESHEETS ---
        // 1. Reset CSS for a clean slate
        wp_enqueue_style('mkb-reset', $assets_url . 'css/reset.css', [], $version);
        
        // 2. Core builder layout styles
        wp_enqueue_style('mkb-builder-core-styles', $assets_url . 'css/builder.css', ['mkb-reset'], $version);
		
		// 3. Shared component styles
        wp_enqueue_style('mkb-components-styles', $assets_url . 'css/components.css', ['mkb-builder-core-styles'], $version);

        // 4. WordPress admin compatibility styles
        wp_enqueue_style('mkb-wp-admin-compat', $assets_url . 'css/wp-admin-compat.css', ['mkb-builder-core-styles'], $version);

        // --- SCRIPTS ---
        // WordPress dependencies
        wp_enqueue_script('jquery');
        wp_enqueue_media();
        
        // 1. Polyfills for cross-browser support (loads from external CDN)
        wp_enqueue_script('mkb-polyfills', 'https://polyfill.io/v3/polyfill.min.js?features=default', array(), null, false);
        
        // 2. Compatibility script for feature detection and browser-specific fixes
        wp_enqueue_script('mkb-compatibility', $assets_url . 'js/compatibility.js', ['jquery', 'mkb-polyfills'], $version, false);
        
        // 3. Standalone Initializer to set up the global namespace
        wp_enqueue_script('mkb-standalone-initializer', $assets_url . 'js/standalone-initializer.js', ['mkb-compatibility'], $version, false);
        
        // 4. Main builder logic
        wp_enqueue_script('mkb-core-builder', $assets_url . 'js/builder.js', ['jquery', 'mkb-standalone-initializer'], $version, true);
        
        // 5. New Section Management Logic
        wp_enqueue_script('mkb-section-management', $assets_url . 'js/section-management.js', ['mkb-core-builder'], $version, true);

        // 6. WordPress Adapter to connect the builder to WP
        wp_enqueue_script('mkb-wp-adapter', $assets_url . 'js/builder-wordpress.js', ['mkb-core-builder', 'mkb-section-management'], $version, true);
        
        // 7. Other managers
        wp_enqueue_script('mkb-template-manager', $assets_url . 'js/template-manager.js', ['mkb-wp-adapter'], $version, true);
        wp_enqueue_script('mkb-premium-access', $assets_url . 'js/premium-access-control.js', ['mkb-wp-adapter'], $version, true);

        // Localize script with data for the application
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
     * Renders the main builder page in an isolated HTML document.
     */
    private function show_builder_page() {
        $this->enqueue_builder_assets();
        
        $entry_key = get_query_var('mkb_entry_key');
        $access_tier = function_exists('mkb_get_user_access_tier') ? mkb_get_user_access_tier() : 'guest';
        $template_file = MKB_PLUGIN_DIR . 'templates/builder.php';

        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title><?php echo esc_html__('Media Kit Builder', 'media-kit-builder'); ?> - <?php bloginfo('name'); ?></title>
            <?php
            // Using wp_print_styles() and wp_print_head_scripts() creates an isolated
            // environment, preventing conflicts from other plugins or the active theme.
            if (is_user_logged_in()) {
                wp_print_styles('admin-bar');
            }
            wp_print_styles();
            wp_print_head_scripts();
            ?>
        </head>
        <body class="mkb-builder-body">
            <?php 
            if (is_user_logged_in()) {
                wp_admin_bar_render(); 
            }
            
            if (file_exists($template_file)) {
                include $template_file;
            } else {
                wp_die('Error: The main builder template is missing.');
            }

            // Prints only the scripts enqueued for the footer.
            wp_print_footer_scripts();
            ?>
        </body>
        </html>
        <?php
    }
    
    /**
     * Renders the preview page in an isolated HTML document.
     */
    private function show_preview_page() {
        // You would create a specific enqueue function for the preview page assets
        // wp_enqueue_script('mkb-preview-script', '...');
        // wp_enqueue_style('mkb-preview-style', '...');
        
        $template_file = MKB_PLUGIN_DIR . 'templates/preview.php';
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <title>Media Kit Preview</title>
            <?php wp_print_styles(); wp_print_head_scripts(); ?>
        </head>
        <body>
            <?php 
            if(file_exists($template_file)){
                include $template_file;
            } else {
                 wp_die('Preview template is missing.');
            }
            wp_print_footer_scripts(); 
            ?>
        </body>
        </html>
        <?php
    }

    /**
     * Renders the gallery page in an isolated HTML document.
     */
    private function show_gallery_page() {
        // You would create a specific enqueue function for the gallery page assets
        // wp_enqueue_script('mkb-gallery-script', '...');
        // wp_enqueue_style('mkb-gallery-style', '...');

        $template_file = MKB_PLUGIN_DIR . 'templates/gallery.php';
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <title>Template Gallery</title>
            <?php wp_print_styles(); wp_print_head_scripts(); ?>
        </head>
        <body>
            <?php 
            if(file_exists($template_file)){
                include $template_file;
            } else {
                wp_die('Gallery template is missing.');
            }
            wp_print_footer_scripts(); 
            ?>
        </body>
        </html>
        <?php
    }
}

// Initialize the URL router.
new Media_Kit_Builder_URL_Router();