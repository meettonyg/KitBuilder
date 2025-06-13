/**
 * Media Kit Builder - Standalone Initializer (Revised)
 *
 * This script is the ONLY initializer needed. It sets up the global namespace
 * and a reliable queue to prevent race conditions.
 */
(function() {
    'use strict';

    // 1. Set up the global namespace immediately and safely
    window.MediaKitBuilder = window.MediaKitBuilder || {};
    
    // 2. Create an initialization queue - ensure it's an array
    if (!window.MediaKitBuilder.initQueue || !Array.isArray(window.MediaKitBuilder.initQueue)) {
        window.MediaKitBuilder.initQueue = [];
    }
    
    // 3. Flag to ensure initialization only runs once
    let hasInitialized = false;

    /**
     * The single, central function to run all queued initializers.
     */
    function runInitializers() {
        if (hasInitialized) {
            return; // Prevent multiple runs
        }
        hasInitialized = true;
        
        console.log('🚀 Firing all Media Kit Builder initializers...');
        
        if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
            console.warn('MediaKitBuilder.initQueue is not an array. Initializing empty queue.');
            window.MediaKitBuilder.initQueue = [];
        }
        
        window.MediaKitBuilder.initQueue.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.error('Error running initializer function:', error);
            }
        });
    }

    /**
     * Checks for the required DOM elements for the builder.
     */
    window.MediaKitBuilder.checkElements = function() {
        const elements = {
            container: document.querySelector('#media-kit-builder'),
            preview: document.querySelector('#media-kit-preview'),
            palette: document.querySelector('#component-palette')
        };

        // Store elements globally for reference by other scripts
        window.MediaKitBuilder.elements = elements;

        // Set flag indicating that the DOM elements are ready
        window.MediaKitBuilder.elementsReady = true;

        return elements;
    };

    /**
     * Safe initialization function that adds to the queue.
     */
    window.MediaKitBuilder.safeInit = function(fn) {
        if (typeof fn === 'function') {
            window.MediaKitBuilder.initQueue.push(fn);
        } else {
            // If no function is provided, add a default initializer
            window.MediaKitBuilder.initQueue.push(() => {
                if (typeof window.MediaKitBuilder.checkElements === 'function') {
                    window.MediaKitBuilder.checkElements();
                }
            });
        }
    };

    /**
     * The main initialization function.
     */
    window.MediaKitBuilder.init = function() {
        console.log('MediaKitBuilder.init called');

        // Check if the builder instance exists
        if (window.MediaKitBuilder.global && window.MediaKitBuilder.global.instance) {
            if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                window.MediaKitBuilder.global.instance.init();
            }
        } else {
            // Flag for later initialization
            window.MediaKitBuilder.shouldInitialize = true;
        }
    };

    /**
     * Define a global namespace for sharing data across scripts.
     */
    window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};

    /**
     * Run the initializers when the DOM is fully loaded.
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInitializers);
    } else {
        // DOM is already ready
        runInitializers();
    }

    console.log('✅ Media Kit Builder Standalone Initializer is ready and waiting for DOM load.');
})();