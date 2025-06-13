<?php
/**
 * URL Router for Media Kit Builder
 */
class Media_Kit_Builder_URL_Router {

    /**
     * Constructor
     */
    public function __construct() {
        // Hook early in the WordPress initialization process
        add_action('init', array($this, 'register_rewrite_rules'), 10);
        add_filter('query_vars', array($this, 'register_query_vars'));
        add_action('template_redirect', array($this, 'intercept_request'), 5); // Higher priority (lower number)
        
        // Flush rewrite rules on activation
        register_activation_hook(MEDIA_KIT_BUILDER_FILE, array($this, 'flush_rewrite_rules'));
    }

    /**
     * Register rewrite rules
     */
    public function register_rewrite_rules() {
        // Create rule for the builder page
        add_rewrite_rule(
            '^media-kit-builder/?$',
            'index.php?media_kit_builder=1',
            'top'
        );

        // Create rule for editing specific media kits
        add_rewrite_rule(
            '^media-kit-builder/([^/]+)/?$',
            'index.php?media_kit_builder=1&entry_key=$matches[1]',
            'top'
        );
        
        // Debug output to verify rewrite rules
        if (isset($_GET['debug_router']) && current_user_can('manage_options')) {
            global $wp_rewrite;
            echo '<pre>';
            print_r($wp_rewrite->rules);
            echo '</pre>';
            exit;
        }
    }

    /**
     * Register query vars
     */
    public function register_query_vars($vars) {
        $vars[] = 'media_kit_builder';
        $vars[] = 'entry_key';
        return $vars;
    }

    /**
     * Intercept request and load builder
     */
    public function intercept_request() {
        // Debug output
        if (isset($_GET['debug_router_vars']) && current_user_can('manage_options')) {
            global $wp_query;
            echo '<pre>';
            print_r($wp_query->query_vars);
            echo '</pre>';
            exit;
        }
        
        // Check if this is a media kit builder request
        if (get_query_var('media_kit_builder')) {
            // Get entry key if provided
            $entry_key = get_query_var('entry_key', '');
            
            // Set headers to prevent caching
            nocache_headers();
            header('Content-Type: text/html; charset=utf-8');
            
            // Load the builder template
            include_once MEDIA_KIT_BUILDER_PATH . 'templates/builder.php';
            
            // Important: exit to prevent WordPress from loading the theme
            exit;
        }
    }

    /**
     * Flush rewrite rules
     */
    public function flush_rewrite_rules() {
        // Register rules first
        $this->register_rewrite_rules();
        
        // Then flush
        flush_rewrite_rules();
    }
}