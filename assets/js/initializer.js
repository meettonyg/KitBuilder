/**
 * Media Kit Builder - Initializer
 * 
 * This file ensures proper initialization of the Media Kit Builder by:
 * 1. Setting up the global namespace correctly
 * 2. Ensuring DOM elements exist before initialization
 * 3. Managing the proper initialization sequence
 * 4. Handling error recovery and providing fallbacks
 */

console.log('📋 Media Kit Builder Initializer loading...');

// Set up the global namespace and essential structures
window.MediaKitBuilder = window.MediaKitBuilder || {};
window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};
window.MediaKitBuilder.performance = window.MediaKitBuilder.performance || {};
window.MediaKitBuilder.errors = window.MediaKitBuilder.errors || [];

// Ensure initQueue is properly initialized
if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
    console.log('Fixing initQueue in initializer.js - it was not an array');
    window.MediaKitBuilder.initQueue = [];
}

// Track initialization stages for debugging
window.MediaKitBuilder.performance.loadStart = window.MediaKitBuilder.performance.loadStart || Date.now();
window.MediaKitBuilder.performance.stages = window.MediaKitBuilder.performance.stages || {
    initializerLoaded: Date.now(),
    compatibilityLoaded: false,
    coreInitialized: false,
    buildComplete: false
};

/**
 * Central error handler
 * @param {Error|Object} error - The error object
 * @param {string} context - Context where the error occurred
 */
window.MediaKitBuilder.logError = function(error, context) {
    console.error(`Media Kit Builder Error (${context}):`, error);
    window.MediaKitBuilder.errors.push({
        error: error.message || String(error),
        stack: error.stack || '',
        context: context,
        timestamp: new Date().toISOString()
    });
    
    // Emit error event if possible
    if (window.MediaKitBuilder.global.instance && typeof window.MediaKitBuilder.global.instance.emit === 'function') {
        window.MediaKitBuilder.global.instance.emit('error', { error, context });
    }
};

/**
 * Robust element checker and creator
 * @returns {Object} The DOM elements
 */
window.MediaKitBuilder.checkElements = function() {
    try {
        console.log('Checking for required DOM elements...');
        
        const elements = {
            container: document.querySelector('#media-kit-builder'),
            preview: document.querySelector('#media-kit-preview'),
            palette: document.querySelector('#component-palette')
        };
        
        // 1. Create or find main container
        if (!elements.container) {
            console.log('Creating media-kit-builder container');
            const container = document.createElement('div');
            container.id = 'media-kit-builder';
            container.className = 'media-kit-builder';
            
            // Try to add structure if needed
            container.innerHTML = `
                <div class="builder-toolbar">
                    <div class="builder-actions">
                        <button id="save-button" class="button button-primary">Save</button>
                        <button id="preview-button" class="button">Preview</button>
                        <button id="export-button" class="button">Export</button>
                        <span id="save-status" class="save-status"></span>
                    </div>
                    <div class="builder-history">
                        <button id="undo-button" class="button" disabled>Undo</button>
                        <button id="redo-button" class="button" disabled>Redo</button>
                    </div>
                </div>
                <div class="builder-main">
                    <div class="builder-sidebar">
                        <div class="sidebar-tabs">
                            <button class="sidebar-tab active" data-tab="components">Components</button>
                            <button class="sidebar-tab" data-tab="layout">Layout</button>
                            <button class="sidebar-tab" data-tab="design">Design</button>
                            <button class="sidebar-tab" data-tab="settings">Settings</button>
                        </div>
                        <div class="sidebar-content">
                            <div id="components-tab" class="tab-content active">
                                <!-- Component palette will be added here -->
                            </div>
                            <div id="layout-tab" class="tab-content">
                                <!-- Layout options -->
                                <div class="section-title" style="margin-top: 24px;">Section Management</div>
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
                                <!-- Design options -->
                            </div>
                            <div id="settings-tab" class="tab-content">
                                <!-- Settings options -->
                            </div>
                        </div>
                    </div>
                    <div class="builder-content">
                        <div id="media-kit-preview" class="media-kit-preview">
                            <!-- Media kit content will be added here -->
                        </div>
                    </div>
                </div>
            `;
            
            // Find a suitable place to append it
            const content = document.querySelector('.content-area, .entry-content, main, #content');
            if (content) {
                content.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
            
            elements.container = container;
        }
        
        // 2. Create or find preview container
        if (!elements.preview) {
            elements.preview = document.querySelector('#media-kit-preview');
            
            if (!elements.preview) {
                console.log('Creating media-kit-preview container');
                const preview = document.createElement('div');
                preview.id = 'media-kit-preview';
                preview.className = 'media-kit-preview';
                
                // Find builder-content to add preview to
                const builderContent = elements.container.querySelector('.builder-content');
                if (builderContent) {
                    builderContent.appendChild(preview);
                } else {
                    elements.container.appendChild(preview);
                }
                
                elements.preview = preview;
            }
        }
        
        // 3. Create or find component palette
        if (!elements.palette) {
            elements.palette = document.querySelector('#component-palette');
            
            if (!elements.palette) {
                console.log('Creating component-palette container');
                const palette = document.createElement('div');
                palette.id = 'component-palette';
                palette.className = 'component-palette';
                
                // Find components tab to add palette to
                const componentsTab = document.querySelector('#components-tab');
                if (componentsTab) {
                    componentsTab.appendChild(palette);
                } else {
                    elements.container.appendChild(palette);
                }
                
                elements.palette = palette;
            }
        }
        
        // Ensure CSS styles are applied
        window.MediaKitBuilder.ensureStyles();
        
        console.log('All required elements are available:', {
            container: !!elements.container,
            preview: !!elements.preview,
            palette: !!elements.palette
        });
        
        window.MediaKitBuilder.performance.stages.elementsChecked = Date.now();
        
        return elements;
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'checkElements');
        // Return whatever we have to prevent further errors
        return {
            container: document.querySelector('#media-kit-builder') || document.body,
            preview: document.querySelector('#media-kit-preview'),
            palette: document.querySelector('#component-palette')
        };
    }
};

