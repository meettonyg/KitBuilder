<?php
/**
 * Media Kit Builder Activation
 * 
 * Functions that run during plugin activation
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Activation function
 */
function mkb_activate() {
    // Create database tables
    mkb_create_tables();
    
    // Set up plugin options
    mkb_setup_options();
    
    // Add capabilities
    mkb_add_capabilities();
    
    // Create default templates
    mkb_create_default_templates();
}

/**
 * Create database tables
 */
function mkb_create_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // Media kits table
    $table_name = $wpdb->prefix . 'media_kits';
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        entry_key varchar(32) NOT NULL,
        user_id bigint(20) NOT NULL,
        title varchar(255) NOT NULL DEFAULT '',
        data longtext NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft',
        created datetime NOT NULL,
        modified datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY entry_key (entry_key),
        KEY user_id (user_id),
        KEY status (status)
    ) $charset_collate;";
    
    // Templates table
    $templates_table = $wpdb->prefix . 'media_kit_templates';
    
    $sql .= "CREATE TABLE $templates_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        template_key varchar(32) NOT NULL,
        user_id bigint(20) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        data longtext NOT NULL,
        is_public tinyint(1) NOT NULL DEFAULT 0,
        created datetime NOT NULL,
        modified datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY template_key (template_key),
        KEY user_id (user_id)
    ) $charset_collate;";
    
    // Create tables
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    
    // Suppress errors during table creation
    $wpdb->hide_errors();
    
    dbDelta($sql);
    
    // Restore error display
    $wpdb->show_errors();
}

/**
 * Set up plugin options
 */
function mkb_setup_options() {
    // Default options
    $options = array(
        'version' => MKB_VERSION,
        'db_version' => '1.0.0',
        'installed' => time(),
        'guest_access' => true,
        'default_template' => 'minimal',
        'premium_access_control' => true
    );
    
    // Add options
    foreach ($options as $key => $value) {
        update_option('mkb_' . $key, $value);
    }
}

/**
 * Add capabilities
 */
function mkb_add_capabilities() {
    // Get administrator role
    $admin = get_role('administrator');
    
    // Add capabilities
    if ($admin) {
        $admin->add_cap('create_media_kits');
        $admin->add_cap('edit_media_kits');
        $admin->add_cap('edit_others_media_kits');
        $admin->add_cap('delete_media_kits');
        $admin->add_cap('delete_others_media_kits');
        $admin->add_cap('read_media_kits');
        $admin->add_cap('read_private_media_kits');
        $admin->add_cap('publish_media_kits');
    }
    
    // Get editor role
    $editor = get_role('editor');
    
    // Add capabilities
    if ($editor) {
        $editor->add_cap('create_media_kits');
        $editor->add_cap('edit_media_kits');
        $editor->add_cap('delete_media_kits');
        $editor->add_cap('read_media_kits');
        $editor->add_cap('publish_media_kits');
    }
}

/**
 * Create default templates
 */
