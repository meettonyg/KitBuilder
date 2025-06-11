<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? esc_html($page_title) : 'Media Kit Builder - Guestify'; ?></title>
    <?php wp_head(); ?>
</head>
<body class="<?php echo isset($body_class) ? esc_attr($body_class) : 'mkb-builder-page'; ?>">

<!-- Add nonce field for AJAX security -->
<input type="hidden" id="media_kit_builder_nonce" value="<?php echo wp_create_nonce('media_kit_builder_nonce'); ?>">

<!-- Loading Overlay -->
<div class="loading-overlay" id="loading-overlay">
    <div class="loading-spinner"></div>
    <div>Loading your media kit...</div>
</div>

<div class="builder-container">
    <div class="top-toolbar">
        <div class="toolbar-left">
            <div class="logo">Guestify</div>
            <div class="guest-name">
                <?php if (isset($is_new) && $is_new): ?>
                    Creating: New Media Kit
                <?php elseif (isset($entry_key)): ?>
                    Editing: <?php echo esc_html($entry_key); ?>'s Media Kit
                <?php endif; ?>
            </div>
            <div class="status-indicator">
                <div class="status-dot" id="status-dot"></div>
                <span id="status-text">Loading...</span>
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
        
        <div class="toolbar-right">
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

    <div class="left-sidebar">
        <div class="sidebar-tabs">
            <button class="sidebar-tab active" data-tab="components">Components</button>
            <button class="sidebar-tab" data-tab="design">Design</button>
            <button class="sidebar-tab" data-tab="layout">Layout</button>
        </div>

        <div class="sidebar-content">
            <div id="components-tab" class="tab-content active">
                <div class="components-section">
                    <div class="section-title">Essential Components</div>
                    <div class="component-grid">
                        <div class="component-item" draggable="true" data-component="hero">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div class="component-name">Hero</div>
                        </div>
                        <div class="component-item" draggable="true" data-component="bio">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                            </svg>
                            <div class="component-name">Biography</div>
                        </div>
                        <div class="component-item" draggable="true" data-component="topics">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4l2 3 2-3h4a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-4l-2-3z"></path>
                            </svg>
                            <div class="component-name">Topics</div>
                        </div>
                        <div class="component-item" draggable="true" data-component="social">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                <rect x="2" y="9" width="4" height="12"></rect>
                                <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                            <div class="component-name">Social</div>
                        </div>
                        <div class="component-item" draggable="true" data-component="stats">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 20V10"></path>
                                <path d="M12 20V4"></path>
                                <path d="M6 20v-6"></path>
                            </svg>
                            <div class="component-name">Stats</div>
                        </div>
                        <div class="component-item" draggable="true" data-component="questions">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <path d="M12 17h.01"></path>
                            </svg>
                            <div class="component-name">Questions</div>
                        </div>
                    </div>
                </div>

                <div class="components-section">
                    <div class="section-title">
                        Premium Components
                        <span class="premium-badge">PRO</span>
                    </div>
                    <div class="component-grid">
                        <div class="component-item premium" draggable="true" data-component="video">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            <div class="component-name">Video</div>
                        </div>
                        <div class="component-item premium" draggable="true" data-component="gallery">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21,15 16,10 5,21"></polyline>
                            </svg>
                            <div class="component-name">Gallery</div>
                        </div>
                        <div class="component-item premium" draggable="true" data-component="logos">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                            </svg>
                            <div class="component-name">Logo Grid</div>
                        </div>
                        <div class="component-item premium" draggable="true" data-component="testimonials">
                            <svg class="component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <div class="component-name">Testimonials</div>
                        </div>
                    </div>
                </div>

                <style>
                .preset-btn:hover {
                    background: #dbeafe !important;
                    border-color: #0ea5e9 !important;
                    color: #0ea5e9 !important;
                }
                
                .quick-section-btn span {
                    margin-top: 2px;
                    font-size: 9px;
                    font-weight: 500;
                }
                
                .section-help {
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                </style>
            </div>

            <div id="design-tab" class="tab-content">
                <div class="element-editor" id="element-editor">
                    <div class="editor-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Element Settings
                    </div>
                    <div class="editor-subtitle">Click on any element to edit its properties</div>
                    
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" value="" id="hero-name">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Professional Title</label>
                        <input type="text" class="form-input" value="" id="hero-title">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Bio Description</label>
                        <textarea class="form-input form-textarea" id="hero-bio"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Background Color</label>
                        <div class="color-picker">
                            <input type="color" class="color-input" value="#f8fafc" id="hero-bg-color">
                            <input type="text" class="form-input" value="#f8fafc" id="hero-bg-text" style="flex: 1;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Text Color</label>
                        <div class="color-picker">
                            <input type="color" class="color-input" value="#1e293b" id="hero-text-color">
                            <input type="text" class="form-input" value="#1e293b" id="hero-text-text" style="flex: 1;">
                        </div>
                    </div>
                </div>
            </div>

            <div id="layout-tab" class="tab-content">
                <!-- Existing layout options... -->
                <div class="section-title">Section Layouts</div>
                <div class="layout-options">
                    <div class="layout-option active" data-layout="full-width">
                        <div class="layout-preview full-width"></div>
                        <div class="layout-name">Full Width</div>
                    </div>
                    <div class="layout-option" data-layout="two-column">
                        <div class="layout-preview two-column"></div>
                        <div class="layout-name">Two Column</div>
                    </div>
                    <div class="layout-option" data-layout="sidebar">
                        <div class="layout-preview sidebar"></div>
                        <div class="layout-name">Main + Sidebar</div>
                    </div>
                    <div class="layout-option" data-layout="three-column">
                        <div class="layout-preview three-column"></div>
                        <div class="layout-name">Three Column</div>
                    </div>
                </div>
                
                <!-- EXISTING SECTION CONTROLS -->
                <div class="section-controls">
                    <button class="section-btn" id="add-section-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Section
                    </button>
                    <button class="section-btn" id="duplicate-section-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Duplicate
                    </button>
                </div>

                <!-- ENHANCED SECTION MANAGEMENT AREA - PHASE 3A -->
                <div class="section-title" style="margin-top: 24px; display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #0ea5e9;">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M9 9h6v6H9z"></path>
                    </svg>
                    Section Management
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 16px; line-height: 1.4;">
                    Create new sections or choose from professional templates to build your media kit structure.
                </p>

                <div class="section-management-controls">
                    <!-- PRIMARY ADD SECTION BUTTON - ENHANCED -->
                    <button class="section-btn primary" id="add-section-btn-primary" title="Add a new section with templates">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add New Section
                    </button>
                    
                    <!-- TEMPLATE BROWSER BUTTON - ENHANCED -->
                    <button class="section-btn secondary" id="section-templates-btn" title="Browse professional section templates">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M9 9h6v6H9z"></path>
                        </svg>
                        Browse Templates
                    </button>
                    
                    <!-- QUICK SECTION TYPES - ENHANCED -->
                    <div class="quick-sections" style="margin-top: 16px;">
                        <div class="quick-section-title" style="font-size: 11px; color: #64748b; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #64748b;">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                            Quick Add:
                        </div>
                        <div class="quick-section-buttons">
                            <button class="quick-section-btn" data-section-type="hero" data-layout="full-width" title="Add Hero Section - Main introduction with name, title, and bio">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>Hero</span>
                            </button>
                            <button class="quick-section-btn" data-section-type="content" data-layout="two-column" title="Add Content Section - Biography, topics, and other content">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                </svg>
                                <span>Content</span>
                            </button>
                            <button class="quick-section-btn" data-section-type="features" data-layout="three-column" title="Add Features/Stats Section - Showcase achievements and metrics">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 20V10"></path>
                                    <path d="M12 20V4"></path>
                                    <path d="M6 20v-6"></path>
                                </svg>
                                <span>Stats</span>
                            </button>
                            <button class="quick-section-btn" data-section-type="media" data-layout="full-width" title="Add Media Gallery Section - Photos, videos, and visual content">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21,15 16,10 5,21"></polyline>
                                </svg>
                                <span>Media</span>
                            </button>
                            <button class="quick-section-btn" data-section-type="contact" data-layout="main-sidebar" title="Add Contact Section - Contact information and social links">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>Contact</span>
                            </button>
                            <button class="quick-section-btn" data-section-type="testimonials" data-layout="full-width" title="Add Testimonials Section - Client reviews and testimonials">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>Reviews</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ENHANCED SECTION HELP - PHASE 3A -->
                <div class="section-help" style="margin-top: 20px; padding: 14px; background: rgba(14, 165, 233, 0.08); border-radius: 8px; border-left: 4px solid #0ea5e9; position: relative; overflow: hidden;">
                    <!-- Background decoration -->
                    <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(14, 165, 233, 0.1); border-radius: 50%; opacity: 0.3;"></div>
                    <div style="position: absolute; bottom: -5px; left: -5px; width: 20px; height: 20px; background: rgba(14, 165, 233, 0.15); border-radius: 50%; opacity: 0.5;"></div>
                    
                    <div style="font-size: 12px; font-weight: 600; color: #0ea5e9; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12h8"></path>
                            <path d="M12 8v8"></path>
                        </svg>
                        Pro Tip
                    </div>
                    <div style="font-size: 11px; color: #475569; line-height: 1.4; position: relative; z-index: 2;">
                        <strong>Hover over any section</strong> in the preview to see controls for moving, duplicating, or deleting sections. Click on a section to access layout and styling options in the Design tab.
                    </div>
                </div>

                <!-- GLOBAL LAYOUT SETTINGS -->
                <div class="section-title" style="margin-top: 24px;">Global Settings</div>
                <div class="form-group">
                    <label class="form-label">Max Width</label>
                    <input type="text" class="form-input" value="900px" id="global-max-width" placeholder="e.g., 900px, 100%">
                </div>
                <div class="form-group">
                    <label class="form-label">Section Spacing</label>
                    <select class="form-input" id="global-spacing">
                        <option value="16px">Compact (16px)</option>
                        <option value="24px">Standard (24px)</option>
                        <option value="32px" selected>Comfortable (32px)</option>
                        <option value="48px">Spacious (48px)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Mobile Behavior</label>
                    <select class="form-input" id="mobile-behavior">
                        <option value="stack" selected>Stack Sections Vertically</option>
                        <option value="preserve">Preserve Desktop Layout</option>
                    </select>
                </div>

                <!-- LAYOUT PRESETS -->
                <div class="section-title" style="margin-top: 20px;">Layout Presets</div>
                <div class="layout-presets" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="preset-btn" data-preset="speaker" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 8px; cursor: pointer; transition: all 0.2s ease; color: #475569; text-align: center;">
                        <div class="preset-icon" style="font-size: 16px; margin-bottom: 4px;">🎤</div>
                        <div class="preset-name" style="font-size: 10px; font-weight: 500;">Speaker Kit</div>
                    </button>
                    <button class="preset-btn" data-preset="author" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 8px; cursor: pointer; transition: all 0.2s ease; color: #475569; text-align: center;">
                        <div class="preset-icon" style="font-size: 16px; margin-bottom: 4px;">📚</div>
                        <div class="preset-name" style="font-size: 10px; font-weight: 500;">Author Kit</div>
                    </button>
                    <button class="preset-btn" data-preset="coach" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 8px; cursor: pointer; transition: all 0.2s ease; color: #475569; text-align: center;">
                        <div class="preset-icon" style="font-size: 16px; margin-bottom: 4px;">🎯</div>
                        <div class="preset-name" style="font-size: 10px; font-weight: 500;">Coach Kit</div>
                    </button>
                    <button class="preset-btn" data-preset="consultant" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 8px; cursor: pointer; transition: all 0.2s ease; color: #475569; text-align: center;">
                        <div class="preset-icon" style="font-size: 16px; margin-bottom: 4px;">💼</div>
                        <div class="preset-name" style="font-size: 10px; font-weight: 500;">Business Kit</div>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="preview-area">
        <div class="preview-container" id="preview-container">
            <div class="media-kit-preview" id="media-kit-preview">
                
                <!-- Hero Section -->
                <div class="media-kit-section" data-section-id="section-hero-1" data-section-type="hero" data-section-layout="full-width">
                    <div class="section-content layout-full-width">
                        <div class="section-column" data-column="full">
                                <div class="hero-section editable-element selected" data-element="hero" data-component="hero" data-component-id="hero-1">
                                <div class="element-controls">
                                    <button class="control-btn" title="Move Up">↑</button>
                                    <button class="control-btn" title="Duplicate">⧉</button>
                                    <button class="control-btn" title="Delete">×</button>
                                </div>
                                <div class="hero-avatar">
                                    <span id="avatar-initials">?</span>
                                </div>
                                <h1 class="hero-name" contenteditable="true" id="preview-name">Your Name</h1>
                                <div class="hero-title" contenteditable="true" id="preview-title">Your Professional Title</div>
                                <p class="hero-bio" contenteditable="true" id="preview-bio">Add your professional biography here.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="drop-zone empty" data-zone="between-sections-1"></div>

                <!-- Content Section with Topics -->
                <div class="media-kit-section" data-section-id="section-content-1" data-section-type="content" data-section-layout="full-width">
                    <div class="section-content layout-full-width">
                        <div class="section-column" data-column="full">
                            <div class="content-section editable-element" data-element="topics" data-component="topics" data-component-id="topics-1">
                                <div class="element-controls">
                                    <button class="control-btn" title="Move Up">↑</button>
                                    <button class="control-btn" title="Move Down">↓</button>
                                    <button class="control-btn" title="Duplicate">⧉</button>
                                    <button class="control-btn" title="Delete">×</button>
                                </div>
                                <h2 class="section-title-mk" contenteditable="true">Speaking Topics</h2>
                                <div class="topics-grid">
                                    <div class="topic-item" contenteditable="true">Topic 1</div>
                                    <div class="topic-item" contenteditable="true">Topic 2</div>
                                    <div class="topic-item" contenteditable="true">Topic 3</div>
                                    <div class="topic-item" contenteditable="true">Topic 4</div>
                                </div>
                            </div>
                    </div>
                </div>

                <div class="drop-zone empty" data-zone="between-sections-2"></div>

                <!-- Contact Section with Social Links -->
                <div class="media-kit-section" data-section-id="section-contact-1" data-section-type="contact" data-section-layout="full-width">
                    <div class="section-content layout-full-width">
                        <div class="section-column" data-column="full">
                            <div class="social-links editable-element" data-element="social" data-component="social" data-component-id="social-1">
                                <div class="element-controls">
                                    <button class="control-btn" title="Move Up">↑</button>
                                    <button class="control-btn" title="Move Down">↓</button>
                                    <button class="control-btn" title="Duplicate">⧉</button>
                                    <button class="control-btn" title="Delete">×</button>
                                </div>
                                <a href="#" class="social-link" title="Twitter">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" title="LinkedIn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                                        <circle cx="4" cy="4" r="2"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" title="Instagram">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                    </svg>
                                </a>
                            </div>
                    </div>
                </div>

                <div class="drop-zone empty" data-zone="final"></div>
                
            </div>
        </div>
    </div>
</div>

<script>
// Initialize builder with WordPress configuration
window.MediaKitBuilder = {
    config: {
        entryKey: '<?php echo isset($entry_key) ? esc_js($entry_key) : ""; ?>',
        isNew: <?php echo isset($is_new) && $is_new ? 'true' : 'false'; ?>,
        userId: <?php echo isset($user_id) ? intval($user_id) : 0; ?>,
        isLoggedIn: <?php echo isset($is_logged_in) && $is_logged_in ? 'true' : 'false'; ?>,
        accessTier: '<?php echo isset($access_tier) ? esc_js($access_tier) : 'guest'; ?>',
        ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
        nonce: '<?php echo wp_create_nonce('media_kit_builder_nonce'); ?>',
        pluginUrl: '<?php echo plugin_dir_url(dirname(__FILE__)); ?>'
    },
    
    // Field mappings for Formidable integration
    fieldMappings: {
        // Hero Section
        'hero_full_name': 8517,
        'hero_first_name': 8029,
        'hero_last_name': 8176,
        'hero_title': 10388,
        'hero_organization': 8032,
        'hero_tagline': 8489,
        
        // Biography
        'bio_text': 8045,
        'bio_ai_generated': 10077,
        
        // Topics (5 individual fields)
        'topic_1': 8498,
        'topic_2': 8499,
        'topic_3': 8500,
        'topic_4': 8501,
        'topic_5': 8502,
        
        // Questions (25 individual fields)
        'question_1': 8505,
        'question_2': 8506,
        'question_3': 8507,
        'question_4': 8508,
        'question_5': 8509,
        'question_6': 8510,
        'question_7': 8511,
        'question_8': 8512,
        'question_9': 8513,
        'question_10': 8514,
        'question_11': 8515,
        'question_12': 8516,
        'question_13': 8518,
        'question_14': 8519,
        'question_15': 8520,
        'question_16': 8521,
        'question_17': 8522,
        'question_18': 8523,
        'question_19': 8524,
        'question_20': 8525,
        'question_21': 8526,
        'question_22': 8527,
        'question_23': 8528,
        'question_24': 8529,
        'question_25': 10384,
        
        // Social Media
        'social_facebook': 8035,
        'social_twitter': 8036,
        'social_instagram': 8037,
        'social_linkedin': 8038,
        'social_youtube': 8381,
        'social_pinterest': 8382,
        'social_tiktok': 8383,
        
        // Media
        'headshot_primary': 8046,
        'logo_main': 8047,
        'carousel_images': 10423
    },
    
    // Initialize function
    init: function() {
        console.log('Media Kit Builder v2.0 - WordPress Integration');
        console.log('Configuration:', this.config);
        console.log('Field Mappings:', Object.keys(this.fieldMappings).length + ' fields mapped');
        
        // The main builder JavaScript will take over from here
        // This just provides the WordPress integration layer
    
    // DEBUGGING: Force hide loading overlay after 2 seconds
    setTimeout(function() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('✅ Loading overlay manually hidden');
        }
    }, 2000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.MediaKitBuilder.init();
});
</script>

