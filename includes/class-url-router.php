<?php
/**
 * URL Router for Media Kit Builder
 * Handles custom URL routing and asset loading for the frontend builder.
 *
 * @version 2.1 - Final Corrected Version
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

    public function add_rewrite_rules() {
        add_rewrite_rule('^media-kit-builder/new/?$', 'index.php?mkb_page=new', 'top');
        add_rewrite_rule('^media-kit-builder/preview/([^/]+)/?$', 'index.php?mkb_page=preview&mkb_entry_key=$matches[1]', 'top');
        add_rewrite_rule('^media-kit-builder/([^/]+)/?$', 'index.php?mkb_page=edit&mkb_entry_key=$matches[1]', 'top');
        add_rewrite_rule('^media-kit-builder/?$', 'index.php?mkb_page=gallery', 'top');
    }

    public function add_query_vars($vars) {
        $vars[] = 'mkb_page';
        $vars[] = 'mkb_entry_key';
        return $vars;
    }

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
    
    private function enqueue_builder_assets() {
        $version = defined('MKB_VERSION') ? MKB_VERSION : '1.0.1';
        $assets_url = MKB_PLUGIN_URL . 'assets/';

        // --- STYLESHEETS ---
        wp_enqueue_style('mkb-reset', $assets_url . 'css/reset.css', [], $version);
        wp_enqueue_style('mkb-builder-core-styles', $assets_url . 'css/builder.css', ['mkb-reset'], $version);
        wp_enqueue_style('mkb-components-styles', $assets_url . 'css/components.css', ['mkb-builder-core-styles'], $version);
        wp_enqueue_style('mkb-wp-admin-compat', $assets_url . 'css/wp-admin-compat.css', ['mkb-builder-core-styles'], $version);

        // --- SCRIPTS ---
        wp_enqueue_script('jquery');
        wp_enqueue_media();
        
        wp_enqueue_script('mkb-polyfills', 'https://polyfill.io/v3/polyfill.min.js?features=default', array(), null, false);
        wp_enqueue_script('mkb-compatibility', $assets_url . 'js/compatibility.js', ['jquery', 'mkb-polyfills'], $version, false);
        wp_enqueue_script('mkb-standalone-initializer', $assets_url . 'js/standalone-initializer.js', ['mkb-compatibility'], $version, false);
        
        // Load builder logic in the footer
        wp_enqueue_script('mkb-core-builder', $assets_url . 'js/builder.js', ['jquery', 'mkb-standalone-initializer'], $version, true);
        wp_enqueue_script('mkb-section-management', $assets_url . 'js/section-management.js', ['mkb-core-builder'], $version, true);
        wp_enqueue_script('mkb-wp-adapter', $assets_url . 'js/builder-wordpress.js', ['mkb-core-builder', 'mkb-section-management'], $version, true);
        wp_enqueue_script('mkb-template-manager', $assets_url . 'js/template-manager.js', ['mkb-wp-adapter'], $version, true);
        wp_enqueue_script('mkb-premium-access', $assets_url . 'js/premium-access-control.js', ['mkb-wp-adapter'], $version, true);
        wp_enqueue_script('mkb-debug-helper', $assets_url . 'js/debug-helper.js', ['mkb-wp-adapter'], $version, true);

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
                wp_die('Builder template is missing.');
            }

            wp_print_footer_scripts();
            ?>
        </body>
        </html>
        <?php
    }
    
    private function show_preview_page() {
        $template_file = MKB_PLUGIN_DIR . 'templates/preview.php';
        // You can create a separate enqueue function for preview assets if needed
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
                 wp_die('Preview page is not yet implemented.');
            }
            wp_print_footer_scripts(); 
            ?>
        </body>
        </html>
        <?php
    }

    private function show_gallery_page() {
        $template_file = MKB_PLUGIN_DIR . 'templates/gallery.php';
        // You can create a separate enqueue function for gallery assets if needed
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
                wp_die('Gallery template is not yet implemented.');
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