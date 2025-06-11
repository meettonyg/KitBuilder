/**
 * WordPress Admin Integration - Phase 3 Day 15 Completion
 * Bridges React application with WordPress admin interface
 * 
 * Handles admin-specific functionality, menu integration, and WordPress compatibility
 * Ensures seamless user experience between WordPress admin and React builder
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function($, window, document) {
    'use strict';
    
    /**
     * Admin Integration Manager
     */
    const AdminIntegration = {
        
        // Configuration
        config: {
            adminPageId: 'media-kit-builder',
            builderContainerId: 'mkb-builder-root',
            loadingTimeout: 10000,
            retryAttempts: 3
        },
        
        // State
        state: {
            isLoaded: false,
            retryCount: 0,
            loadStartTime: 0
        },
        
        /**
         * Initialize admin integration
         */
        init() {
            console.log('🔧 Initializing WordPress Admin Integration...');
            
            // Wait for DOM and WordPress admin to be ready
            $(document).ready(() => {
                this.setupAdminInterface();
                this.initializeReactApp();
                this.setupAdminEvents();
                this.enhanceWordPressUI();
                this.setupPerformanceMonitoring();
            });
        },
        
        /**
         * Setup admin interface
         */
        setupAdminInterface() {
            // Check if React app container exists, if not create it
            let container = document.getElementById(this.config.builderContainerId);
            
            if (!container) {
                // Look for alternative container names
                container = document.getElementById('mkb-admin-container');
                
                if (!container) {
                    // Create new container
                    const newContainer = $('<div>', {
                        id: this.config.builderContainerId,
                        class: 'mkb-react-container'
                    });
                    
                    $('.wrap').append(newContainer);
                    container = newContainer[0];
                }
            }
            
            // Remove loading screen if it exists
            $(container).find('.mkb-loading-screen').fadeOut();
            
            // Add admin-specific styles
            this.addAdminStyles();
            
            // Setup admin toolbar integration
            this.setupAdminToolbar();
            
            console.log('✅ Admin interface setup complete');
        },
        
        /**
         * Initialize React application
         */
        initializeReactApp() {
            this.state.loadStartTime = performance.now();
            
            // Check if React and dependencies are loaded
            this.waitForDependencies()
                .then(() => this.mountReactApp())
                .catch(error => this.handleLoadError(error));
        },
        
        /**
         * Wait for all dependencies to load with improved React 18 detection
         */
        waitForDependencies() {
            return new Promise((resolve, reject) => {
                // Listen for React ready event
                const onReactReady = () => {
                    window.removeEventListener('mkb-react-ready', onReactReady);
                    this.checkOtherDependencies(resolve, reject);
                };
                
                // If React is already ready, proceed
                if (window.React && window.ReactDOM && window.ReactDOM.createRoot) {
                    this.checkOtherDependencies(resolve, reject);
                } else {
                    // Wait for React ready event
                    window.addEventListener('mkb-react-ready', onReactReady);
                    
                    // Fallback timeout
                    setTimeout(() => {
                        window.removeEventListener('mkb-react-ready', onReactReady);
                        this.checkOtherDependencies(resolve, reject);
                    }, 10000);
                }
            });
        },
        
        /**
         * Check other dependencies after React is ready
         */
        checkOtherDependencies(resolve, reject) {
            const checkDependencies = () => {
                // Check for React 18 specifically
                if (!window.React || !window.ReactDOM || !window.ReactDOM.createRoot) {
                    this.retryOrFail('React 18 not fully loaded', resolve, reject, checkDependencies);
                    return;
                }
                
                // Check for MediaKitBuilder
                if (typeof window.MediaKitBuilder === 'undefined') {
                    this.retryOrFail('MediaKitBuilder not loaded', resolve, reject, checkDependencies);
                    return;
                }
                
                // Handle ES Module structure
                if (window.MediaKitBuilder && window.MediaKitBuilder.__esModule) {
                    if (window.MediaKitBuilder.default) {
                        console.log('🔧 Fixing ES Module export structure...');
                        window.MediaKitBuilder = window.MediaKitBuilder.default;
                    }
                }
                
                // Verify mount function exists
                if (!window.MediaKitBuilder.mount || typeof window.MediaKitBuilder.mount !== 'function') {
                    this.retryOrFail('MediaKitBuilder.mount function not available', resolve, reject, checkDependencies);
                    return;
                }
                
                // Check for WordPress config (optional)
                if (typeof window.mkbConfig === 'undefined') {
                    console.warn('⚠️ WordPress config not loaded, using defaults');
                    window.mkbConfig = this.getDefaultConfig();
                }
                
                console.log('✅ All dependencies loaded successfully');
                resolve();
            };
            
            checkDependencies();
        },
        
        /**
         * Mount React application
         */
        mountReactApp() {
            try {
                const container = document.getElementById(this.config.builderContainerId);
                
                if (!container) {
                    throw new Error('Builder container not found');
                }
                
                // Mount React app
                if (window.MediaKitBuilder && typeof window.MediaKitBuilder.mount === 'function') {
                    console.log('🚀 Attempting to mount React app to:', container);
                    
                    window.MediaKitBuilder.mount(container, {
                        mode: 'admin',
                        userId: window.mkbConfig ? window.mkbConfig.userId : null,
                        isAdmin: true,
                        adminIntegration: this
                    });
                    
                    // Mark container as loaded
                    $(container).addClass('mkb-react-loaded');
                    
                    // Dispatch custom event
                    const event = new CustomEvent('mkb-react-loaded', {
                        detail: { container, loadTime: performance.now() - this.state.loadStartTime }
                    });
                    window.dispatchEvent(event);
                    
                } else {
                    console.error('MediaKitBuilder object:', window.MediaKitBuilder);
                    throw new Error('MediaKitBuilder.mount function not available');
                }
                
                this.state.isLoaded = true;
                const loadTime = performance.now() - this.state.loadStartTime;
                
                console.log(`✅ React app mounted successfully in ${loadTime.toFixed(2)}ms`);
                
                // Trigger loaded event
                $(document).trigger('mkb:admin:loaded', { loadTime });
                
            } catch (error) {
                this.handleLoadError(error);
            }
        },
        
        /**
         * Handle loading errors with retry logic
         */
        retryOrFail(message, resolve, reject, retryFn) {
            this.state.retryCount++;
            
            if (this.state.retryCount <= this.config.retryAttempts) {
                console.warn(`⚠️ ${message}, retrying (${this.state.retryCount}/${this.config.retryAttempts})...`);
                setTimeout(retryFn, 1000 * this.state.retryCount);
            } else {
                reject(new Error(`${message} after ${this.config.retryAttempts} attempts`));
            }
        },
        
        /**
         * Handle load errors
         */
        handleLoadError(error) {
            console.error('❌ Failed to load React app:', error);
            
            // Show error message to user
            this.showErrorMessage(error.message);
            
            // Report error to WordPress
            this.reportError(error);
        },
        
        /**
         * Show error message to user
         */
        showErrorMessage(message) {
            const errorHtml = `
                <div class="notice notice-error">
                    <p><strong>Media Kit Builder Error:</strong> ${message}</p>
                    <p>Please refresh the page or contact support if the problem persists.</p>
                    <button type="button" class="button button-secondary" onclick="location.reload()">
                        Refresh Page
                    </button>
                </div>
            `;
            
            $('.wrap').prepend(errorHtml);
        },
        
        /**
         * Setup admin events
         */
        setupAdminEvents() {
            // WordPress admin menu integration
            $('.mkb-admin-menu').on('click', (e) => {
                e.preventDefault();
                this.navigateToBuilder(e.target.getAttribute('data-action'));
            });
            
            // Save integration
            $(document).on('mkb:save', (e, data) => {
                this.saveToWordPress(data);
            });
            
            // Export integration
            $(document).on('mkb:export', (e, data) => {
                this.handleExport(data);
            });
            
            // WordPress heartbeat integration
            $(document).on('heartbeat-send', (e, data) => {
                if (this.state.isLoaded) {
                    data.mkb_active = true;
                    data.mkb_session = this.getCurrentSession();
                }
            });
            
            console.log('✅ Admin events setup complete');
        },
        
        /**
         * Enhance WordPress UI
         */
        enhanceWordPressUI() {
            // Add custom admin notice styles
            $('<style>')
                .text(`
                    .mkb-react-container {
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        overflow: hidden;
                        margin-top: 20px;
                    }
                    
                    .mkb-admin-toolbar {
                        background: #f0f6fc;
                        border-bottom: 1px solid #c3c4c7;
                        padding: 12px 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .mkb-admin-toolbar h2 {
                        margin: 0;
                        font-size: 18px;
                        color: #1d2327;
                    }
                    
                    .mkb-admin-actions .button {
                        margin-left: 8px;
                    }
                    
                    .mkb-loading-spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid #c3c4c7;
                        border-radius: 50%;
                        border-top-color: #0073aa;
                        animation: mkb-spin 1s ease-in-out infinite;
                    }
                    
                    @keyframes mkb-spin {
                        to { transform: rotate(360deg); }
                    }
                `)
                .appendTo('head');
            
            console.log('✅ WordPress UI enhancements applied');
        },
        
        /**
         * Setup admin toolbar
         */
        setupAdminToolbar() {
            const toolbar = $(`
                <div class="mkb-admin-toolbar">
                    <h2>Media Kit Builder</h2>
                    <div class="mkb-admin-actions">
                        <button type="button" class="button" id="mkb-templates-btn">
                            Templates
                        </button>
                        <button type="button" class="button" id="mkb-settings-btn">
                            Settings
                        </button>
                        <button type="button" class="button button-primary" id="mkb-save-btn">
                            Save Changes
                        </button>
                    </div>
                </div>
            `);
            
            $('#' + this.config.builderContainerId).before(toolbar);
            
            // Setup toolbar events
            $('#mkb-templates-btn').on('click', () => this.openTemplateGallery());
            $('#mkb-settings-btn').on('click', () => this.openSettings());
            $('#mkb-save-btn').on('click', () => this.saveChanges());
        },
        
        /**
         * Setup performance monitoring
         */
        setupPerformanceMonitoring() {
            if (window.mkbConfig && window.mkbConfig.performance.enableTracking) {
                // Monitor resource usage
                setInterval(() => {
                    this.reportPerformanceMetrics();
                }, 30000); // Every 30 seconds
                
                // Monitor for memory leaks
                this.monitorMemoryUsage();
            }
        },
        
        /**
         * WordPress Integration Methods
         */
        
        saveToWordPress(data) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: window.mkbConfig.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mkb_save_media_kit',
                        nonce: window.mkbConfig.nonce,
                        data: JSON.stringify(data)
                    },
                    success: (response) => {
                        if (response.success) {
                            this.showSuccessMessage('Media kit saved successfully');
                            resolve(response.data);
                        } else {
                            reject(new Error(response.data.message));
                        }
                    },
                    error: (xhr, status, error) => {
                        reject(new Error(`Save failed: ${error}`));
                    }
                });
            });
        },
        
        getCurrentSession() {
            return {
                userId: window.mkbConfig.userId,
                mediaKitId: window.mkbConfig.mediaKitId,
                timestamp: Date.now(),
                isActive: document.hasFocus()
            };
        },
        
        navigateToBuilder(action) {
            // Handle navigation within admin
            if (window.mkbState && typeof window.mkbState.dispatch === 'function') {
                window.mkbState.dispatch({
                    type: 'NAVIGATE',
                    payload: { action }
                });
            }
        },
        
        openTemplateGallery() {
            $(document).trigger('mkb:open-template-gallery');
        },
        
        openSettings() {
            window.location.href = window.mkbConfig.adminUrl + 'admin.php?page=mkb-settings';
        },
        
        saveChanges() {
            $(document).trigger('mkb:save-request');
        },
        
        handleExport(data) {
            // Handle export through WordPress admin
            const form = $('<form>', {
                method: 'POST',
                action: window.mkbConfig.adminUrl + 'admin-post.php'
            });
            
            form.append($('<input>', {
                type: 'hidden',
                name: 'action',
                value: 'mkb_export'
            }));
            
            form.append($('<input>', {
                type: 'hidden',
                name: 'nonce',
                value: window.mkbConfig.nonce
            }));
            
            form.append($('<input>', {
                type: 'hidden',
                name: 'export_data',
                value: JSON.stringify(data)
            }));
            
            $('body').append(form);
            form.submit();
            form.remove();
        },
        
        /**
         * Get default configuration
         */
        getDefaultConfig() {
            return {
                ajaxUrl: '/wp-admin/admin-ajax.php',
                nonce: 'default_nonce',
                userId: 0,
                adminUrl: '/wp-admin/',
                debug: true,
                performance: {
                    enableTracking: false
                }
            };
        },
        
        /**
         * Utility Methods
         */
        
        addAdminStyles() {
            // Ensure consistent styling between React app and WordPress admin
            const adminStyles = `
                .mkb-react-container .wp-core-ui .button {
                    font-family: inherit;
                }
                
                .mkb-react-container input[type="text"],
                .mkb-react-container input[type="email"],
                .mkb-react-container textarea {
                    border-color: #8c8f94;
                }
                
                .mkb-react-container input[type="text"]:focus,
                .mkb-react-container input[type="email"]:focus,
                .mkb-react-container textarea:focus {
                    border-color: #2271b1;
                    box-shadow: 0 0 0 1px #2271b1;
                }
            `;
            
            $('<style>').text(adminStyles).appendTo('head');
        },
        
        showSuccessMessage(message) {
            const notice = $(`
                <div class="notice notice-success is-dismissible">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">Dismiss this notice.</span>
                    </button>
                </div>
            `);
            
            $('.wrap').prepend(notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                notice.fadeOut(() => notice.remove());
            }, 5000);
        },
        
        reportError(error) {
            // Report error to WordPress debug log if available
            if (window.mkbConfig.debug) {
                $.ajax({
                    url: window.mkbConfig.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mkb_log_error',
                        nonce: window.mkbConfig.nonce,
                        error: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        },
        
        reportPerformanceMetrics() {
            if (performance.memory) {
                const metrics = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    loadTime: this.state.loadStartTime ? performance.now() - this.state.loadStartTime : 0
                };
                
                // Send to analytics endpoint
                $.ajax({
                    url: window.mkbConfig.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mkb_performance_report',
                        nonce: window.mkbConfig.nonce,
                        metrics: JSON.stringify(metrics)
                    }
                });
            }
        },
        
        monitorMemoryUsage() {
            let lastMemoryUsage = 0;
            
            setInterval(() => {
                if (performance.memory) {
                    const currentUsage = performance.memory.usedJSHeapSize;
                    const memoryIncrease = currentUsage - lastMemoryUsage;
                    
                    // Warn if memory usage increases significantly
                    if (memoryIncrease > 10 * 1024 * 1024) { // 10MB increase
                        console.warn('⚠️ Significant memory usage increase detected:', {
                            increase: Math.round(memoryIncrease / 1024 / 1024) + 'MB',
                            current: Math.round(currentUsage / 1024 / 1024) + 'MB'
                        });
                    }
                    
                    lastMemoryUsage = currentUsage;
                }
            }, 60000); // Check every minute
        }
    };
    
    // Global access
    window.mkbAdminIntegration = AdminIntegration;
    
    // Auto-initialize on admin pages
    if (window.location.pathname.includes('/wp-admin/')) {
        AdminIntegration.init();
    }
    
    console.log('🔧 WordPress Admin Integration loaded');
    
})(jQuery, window, document);
