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

        /**
         * Checks for the required DOM elements for the builder.
         * If they don't exist, it creates and appends them to the DOM.
         */
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

                // If the main container doesn't exist, create it
                if (!elements.container) {
                    console.log('Creating media-kit-builder container');
                    const container = document.createElement('div');
                    container.id = 'media-kit-builder';
                    container.className = 'media-kit-builder';
                    
                    // Create structure
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

                // If the preview container doesn't exist within the main container, find or create it
                if (!elements.preview && elements.container) {
                    console.log('Finding or creating media-kit-preview container');
                    elements.preview = elements.container.querySelector('#media-kit-preview');
                    
                    if (!elements.preview) {
                        const builderContent = elements.container.querySelector('.builder-content');
                        if (builderContent) {
                            const preview = document.createElement('div');
                            preview.id = 'media-kit-preview';
                            preview.className = 'media-kit-preview';
                            builderContent.appendChild(preview);
                            elements.preview = preview;
                        } else {
                            console.warn('Could not find .builder-content to add preview');
                        }
                    }
                }

                // If the component palette doesn't exist, find or create it
                if (!elements.palette && elements.container) {
                    console.log('Finding or creating component-palette container');
                    elements.palette = document.querySelector('#component-palette');
                    
                    if (!elements.palette) {
                        const componentsTab = document.querySelector('#components-tab');
                        if (componentsTab) {
                            const palette = document.createElement('div');
                            palette.id = 'component-palette';
                            palette.className = 'component-palette';
                            componentsTab.appendChild(palette);
                            elements.palette = palette;
                        } else {
                            console.warn('Could not find #components-tab to add palette');
                        }
                    }
                }

                // Store elements globally for reference by other scripts
                window.MediaKitBuilder.elements = elements;

                // Set a flag indicating that the DOM elements are ready
                window.MediaKitBuilder.elementsReady = true;

                return elements;

            } catch (error) {
                console.error('Error in checkElements function:', error);
                // Create a basic fallback return to prevent further errors
                return {
                    container: document.querySelector('#media-kit-builder') || document.body,
                    preview: document.querySelector('#media-kit-preview'),
                    palette: document.querySelector('#component-palette')
                };
            }
        };

        /**
         * A safe initialization function that ensures elements are checked and ready.
         */
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

        /**
         * The main initialization function to be called by other scripts.
         * It checks if the main builder instance exists and initializes it.
         */
        window.MediaKitBuilder.init = function() {
            try {
                console.log('MediaKitBuilder.init called');

                // Check if the builder instance has been created
                if (window.MediaKitBuilder.global.instance) {
                    console.log('MediaKitBuilder instance exists, initializing...');
                    if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                        window.MediaKitBuilder.global.instance.init();
                    } else {
                        console.error('Instance exists but init function is missing');
                    }
                } else {
                    console.log('MediaKitBuilder instance not found, will initialize when ready');
                    // Set a flag for the builder.js script to know it should initialize immediately upon creation.
                    window.MediaKitBuilder.shouldInitialize = true;
                }
            } catch (error) {
                console.error('Error in init function:', error);
            }
        };

        /**
         * Defines a fallback Core constructor if it doesn't exist,
         * ensuring other scripts don't fail if they load out of order.
         */
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
                    // Make this instance globally available for other scripts to find.
                    window.MediaKitBuilder.global.instance = this;
                } catch (error) {
                    console.error('Error in Core constructor:', error);
                }
            };
        }

        /**
         * After all functions are defined on the global object,
         * safely run the element check. This resolves the race condition.
         */
        if (document.readyState === 'loading') {
            // The DOM is not yet ready, wait for the DOMContentLoaded event.
            document.addEventListener('DOMContentLoaded', function() {
                window.MediaKitBuilder.checkElements();
                // Trigger safeInit after checking elements
                if (window.MediaKitBuilder.safeInit) {
                    window.MediaKitBuilder.safeInit();
                }
            });
        } else {
            // The DOM has already loaded, execute the function immediately.
            window.MediaKitBuilder.checkElements();
            // Trigger safeInit after checking elements
            if (window.MediaKitBuilder.safeInit) {
                window.MediaKitBuilder.safeInit();
            }
        }

        console.log('Media Kit Builder global namespace initialized');

    } catch (error) {
        console.error('Critical error in standalone initializer:', error);

        // Emergency fallback to prevent cascading script failures.
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