function mkb_create_default_templates() {
    global $wpdb;
    
    // Templates table
    $table_name = $wpdb->prefix . 'media_kit_templates';
    
    // Check if templates table exists
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        return;
    }
    
    // Default templates data
    $templates = array(
        array(
            'template_key' => 'minimal',
            'user_id' => 0, // System template
            'title' => 'Minimal',
            'description' => 'A clean, minimal template with essential sections',
            'is_public' => 1,
            'data' => json_encode(array(
                'sections' => array(
                    array(
                        'id' => 'section-hero',
                        'type' => 'hero',
                        'layout' => 'full-width',
                        'components' => array('header-1')
                    ),
                    array(
                        'id' => 'section-bio',
                        'type' => 'content',
                        'layout' => 'full-width',
                        'components' => array('bio-1')
                    ),
                    array(
                        'id' => 'section-topics',
                        'type' => 'features',
                        'layout' => 'full-width',
                        'components' => array('topics-1')
                    ),
                    array(
                        'id' => 'section-social',
                        'type' => 'contact',
                        'layout' => 'full-width',
                        'components' => array('social-1')
                    )
                ),
                'components' => array(
                    'header-1' => array(
                        'id' => 'header-1',
                        'type' => 'header',
                        'content' => array(
                            'title' => 'Your Name',
                            'subtitle' => 'Your Title or Profession'
                        )
                    ),
                    'bio-1' => array(
                        'id' => 'bio-1',
                        'type' => 'biography',
                        'content' => array(
                            'text' => 'Your biography here. This should be 300-500 words about yourself, your expertise, and what makes you unique.'
                        )
                    ),
                    'topics-1' => array(
                        'id' => 'topics-1',
                        'type' => 'topics',
                        'content' => array(
                            'topics' => array('Topic 1', 'Topic 2', 'Topic 3', 'Topic 4')
                        )
                    ),
                    'social-1' => array(
                        'id' => 'social-1',
                        'type' => 'social',
                        'content' => array(
                            'platforms' => array(
                                array('platform' => 'Twitter', 'link' => 'https://twitter.com/yourusername'),
                                array('platform' => 'LinkedIn', 'link' => 'https://linkedin.com/in/yourusername'),
                                array('platform' => 'Instagram', 'link' => 'https://instagram.com/yourusername')
                            )
                        )
                    )
                )
            ))
        ),
        array(
            'template_key' => 'professional',
            'user_id' => 0, // System template
            'title' => 'Professional',
            'description' => 'A professional template for business use',
            'is_public' => 1,
            'data' => json_encode(array(
                'sections' => array(
                    array(
                        'id' => 'section-hero',
                        'type' => 'hero',
                        'layout' => 'two-column',
                        'components' => array(
                            'left' => array('header-1'),
                            'right' => array('logo-1')
                        )
                    ),
                    array(
                        'id' => 'section-bio',
                        'type' => 'content',
                        'layout' => 'full-width',
                        'components' => array('bio-1')
                    ),
                    array(
                        'id' => 'section-topics',
                        'type' => 'features',
                        'layout' => 'three-column',
                        'components' => array(
                            'left' => array('topics-1'),
                            'center' => array('questions-1'),
                            'right' => array('social-1')
                        )
                    )
                ),
                'components' => array(
                    'header-1' => array(
                        'id' => 'header-1',
                        'type' => 'header',
                        'content' => array(
                            'title' => 'Your Name',
                            'subtitle' => 'Your Title or Profession'
                        )
                    ),
                    'logo-1' => array(
                        'id' => 'logo-1',
                        'type' => 'logo',
                        'content' => array(
                            'url' => '',
                            'alt' => 'Logo'
                        )
                    ),
                    'bio-1' => array(
                        'id' => 'bio-1',
                        'type' => 'biography',
                        'content' => array(
                            'text' => 'Your professional biography. Explain your background, expertise, and what makes you unique in your field.'
                        )
                    ),
                    'topics-1' => array(
                        'id' => 'topics-1',
                        'type' => 'topics',
                        'content' => array(
                            'topics' => array('Expertise 1', 'Expertise 2', 'Expertise 3')
                        )
                    ),
                    'questions-1' => array(
                        'id' => 'questions-1',
                        'type' => 'questions',
                        'content' => array(
                            'questions' => array('What services do you offer?', 'What is your experience?', 'How can you help clients?')
                        )
                    ),
                    'social-1' => array(
                        'id' => 'social-1',
                        'type' => 'social',
                        'content' => array(
                            'platforms' => array(
                                array('platform' => 'LinkedIn', 'link' => 'https://linkedin.com/in/yourusername'),
                                array('platform' => 'Twitter', 'link' => 'https://twitter.com/yourusername'),
                                array('platform' => 'Website', 'link' => 'https://yourwebsite.com')
                            )
                        )
                    )
                )
            ))
        )
    );
    
    // Insert templates
    foreach ($templates as $template) {
        // Check if template already exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE template_key = %s",
            $template['template_key']
        ));
        
        if (!$exists) {
            $wpdb->insert(
                $table_name,
                array(
                    'template_key' => $template['template_key'],
                    'user_id' => $template['user_id'],
                    'title' => $template['title'],
                    'description' => $template['description'],
                    'data' => $template['data'],
                    'is_public' => $template['is_public'],
                    'created' => current_time('mysql'),
                    'modified' => current_time('mysql')
                ),
                array('%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s')
            );
        }
    }
}