/**
 * Ensure critical CSS styles are applied
 */
window.MediaKitBuilder.ensureStyles = function() {
    try {
        // Check if builder.css is loaded by looking for styleSheets
        const styleLoaded = Array.from(document.styleSheets).some(sheet => {
            try {
                return sheet.href && sheet.href.includes('builder.css');
            } catch (e) {
                return false;
            }
        });
        
        if (!styleLoaded) {
            console.log('Applying critical inline styles...');
            
            // Critical styles for the builder UI
            const criticalStyles = `
                #media-kit-builder {
                    background: #1a1a1a;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                }
                
                .builder-toolbar {
                    background: #2a2a2a;
                    padding: 10px;
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #404040;
                }
                
                .builder-main {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }
                
                .builder-sidebar {
                    width: 300px;
                    background: #2a2a2a;
                    border-right: 1px solid #404040;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .sidebar-tabs {
                    display: flex;
                    border-bottom: 1px solid #404040;
                }
                
                .sidebar-tab {
                    flex: 1;
                    padding: 10px;
                    text-align: center;
                    color: #94a3b8;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                
                .sidebar-tab.active {
                    color: #0ea5e9;
                    border-bottom: 2px solid #0ea5e9;
                }
                
                .sidebar-content {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .builder-content {
                    flex: 1;
                    overflow: auto;
                    background: #1a1a1a;
                    padding: 20px;
                }
                
                .media-kit-preview {
                    background: #ffffff;
                    color: #1a1a1a;
                    margin: 0 auto;
                    max-width: 800px;
                    min-height: 80vh;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }
                
                .drop-zone {
                    min-height: 100px;
                    border: 2px dashed transparent;
                    padding: 10px;
                    transition: all 0.2s ease;
                }
                
                .drop-zone.empty {
                    border-color: #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 30px;
                }
                
                .section-btn {
                    background: #333;
                    border: 1px solid #555;
                    color: #94a3b8;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    width: 100%;
                    justify-content: center;
                }
                
                .section-btn:hover {
                    border-color: #0ea5e9;
                    color: #0ea5e9;
                    background: #3a3a3a;
                }
                
                .media-kit-section {
                    position: relative;
                    margin-bottom: 20px;
                    padding: 20px 0;
                }
                
                .media-kit-section.selected {
                    background-color: rgba(14, 165, 233, 0.03);
                    border-left: 3px solid #0ea5e9;
                    border-right: 3px solid #0ea5e9;
                    outline: 2px solid #0ea5e9;
                    outline-offset: 2px;
                }
                
                .section-controls {
                    position: absolute;
                    top: -40px;
                    right: 20px;
                    background: #2a2a2a;
                    border-radius: 6px;
                    padding: 4px;
                    display: none;
                    gap: 4px;
                    z-index: 100;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                
                .media-kit-section:hover .section-controls,
                .media-kit-section.selected .section-controls {
                    display: flex;
                }
            `;
            
            // Create style element and append to head
            const style = document.createElement('style');
            style.textContent = criticalStyles;
            document.head.appendChild(style);
            
            console.log('Critical styles applied');
        }
        
        window.MediaKitBuilder.performance.stages.stylesEnsured = Date.now();
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'ensureStyles');
    }
};

/**
 * Main initialization function
 */
window.MediaKitBuilder.init = function() {
    try {
        console.log('MediaKitBuilder.init called');
        
        // Check if the instance is already created
        if (window.MediaKitBuilder.global.instance) {
            console.log('MediaKitBuilder instance exists, initializing...');
            if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                window.MediaKitBuilder.global.instance.init();
                window.MediaKitBuilder.performance.stages.coreInitialized = Date.now();
            } else {
                console.error('Instance exists but init function is missing');
            }
        } else {
            console.log('MediaKitBuilder instance not found, will initialize when ready');
            // Set flag to initialize when instance is created
            window.MediaKitBuilder.shouldInitialize = true;
        }
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'init');
    }
};

/**
 * Safe initialization function
 */
