/**
 * ES Module Compatibility Fix
 * Ensures proper loading and exposure of React modules from webpack builds
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function() {
    'use strict';
    
    console.log('🔧 ES Module compatibility fix loading...');
    
    /**
     * Fix ES Module exports for global scope
     */
    function fixESModuleExports() {
        // Create a helper to fix module exports
        window.mkbFixESModule = function(moduleName, moduleObject) {
            if (!moduleObject) {
                console.warn(`⚠️ Module ${moduleName} is undefined`);
                return null;
            }
            
            // If it's an ES module with __esModule flag
            if (moduleObject.__esModule === true) {
                console.log(`🔧 Fixing ES Module: ${moduleName}`);
                
                // If it has a default export, use that
                if (moduleObject.default) {
                    window[moduleName] = moduleObject.default;
                    console.log(`✅ Fixed ${moduleName} using default export`);
                    return moduleObject.default;
                }
                
                // Otherwise, extract all named exports
                const namedExports = {};
                for (const key in moduleObject) {
                    if (key !== '__esModule' && key !== 'default') {
                        namedExports[key] = moduleObject[key];
                    }
                }
                
                if (Object.keys(namedExports).length > 0) {
                    window[moduleName] = namedExports;
                    console.log(`✅ Fixed ${moduleName} using named exports`);
                    return namedExports;
                }
            }
            
            // If it's already properly structured, just assign it
            window[moduleName] = moduleObject;
            return moduleObject;
        };
    }
    
    /**
     * Ensure React is globally available with proper timing
     */
    function ensureReactGlobals() {
        let attempts = 0;
        const maxAttempts = 50;
        
        function checkAndSetGlobals() {
            attempts++;
            
            // Check if React is loaded but not global
            if (typeof React !== 'undefined' && typeof window.React === 'undefined') {
                window.React = React;
                console.log('✅ React made globally available');
            }
            
            // Check if ReactDOM is loaded but not global
            if (typeof ReactDOM !== 'undefined' && typeof window.ReactDOM === 'undefined') {
                window.ReactDOM = ReactDOM;
                console.log('✅ ReactDOM made globally available');
            }
            
            // Verify createRoot is available
            if (window.ReactDOM && !window.ReactDOM.createRoot && ReactDOM && ReactDOM.createRoot) {
                window.ReactDOM = ReactDOM;
                console.log('✅ ReactDOM.createRoot fixed');
            }
            
            // If React 18 features are missing, keep checking
            if ((!window.React || !window.ReactDOM || !window.ReactDOM.createRoot) && attempts < maxAttempts) {
                setTimeout(checkAndSetGlobals, 100);
            } else if (window.React && window.ReactDOM && window.ReactDOM.createRoot) {
                console.log('✅ React 18 fully loaded and available');
                // Dispatch ready event
                const event = new CustomEvent('mkb-react-ready');
                window.dispatchEvent(event);
            } else {
                console.warn('⚠️ React 18 not fully available after maximum attempts');
            }
        }
        
        // Start checking immediately and then with delays
        checkAndSetGlobals();
    }
    
    /**
     * Monitor for MediaKitBuilder module loading
     */
    function monitorMediaKitBuilder() {
        let checkCount = 0;
        const maxChecks = 50; // 5 seconds max
        
        const checkForBuilder = () => {
            checkCount++;
            
            if (typeof window.MediaKitBuilder !== 'undefined') {
                // Fix ES module if needed
                if (window.MediaKitBuilder.__esModule) {
                    console.log('🔧 MediaKitBuilder ES Module detected, fixing...');
                    window.mkbFixESModule('MediaKitBuilder', window.MediaKitBuilder);
                }
                
                // Verify mount function
                if (window.MediaKitBuilder && typeof window.MediaKitBuilder.mount === 'function') {
                    console.log('✅ MediaKitBuilder.mount function verified');
                    
                    // Dispatch ready event
                    const event = new CustomEvent('mkb-module-ready', {
                        detail: { module: 'MediaKitBuilder' }
                    });
                    window.dispatchEvent(event);
                } else {
                    console.warn('⚠️ MediaKitBuilder.mount function not found');
                }
                return;
            }
            
            if (checkCount < maxChecks) {
                setTimeout(checkForBuilder, 100);
            } else {
                console.error('❌ MediaKitBuilder module failed to load after 5 seconds');
            }
        };
        
        // Start monitoring
        setTimeout(checkForBuilder, 100);
    }
    
    /**
     * Initialize fixes
     */
    function init() {
        fixESModuleExports();
        ensureReactGlobals();
        monitorMediaKitBuilder();
        
        console.log('✅ ES Module compatibility fix initialized');
    }
    
    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
