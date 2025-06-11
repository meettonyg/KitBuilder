<?php
/**
 * Version Management for Media Kit Builder
 * Handles asset versioning and React build integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class MKB_Version {
    
    /**
     * Get current plugin version
     */
    public static function get_plugin_version() {
        return MKB_VERSION;
    }
    
    /**
     * Get React build version
     */
    public static function get_build_version() {
        $build_info_file = MKB_PLUGIN_DIR . 'app/build/build-info.json';
        
        if (file_exists($build_info_file)) {
            $build_info = json_decode(file_get_contents($build_info_file), true);
            return $build_info['version'] ?? MKB_VERSION;
        }
        
        return MKB_VERSION;
    }
    
    /**
     * Get React asset URLs
     */
    public static function get_react_assets() {
        $assets = [
            'js' => [
                'builder' => MKB_PLUGIN_URL . 'app/build/js/builder.js',
                'components' => MKB_PLUGIN_URL . 'app/build/js/components.js', 
                'state' => MKB_PLUGIN_URL . 'app/build/js/state.js',
            ],
            'css' => []
        ];
        
        return $assets;
    }
    
    /**
     * Enqueue React assets for admin pages
     */
    public static function enqueue_react_assets($page = 'builder') {
        $assets = self::get_react_assets();
        $version = self::get_build_version();
        
        // Enqueue React core scripts
        wp_enqueue_script(
            'mkb-react-state',
            $assets['js']['state'],
            [],
            $version,
            true
        );
        
        wp_enqueue_script(
            'mkb-react-components',
            $assets['js']['components'],
            ['mkb-react-state'],
            $version,
            true
        );
        
        wp_enqueue_script(
            'mkb-react-builder',
            $assets['js']['builder'],
            ['mkb-react-components', 'mkb-react-state'],
            $version,
            true
        );
        
        // Localize with WordPress data
        wp_localize_script('mkb-react-builder', 'mkbWordPress', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mkb_nonce'),
            'userId' => get_current_user_id(),
            'isGuest' => !is_user_logged_in(),
            'pluginUrl' => MKB_PLUGIN_URL,
            'restUrl' => rest_url('mkb/v1/'),
            'restNonce' => wp_create_nonce('wp_rest'),
        ]);
    }
    
    /**
     * Check if React assets exist
     */
    public static function react_assets_exist() {
        $build_dir = MKB_PLUGIN_DIR . 'app/build/js/';
        
        $required_files = [
            'builder.js',
            'components.js',
            'state.js'
        ];
        
        foreach ($required_files as $file) {
            if (!file_exists($build_dir . $file)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get asset file size for cache busting
     */
    public static function get_asset_hash($asset_path) {
        $full_path = MKB_PLUGIN_DIR . 'app/build/js/' . $asset_path;
        
        if (file_exists($full_path)) {
            return md5_file($full_path);
        }
        
        return MKB_VERSION;
    }
}