window.MediaKitBuilder.safeInit = function() {
    try {
        console.log('Safe initialization started');
        
        // First make sure elements exist
        const elements = window.MediaKitBuilder.checkElements();
        
        // Store elements globally for reference
        window.MediaKitBuilder.elements = elements;
        
        // Set initialization flag
        window.MediaKitBuilder.elementsReady = true;
        
        console.log('Elements are ready, initialization can proceed');
        
        // If we have mkbData but no wpAdapter, create default
        if (!window.wpAdapter && typeof WordPressAdapter === 'function') {
            console.log('Creating WordPress adapter');
            try {
                // Use existing mkbData or create defaults
                const config = window.mkbData || {
                    ajaxUrl: '/wp-admin/admin-ajax.php',
                    restUrl: '/wp-json/media-kit/v1/',
                    nonce: '',
                    debugMode: true
                };
                
                window.wpAdapter = new WordPressAdapter(config);
                console.log('WordPress adapter created');
            } catch (error) {
                window.MediaKitBuilder.logError(error, 'wpAdapterCreation');
            }
        }
        
        // Initialize tabs
        window.MediaKitBuilder.initTabs();
        
        window.MediaKitBuilder.performance.stages.safeInitComplete = Date.now();
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'safeInit');
    }
};

/**
 * Initialize sidebar tabs
 */
window.MediaKitBuilder.initTabs = function() {
    try {
        const tabs = document.querySelectorAll('.sidebar-tab');
        if (!tabs.length) return;
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show content for active tab
                const tabName = this.getAttribute('data-tab');
                const tabContent = document.getElementById(tabName + '-tab');
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
        
        console.log('Tabs initialized');
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'initTabs');
    }
};

/**
 * Run emergency initialization if needed
 */
window.MediaKitBuilder.emergencyInit = function() {
    try {
        console.log('Running emergency initialization...');
        
        // Ensure initQueue is properly initialized
        if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
            console.log('Fixing initQueue in emergencyInit - it was not an array');
            window.MediaKitBuilder.initQueue = [];
        }
        
        // Check if already properly initialized
        const isInitialized = window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            window.MediaKitBuilder.global.instance.state && 
            window.MediaKitBuilder.global.instance.state.initialized;
            
        if (isInitialized) {
            console.log('Builder already initialized, skipping emergency init');
            return;
        }
        
        // Check if initialization already happened
        if (window.MediaKitBuilder.performance.stages.coreInitialized) {
            console.log('Core already initialized according to performance stages, skipping emergency init');
            return;
        }
        
        // Check if builder instance exists
        if (window.MediaKitBuilder.global && window.MediaKitBuilder.global.instance) {
            console.log('Builder instance exists, calling init()');
            if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                window.MediaKitBuilder.global.instance.init();
                window.MediaKitBuilder.performance.stages.emergencyInit = Date.now();
                window.MediaKitBuilder.performance.stages.coreInitialized = Date.now();
            } else {
                console.error('Builder instance exists but init() method is missing');
            }
        } else if (window.MediaKitBuilder.Core && typeof window.MediaKitBuilder.Core === 'function') {
            // Create instance
            console.log('Creating new builder instance using Core constructor');
            try {
                const instance = new window.MediaKitBuilder.Core({
                    debugging: true,
                    autoInitialize: true
                });
                window.MediaKitBuilder.global.instance = instance;
                window.MediaKitBuilder.performance.stages.instanceCreated = Date.now();
                
                if (typeof instance.init === 'function') {
                    instance.init();
                    window.MediaKitBuilder.performance.stages.emergencyInit = Date.now();
                    window.MediaKitBuilder.performance.stages.coreInitialized = Date.now();
                }
            } catch (instanceError) {
                console.error('Error creating instance:', instanceError);
                window.MediaKitBuilder.logError(instanceError, 'instance creation');
            }
        } else {
            console.error('Cannot force initialization: Core constructor not found');
        }
    } catch (error) {
        window.MediaKitBuilder.logError(error, 'emergencyInit');
    }
};

// Run when DOM is ready
jQuery(document).ready(function() {
    console.log('DOM ready - initializing Media Kit Builder');
    
    // Run safe initialization immediately
    window.MediaKitBuilder.safeInit();
    
    // If we should initialize and have an instance, do it
    if (window.MediaKitBuilder.shouldInitialize && window.MediaKitBuilder.global.instance) {
        console.log('Immediate initialization starting...');
        window.MediaKitBuilder.global.instance.init();
    }
    
    // Set up emergency initialization after a timeout
    setTimeout(function() {
        // Check if already properly initialized to avoid redundant emergency init
        const isInitialized = window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            window.MediaKitBuilder.global.instance.state && 
            window.MediaKitBuilder.global.instance.state.initialized;
            
        if (isInitialized) {
            console.log('Builder already initialized, skipping emergency init');
            return;
        }
            
        if (!window.MediaKitBuilder.performance.stages.coreInitialized) {
            console.log('Builder not initialized after timeout, running emergency init');
            window.MediaKitBuilder.emergencyInit();
        }
    }, 2000);
});

console.log('📋 Media Kit Builder Initializer loaded');