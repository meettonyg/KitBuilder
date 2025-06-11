/**
 * Media Kit Builder Debug & Initialization Helper
 * Helps troubleshoot loading issues and provides debugging info
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function() {
    'use strict';

    // Debug utilities
    window.MKB_Debug = {
        
        /**
         * Check plugin status
         */
        checkStatus: function() {
            const status = {
                timestamp: new Date().toISOString(),
                react: {
                    loaded: typeof React !== 'undefined',
                    version: typeof React !== 'undefined' ? React.version : null
                },
                mediaKitBuilder: {
                    loaded: typeof window.MediaKitBuilder !== 'undefined',
                    hasMount: typeof window.MediaKitBuilder !== 'undefined' && typeof window.MediaKitBuilder.mount === 'function'
                },
                config: {
                    loaded: typeof window.mkbConfig !== 'undefined',
                    data: window.mkbConfig || null
                },
                containers: {
                    builderRoot: !!document.getElementById('mkb-builder-root'),
                    adminContainer: !!document.getElementById('mkb-admin-container')
                },
                adminIntegration: {
                    loaded: typeof window.mkbAdminIntegration !== 'undefined'
                }
            };

            console.group('📋 Media Kit Builder Status');
            console.table(status);
            console.groupEnd();

            return status;
        },

        /**
         * Force initialize React app
         */
        forceInit: function() {
            console.log('🔧 Force initializing Media Kit Builder...');
            
            const container = document.getElementById('mkb-builder-root') || 
                            document.getElementById('mkb-admin-container');
            
            if (!container) {
                console.error('❌ No container found for React app');
                return false;
            }

            if (typeof window.MediaKitBuilder === 'undefined') {
                console.error('❌ MediaKitBuilder not loaded');
                return false;
            }

            if (typeof window.MediaKitBuilder.mount !== 'function') {
                console.error('❌ MediaKitBuilder.mount not a function');
                return false;
            }

            try {
                window.MediaKitBuilder.mount(container);
                console.log('✅ React app mounted successfully');
                return true;
            } catch (error) {
                console.error('❌ Failed to mount React app:', error);
                return false;
            }
        },

        /**
         * Fix common issues
         */
        fixIssues: function() {
            console.log('🔧 Attempting to fix common issues...');

            // Issue 1: Missing container
            if (!document.getElementById('mkb-builder-root')) {
                console.log('Creating missing mkb-builder-root container...');
                const container = document.createElement('div');
                container.id = 'mkb-builder-root';
                container.className = 'mkb-builder-container';
                
                const wrap = document.querySelector('.wrap');
                if (wrap) {
                    wrap.appendChild(container);
                    console.log('✅ Container created');
                }
            }

            // Issue 2: Missing config
            if (typeof window.mkbConfig === 'undefined') {
                console.log('Creating minimal config...');
                window.mkbConfig = {
                    ajaxUrl: '/wp-admin/admin-ajax.php',
                    nonce: 'demo-nonce',
                    userId: 1,
                    isLoggedIn: true,
                    isAdmin: true,
                    debug: true
                };
                console.log('✅ Minimal config created');
            }

            // Issue 3: Try mounting again
            setTimeout(() => {
                this.forceInit();
            }, 1000);
        },

        /**
         * Show detailed error information
         */
        showErrors: function() {
            const errors = [];

            if (typeof React === 'undefined') {
                errors.push('React library not loaded');
            }

            if (typeof window.MediaKitBuilder === 'undefined') {
                errors.push('MediaKitBuilder object not available');
            } else if (typeof window.MediaKitBuilder.mount !== 'function') {
                errors.push('MediaKitBuilder.mount is not a function');
            }

            if (!document.getElementById('mkb-builder-root') && !document.getElementById('mkb-admin-container')) {
                errors.push('No suitable container element found');
            }

            if (typeof window.mkbConfig === 'undefined') {
                errors.push('WordPress configuration not loaded');
            }

            if (errors.length > 0) {
                console.group('❌ Media Kit Builder Errors');
                errors.forEach(error => console.error('•', error));
                console.groupEnd();
            } else {
                console.log('✅ No obvious errors detected');
            }

            return errors;
        }
    };

    // Auto-run diagnostics on load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('🔍 Running Media Kit Builder diagnostics...');
            window.MKB_Debug.checkStatus();
            
            const errors = window.MKB_Debug.showErrors();
            
            if (errors.length > 0) {
                console.log('🔧 Attempting to fix issues...');
                window.MKB_Debug.fixIssues();
            }
        }, 2000);
    });

    // Make debug functions available globally
    window.mkbCheckStatus = () => window.MKB_Debug.checkStatus();
    window.mkbForceInit = () => window.MKB_Debug.forceInit();
    window.mkbFixIssues = () => window.MKB_Debug.fixIssues();

    console.log('🐛 Media Kit Builder Debug utilities loaded');
    console.log('Available commands: mkbCheckStatus(), mkbForceInit(), mkbFixIssues()');

})();