<!-- Error checking -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking template system dependencies...');
    setTimeout(() => {
        console.log('showAddSectionModal:', typeof showAddSectionModal);
        console.log('sectionTemplates:', typeof window.sectionTemplates);
        console.log('premiumAccess:', typeof window.premiumAccess);
        console.log('MediaKitBuilder:', typeof window.MediaKitBuilder);
        console.log('Nonce available:', window.MediaKitBuilder?.config?.nonce ? 'Yes' : 'No');
        console.log('Nonce from hidden field:', document.getElementById('media_kit_builder_nonce')?.value ? 'Yes' : 'No');
        
        if (typeof showAddSectionModal === 'function') {
            console.log('✅ Template system loaded successfully');
        } else {
            console.error('❌ Template system failed to load');
        }
        
        // Use fixed premium component handler if available
        if (typeof window.fixedSetupPremiumComponentHandlers === 'function') {
            console.log('🔧 Using fixed premium component handler');
            // Override the default function with our fixed version
            window.setupPremiumComponentHandlers = window.fixedSetupPremiumComponentHandlers;
            // Run the fixed handler
            window.setupPremiumComponentHandlers();
        }
        
        // Template system should now work correctly with built-in fixes
        console.log('🔧 Template system using native functionality with integrated fixes');
        
        // Debug available template modal buttons
        console.log('Add Section buttons found:', document.querySelectorAll('#add-section-btn, #add-section-btn-primary').length);
        console.log('Template buttons found:', document.querySelectorAll('#section-templates-btn').length);
    }, 1000);
});
</script>

<?php wp_footer(); ?>
</body>
</html>