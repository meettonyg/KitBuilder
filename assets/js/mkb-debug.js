/**
 * Media Kit Builder - Debug Helper
 * 
 * This script provides debugging tools to help diagnose initialization issues
 * and other problems with the Media Kit Builder plugin.
 */

console.log('🔍 Media Kit Builder Debug Helper Loading...');

(function() {
    'use strict';
    
    // Keep track of loaded scripts
    const loadedScripts = new Set();
    const loadedStyles = new Set();
    const initializationLog = [];
    
    // Track initialization status
    let builderInitialized = false;
    let wordpressAdapterInitialized = false;
    let premiumAccessInitialized = false;
    
    // Configuration
    const config = {
        debugMode: true,
        autoFixEnabled: true,
        showDebugButton: true,
        logToConsole: true,
        logToServer: false,
        checkInterval: 500 // milliseconds
    };
    
    /**
     * Initialize debug helper
     */
    function init() {
        console.log('🔧 Initializing Media Kit Builder Debug Helper...');
        
        // Track script loading
        trackScriptLoading();
        
        // Track initialization
        trackInitialization();
        
        // Setup debug UI
        if (config.showDebugButton) {
            setupDebugUI();
        }
        
        // Start checking for initialization
        startInitializationCheck();
        
        // Check for common errors
        checkForCommonErrors();
        
        console.log('✅ Media Kit Builder Debug Helper initialized');
    }
    
    /**
     * Track script loading
     */
    function trackScriptLoading() {
        // Find all scripts in the document
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src) {
                loadedScripts.add(src);
                
                // Log Media Kit Builder related scripts
                if (src.includes('media-kit') || src.includes('builder')) {
                    console.log('📝 Script loaded:', src);
                }
            }
        });
        
        // Find all styles in the document
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        styles.forEach(style => {
            const href = style.getAttribute('href');
            if (href) {
                loadedStyles.add(href);
                
                // Log Media Kit Builder related styles
                if (href.includes('media-kit') || href.includes('builder')) {
                    console.log('📝 Style loaded:', href);
                }
            }
        });
        
        // Track new script and style loading
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                element.addEventListener('load', function() {
                    const src = this.getAttribute('src');
                    if (src) {
                        loadedScripts.add(src);
                        if (src.includes('media-kit') || src.includes('builder')) {
                            console.log('📝 Script dynamically loaded:', src);
                        }
                    }
                });
            }
            
            if (tagName.toLowerCase() === 'link') {
                element.addEventListener('load', function() {
                    const href = this.getAttribute('href');
                    if (href && this.getAttribute('rel') === 'stylesheet') {
                        loadedStyles.add(href);
                        if (href.includes('media-kit') || href.includes('builder')) {
                            console.log('📝 Style dynamically loaded:', href);
                        }
                    }
                });
            }
            
            return element;
        };
    }
    
    /**
     * Track initialization of key components
     */
    function trackInitialization() {
        // Track MediaKitBuilder initialization
        const originalMediaKitBuilder = window.MediaKitBuilder;
        Object.defineProperty(window, 'MediaKitBuilder', {
            get: function() {
                return originalMediaKitBuilder;
            },
            set: function(value) {
                originalMediaKitBuilder = value;
                if (value) {
                    console.log('📝 MediaKitBuilder class available');
                    logInitialization('MediaKitBuilder class available');
                }
                return value;
            },
            configurable: true
        });
        
        // Track mediaKitBuilder instance initialization
        const originalMediaKitBuilderInstance = window.mediaKitBuilder;
        Object.defineProperty(window, 'mediaKitBuilder', {
            get: function() {
                return originalMediaKitBuilderInstance;
            },
            set: function(value) {
                originalMediaKitBuilderInstance = value;
                if (value) {
                    console.log('📝 mediaKitBuilder instance created');
                    logInitialization('mediaKitBuilder instance created');
                    builderInitialized = true;
                }
                return value;
            },
            configurable: true
        });
        
        // Track WordPress adapter initialization
        const originalWpAdapter = window.wpAdapter;
        Object.defineProperty(window, 'wpAdapter', {
            get: function() {
                return originalWpAdapter;
            },
            set: function(value) {
                originalWpAdapter = value;
                if (value) {
                    console.log('📝 WordPress adapter created');
                    logInitialization('WordPress adapter created');
                    wordpressAdapterInitialized = true;
                }
                return value;
            },
            configurable: true
        });
        
        // Track Premium Access Manager initialization
        const originalPremiumAccessManager = window.premiumAccessManager;
        Object.defineProperty(window, 'premiumAccessManager', {
            get: function() {
                return originalPremiumAccessManager;
            },
            set: function(value) {
                originalPremiumAccessManager = value;
                if (value) {
                    console.log('📝 Premium Access Manager created');
                    logInitialization('Premium Access Manager created');
                    premiumAccessInitialized = true;
                }
                return value;
            },
            configurable: true
        });
    }
    
    /**
     * Start periodic check for initialization
     */
    function startInitializationCheck() {
        let checkCount = 0;
        const maxChecks = 30; // 15 seconds
        
        const intervalId = setInterval(() => {
            checkCount++;
            
            // Check initialization status
            const status = {
                builder: window.mediaKitBuilder ? '✅' : '❌',
                wpAdapter: window.wpAdapter ? '✅' : '❌',
                premiumAccess: window.premiumAccessManager ? '✅' : '❌',
                mkbData: window.mkbData ? '✅' : '❌',
                container: document.querySelector('#media-kit-builder') ? '✅' : '❌',
                preview: document.querySelector('#media-kit-preview') ? '✅' : '❌',
                palette: document.querySelector('#component-palette') ? '✅' : '❌'
            };
            
            // Log status
            console.log(`🔍 Initialization check #${checkCount}:`, status);
            
            // Check if everything is initialized
            if (status.builder === '✅' && status.wpAdapter === '✅' && status.container === '✅') {
                console.log('✅ Media Kit Builder fully initialized!');
                clearInterval(intervalId);
                return;
            }
            
            // Try to fix if auto-fix is enabled
            if (config.autoFixEnabled && checkCount > 5 && checkCount < maxChecks) {
                attemptAutoFix(status);
            }
            
            // Stop after max checks
            if (checkCount >= maxChecks) {
                console.warn('⚠️ Media Kit Builder initialization check timed out');
                clearInterval(intervalId);
                
                // Show initialization failure
                showInitializationFailure(status);
            }
        }, config.checkInterval);
    }
    
    /**
     * Attempt to auto-fix initialization issues
     * @param {Object} status - Initialization status
     */
    function attemptAutoFix(status) {
        console.log('🔧 Attempting to auto-fix initialization issues...');
        
        // Fix missing mkbData
        if (status.mkbData === '❌' && !window.mkbData) {
            console.log('🔧 Creating fallback mkbData object');
            window.mkbData = {
                ajaxUrl: '/wp-admin/admin-ajax.php',
                restUrl: '/wp-json/media-kit/v1/',
                nonce: '',
                restNonce: '',
                userId: 0,
                accessTier: 'guest',
                isAdmin: false,
                debugMode: true
            };
        }
        
        // Fix missing builder container
        if (status.container === '❌' && !document.querySelector('#media-kit-builder')) {
            console.log('🔧 Creating fallback builder container');
            const container = document.createElement('div');
            container.id = 'media-kit-builder';
            container.className = 'media-kit-builder';
            container.innerHTML = `
                <div id="media-kit-preview" class="media-kit-preview"></div>
                <div id="component-palette" class="component-palette"></div>
            `;
            document.body.appendChild(container);
        }
        
        // Force WordPress adapter initialization
        if (status.wpAdapter === '❌' && status.mkbData === '✅' && typeof WordPressAdapter === 'function') {
            console.log('🔧 Forcing WordPress adapter initialization');
            try {
                window.wpAdapter = new WordPressAdapter(window.mkbData);
            } catch (error) {
                console.error('❌ Failed to initialize WordPress adapter:', error);
            }
        }
        
        // Force builder initialization
        if (status.builder === '❌' && status.container === '✅' && typeof MediaKitBuilder === 'function') {
            console.log('🔧 Forcing Media Kit Builder initialization');
            try {
                window.mediaKitBuilder = new MediaKitBuilder({
                    container: '#media-kit-builder',
                    previewContainer: '#media-kit-preview',
                    componentPalette: '#component-palette',
                    wpData: window.mkbData
                });
            } catch (error) {
                console.error('❌ Failed to initialize Media Kit Builder:', error);
            }
        }
    }
    
    /**
     * Check for common errors
     */
    function checkForCommonErrors() {
        // Check for jQuery
        if (typeof jQuery === 'undefined') {
            console.error('❌ jQuery is not loaded! Media Kit Builder requires jQuery.');
            logInitialization('ERROR: jQuery not found');
        }
        
        // Check for WordPress globals
        if (typeof wp === 'undefined') {
            console.warn('⚠️ WordPress JavaScript libraries not found. Some features may not work properly.');
            logInitialization('WARNING: WordPress JS libraries not found');
        }
        
        // Check for container
        setTimeout(() => {
            const container = document.querySelector('#media-kit-builder');
            if (!container) {
                console.error('❌ Media Kit Builder container (#media-kit-builder) not found in the DOM.');
                logInitialization('ERROR: Builder container not found');
            } else if (container.offsetWidth === 0 || container.offsetHeight === 0) {
                console.warn('⚠️ Media Kit Builder container has zero width or height. Check CSS display properties.');
                logInitialization('WARNING: Builder container has zero size');
            }
            
            // Check for preview container
            const preview = document.querySelector('#media-kit-preview');
            if (!preview) {
                console.error('❌ Media Kit Preview container (#media-kit-preview) not found in the DOM.');
                logInitialization('ERROR: Preview container not found');
            }
            
            // Check for component palette
            const palette = document.querySelector('#component-palette');
            if (!palette) {
                console.error('❌ Component Palette (#component-palette) not found in the DOM.');
                logInitialization('ERROR: Component palette not found');
            }
        }, 1000);
    }
    
    /**
     * Log initialization event
     * @param {string} message - Event message
     */
    function logInitialization(message) {
        const timestamp = new Date().toISOString();
        initializationLog.push({
            timestamp,
            message,
            scripts: Array.from(loadedScripts),
            styles: Array.from(loadedStyles)
        });
    }
    
    /**
     * Setup debug UI
     */
    function setupDebugUI() {
        // Create debug button
        const debugButton = document.createElement('button');
        debugButton.id = 'mkb-debug-button';
        debugButton.textContent = 'Debug';
        debugButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        `;
        
        // Add click handler
        debugButton.addEventListener('click', showDebugPanel);
        
        // Add to DOM when ready
        if (document.body) {
            document.body.appendChild(debugButton);
        } else {
            window.addEventListener('load', () => {
                document.body.appendChild(debugButton);
            });
        }
    }
    
    /**
     * Show debug panel
     */
    function showDebugPanel() {
        // Check if panel already exists
        if (document.getElementById('mkb-debug-panel')) {
            return;
        }
        
        // Create debug panel
        const panel = document.createElement('div');
        panel.id = 'mkb-debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50px;
            right: 50px;
            bottom: 50px;
            background: white;
            z-index: 999999;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;
        
        // Add header
        panel.innerHTML = `
            <div style="background: #2c3e50; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 18px;">Media Kit Builder Debug Panel</h2>
                <button id="mkb-debug-close" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div style="display: flex; height: calc(100% - 60px);">
                <div style="width: 200px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                    <div class="debug-tab active" data-tab="status" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">Status</div>
                    <div class="debug-tab" data-tab="scripts" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">Scripts</div>
                    <div class="debug-tab" data-tab="styles" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">Styles</div>
                    <div class="debug-tab" data-tab="dom" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">DOM</div>
                    <div class="debug-tab" data-tab="logs" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">Logs</div>
                    <div class="debug-tab" data-tab="fixes" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #ddd;">Fixes</div>
                </div>
                <div style="flex: 1; padding: 20px; overflow-y: auto;">
                    <div id="debug-content"></div>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(panel);
        
        // Setup event listeners
        document.getElementById('mkb-debug-close').addEventListener('click', () => {
            panel.remove();
        });
        
        // Tab switching
        const tabs = panel.querySelectorAll('.debug-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show tab content
                showTabContent(tab.getAttribute('data-tab'));
            });
        });
        
        // Show initial tab
        showTabContent('status');
        
        // Tab styling
        const style = document.createElement('style');
        style.textContent = `
            .debug-tab {
                transition: background 0.2s ease;
            }
            .debug-tab:hover {
                background: #e9e9e9;
            }
            .debug-tab.active {
                background: #2c3e50;
                color: white;
                font-weight: bold;
            }
            .debug-button {
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            }
            .debug-button:hover {
                background: #2980b9;
            }
            .status-ok {
                color: #27ae60;
                font-weight: bold;
            }
            .status-error {
                color: #e74c3c;
                font-weight: bold;
            }
            .status-warning {
                color: #f39c12;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Show tab content
     * @param {string} tabName - Tab name
     */
    function showTabContent(tabName) {
        const contentContainer = document.getElementById('debug-content');
        if (!contentContainer) return;
        
        switch (tabName) {
            case 'status':
                showStatusTab(contentContainer);
                break;
            case 'scripts':
                showScriptsTab(contentContainer);
                break;
            case 'styles':
                showStylesTab(contentContainer);
                break;
            case 'dom':
                showDomTab(contentContainer);
                break;
            case 'logs':
                showLogsTab(contentContainer);
                break;
            case 'fixes':
                showFixesTab(contentContainer);
                break;
        }
    }
    
    /**
     * Show status tab
     * @param {HTMLElement} container - Content container
     */
    function showStatusTab(container) {
        // Get current status
        const status = {
            jQuery: typeof jQuery !== 'undefined',
            MediaKitBuilder: typeof MediaKitBuilder !== 'undefined',
            mediaKitBuilder: !!window.mediaKitBuilder,
            wpAdapter: !!window.wpAdapter,
            premiumAccessManager: !!window.premiumAccessManager,
            mkbData: !!window.mkbData,
            container: !!document.querySelector('#media-kit-builder'),
            preview: !!document.querySelector('#media-kit-preview'),
            palette: !!document.querySelector('#component-palette'),
            DOMContentLoaded: document.readyState !== 'loading',
            windowLoaded: document.readyState === 'complete'
        };
        
        // Create status table
        let html = `
            <h3>Initialization Status</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Component</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Status</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Details</th>
                </tr>
        `;
        
        // Add rows
        Object.entries(status).forEach(([key, value]) => {
            const statusClass = value ? 'status-ok' : 'status-error';
            const statusText = value ? 'OK' : 'NOT FOUND';
            
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${key}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="${statusClass}">${statusText}</span></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getComponentDetails(key, value)}</td>
                </tr>
            `;
        });
        
        html += `</table>`;
        
        // Add builder state
        if (window.mediaKitBuilder) {
            html += `
                <h3>Builder State</h3>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${JSON.stringify(window.mediaKitBuilder.state, null, 2)}</pre>
            `;
        }
        
        // Add mkbData
        if (window.mkbData) {
            html += `
                <h3>WordPress Data</h3>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${JSON.stringify(window.mkbData, null, 2)}</pre>
            `;
        }
        
        // Add refresh button
        html += `<button class="debug-button" id="refresh-status">Refresh Status</button>`;
        
        container.innerHTML = html;
        
        // Add event listener for refresh button
        document.getElementById('refresh-status')?.addEventListener('click', () => {
            showStatusTab(container);
        });
    }
    
    /**
     * Get component details
     * @param {string} key - Component key
     * @param {boolean} value - Component status
     * @returns {string} - Component details
     */
    function getComponentDetails(key, value) {
        if (!value) {
            return 'Not initialized or missing';
        }
        
        switch (key) {
            case 'jQuery':
                return `Version: ${jQuery.fn.jquery}`;
            case 'MediaKitBuilder':
                return 'Class available';
            case 'mediaKitBuilder':
                return `Instance created, state has ${Object.keys(window.mediaKitBuilder.state).length} properties`;
            case 'wpAdapter':
                return `WordPress adapter initialized, using ${window.wpAdapter.config.restUrl ? 'REST API' : 'AJAX'}`;
            case 'premiumAccessManager':
                return `Premium access manager initialized, tier: ${window.premiumAccessManager.config.userTier}`;
            case 'mkbData':
                return `WordPress data available, access tier: ${window.mkbData.accessTier}`;
            case 'container':
                const container = document.querySelector('#media-kit-builder');
                return `Size: ${container.offsetWidth}×${container.offsetHeight}px, Visible: ${isVisible(container)}`;
            case 'preview':
                const preview = document.querySelector('#media-kit-preview');
                return `Size: ${preview.offsetWidth}×${preview.offsetHeight}px, Visible: ${isVisible(preview)}`;
            case 'palette':
                const palette = document.querySelector('#component-palette');
                return `Components: ${palette.querySelectorAll('.component-item').length}, Visible: ${isVisible(palette)}`;
            case 'DOMContentLoaded':
                return `Document ready state: ${document.readyState}`;
            case 'windowLoaded':
                return `Window loaded: ${document.readyState === 'complete'}`;
            default:
                return 'Available';
        }
    }
    
    /**
     * Check if element is visible
     * @param {HTMLElement} el - Element to check
     * @returns {boolean} - Whether element is visible
     */
    function isVisible(el) {
        if (!el) return false;
        
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
    
    /**
     * Show scripts tab
     * @param {HTMLElement} container - Content container
     */
    function showScriptsTab(container) {
        let html = `
            <h3>Loaded Scripts</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Script</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Status</th>
                </tr>
        `;
        
        // Required scripts
        const requiredScripts = [
            'builder.js',
            'builder-wordpress.js',
            'premium-access-control.js',
            'section-templates.js'
        ];
        
        // Check required scripts
        requiredScripts.forEach(script => {
            const isLoaded = Array.from(loadedScripts).some(src => src.includes(script));
            const statusClass = isLoaded ? 'status-ok' : 'status-error';
            const statusText = isLoaded ? 'LOADED' : 'MISSING';
            
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${script}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="${statusClass}">${statusText}</span></td>
                </tr>
            `;
        });
        
        // Add all loaded scripts
        const mkbScripts = Array.from(loadedScripts).filter(src => 
            src.includes('media-kit') || src.includes('builder')
        );
        
        mkbScripts.forEach(script => {
            if (!requiredScripts.some(req => script.includes(req))) {
                html += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${script}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="status-ok">LOADED</span></td>
                    </tr>
                `;
            }
        });
        
        html += `</table>`;
        
        // Add script load order
        html += `
            <h3>Script Load Order</h3>
            <ol style="margin-left: 20px;">
        `;
        
        document.querySelectorAll('script').forEach(script => {
            const src = script.getAttribute('src');
            if (src && (src.includes('media-kit') || src.includes('builder'))) {
                html += `<li>${src}</li>`;
            }
        });
        
        html += `</ol>`;
        
        // Add force load scripts button
        html += `
            <h3>Fix Script Loading</h3>
            <p>If scripts are missing, you can try to load them manually:</p>
            <button class="debug-button" id="force-load-scripts">Force Load Required Scripts</button>
        `;
        
        container.innerHTML = html;
        
        // Add event listener for force load button
        document.getElementById('force-load-scripts')?.addEventListener('click', () => {
            forceLoadScripts();
            setTimeout(() => {
                showScriptsTab(container);
            }, 1000);
        });
    }
    
    /**
     * Force load required scripts
     */
    function forceLoadScripts() {
        const baseUrl = '/wp-content/plugins/media-kit-builder/assets/js/';
        const scripts = [
            'builder.js',
            'builder-wordpress.js',
            'premium-access-control.js',
            'section-templates.js'
        ];
        
        // Try to determine base URL from existing scripts
        let detectedBaseUrl = null;
        document.querySelectorAll('script').forEach(script => {
            const src = script.getAttribute('src');
            if (src && src.includes('media-kit') && src.includes('.js')) {
                const match = src.match(/(.*\/)[^\/]+$/);
                if (match && match[1]) {
                    detectedBaseUrl = match[1];
                }
            }
        });
        
        if (detectedBaseUrl) {
            console.log('🔍 Detected base URL:', detectedBaseUrl);
        }
        
        const scriptBaseUrl = detectedBaseUrl || baseUrl;
        
        scripts.forEach(script => {
            const isLoaded = Array.from(loadedScripts).some(src => src.includes(script));
            if (!isLoaded) {
                console.log(`🔧 Force loading script: ${script}`);
                
                const scriptEl = document.createElement('script');
                scriptEl.src = scriptBaseUrl + script;
                document.head.appendChild(scriptEl);
            }
        });
    }
    
    /**
     * Show styles tab
     * @param {HTMLElement} container - Content container
     */
    function showStylesTab(container) {
        let html = `
            <h3>Loaded Styles</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Style</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Status</th>
                </tr>
        `;
        
        // Required styles
        const requiredStyles = [
            'builder.css',
            'builder-v2.css',
            'components.css'
        ];
        
        // Check required styles
        requiredStyles.forEach(style => {
            const isLoaded = Array.from(loadedStyles).some(href => href.includes(style));
            const statusClass = isLoaded ? 'status-ok' : 'status-error';
            const statusText = isLoaded ? 'LOADED' : 'MISSING';
            
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${style}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="${statusClass}">${statusText}</span></td>
                </tr>
            `;
        });
        
        // Add all loaded styles
        const mkbStyles = Array.from(loadedStyles).filter(href => 
            href.includes('media-kit') || href.includes('builder')
        );
        
        mkbStyles.forEach(style => {
            if (!requiredStyles.some(req => style.includes(req))) {
                html += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${style}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="status-ok">LOADED</span></td>
                    </tr>
                `;
            }
        });
        
        html += `</table>`;
        
        // Add inline styles analysis
        html += `
            <h3>Inline Styles</h3>
            <div style="max-height: 300px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
        `;
        
        document.querySelectorAll('style').forEach((style, index) => {
            html += `
                <div style="margin-bottom: 10px;">
                    <strong>Style #${index + 1}</strong>
                    <pre style="margin: 5px 0 0 0; white-space: pre-wrap;">${style.textContent.substring(0, 200)}${style.textContent.length > 200 ? '...' : ''}</pre>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Add force load styles button
        html += `
            <h3>Fix Style Loading</h3>
            <p>If styles are missing, you can try to load them manually:</p>
            <button class="debug-button" id="force-load-styles">Force Load Required Styles</button>
        `;
        
        container.innerHTML = html;
        
        // Add event listener for force load button
        document.getElementById('force-load-styles')?.addEventListener('click', () => {
            forceLoadStyles();
            setTimeout(() => {
                showStylesTab(container);
            }, 1000);
        });
    }
    
    /**
     * Force load required styles
     */
    function forceLoadStyles() {
        const baseUrl = '/wp-content/plugins/media-kit-builder/assets/css/';
        const styles = [
            'builder.css',
            'builder-v2.css',
            'components.css'
        ];
        
        // Try to determine base URL from existing styles
        let detectedBaseUrl = null;
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('media-kit') && href.includes('.css')) {
                const match = href.match(/(.*\/)[^\/]+$/);
                if (match && match[1]) {
                    detectedBaseUrl = match[1];
                }
            }
        });
        
        if (detectedBaseUrl) {
            console.log('🔍 Detected base URL for styles:', detectedBaseUrl);
        }
        
        const styleBaseUrl = detectedBaseUrl || baseUrl;
        
        styles.forEach(style => {
            const isLoaded = Array.from(loadedStyles).some(href => href.includes(style));
            if (!isLoaded) {
                console.log(`🔧 Force loading style: ${style}`);
                
                const linkEl = document.createElement('link');
                linkEl.rel = 'stylesheet';
                linkEl.href = styleBaseUrl + style;
                document.head.appendChild(linkEl);
            }
        });
    }
    
    /**
     * Show DOM tab
     * @param {HTMLElement} container - Content container
     */
    function showDomTab(container) {
        let html = `
            <h3>DOM Structure</h3>
            <p>Examining the DOM structure for the Media Kit Builder...</p>
        `;
        
        // Check if builder container exists
        const builderContainer = document.querySelector('#media-kit-builder');
        
        if (!builderContainer) {
            html += `
                <div class="status-error" style="padding: 10px; background: #fdeaea; border-radius: 4px; margin-bottom: 20px;">
                    Media Kit Builder container (#media-kit-builder) not found in the DOM!
                </div>
                
                <button class="debug-button" id="create-container">Create Container</button>
            `;
        } else {
            // Container dimensions
            const rect = builderContainer.getBoundingClientRect();
            html += `
                <div style="margin-bottom: 20px;">
                    <strong>Builder Container:</strong> 
                    <ul>
                        <li>Width: ${rect.width}px</li>
                        <li>Height: ${rect.height}px</li>
                        <li>Visible: ${isVisible(builderContainer)}</li>
                        <li>Children: ${builderContainer.children.length}</li>
                        <li>Classes: ${builderContainer.className}</li>
                    </ul>
                </div>
            `;
            
            // Check if preview container exists
            const previewContainer = document.querySelector('#media-kit-preview');
            if (!previewContainer) {
                html += `
                    <div class="status-error" style="padding: 10px; background: #fdeaea; border-radius: 4px; margin-bottom: 20px;">
                        Media Kit Preview container (#media-kit-preview) not found in the DOM!
                    </div>
                `;
            } else {
                const previewRect = previewContainer.getBoundingClientRect();
                html += `
                    <div style="margin-bottom: 20px;">
                        <strong>Preview Container:</strong> 
                        <ul>
                            <li>Width: ${previewRect.width}px</li>
                            <li>Height: ${previewRect.height}px</li>
                            <li>Visible: ${isVisible(previewContainer)}</li>
                            <li>Children: ${previewContainer.children.length}</li>
                            <li>Classes: ${previewContainer.className}</li>
                        </ul>
                    </div>
                `;
            }
            
            // Check if component palette exists
            const paletteContainer = document.querySelector('#component-palette');
            if (!paletteContainer) {
                html += `
                    <div class="status-error" style="padding: 10px; background: #fdeaea; border-radius: 4px; margin-bottom: 20px;">
                        Component Palette (#component-palette) not found in the DOM!
                    </div>
                `;
            } else {
                const paletteRect = paletteContainer.getBoundingClientRect();
                html += `
                    <div style="margin-bottom: 20px;">
                        <strong>Component Palette:</strong> 
                        <ul>
                            <li>Width: ${paletteRect.width}px</li>
                            <li>Height: ${paletteRect.height}px</li>
                            <li>Visible: ${isVisible(paletteContainer)}</li>
                            <li>Components: ${paletteContainer.querySelectorAll('.component-item').length}</li>
                            <li>Classes: ${paletteContainer.className}</li>
                        </ul>
                    </div>
                `;
            }
            
            // DOM fix buttons
            html += `
                <h3>DOM Fixes</h3>
                <button class="debug-button" id="fix-container-styles">Fix Container Styles</button>
                <button class="debug-button" id="force-show-containers" style="margin-left: 10px;">Force Show Containers</button>
            `;
        }
        
        container.innerHTML = html;
        
        // Add event listeners for buttons
        document.getElementById('create-container')?.addEventListener('click', () => {
            createBuilderContainer();
            setTimeout(() => {
                showDomTab(container);
            }, 500);
        });
        
        document.getElementById('fix-container-styles')?.addEventListener('click', () => {
            fixContainerStyles();
            setTimeout(() => {
                showDomTab(container);
            }, 500);
        });
        
        document.getElementById('force-show-containers')?.addEventListener('click', () => {
            forceShowContainers();
            setTimeout(() => {
                showDomTab(container);
            }, 500);
        });
    }
    
    /**
     * Create builder container
     */
    function createBuilderContainer() {
        console.log('🔧 Creating builder container');
        
        const container = document.createElement('div');
        container.id = 'media-kit-builder';
        container.className = 'media-kit-builder';
        container.style.cssText = `
            display: block;
            width: 100%;
            min-height: 600px;
            background: #f9f9f9;
            margin: 20px 0;
            position: relative;
            border: 1px solid #ddd;
            border-radius: 4px;
        `;
        
        container.innerHTML = `
            <div id="media-kit-preview" class="media-kit-preview" style="min-height: 400px; padding: 20px;"></div>
            <div id="component-palette" class="component-palette" style="padding: 20px;"></div>
        `;
        
        // Find suitable location to add the container
        const contentElement = document.querySelector('.content-area, #content, main, .entry-content');
        if (contentElement) {
            contentElement.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
        
        console.log('✅ Builder container created');
    }
    
    /**
     * Fix container styles
     */
    function fixContainerStyles() {
        console.log('🔧 Fixing container styles');
        
        const builderContainer = document.querySelector('#media-kit-builder');
        if (builderContainer) {
            builderContainer.style.cssText = `
                display: block !important;
                width: 100% !important;
                min-height: 600px !important;
                background: #f9f9f9 !important;
                margin: 20px 0 !important;
                position: relative !important;
                border: 1px solid #ddd !important;
                border-radius: 4px !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
        }
        
        const previewContainer = document.querySelector('#media-kit-preview');
        if (previewContainer) {
            previewContainer.style.cssText = `
                min-height: 400px !important;
                padding: 20px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
        }
        
        const paletteContainer = document.querySelector('#component-palette');
        if (paletteContainer) {
            paletteContainer.style.cssText = `
                padding: 20px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
        }
        
        console.log('✅ Container styles fixed');
    }
    
    /**
     * Force show containers
     */
    function forceShowContainers() {
        console.log('🔧 Forcing containers to be visible');
        
        // Add global styles
        const style = document.createElement('style');
        style.textContent = `
            #media-kit-builder,
            #media-kit-preview,
            #component-palette,
            .media-kit-builder,
            .media-kit-preview,
            .component-palette {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                min-height: 20px !important;
                border: 2px solid red !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Force show styles added');
    }
    
    /**
     * Show logs tab
     * @param {HTMLElement} container - Content container
     */
    function showLogsTab(container) {
        let html = `
            <h3>Initialization Log</h3>
            <div style="max-height: 400px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-family: monospace;">
        `;
        
        if (initializationLog.length === 0) {
            html += '<p>No initialization events logged yet.</p>';
        } else {
            initializationLog.forEach(logEntry => {
                const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
                const isError = logEntry.message.includes('ERROR');
                const isWarning = logEntry.message.includes('WARNING');
                
                let messageClass = '';
                if (isError) messageClass = 'status-error';
                if (isWarning) messageClass = 'status-warning';
                
                html += `
                    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ddd;">
                        <div><strong>${timestamp}</strong>: <span class="${messageClass}">${logEntry.message}</span></div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        
        // Add console log capture
        html += `
            <h3>Console Logs</h3>
            <div id="console-log-container" style="max-height: 300px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-family: monospace;">
                <div style="margin-bottom: 10px;">Waiting for logs...</div>
            </div>
            
            <button class="debug-button" id="capture-console">Capture Console Logs</button>
            <button class="debug-button" id="clear-console" style="margin-left: 10px;">Clear Console</button>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners for buttons
        document.getElementById('capture-console')?.addEventListener('click', () => {
            startConsoleCapture();
        });
        
        document.getElementById('clear-console')?.addEventListener('click', () => {
            document.getElementById('console-log-container').innerHTML = '<div>Console cleared</div>';
            console.clear();
        });
    }
    
    /**
     * Start console capture
     */
    function startConsoleCapture() {
        const logContainer = document.getElementById('console-log-container');
        if (!logContainer) return;
        
        logContainer.innerHTML = '<div>Capturing logs...</div>';
        
        // Store original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        // Override console methods
        console.log = function() {
            // Call original method
            originalLog.apply(console, arguments);
            
            // Add to log container
            appendToLogContainer('log', arguments);
        };
        
        console.warn = function() {
            // Call original method
            originalWarn.apply(console, arguments);
            
            // Add to log container
            appendToLogContainer('warn', arguments);
        };
        
        console.error = function() {
            // Call original method
            originalError.apply(console, arguments);
            
            // Add to log container
            appendToLogContainer('error', arguments);
        };
        
        // Helper function to append logs
        function appendToLogContainer(type, args) {
            const logContainer = document.getElementById('console-log-container');
            if (!logContainer) return;
            
            const logEntry = document.createElement('div');
            logEntry.style.marginBottom = '5px';
            logEntry.style.borderBottom = '1px solid #ddd';
            logEntry.style.paddingBottom = '5px';
            
            // Create log content
            let content = '';
            for (let i = 0; i < args.length; i++) {
                try {
                    if (typeof args[i] === 'object') {
                        content += JSON.stringify(args[i]) + ' ';
                    } else {
                        content += args[i] + ' ';
                    }
                } catch (e) {
                    content += '[Object] ';
                }
            }
            
            // Set log type styling
            if (type === 'warn') {
                logEntry.classList.add('status-warning');
            } else if (type === 'error') {
                logEntry.classList.add('status-error');
            }
            
            logEntry.textContent = `[${type.toUpperCase()}] ${content}`;
            
            // Add to container
            logContainer.appendChild(logEntry);
            
            // Scroll to bottom
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        // Add message
        const message = document.createElement('div');
        message.textContent = 'Console capture started. Check browser console for more logs.';
        message.style.marginBottom = '10px';
        message.style.fontWeight = 'bold';
        logContainer.insertBefore(message, logContainer.firstChild);
    }
    
    /**
     * Show fixes tab
     * @param {HTMLElement} container - Content container
     */
    function showFixesTab(container) {
        let html = `
            <h3>Quick Fixes</h3>
            <p>Select a fix to apply:</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Fix Script Loading</h4>
                    <p>Attempt to load missing JavaScript files required for the builder.</p>
                    <button class="debug-button" id="fix-script-loading">Apply Fix</button>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Fix Style Loading</h4>
                    <p>Attempt to load missing CSS files required for the builder.</p>
                    <button class="debug-button" id="fix-style-loading">Apply Fix</button>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Fix Container Visibility</h4>
                    <p>Force containers to be visible and properly styled.</p>
                    <button class="debug-button" id="fix-visibility">Apply Fix</button>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Force Initialization</h4>
                    <p>Attempt to force the builder to initialize.</p>
                    <button class="debug-button" id="force-initialization">Apply Fix</button>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Create mkbData Object</h4>
                    <p>Create a fallback mkbData object if missing.</p>
                    <button class="debug-button" id="create-mkbdata">Apply Fix</button>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Refresh Page</h4>
                    <p>Reload the page to start fresh.</p>
                    <button class="debug-button" id="refresh-page">Apply Fix</button>
                </div>
            </div>
            
            <h3>Fix Results</h3>
            <div id="fix-results" style="background: #f5f5f5; padding: 10px; border-radius: 4px; min-height: 100px;">
                <p>No fixes applied yet.</p>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners for buttons
        document.getElementById('fix-script-loading')?.addEventListener('click', () => {
            updateFixResults('Attempting to fix script loading...');
            forceLoadScripts();
            setTimeout(() => {
                updateFixResults('Script loading fix applied. Check Scripts tab for results.');
            }, 1000);
        });
        
        document.getElementById('fix-style-loading')?.addEventListener('click', () => {
            updateFixResults('Attempting to fix style loading...');
            forceLoadStyles();
            setTimeout(() => {
                updateFixResults('Style loading fix applied. Check Styles tab for results.');
            }, 1000);
        });
        
        document.getElementById('fix-visibility')?.addEventListener('click', () => {
            updateFixResults('Attempting to fix container visibility...');
            fixContainerStyles();
            forceShowContainers();
            setTimeout(() => {
                updateFixResults('Container visibility fix applied. Check DOM tab for results.');
            }, 500);
        });
        
        document.getElementById('force-initialization')?.addEventListener('click', () => {
            updateFixResults('Attempting to force initialization...');
            forceInitialization();
            setTimeout(() => {
                updateFixResults('Initialization attempt complete. Check Status tab for results.');
            }, 1000);
        });
        
        document.getElementById('create-mkbdata')?.addEventListener('click', () => {
            updateFixResults('Attempting to create mkbData object...');
            createMkbDataObject();
            setTimeout(() => {
                updateFixResults('mkbData object created. Check Status tab for results.');
            }, 500);
        });
        
        document.getElementById('refresh-page')?.addEventListener('click', () => {
            updateFixResults('Refreshing page...');
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
    }
    
    /**
     * Update fix results
     * @param {string} message - Result message
     */
    function updateFixResults(message) {
        const resultsContainer = document.getElementById('fix-results');
        if (resultsContainer) {
            const timestamp = new Date().toLocaleTimeString();
            
            const resultEntry = document.createElement('div');
            resultEntry.style.marginBottom = '8px';
            resultEntry.style.paddingBottom = '8px';
            resultEntry.style.borderBottom = '1px solid #ddd';
            
            resultEntry.innerHTML = `<strong>${timestamp}</strong>: ${message}`;
            
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(resultEntry);
        }
    }
    
    /**
     * Force initialization
     */
    function forceInitialization() {
        console.log('🔧 Attempting to force initialization...');
        
        // Ensure we have mkbData
        if (!window.mkbData) {
            createMkbDataObject();
        }
        
        // Force MediaKitBuilder initialization
        if (typeof MediaKitBuilder === 'function' && !window.mediaKitBuilder) {
            try {
                console.log('🔧 Creating MediaKitBuilder instance...');
                window.mediaKitBuilder = new MediaKitBuilder({
                    container: '#media-kit-builder',
                    previewContainer: '#media-kit-preview',
                    componentPalette: '#component-palette',
                    wpData: window.mkbData
                });
                console.log('✅ MediaKitBuilder instance created');
            } catch (error) {
                console.error('❌ Failed to create MediaKitBuilder instance:', error);
            }
        }
        
        // Force WordPress adapter initialization
        if (typeof WordPressAdapter === 'function' && !window.wpAdapter) {
            try {
                console.log('🔧 Creating WordPress adapter...');
                window.wpAdapter = new WordPressAdapter(window.mkbData);
                console.log('✅ WordPress adapter created');
            } catch (error) {
                console.error('❌ Failed to create WordPress adapter:', error);
            }
        }
        
        // Force Premium Access Manager initialization
        if (typeof PremiumAccessManager === 'function' && !window.premiumAccessManager) {
            try {
                console.log('🔧 Creating Premium Access Manager...');
                window.premiumAccessManager = new PremiumAccessManager({
                    accessTier: window.mkbData?.accessTier || 'guest',
                    isAdmin: window.mkbData?.isAdmin || false
                });
                console.log('✅ Premium Access Manager created');
            } catch (error) {
                console.error('❌ Failed to create Premium Access Manager:', error);
            }
        }
        
        console.log('✅ Force initialization attempt complete');
    }
    
    /**
     * Create mkbData object
     */
    function createMkbDataObject() {
        console.log('🔧 Creating mkbData object...');
        
        if (!window.mkbData) {
            window.mkbData = {
                ajaxUrl: '/wp-admin/admin-ajax.php',
                restUrl: '/wp-json/media-kit/v1/',
                nonce: '',
                restNonce: '',
                userId: 0,
                accessTier: 'guest',
                isAdmin: false,
                debugMode: true,
                plugins_url: '/wp-content/plugins/media-kit-builder/'
            };
            
            console.log('✅ Created mkbData object');
        } else {
            console.log('ℹ️ mkbData object already exists');
        }
    }
    
    /**
     * Show initialization failure
     * @param {Object} status - Initialization status
     */
    function showInitializationFailure(status) {
        console.error('❌ Media Kit Builder initialization failed!', status);
        
        // Create failure overlay
        const overlay = document.createElement('div');
        overlay.id = 'mkb-initialization-failure';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            max-width: 80%;
            width: 500px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;
        
        overlay.innerHTML = `
            <h3 style="margin-top: 0; color: #e74c3c;">Media Kit Builder Initialization Failed</h3>
            <p>The Media Kit Builder failed to initialize properly. Here's what's missing:</p>
            <ul style="text-align: left; margin-bottom: 20px;">
                ${status.builder === '❌' ? '<li><strong>Builder Instance</strong> - Core builder not initialized</li>' : ''}
                ${status.wpAdapter === '❌' ? '<li><strong>WordPress Adapter</strong> - WordPress integration not initialized</li>' : ''}
                ${status.mkbData === '❌' ? '<li><strong>WordPress Data</strong> - Configuration data missing</li>' : ''}
                ${status.container === '❌' ? '<li><strong>Builder Container</strong> - HTML container missing</li>' : ''}
            </ul>
            <button id="show-debug-panel" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Show Debug Panel</button>
            <button id="try-auto-fix" style="background: #2ecc71; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Try Auto Fix</button>
            <button id="close-failure" style="display: block; background: none; border: none; color: #7f8c8d; margin: 15px auto 0; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('show-debug-panel')?.addEventListener('click', () => {
            showDebugPanel();
            overlay.remove();
        });
        
        document.getElementById('try-auto-fix')?.addEventListener('click', () => {
            // Try auto fixes
            createMkbDataObject();
            forceLoadScripts();
            forceLoadStyles();
            fixContainerStyles();
            setTimeout(() => {
                forceInitialization();
                overlay.remove();
                
                // Show results
                setTimeout(() => {
                    showDebugPanel();
                }, 1000);
            }, 1000);
        });
        
        document.getElementById('close-failure')?.addEventListener('click', () => {
            overlay.remove();
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
