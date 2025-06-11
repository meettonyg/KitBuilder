/**
 * Media Kit Builder Debug Tools
 * Helps troubleshoot loading and initialization issues
 */

console.log('🐛 Debug.js loading...');

(function($) {
    'use strict';
    
    // Debug Tools
    var MediaKitBuilderDebug = {
        init: function() {
            console.log('Initializing Debug Tools...');
            
            // Run diagnostics
            this.runDiagnostics();
            
            // Setup debug UI
            this.setupDebugUI();
            
            // Add window error handler
            this.setupErrorHandler();
        },
        
        runDiagnostics: function() {
            console.log('Running diagnostics...');
            console.log('------------------------------');
            
            // Check for jQuery
            this.checkComponent('jQuery', typeof jQuery === 'function');
            
            // Check for MediaKitBuilder
            this.checkComponent('MediaKitBuilder', typeof window.MediaKitBuilder !== 'undefined');
            
            // Check if MediaKitBuilder is initialized
            if (window.MediaKitBuilder && window.MediaKitBuilder.state) {
                this.checkComponent('MediaKitBuilder initialized', window.MediaKitBuilder.state.initialized);
            }
            
            // Check for builder containers
            this.checkComponent('Builder container', $('#media-kit-builder').length > 0);
            this.checkComponent('Preview container', $('#media-kit-preview').length > 0);
            this.checkComponent('Component palette', $('#component-palette').length > 0);
            
            // Check script loading
            $('script').each(function() {
                var src = $(this).attr('src');
                if (src && src.includes('media-kit-builder')) {
                    console.log('Loaded script: ' + src);
                }
            });
            
            // Check style loading
            $('link').each(function() {
                var href = $(this).attr('href');
                if (href && href.includes('media-kit-builder')) {
                    console.log('Loaded style: ' + href);
                }
            });
            
            // Check for WordPress AJAX endpoint
            if (typeof mkbData !== 'undefined') {
                this.checkComponent('WordPress AJAX URL', mkbData.ajaxUrl !== undefined);
                this.checkComponent('WordPress REST URL', mkbData.restUrl !== undefined);
                this.checkComponent('WordPress Nonce', mkbData.nonce !== undefined);
            } else {
                console.warn('⚠️ mkbData not available - WordPress integration may not work');
            }
            
            console.log('------------------------------');
        },
        
        checkComponent: function(name, condition) {
            var status = condition ? '✓ LOADED' : '✗ NOT LOADED';
            console.log(name + ': ' + status);
        },
        
        setupDebugUI: function() {
            // Add debug button to the page
            $('<button id="mkb-debug-button">Debug</button>')
                .css({
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    padding: '10px 15px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                })
                .appendTo('body')
                .on('click', function() {
                    MediaKitBuilderDebug.showDebugPanel();
                });
        },
        
        setupErrorHandler: function() {
            // Capture JavaScript errors
            window.onerror = function(message, source, lineno, colno, error) {
                console.error('Captured error:', message, 'at', source, 'line', lineno);
                if (error && error.stack) {
                    console.error('Stack trace:', error.stack);
                }
                return false;
            };
        },
        
        showDebugPanel: function() {
            // Create debug panel
            var debugHTML = `
                <div style="position:fixed; top:50px; left:50px; right:50px; bottom:50px; background:white; z-index:10000; padding:20px; overflow:auto; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:5px;">
                    <h2 style="margin-top:0;">Media Kit Builder Debug Panel</h2>
                    <button id="mkb-close-debug" style="position:absolute; top:10px; right:10px; background:#e74c3c; color:white; border:none; border-radius:3px; padding:5px 10px;">Close</button>
                    
                    <h3>Component Status</h3>
                    <ul>
                        <li>jQuery: ${typeof jQuery === 'function' ? '✓ Loaded' : '✗ Not Loaded'}</li>
                        <li>MediaKitBuilder: ${typeof window.MediaKitBuilder !== 'undefined' ? '✓ Loaded' : '✗ Not Loaded'}</li>
                        <li>Initialized: ${window.MediaKitBuilder && window.MediaKitBuilder.state && window.MediaKitBuilder.state.initialized ? '✓ Yes' : '✗ No'}</li>
                        <li>Builder Container: ${$('#media-kit-builder').length > 0 ? '✓ Found' : '✗ Not Found'}</li>
                        <li>Preview Container: ${$('#media-kit-preview').length > 0 ? '✓ Found' : '✗ Not Found'}</li>
                        <li>Component Palette: ${$('#component-palette').length > 0 ? '✓ Found' : '✗ Not Found'}</li>
                    </ul>
                    
                    <h3>WordPress Integration</h3>
                    <ul>
                        <li>mkbData: ${typeof mkbData !== 'undefined' ? '✓ Available' : '✗ Not Available'}</li>
                        <li>AJAX URL: ${typeof mkbData !== 'undefined' && mkbData.ajaxUrl ? '✓ Set: ' + mkbData.ajaxUrl : '✗ Not Set'}</li>
                        <li>User ID: ${typeof mkbData !== 'undefined' && mkbData.userId ? '✓ Set: ' + mkbData.userId : '✗ Not Set'}</li>
                        <li>Access Tier: ${typeof mkbData !== 'undefined' && mkbData.accessTier ? '✓ Set: ' + mkbData.accessTier : '✗ Not Set'}</li>
                    </ul>
                    
                    <h3>Loaded Scripts</h3>
                    <ul id="mkb-debug-scripts"></ul>
                    
                    <h3>Loaded Styles</h3>
                    <ul id="mkb-debug-styles"></ul>
                    
                    <h3>Actions</h3>
                    <button id="mkb-force-init" style="background:#3498db; color:white; border:none; border-radius:3px; padding:5px 10px; margin-right:10px;">Force Initialization</button>
                    <button id="mkb-reload-assets" style="background:#2ecc71; color:white; border:none; border-radius:3px; padding:5px 10px; margin-right:10px;">Reload Assets</button>
                    <button id="mkb-test-ajax" style="background:#f39c12; color:white; border:none; border-radius:3px; padding:5px 10px;">Test AJAX Connection</button>
                </div>
            `;
            
            // Add to page
            $('body').append(debugHTML);
            
            // Populate scripts
            $('script').each(function() {
                var src = $(this).attr('src');
                if (src && src.includes('media-kit-builder')) {
                    $('#mkb-debug-scripts').append('<li>' + src + '</li>');
                }
            });
            
            // Populate styles
            $('link').each(function() {
                var href = $(this).attr('href');
                if (href && href.includes('media-kit-builder')) {
                    $('#mkb-debug-styles').append('<li>' + href + '</li>');
                }
            });
            
            // Setup close button
            $('#mkb-close-debug').on('click', function() {
                $(this).closest('div').remove();
            });
            
            // Setup force init button
            $('#mkb-force-init').on('click', function() {
                if (window.MediaKitBuilder) {
                    console.log('Forcing initialization...');
                    window.MediaKitBuilder.state = window.MediaKitBuilder.state || {};
                    window.MediaKitBuilder.state.initialized = false;
                    window.MediaKitBuilder.init();
                    alert('Forced initialization complete. Check console for details.');
                } else {
                    alert('MediaKitBuilder not found. Cannot initialize.');
                }
            });
            
            // Setup reload assets button
            $('#mkb-reload-assets').on('click', function() {
                location.reload();
            });
            
            // Setup test AJAX button
            $('#mkb-test-ajax').on('click', function() {
                if (typeof mkbData !== 'undefined' && mkbData.ajaxUrl) {
                    console.log('Testing AJAX connection...');
                    
                    var formData = new FormData();
                    formData.append('action', 'mkb_test_ajax');
                    formData.append('nonce', mkbData.nonce);
                    formData.append('test_data', 'Testing connection');
                    
                    fetch(mkbData.ajaxUrl, {
                        method: 'POST',
                        credentials: 'same-origin',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('AJAX test response:', data);
                        alert('AJAX test completed. Check console for details.');
                    })
                    .catch(error => {
                        console.error('AJAX test failed:', error);
                        alert('AJAX test failed: ' + error.message);
                    });
                } else {
                    alert('mkbData not available. Cannot test AJAX connection.');
                }
            });
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        MediaKitBuilderDebug.init();
        
        // Try to help with initialization if MediaKitBuilder isn't initialized after 2 seconds
        setTimeout(function() {
            if (window.MediaKitBuilder && window.MediaKitBuilder.state && !window.MediaKitBuilder.state.initialized) {
                console.log('⚠️ MediaKitBuilder not initialized after timeout, attempting to fix...');
                
                if (typeof window.MediaKitBuilder.init === 'function') {
                    window.MediaKitBuilder.init();
                }
                
                if (window.wpAdapter && typeof window.wpAdapter.init === 'function') {
                    window.wpAdapter.init();
                }
            }
        }, 2000);
    });
})(jQuery);
