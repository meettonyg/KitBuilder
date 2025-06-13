<?php
/**
 * URL Router for Media Kit Builder
 * Handles custom URL routing and asset loading for the frontend builder.
 *
 * @version 2.2 - Final Corrected Version with Self-Contained Functions
 */

if (!defined('ABSPATH')) {
    exit;
}

class Media_Kit_Builder_URL_Router {

    public function __construct() {
        add_action('init', array($this, 'add_rewrite_rules'), 10);
        add_filter('query_vars', array($this, 'add_query_vars'), 10, 1);
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
        $mkb_page = $wp_query->get('mkb_page');

        if (empty($mkb_page)) {
            return;
        }
        
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
                $this->show_builder_page();
                break;
        }
        
        exit;
    }

    /**
     * Helper function to get user access tier.
     * This is now self-contained within the router to avoid dependency issues.
     *
     * @return string The user's access tier ('guest', 'free', 'pro', 'agency', 'admin').
     */
    private function get_user_access_tier() {
        if (!is_user_logged_in()) {
            return 'guest';
        }

        if (current_user_can('manage_options')) {
            return 'admin';
        }
        
        if (function_exists('wp_fusion')) {
            $user_tags = wp_fusion()->user->get_tags();
            if (is_array($user_tags)) {
                if (in_array('agency', $user_tags)) return 'agency';
                if (in_array('pro', $user_tags)) return 'pro';
            }
        }
        
        // Default for logged-in users without specific tags
        return 'free';
    }

    /**
     * Enqueues all necessary scripts and styles for the builder application.
     */
    private function enqueue_builder_assets() {
        $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.3'; // Version bump
        $assets_url = MKB_PLUGIN_URL . 'assets/';

        // --- STYLESHEETS ---
        wp_enqueue_style('mkb-reset', $assets_url . 'css/reset.css', [], $version);
        wp_enqueue_style('mkb-builder-styles', $assets_url . 'css/builder.css', ['mkb-reset'], $version);
        wp_enqueue_style('mkb-components-styles', $assets_url . 'css/components.css', ['mkb-builder-styles'], $version);
        wp_enqueue_style('mkb-wp-admin-compat', $assets_url . 'css/wp-admin-compat.css', ['mkb-builder-styles'], $version);

        // --- SCRIPTS ---
        wp_enqueue_script('jquery');
        wp_enqueue_media();
        
        // Load our local polyfill file
        wp_enqueue_script('mkb-polyfill', $assets_url . 'js/lib/polyfill.min.js', [], $version, false);
        
        // Load the single, reliable initializer in the header
        wp_enqueue_script('mkb-standalone-initializer', $assets_url . 'js/standalone-initializer.js', ['jquery'], $version, false);
        
        // Load all other scripts in the footer (true as the last parameter)
        wp_enqueue_script('mkb-compatibility', $assets_url . 'js/compatibility.js', ['jquery'], $version, true);
        wp_enqueue_script('mkb-core-builder', $assets_url . 'js/builder.js', ['jquery', 'mkb-compatibility'], $version, true);
        wp_enqueue_script('mkb-section-management', $assets_url . 'js/section-management.js', ['mkb-core-builder'], $version, true);
        wp_enqueue_script('mkb-template-manager', $assets_url . 'js/template-manager.js', ['mkb-core-builder'], $version, true);
        wp_enqueue_script('mkb-premium-access', $assets_url . 'js/premium-access-control.js', ['mkb-core-builder'], $version, true);
        
        // The WordPress adapter should be one of the last to load
        wp_enqueue_script('mkb-wp-adapter', $assets_url . 'js/builder-wordpress.js', ['mkb-core-builder', 'mkb-template-manager'], $version, true);
        
        // Debug helper loads last
        wp_enqueue_script('mkb-debug-helper', $assets_url . 'js/debug-helper.js', ['mkb-wp-adapter'], $version, true);

        wp_localize_script('mkb-wp-adapter', 'mkbData', [
            'ajaxUrl'    => admin_url('admin-ajax.php'),
            'restUrl'    => rest_url('media-kit/v1/'),
            'nonce'      => wp_create_nonce('media_kit_builder_nonce'),
            'restNonce'  => wp_create_nonce('wp_rest'),
            'userId'     => get_current_user_id(),
            'isGuest'    => !is_user_logged_in(),
            'isAdmin'    => current_user_can('manage_options'),
            'pluginUrl'  => MKB_PLUGIN_URL,
            'accessTier' => $this->get_user_access_tier(), // Use the self-contained method
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
        // This variable is now correctly populated by our local method
        $access_tier = $this->get_user_access_tier();
        $template_file = MKB_PLUGIN_DIR . 'templates/builder.php';

        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title><?php echo esc_html__('Media Kit Builder', 'media-kit-builder'); ?> - <?php bloginfo('name'); ?></title>
            <?php
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
                // Pass the access_tier variable to the template
                include $template_file;
            } else {
                wp_die('Error: The main builder template is missing.');
            }

            wp_print_footer_scripts();
            ?>
        </body>
        </html>
        <?php
    }
    
    private function show_preview_page() {
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

    private function show_gallery_page() {
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