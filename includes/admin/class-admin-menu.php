<?php
/**
 * Admin Menu Class
 * 
 * Handles the plugin's admin menu setup and navigation
 * 
 * @package Media_Kit_Builder
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin Menu Class
 */
class MKB_Admin_Menu {
    /**
     * Instance of this class
     *
     * @var MKB_Admin_Menu
     */
    private static $instance;

    /**
     * Get instance of this class
     *
     * @return MKB_Admin_Menu
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
    public function __construct() {
        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Main menu
        add_menu_page(
            __('Media Kit Builder', 'media-kit-builder'),
            __('Media Kit Builder', 'media-kit-builder'),
            'edit_posts',
            'media-kit-builder',
            array($this, 'render_builder_page'),
            'dashicons-layout',
            30
        );

        // Builder submenu
        add_submenu_page(
            'media-kit-builder',
            __('Builder', 'media-kit-builder'),
            __('Builder', 'media-kit-builder'),
            'edit_posts',
            'media-kit-builder',
            array($this, 'render_builder_page')
        );

        // My Kits submenu
        add_submenu_page(
            'media-kit-builder',
            __('My Kits', 'media-kit-builder'),
            __('My Kits', 'media-kit-builder'),
            'edit_posts',
            'media-kit-my-kits',
            array($this, 'render_my_kits_page')
        );

        // Settings submenu
        add_submenu_page(
            'media-kit-builder',
            __('Settings', 'media-kit-builder'),
            __('Settings', 'media-kit-builder'),
            'manage_options',
            'media-kit-settings',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Render builder page
     */
    public function render_builder_page() {
        // Verify the builder page class exists
        if (class_exists('MKB_Builder_Interface')) {
            $builder_page = new MKB_Builder_Interface();
            $builder_page->render();
        } else {
            echo '<div class="wrap"><h1>' . esc_html__('Media Kit Builder', 'media-kit-builder') . '</h1>';
            echo '<div class="notice notice-error"><p>' . 
                esc_html__('Error: Builder interface class not found.', 'media-kit-builder') . 
                '</p></div></div>';
        }
    }

    /**
     * Render my kits page
     */
    public function render_my_kits_page() {
        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('My Media Kits', 'media-kit-builder') . '</h1>';
        
        // Get current user's media kits
        global $wpdb;
        $table_name = $wpdb->prefix . 'media_kits';
        $user_id = get_current_user_id();
        
        $kits = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table_name} WHERE user_id = %d ORDER BY modified DESC",
                $user_id
            )
        );
        
        if ($kits) {
            echo '<div class="mkb-kits-list">';
            foreach ($kits as $kit) {
                $edit_url = admin_url('admin.php?page=media-kit-builder&entry_key=' . $kit->entry_key);
                $view_url = home_url('media-kit/' . $kit->entry_key);
                
                echo '<div class="mkb-kit-item">';
                echo '<h3>' . esc_html($kit->name ?? 'Untitled Media Kit') . '</h3>';
                echo '<div class="mkb-kit-meta">';
                echo '<span class="mkb-kit-date">Modified: ' . esc_html(date_i18n(get_option('date_format'), strtotime($kit->modified))) . '</span>';
                echo '</div>';
                echo '<div class="mkb-kit-actions">';
                echo '<a href="' . esc_url($edit_url) . '" class="button">' . esc_html__('Edit', 'media-kit-builder') . '</a> ';
                echo '<a href="' . esc_url($view_url) . '" class="button" target="_blank">' . esc_html__('View', 'media-kit-builder') . '</a> ';
                echo '<a href="#" class="button mkb-delete-kit" data-kit-id="' . esc_attr($kit->entry_key) . '">' . esc_html__('Delete', 'media-kit-builder') . '</a>';
                echo '</div>';
                echo '</div>';
            }
            echo '</div>';
        } else {
            echo '<p>' . esc_html__('You don\'t have any media kits yet.', 'media-kit-builder') . '</p>';
            echo '<a href="' . esc_url(admin_url('admin.php?page=media-kit-builder')) . '" class="button button-primary">' . 
                esc_html__('Create Your First Media Kit', 'media-kit-builder') . '</a>';
        }
        
        echo '</div>';
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Verify the settings page class exists
        if (class_exists('MKB_Settings_Page')) {
            $settings_page = new MKB_Settings_Page();
            $settings_page->render();
        } else {
            echo '<div class="wrap"><h1>' . esc_html__('Media Kit Builder Settings', 'media-kit-builder') . '</h1>';
            echo '<div class="notice notice-error"><p>' . 
                esc_html__('Error: Settings page class not found.', 'media-kit-builder') . 
                '</p></div></div>';
        }
    }
}

// Initialize
MKB_Admin_Menu::instance();
