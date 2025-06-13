/**
 * Media Kit Builder - Standalone Initializer
 *
 * This script is the ONLY initializer needed. It sets up the global namespace
 * and a reliable queue to prevent race conditions.
 */
(function() {
    'use strict';

    // 1. Global safety check: ensure our global object exists and is clean
    if (typeof window.MediaKitBuilder === 'undefined' || typeof window.MediaKitBuilder !== 'object') {
        window.MediaKitBuilder = {};
    }
    
    // 2. Create a fresh initialization queue if it doesn't exist
if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
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
        
        console.log('🚀 Running Media Kit Builder initializers...');
        
        // Always verify the queue is an array before proceeding
        if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
            console.warn('MediaKitBuilder.initQueue is not an array. Initializing empty queue.');
            window.MediaKitBuilder.initQueue = [];
        }
        
        // Get a copy of the queue to prevent modification while iterating
        const queueCopy = window.MediaKitBuilder.initQueue.slice();
        
        // Mark as initialized before running functions to prevent re-entry
        hasInitialized = true;
        
        // Run each initializer function
        queueCopy.forEach(function(fn) {
            try {
                if (typeof fn === 'function') {
                    fn();
                }
            } catch (error) {
                console.error('Error running initializer function:', error);
            }
        });
        
        console.log('✅ Media Kit Builder initialization complete');
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
        if (hasInitialized) {
            // If already initialized, run the function immediately
            if (typeof fn === 'function') {
                try {
                    fn();
                } catch (error) {
                    console.error('Error running initialization function:', error);
                }
            }
            return;
        }
        
        // Otherwise, add to the queue
        if (typeof fn === 'function') {
            window.MediaKitBuilder.initQueue.push(fn);
        }
    };

    /**
     * The main initialization function.
     */
    window.MediaKitBuilder.init = function() {
        console.log('MediaKitBuilder.init called');

        // Check if already initialized to prevent duplicate calls
        if (hasInitialized) {
            console.log('Already initialized, skipping redundant init call');
            return;
        }

        // Check if the builder instance exists
        if (window.MediaKitBuilder.global && window.MediaKitBuilder.global.instance) {
            if (typeof window.MediaKitBuilder.global.instance.init === 'function') {
                window.MediaKitBuilder.global.instance.init();
                hasInitialized = true;
            }
        } else {
            // Flag for later initialization
            window.MediaKitBuilder.shouldInitialize = true;
        }
    };

    /**
     * Run the initializers when the DOM is fully loaded.
     * Use a single initialization path to prevent race conditions.
     */
    function ensureInitializersRun() {
        if (!hasInitialized) {
            runInitializers();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureInitializersRun);
    } else {
        // DOM is already ready
        setTimeout(ensureInitializersRun, 0);
    }

    console.log('✅ Media Kit Builder Standalone Initializer is ready');
})();