/**
 * Media Kit Builder - Initializer
 * 
 * This file ensures proper initialization of the Media Kit Builder by:
 * 1. Setting up the global namespace correctly
 * 2. Ensuring DOM elements exist before initialization
 * 3. Managing the proper initialization sequence
 */

console.log('📋 Media Kit Builder Initializer loading...');

// Set up the global namespace immediately
window.MediaKitBuilder = window.MediaKitBuilder || {};
window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};

// Create the init function that will be called by other scripts
window.MediaKitBuilder.init = function() {
    console.log('MediaKitBuilder.init called');
    
    // Check if the instance is already created
    if (window.MediaKitBuilder.global.instance) {
        console.log('MediaKitBuilder instance exists, initializing...');
        window.MediaKitBuilder.global.instance.init();
    } else {
        console.log('MediaKitBuilder instance not found, will initialize when ready');
        // Set flag to initialize when instance is created
        window.MediaKitBuilder.shouldInitialize = true;
    }
};

// Create function to check if DOM elements exist
window.MediaKitBuilder.checkElements = function() {
    const elements = {
        container: document.querySelector('#media-kit-builder'),
        preview: document.querySelector('#media-kit-preview'),
        palette: document.querySelector('#component-palette')
    };
    
    console.log('Checking for required DOM elements:', elements);
    
    // If elements don't exist, create them
    if (!elements.container) {
        console.log('Creating media-kit-builder container');
        const container = document.createElement('div');
        container.id = 'media-kit-builder';
        container.className = 'media-kit-builder';
        
        // Find a suitable place to append it
        const content = document.querySelector('.content-area, .entry-content, main, #content');
        if (content) {
            content.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
        
        elements.container = container;
    }
    
    if (!elements.preview && elements.container) {
        console.log('Creating media-kit-preview container');
        const preview = document.createElement('div');
        preview.id = 'media-kit-preview';
        preview.className = 'media-kit-preview';
        elements.container.appendChild(preview);
        elements.preview = preview;
    }
    
    if (!elements.palette && elements.container) {
        console.log('Creating component-palette container');
        const palette = document.createElement('div');
        palette.id = 'component-palette';
        palette.className = 'component-palette';
        elements.container.appendChild(palette);
        elements.palette = palette;
    }
    
    return elements;
};

// Function to safely initialize everything
window.MediaKitBuilder.safeInit = function() {
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
            console.error('Failed to create WordPress adapter:', error);
        }
    }
};

// Run when DOM is ready
jQuery(document).ready(function() {
    console.log('DOM ready - initializing Media Kit Builder');
    
    // Wait a brief moment for other scripts to load
    setTimeout(function() {
        window.MediaKitBuilder.safeInit();
        
        // If we should initialize and have an instance, do it
        if (window.MediaKitBuilder.shouldInitialize && window.MediaKitBuilder.global.instance) {
            console.log('Delayed initialization starting...');
            window.MediaKitBuilder.global.instance.init();
        }
    }, 500);
});

console.log('📋 Media Kit Builder Initializer loaded');
