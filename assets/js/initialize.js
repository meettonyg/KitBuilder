/**
 * Media Kit Builder Initialization
 */

// Make sure jQuery is loaded
if (typeof jQuery === 'undefined') {
    console.error('jQuery is required for Media Kit Builder');
} else {
    (function($) {
        // Log initialization
        console.log('Media Kit Builder initialization script loaded');
        
        // Configuration
        const config = {
            scripts: [
                'builder.js',
                'builder-wordpress.js',
                'premium-access-control.js',
                'section-templates.js',
                'export.js',
                'debug-helper.js'
            ],
            baseUrl: '/wp-content/plugins/media-kit-builder/assets/js/'
        };
        
        // Load scripts in sequence
        function loadScripts(scripts, callback, index = 0) {
            if (index >= scripts.length) {
                if (typeof callback === 'function') {
                    callback();
                }
                return;
            }
            
            const script = document.createElement('script');
            script.src = config.baseUrl + scripts[index];
            script.async = false;
            
            script.onload = function() {
                console.log(`Loaded script: ${scripts[index]}`);
                loadScripts(scripts, callback, index + 1);
            };
            
            script.onerror = function() {
                console.error(`Failed to load script: ${scripts[index]}`);
                loadScripts(scripts, callback, index + 1);
            };
            
            document.head.appendChild(script);
        }
        
        // Initialize Media Kit Builder
        function initializeBuilder() {
            console.log('All scripts loaded, initializing Media Kit Builder');
            
            // Call MediaKitBuilder.init if available
            if (window.MediaKitBuilder && typeof window.MediaKitBuilder.init === 'function') {
                console.log('Calling MediaKitBuilder.init()');
                window.MediaKitBuilder.init();
            }
        }
        
        // Wait for DOM ready
        $(document).ready(function() {
            console.log('DOM ready, loading Media Kit Builder scripts');
            
            // Update base URL if needed
            const scriptTags = document.getElementsByTagName('script');
            for (let i = 0; i < scriptTags.length; i++) {
                const src = scriptTags[i].src;
                if (src && src.includes('media-kit-builder') && src.endsWith('initialize.js')) {
                    config.baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
                    break;
                }
            }
            
            // Load scripts
            loadScripts(config.scripts, initializeBuilder);
        });
    })(jQuery);
}
