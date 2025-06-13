<?php
/**
 * Media Kit Builder Template
 *
 * This template is loaded when accessing the builder through the URL router.
 *
 * @package Media_Kit_Builder
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Get entry key if provided
$entry_key = get_query_var('entry_key', '');

// Get user info and access level
$user_id = get_current_user_id();
$is_logged_in = is_user_logged_in();
$is_admin = current_user_can('manage_options');

// Determine access tier (for premium features)
$access_tier = 'guest'; // Default to guest
if ($is_admin) {
    $access_tier = 'admin';
} else if ($is_logged_in && function_exists('wp_fusion')) {
    // Check for WP Fusion tags if available
    $user_tags = wp_fusion()->user->get_tags($user_id);
    if (is_array($user_tags) && (in_array('pro', $user_tags) || in_array('agency', $user_tags))) {
        $access_tier = 'pro';
    }
}

// Create nonce for AJAX security
$nonce = wp_create_nonce('media_kit_builder_nonce');
?>
<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $entry_key ? esc_html("Edit Media Kit: $entry_key") : 'Create New Media Kit'; ?> - Guestify</title>
    
    <!-- Load only our required assets -->
    <link rel='stylesheet' id='mkb-reset-css' href='<?php echo MKB_PLUGIN_URL; ?>assets/css/reset.css?ver=<?php echo MKB_VERSION; ?>' media='all' />
    <link rel='stylesheet' id='mkb-builder-core-styles-css' href='<?php echo MKB_PLUGIN_URL; ?>assets/css/builder.css?ver=<?php echo MKB_VERSION; ?>' media='all' />
    <link rel='stylesheet' id='mkb-components-styles-css' href='<?php echo MKB_PLUGIN_URL; ?>assets/css/components.css?ver=<?php echo MKB_VERSION; ?>' media='all' />
    
    <!-- Polyfills -->
    <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
    
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Compatibility script -->
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/compatibility.js?ver=<?php echo MKB_VERSION; ?>"></script>
</head>
<body class="mkb-builder-body">
    <!-- Add nonce field for AJAX security -->
    <input type="hidden" id="media_kit_builder_nonce" value="<?php echo $nonce; ?>">

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-message">Loading...</div>
    </div>
    
    <div class="media-kit-builder-container" id="media-kit-builder">
        <div class="builder-toolbar">
            <div class="toolbar-left">
                <div class="logo">Guestify</div>
                <div class="guest-name">
                    <?php if (!empty($entry_key)): ?>
                        Editing: <?php echo esc_html($entry_key); ?>'s Media Kit
                    <?php else: ?>
                        New Media Kit
                    <?php endif; ?>
                </div>
                <div class="status-indicator">
                    <div class="status-dot" id="status-dot"></div>
                    <span id="status-text">Ready</span>
                </div>
            </div>
            
            <div class="toolbar-center">
                <div class="preview-toggle">
                    <button class="active" data-preview="desktop">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        Desktop
                    </button>
                    <button data-preview="tablet">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="9"></line>
                        </svg>
                        Tablet
                    </button>
                    <button data-preview="mobile">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                        </svg>
                        Mobile
                    </button>
                </div>
            </div>
            
            <div class="builder-actions">
                <button class="toolbar-btn" id="undo-btn" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 7v6h6"></path>
                        <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                    </svg>
                </button>
                <button class="toolbar-btn" id="redo-btn" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 7v6h-6"></path>
                        <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                    </svg>
                </button>
                <button class="toolbar-btn export" id="export-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export
                </button>
                <button class="toolbar-btn" id="share-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share
                </button>
                <button class="toolbar-btn primary" id="save-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17,21 17,13 7,13 7,21"></polyline>
                        <polyline points="7,3 7,8 15,8"></polyline>
                    </svg>
                    Save
                </button>
            </div>
        </div>
        
        <div class="builder-main">
            <div class="builder-sidebar">
                <div class="sidebar-tabs">
                    <button type="button" class="sidebar-tab active" data-tab="components">
                        Components
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="layout">
                        Layout
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="design">
                        Design
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="settings">
                        Settings
                    </button>
                </div>
                
                <div class="sidebar-content">
                    <div id="components-tab" class="tab-content active">
                        <div class="component-categories">
                            <button type="button" class="category-button active" data-category="all">
                                All
                            </button>
                            
                            <button type="button" class="category-button" data-category="basic">
                                Basic
                            </button>
                            
                            <button type="button" class="category-button" data-category="media">
                                Media
                            </button>
                            
                            <button type="button" class="category-button" data-category="social">
                                Social
                            </button>
                        </div>
                        
                        <div class="component-search">
                            <input type="text" id="component-search" placeholder="Search components...">
                        </div>
                        
                        <div id="component-palette" class="component-palette">
                            <!-- Basic Components -->
                            <div class="component-item" draggable="true" data-component="text" data-category="basic">
                                <div class="component-icon">T</div>
                                <div class="component-name">Text</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="heading" data-category="basic">
                                <div class="component-icon">H</div>
                                <div class="component-name">Heading</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="image" data-category="media">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21,15 16,10 5,21"></polyline>
                                </svg>
                                <div class="component-name">Image</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="biography" data-category="basic">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                </svg>
                                <div class="component-name">Biography</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="topics" data-category="basic">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4l2 3 2-3h4a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-4l-2-3z"></path>
                                </svg>
                                <div class="component-name">Topics</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="questions" data-category="basic">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <path d="M12 17h.01"></path>
                                </svg>
                                <div class="component-name">Questions</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="social" data-category="social">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                                <div class="component-name">Social Links</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="logos" data-category="media">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                </svg>
                                <div class="component-name">Logo Carousel</div>
                            </div>
                            
                            <!-- Premium Components -->
                            <?php if ($access_tier === 'pro' || $access_tier === 'agency') : ?>
                            <div class="component-item" draggable="true" data-component="gallery" data-category="media">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21,15 16,10 5,21"></polyline>
                                </svg>
                                <div class="component-name">Gallery</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="testimonials" data-category="social">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <div class="component-name">Testimonials</div>
                            </div>
                            
                            <div class="component-item" draggable="true" data-component="stats" data-category="basic">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 20V10"></path>
                                    <path d="M12 20V4"></path>
                                    <path d="M6 20v-6"></path>
                                </svg>
                                <div class="component-name">Stats</div>
                            </div>
                            <?php else : ?>
                            <div class="component-item premium-component" data-category="media">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21,15 16,10 5,21"></polyline>
                                </svg>
                                <div class="component-name">Gallery</div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            
                            <div class="component-item premium-component" data-category="social">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <div class="component-name">Testimonials</div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            
                            <div class="component-item premium-component" data-category="basic">
                                <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 20V10"></path>
                                    <path d="M12 20V4"></path>
                                    <path d="M6 20v-6"></path>
                                </svg>
                                <div class="component-name">Stats</div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <div id="layout-tab" class="tab-content">
                        <div class="section-title">Layout Options</div>
                        
                        <div class="form-group">
                            <label class="form-label">Template</label>
                            <select id="template-select" class="form-input">
                                <option value="default">Default</option>
                                <option value="professional">Professional</option>
                                <option value="creative">Creative</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>
                        
                        <!-- Section Management -->
                        <div class="section-title" style="margin-top: 24px;">
                            Section Management
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
                            Add and manage sections in your media kit
                        </p>

                        <div class="section-controls">
                            <button class="section-btn" id="add-section-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Section
                            </button>
                            <button class="section-btn" id="section-templates-btn" style="margin-top: 8px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <path d="M9 9h6v6H9z"></path>
                                </svg>
                                Browse Templates
                            </button>
                        </div>
                    </div>
                    
                    <div id="design-tab" class="tab-content">
                        <div id="element-editor" class="element-editor">
                            <div class="editor-placeholder">
                                Select an element to edit its properties
                            </div>
                        </div>
                    </div>
                    
                    <div id="settings-tab" class="tab-content">
                        <div class="form-group">
                            <label class="form-label">Media Kit Title</label>
                            <input type="text" id="media-kit-title" class="form-input" placeholder="My Media Kit">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea id="media-kit-description" class="form-input" rows="3" placeholder="Brief description of your media kit"></textarea>
                        </div>
                        
                        <?php if ($access_tier === 'agency') : ?>
                        <div class="form-group">
                            <label class="form-label">White Label</label>
                            <div class="toggle-switch">
                                <input type="checkbox" id="white-label-toggle" class="toggle-input">
                                <label for="white-label-toggle" class="toggle-label"></label>
                                <span class="toggle-text">Remove Guestify branding</span>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="builder-content">
                <div id="media-kit-preview" class="media-kit-preview">
                    <!-- Media kit content will be added here -->
                    <div class="drop-zone empty" data-zone="main"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Section Template Modal -->
    <div id="add-section-modal" class="section-template-modal" style="display: none;">
        <div class="template-modal-content">
            <div class="template-modal-header">
                <h3>Add Section</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="template-categories">
                <button class="category-button active" data-category="all">All</button>
                <button class="category-button" data-category="hero">Hero</button>
                <button class="category-button" data-category="content">Content</button>
                <button class="category-button" data-category="media">Media</button>
                <button class="category-button" data-category="features">Features</button>
            </div>
            <div class="template-search">
                <input type="text" placeholder="Search templates..." id="template-search">
            </div>
            <div id="section-template-gallery" class="template-gallery">
                <!-- Template cards will be added here -->
            </div>
        </div>
    </div>

    <!-- JavaScript Configuration -->
    <script>
    // Initialize builder with configuration
    window.MediaKitBuilder = {
        config: {
            entryKey: '<?php echo esc_js($entry_key); ?>',
            isNew: <?php echo empty($entry_key) ? 'true' : 'false'; ?>,
            userId: <?php echo $user_id; ?>,
            isLoggedIn: <?php echo $is_logged_in ? 'true' : 'false'; ?>,
            accessTier: '<?php echo esc_js($access_tier); ?>',
            ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
            nonce: '<?php echo $nonce; ?>',
            pluginUrl: '<?php echo MKB_PLUGIN_URL; ?>'
        }
    };
    </script>
    
    <!-- Load builder JS scripts -->
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/builder.js?ver=<?php echo MKB_VERSION; ?>"></script>
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/section-management.js?ver=<?php echo MKB_VERSION; ?>"></script>
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/builder-wordpress.js?ver=<?php echo MKB_VERSION; ?>"></script>
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/template-manager.js?ver=<?php echo MKB_VERSION; ?>"></script>
    <script src="<?php echo MKB_PLUGIN_URL; ?>assets/js/premium-access-control.js?ver=<?php echo MKB_VERSION; ?>"></script>
</body>
</html>