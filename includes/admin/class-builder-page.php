<?php
/**
 * Builder Page Class
 * 
 * Handles the rendering of the builder interface
 * 
 * @package Media_Kit_Builder
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Builder Page Class
 */
class MKB_Builder_Page {
    /**
     * Constructor
     */
    public function __construct() {
        // Nothing to initialize
    }

    /**
     * Render the builder interface
     */
    public function render() {
        // Enqueue scripts and styles
        wp_enqueue_script('jquery-ui-sortable');
        wp_enqueue_script('jquery-ui-droppable');
        wp_enqueue_script('jquery-ui-draggable');
        wp_enqueue_media();
        
        // Get entry key from URL
        $entry_key = isset($_GET['entry_key']) ? sanitize_text_field($_GET['entry_key']) : '';
        
        // Get user access tier
        $access_tier = $this->get_user_access_tier();
        
        // Load builder template
        include_once MKB_PLUGIN_DIR . 'templates/builder.php';
    }
    
    /**
     * Get user access tier based on WP Fusion tags
     */
    private function get_user_access_tier() {
        // Default to 'guest'
        $access_tier = 'guest';
        
        // Check if WP Fusion is active
        if (function_exists('wp_fusion')) {
            // Get user tags
            $user_tags = wp_fusion()->user->get_tags();
            
            // Check for agency tag
            if (is_array($user_tags) && in_array('agency', $user_tags)) {
                $access_tier = 'agency';
            } 
            // Check for pro tag
            else if (is_array($user_tags) && in_array('pro', $user_tags)) {
                $access_tier = 'pro';
            }
            // Check for free tag
            else if (is_array($user_tags) && in_array('free', $user_tags)) {
                $access_tier = 'free';
            }
        }
        
        return $access_tier;
    }
}
