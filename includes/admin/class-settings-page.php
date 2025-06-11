<?php
/**
 * Settings Page for Media Kit Builder
 * WordPress admin settings interface
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class MKB_Settings_Page {
    
    /**
     * Render the settings page
     */
    public function render() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'media-kit-builder'));
        }
        
        // Handle form submission
        if (isset($_POST['submit'])) {
            $this->save_settings();
        }
        
        // Get current settings
        $settings = $this->get_settings();
        
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Media Kit Builder Settings', 'media-kit-builder'); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('mkb_settings_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php esc_html_e('Guest Session Duration', 'media-kit-builder'); ?></th>
                        <td>
                            <select name="mkb_guest_session_duration">
                                <option value="1" <?php selected($settings['guest_session_duration'], 1); ?>>
                                    <?php esc_html_e('1 Day', 'media-kit-builder'); ?>
                                </option>
                                <option value="7" <?php selected($settings['guest_session_duration'], 7); ?>>
                                    <?php esc_html_e('7 Days (Default)', 'media-kit-builder'); ?>
                                </option>
                                <option value="30" <?php selected($settings['guest_session_duration'], 30); ?>>
                                    <?php esc_html_e('30 Days', 'media-kit-builder'); ?>
                                </option>
                            </select>
                            <p class="description">
                                <?php esc_html_e('How long guest sessions should be retained before automatic cleanup.', 'media-kit-builder'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('Enable Performance Tracking', 'media-kit-builder'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="mkb_enable_performance_tracking" value="1" 
                                       <?php checked($settings['enable_performance_tracking'], 1); ?>>
                                <?php esc_html_e('Track React application performance', 'media-kit-builder'); ?>
                            </label>
                            <p class="description">
                                <?php esc_html_e('Collects anonymous performance data to help improve the application.', 'media-kit-builder'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('Debug Mode', 'media-kit-builder'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="mkb_debug_mode" value="1" 
                                       <?php checked($settings['debug_mode'], 1); ?>>
                                <?php esc_html_e('Enable debug logging', 'media-kit-builder'); ?>
                            </label>
                            <p class="description">
                                <?php esc_html_e('Enables verbose logging for troubleshooting. Only enable when needed.', 'media-kit-builder'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <h2><?php esc_html_e('System Status', 'media-kit-builder'); ?></h2>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php esc_html_e('Plugin Version', 'media-kit-builder'); ?></th>
                        <td><?php echo esc_html(MKB_VERSION); ?></td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('React Assets', 'media-kit-builder'); ?></th>
                        <td>
                            <?php if ($this->check_react_assets()): ?>
                                <span style="color: green;">✓ <?php esc_html_e('Found', 'media-kit-builder'); ?></span>
                            <?php else: ?>
                                <span style="color: red;">✗ <?php esc_html_e('Missing', 'media-kit-builder'); ?></span>
                                <p class="description">
                                    <?php esc_html_e('Run "npm run build" in the app directory to generate React assets.', 'media-kit-builder'); ?>
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('Dependencies', 'media-kit-builder'); ?></th>
                        <td>
                            <?php $this->render_dependency_status(); ?>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Save settings
     */
    private function save_settings() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['_wpnonce'], 'mkb_settings_nonce')) {
            wp_die(__('Security check failed', 'media-kit-builder'));
        }
        
        // Save settings
        update_option('mkb_guest_session_duration', intval($_POST['mkb_guest_session_duration'] ?? 7));
        update_option('mkb_enable_performance_tracking', !empty($_POST['mkb_enable_performance_tracking']));
        update_option('mkb_debug_mode', !empty($_POST['mkb_debug_mode']));
        
        // Show success message
        add_action('admin_notices', function() {
            echo '<div class="notice notice-success"><p>' . 
                 esc_html__('Settings saved successfully.', 'media-kit-builder') . 
                 '</p></div>';
        });
    }
    
    /**
     * Get current settings
     */
    private function get_settings() {
        return [
            'guest_session_duration' => get_option('mkb_guest_session_duration', 7),
            'enable_performance_tracking' => get_option('mkb_enable_performance_tracking', false),
            'debug_mode' => get_option('mkb_debug_mode', false),
        ];
    }
    
    /**
     * Check if React assets exist
     */
    private function check_react_assets() {
        $build_dir = MKB_PLUGIN_DIR . 'app/build/js/';
        $required_files = ['builder.js', 'components.js', 'state.js'];
        
        foreach ($required_files as $file) {
            if (!file_exists($build_dir . $file)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Render dependency status
     */
    private function render_dependency_status() {
        $dependencies = [
            'Pods' => class_exists('PodsInit'),
            'WP Fusion' => class_exists('WP_Fusion'),
            'WordPress 5.0+' => version_compare(get_bloginfo('version'), '5.0', '>='),
            'PHP 7.4+' => version_compare(PHP_VERSION, '7.4', '>='),
        ];
        
        foreach ($dependencies as $name => $status) {
            if ($status) {
                echo '<span style="color: green;">✓ ' . esc_html($name) . '</span><br>';
            } else {
                echo '<span style="color: red;">✗ ' . esc_html($name) . '</span><br>';
            }
        }
    }
}
