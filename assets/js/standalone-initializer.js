/**
 * Media Kit Builder - Standalone Initializer
 *
 * This script is meant to be included directly in the page, before any other Media Kit Builder scripts.
 * It sets up the global namespace and initialization functions.
 */

// Immediately execute
(function() {
    console.log('🚀 Media Kit Builder Standalone Initializer');
    
    // Set up the global namespace immediately
    window.MediaKitBuilder = window.MediaKitBuilder || {};
    window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};
    
    // Create a safe initialization function
    window.MediaKitBuilder.safeInit = function() {
        console.log('MediaKitBuilder.safeInit called');
        window.MediaKitBuilder.checkElements();
    };
    
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
        
        console.log('Checking for required DOM elements:', 
                   'container:', !!elements.container, 
                   'preview:', !!elements.preview, 
                   'palette:', !!elements.palette);
        
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
        
        // Store elements globally for reference
        window.MediaKitBuilder.elements = elements;
        
        // Set initialization flag
        window.MediaKitBuilder.elementsReady = true;
        
        return elements;
    };
    
    // Run the element check when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.MediaKitBuilder.checkElements();
        });
    } else {
        window.MediaKitBuilder.checkElements();
    }
    
    console.log('Media Kit Builder global namespace initialized');
})();
