/**
 * Media Kit Builder - Script Loader
 * 
 * This file ensures scripts are loaded in the correct order and handles initialization.
 */

(function() {
    'use strict';
    
    console.log('🔄 Script loader initializing...');
    
    // Configuration
    const config = {
        scripts: [
            'builder.js',
            'builder-wordpress.js',
            'premium-access-control.js',
            'section-templates.js',
            'export.js'
        ],
        debugMode: true
    };
    
    // Keep track of loaded scripts
    const loadedScripts = {
        count: 0,
        total: config.scripts.length,
        builder: false,
        wordpress: false
    };
    
    /**
     * Log message to console
     */
    function log(message, data = null) {
        if (config.debugMode) {
            if (data) {
                console.log(`[Script Loader] ${message}`, data);
            } else {
                console.log(`[Script Loader] ${message}`);
            }
        }
    }
    
    /**
     * Handle script load completion
     */
    function handleScriptLoaded(scriptName) {
        loadedScripts.count++;
        log(`Script loaded (${loadedScripts.count}/${loadedScripts.total}): ${scriptName}`);
        
        // Mark specific scripts as loaded
        if (scriptName.includes('builder.js')) {
            loadedScripts.builder = true;
        } else if (scriptName.includes('builder-wordpress.js')) {
            loadedScripts.wordpress = true;
        }
        
        // Check if all scripts are loaded
        if (loadedScripts.count === loadedScripts.total) {
            log('All scripts loaded, initializing...');
            initializeBuilder();
        }
    }
    
    /**
     * Initialize builder
     */
    function initializeBuilder() {
        // Ensure MediaKitBuilder is available
        if (typeof window.MediaKitBuilder === 'undefined') {
            console.error('MediaKitBuilder not found. Make sure builder.js is loaded correctly.');
            return;
        }
        
        // Check if init function is available
        if (typeof window.MediaKitBuilder.init === 'function') {
            log('Calling MediaKitBuilder.init()');
            window.MediaKitBuilder.init();
        } else {
            console.error('MediaKitBuilder.init is not available.');
        }
    }
    
    /**
     * Load script
     */
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Maintain order
        
        script.onload = function() {
            callback(src);
        };
        
        script.onerror = function() {
            console.error(`Failed to load script: ${src}`);
            callback(src); // Still call callback to continue loading other scripts
        };
        
        document.head.appendChild(script);
    }
    
    /**
     * Initialize script loader
     */
    function init() {
        log('Starting script loader...');
        
        // Get script path
        const scripts = document.getElementsByTagName('script');
        const thisScript = scripts[scripts.length - 1];
        const scriptPath = thisScript.src.substring(0, thisScript.src.lastIndexOf('/') + 1);
        
        log(`Script path: ${scriptPath}`);
        
        // Load scripts in order
        let index = 0;
        function loadNextScript() {
            if (index < config.scripts.length) {
                const scriptSrc = scriptPath + config.scripts[index];
                log(`Loading script ${index + 1}/${config.scripts.length}: ${scriptSrc}`);
                loadScript(scriptSrc, function() {
                    handleScriptLoaded(config.scripts[index]);
                    index++;
                    loadNextScript();
                });
            }
        }
        
        // Start loading scripts
        loadNextScript();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
