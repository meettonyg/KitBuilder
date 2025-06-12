/**
 * Media Kit Builder - Standalone Initializer
 *
 * This script is meant to be included directly in the page, before any other Media Kit Builder scripts.
 * It sets up the global namespace and initialization functions.
 */

// Immediately execute with error handling
(function() {
    try {
        console.log('🚀 Media Kit Builder Standalone Initializer - Version 1.0.1');
        
        // Set up the global namespace safely
        window.MediaKitBuilder = window.MediaKitBuilder || {};
        window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};
        
        // Create function to check if DOM elements exist - defining this first to avoid reference errors
        window.MediaKitBuilder.checkElements = function() {
            try {
                console.log('Running checkElements function');
                
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
            } catch (error) {
                console.error('Error in checkElements function:', error);
                // Create a basic fallback return
                return {
                    container: document.querySelector('#media-kit-builder') || document.body,
                    preview: document.querySelector('#media-kit-preview'),
                    palette: document.querySelector('#component-palette')
                };
            }
        };
        
        // Create a safe initialization function
        window.MediaKitBuilder.safeInit = function() {
            try {
                console.log('MediaKitBuilder.safeInit called');
                if (typeof window.MediaKitBuilder.checkElements === 'function') {
                    window.MediaKitBuilder.checkElements();
                } else {
                    console.error('checkElements function is not defined');
                }
            } catch (error) {
                console.error('Error in safeInit:', error);
            }
        };
        
        // Create the init function that will be called by other scripts
        window.MediaKitBuilder.init = function() {
            try {
                console.log('MediaKitBuilder.init called');
                
                // Check if the instance is already created
                if (window.MediaKitBuilder.global.instance) {
                    console.log('MediaKitBuilder instance exists, initializing...');
                    if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                        window.MediaKitBuilder.global.instance.init();
                    } else {
                        console.error('Instance exists but init function is missing');
                    }
                } else {
                    console.log('MediaKitBuilder instance not found, will initialize when ready');
                    // Set flag to initialize when instance is created
                    window.MediaKitBuilder.shouldInitialize = true;
                }
            } catch (error) {
                console.error('Error in init function:', error);
            }
        };
        
        // Define Core constructor if it doesn't exist
        if (!window.MediaKitBuilder.Core) {
            window.MediaKitBuilder.Core = function(config) {
                try {
                    console.log('MediaKitBuilder.Core constructor called with config:', config);
                    this.config = config || {};
                    this.init = function() {
                        try {
                            console.log('MediaKitBuilder.Core init called');
                        } catch (error) {
                            console.error('Error in Core init method:', error);
                        }
                    };
                    // Make instance available globally
                    window.MediaKitBuilder.global.instance = this;
                } catch (error) {
                    console.error('Error in Core constructor:', error);
                }
            };
        }
        
        // Safely run the element check when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                try {
                    if (typeof window.MediaKitBuilder.checkElements === 'function') {
                        window.MediaKitBuilder.checkElements();
                    } else {
                        console.error('checkElements function is not defined on DOMContentLoaded');
                    }
                } catch (error) {
                    console.error('Error in DOMContentLoaded callback:', error);
                }
            });
        } else {
            try {
                if (typeof window.MediaKitBuilder.checkElements === 'function') {
                    window.MediaKitBuilder.checkElements();
                } else {
                    console.error('checkElements function is not defined on immediate run');
                }
            } catch (error) {
                console.error('Error in immediate run of checkElements:', error);
            }
        }
        
        console.log('Media Kit Builder global namespace initialized');
    } catch (error) {
        console.error('Critical error in standalone initializer:', error);
        
        // Emergency recovery - set up minimal required functionality
        window.MediaKitBuilder = window.MediaKitBuilder || {};
        window.MediaKitBuilder.checkElements = window.MediaKitBuilder.checkElements || function() {
            console.log('Emergency checkElements function called');
            return {};
        };
        window.MediaKitBuilder.safeInit = window.MediaKitBuilder.safeInit || function() {
            console.log('Emergency safeInit function called');
        };
        window.MediaKitBuilder.init = window.MediaKitBuilder.init || function() {
            console.log('Emergency init function called');
        };
        window.MediaKitBuilder.Core = window.MediaKitBuilder.Core || function() {
            this.init = function() {};
        };
    }
})();
