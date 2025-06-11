<?php
/**
 * Media Kit Builder Template
 *
 * Main template for the builder interface
 *
 * @package Media_Kit_Builder
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap media-kit-builder-wrap">
    <h1 class="wp-heading-inline"><?php echo esc_html__('Media Kit Builder', 'media-kit-builder'); ?></h1>
    
    <?php if (!empty($entry_key)) : ?>
        <span class="subtitle"><?php echo esc_html__('Editing kit:', 'media-kit-builder'); ?> <?php echo esc_html($entry_key); ?></span>
    <?php else : ?>
        <span class="subtitle"><?php echo esc_html__('Create a new media kit', 'media-kit-builder'); ?></span>
    <?php endif; ?>
    
    <div class="media-kit-builder-container" id="media-kit-builder">
        <div class="loading-overlay" id="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-message"><?php echo esc_html__('Loading...', 'media-kit-builder'); ?></div>
        </div>
        
        <div class="builder-toolbar">
            <div class="builder-actions">
                <button type="button" id="save-button" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php echo esc_html__('Save', 'media-kit-builder'); ?>
                </button>
                
                <button type="button" id="preview-button" class="button">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php echo esc_html__('Preview', 'media-kit-builder'); ?>
                </button>
                
                <button type="button" id="export-button" class="button">
                    <span class="dashicons dashicons-download"></span>
                    <?php echo esc_html__('Export', 'media-kit-builder'); ?>
                </button>
                
                <span id="save-status" class="save-status"></span>
            </div>
            
            <div class="builder-history">
                <button type="button" id="undo-button" class="button" disabled>
                    <span class="dashicons dashicons-undo"></span>
                </button>
                
                <button type="button" id="redo-button" class="button" disabled>
                    <span class="dashicons dashicons-redo"></span>
                </button>
            </div>
        </div>
        
        <div class="builder-main">
            <div class="builder-sidebar">
                <div class="sidebar-tabs">
                    <button type="button" class="sidebar-tab active" data-tab="components">
                        <?php echo esc_html__('Components', 'media-kit-builder'); ?>
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="layout">
                        <?php echo esc_html__('Layout', 'media-kit-builder'); ?>
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="design">
                        <?php echo esc_html__('Design', 'media-kit-builder'); ?>
                    </button>
                    
                    <button type="button" class="sidebar-tab" data-tab="settings">
                        <?php echo esc_html__('Settings', 'media-kit-builder'); ?>
                    </button>
                </div>
                
                <div class="sidebar-content">
                    <div id="components-tab" class="tab-content active">
                        <div class="component-categories">
                            <button type="button" class="category-button active" data-category="all">
                                <?php echo esc_html__('All', 'media-kit-builder'); ?>
                            </button>
                            
                            <button type="button" class="category-button" data-category="basic">
                                <?php echo esc_html__('Basic', 'media-kit-builder'); ?>
                            </button>
                            
                            <button type="button" class="category-button" data-category="media">
                                <?php echo esc_html__('Media', 'media-kit-builder'); ?>
                            </button>
                            
                            <button type="button" class="category-button" data-category="social">
                                <?php echo esc_html__('Social', 'media-kit-builder'); ?>
                            </button>
                        </div>
                        
                        <div class="component-search">
                            <input type="text" id="component-search" placeholder="<?php echo esc_attr__('Search components...', 'media-kit-builder'); ?>">
                        </div>
                        
                        <div id="component-palette" class="component-palette">
                            <!-- Basic Components -->
                            <div class="component-item" data-component="text" data-category="basic">
                                <div class="component-icon">T</div>
                                <div class="component-name"><?php echo esc_html__('Text', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="heading" data-category="basic">
                                <div class="component-icon">H</div>
                                <div class="component-name"><?php echo esc_html__('Heading', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="image" data-category="media">
                                <div class="component-icon"><span class="dashicons dashicons-format-image"></span></div>
                                <div class="component-name"><?php echo esc_html__('Image', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="biography" data-category="basic">
                                <div class="component-icon"><span class="dashicons dashicons-id"></span></div>
                                <div class="component-name"><?php echo esc_html__('Biography', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="topics" data-category="basic">
                                <div class="component-icon"><span class="dashicons dashicons-tag"></span></div>
                                <div class="component-name"><?php echo esc_html__('Topics', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="questions" data-category="basic">
                                <div class="component-icon"><span class="dashicons dashicons-editor-help"></span></div>
                                <div class="component-name"><?php echo esc_html__('Questions', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="social" data-category="social">
                                <div class="component-icon"><span class="dashicons dashicons-share"></span></div>
                                <div class="component-name"><?php echo esc_html__('Social Links', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="logos" data-category="media">
                                <div class="component-icon"><span class="dashicons dashicons-images-alt"></span></div>
                                <div class="component-name"><?php echo esc_html__('Logo Carousel', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <!-- Premium Components -->
                            <?php if ($access_tier === 'pro' || $access_tier === 'agency') : ?>
                            <div class="component-item" data-component="gallery" data-category="media">
                                <div class="component-icon"><span class="dashicons dashicons-format-gallery"></span></div>
                                <div class="component-name"><?php echo esc_html__('Gallery', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="testimonials" data-category="social">
                                <div class="component-icon"><span class="dashicons dashicons-format-quote"></span></div>
                                <div class="component-name"><?php echo esc_html__('Testimonials', 'media-kit-builder'); ?></div>
                            </div>
                            
                            <div class="component-item" data-component="stats" data-category="basic">
                                <div class="component-icon"><span class="dashicons dashicons-chart-bar"></span></div>
                                <div class="component-name"><?php echo esc_html__('Stats', 'media-kit-builder'); ?></div>
                            </div>
                            <?php else : ?>
                            <div class="component-item premium-component" data-category="media">
                                <div class="component-icon"><span class="dashicons dashicons-format-gallery"></span></div>
                                <div class="component-name"><?php echo esc_html__('Gallery', 'media-kit-builder'); ?></div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            
                            <div class="component-item premium-component" data-category="social">
                                <div class="component-icon"><span class="dashicons dashicons-format-quote"></span></div>
                                <div class="component-name"><?php echo esc_html__('Testimonials', 'media-kit-builder'); ?></div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            
                            <div class="component-item premium-component" data-category="basic">
                                <div class="component-icon"><span class="dashicons dashicons-chart-bar"></span></div>
                                <div class="component-name"><?php echo esc_html__('Stats', 'media-kit-builder'); ?></div>
                                <div class="premium-badge">PRO</div>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <div id="layout-tab" class="tab-content">
                        <div class="section-title"><?php echo esc_html__('Layout Options', 'media-kit-builder'); ?></div>
                        
                        <div class="form-group">
                            <label class="form-label"><?php echo esc_html__('Template', 'media-kit-builder'); ?></label>
                            <select id="template-select" class="form-input">
                                <option value="default"><?php echo esc_html__('Default', 'media-kit-builder'); ?></option>
                                <option value="professional"><?php echo esc_html__('Professional', 'media-kit-builder'); ?></option>
                                <option value="creative"><?php echo esc_html__('Creative', 'media-kit-builder'); ?></option>
                                <option value="minimal"><?php echo esc_html__('Minimal', 'media-kit-builder'); ?></option>
                            </select>
                        </div>
                        
                        <!-- Section Management -->
                        <div class="section-title" style="margin-top: 24px;">
                            <?php echo esc_html__('Section Management', 'media-kit-builder'); ?>
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
                            <?php echo esc_html__('Add and manage sections in your media kit', 'media-kit-builder'); ?>
                        </p>

                        <div class="section-controls">
                            <button class="section-btn" id="add-section-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <?php echo esc_html__('Add Section', 'media-kit-builder'); ?>
                            </button>
                            <button class="section-btn" id="section-templates-btn" style="margin-top: 8px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <path d="M9 9h6v6H9z"></path>
                                </svg>
                                <?php echo esc_html__('Browse Templates', 'media-kit-builder'); ?>
                            </button>
                        </div>
                    </div>
                    
                    <div id="design-tab" class="tab-content">
                        <div id="element-editor" class="element-editor">
                            <div class="editor-placeholder">
                                <?php echo esc_html__('Select an element to edit its properties', 'media-kit-builder'); ?>
                            </div>
                        </div>
                    </div>
                    
                    <div id="settings-tab" class="tab-content">
                        <div class="form-group">
                            <label class="form-label"><?php echo esc_html__('Media Kit Title', 'media-kit-builder'); ?></label>
                            <input type="text" id="media-kit-title" class="form-input" placeholder="<?php echo esc_attr__('My Media Kit', 'media-kit-builder'); ?>">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label"><?php echo esc_html__('Description', 'media-kit-builder'); ?></label>
                            <textarea id="media-kit-description" class="form-input" rows="3" placeholder="<?php echo esc_attr__('Brief description of your media kit', 'media-kit-builder'); ?>"></textarea>
                        </div>
                        
                        <?php if ($access_tier === 'agency') : ?>
                        <div class="form-group">
                            <label class="form-label"><?php echo esc_html__('White Label', 'media-kit-builder'); ?></label>
                            <div class="toggle-switch">
                                <input type="checkbox" id="white-label-toggle" class="toggle-input">
                                <label for="white-label-toggle" class="toggle-label"></label>
                                <span class="toggle-text"><?php echo esc_html__('Remove Guestify branding', 'media-kit-builder'); ?></span>
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
</div>

<!-- Section Template Modal -->
<div id="add-section-modal" class="section-template-modal" style="display: none;">
    <div class="template-modal-content">
        <div class="template-modal-header">
            <h3><?php echo esc_html__('Add Section', 'media-kit-builder'); ?></h3>
            <button class="close-modal">&times;</button>
        </div>
        <div class="template-categories">
            <button class="category-button active" data-category="all"><?php echo esc_html__('All', 'media-kit-builder'); ?></button>
            <button class="category-button" data-category="hero"><?php echo esc_html__('Hero', 'media-kit-builder'); ?></button>
            <button class="category-button" data-category="content"><?php echo esc_html__('Content', 'media-kit-builder'); ?></button>
            <button class="category-button" data-category="media"><?php echo esc_html__('Media', 'media-kit-builder'); ?></button>
            <button class="category-button" data-category="features"><?php echo esc_html__('Features', 'media-kit-builder'); ?></button>
        </div>
        <div class="template-search">
            <input type="text" placeholder="<?php echo esc_attr__('Search templates...', 'media-kit-builder'); ?>" id="template-search">
        </div>
        <div id="section-template-gallery" class="template-gallery">
            <!-- Template cards will be added here -->
        </div>
    </div>
</div>

<script type="text/javascript">
    // Pass data to JavaScript
    window.MediaKitBuilder = {
        config: {
            accessTier: '<?php echo esc_js($access_tier); ?>',
            entryKey: '<?php echo esc_js($entry_key); ?>',
            ajaxUrl: '<?php echo esc_js(admin_url('admin-ajax.php')); ?>',
            nonce: '<?php echo esc_js(wp_create_nonce('media_kit_builder_nonce')); ?>',
            restUrl: '<?php echo esc_js(rest_url('media-kit/v1/')); ?>',
            restNonce: '<?php echo esc_js(wp_create_nonce('wp_rest')); ?>'
        }
    };
</script>
