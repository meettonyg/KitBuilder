/**
 * Media Kit Builder - Debug Helper
 * 
 * This file provides debugging utilities for the Media Kit Builder.
 */

(function() {
    'use strict';
    
    console.log('🔍 Debug helper initializing...');
    
    // Debug namespace
    window.MKB_DEBUG = window.MKB_DEBUG || {};
    
    // Configuration
    const config = {
        enabled: true,
        logToConsole: true,
        logToUI: true,
        detailedErrors: true
    };
    
    // Debug log container
    let logContainer = null;
    const logEntries = [];
    
    /**
     * Initialize debug helper
     */
    function init() {
        console.log('[Debug Helper] Initializing...');
        
        // Create log container if logging to UI is enabled
        if (config.logToUI) {
            createLogContainer();
        }
        
        // Set up global error handlers
        setupErrorHandlers();
        
        // Expose debug methods
        exposeDebugMethods();
        
        // Inspect global objects
        setTimeout(inspectGlobalObjects, 1000);
        
        console.log('[Debug Helper] Initialized');
    }
    
    /**
     * Create log container
     */
    function createLogContainer() {
        // Check if container already exists
        if (document.getElementById('mkb-debug-log')) {
            logContainer = document.getElementById('mkb-debug-log');
            return;
        }
        
        // Create container
        logContainer = document.createElement('div');
        logContainer.id = 'mkb-debug-log';
        logContainer.className = 'mkb-debug-log';
        logContainer.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 400px;
            max-height: 300px;
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            display: none;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'mkb-debug-header';
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Media Kit Builder Debug Log</span>
                <div>
                    <button id="mkb-debug-clear" style="background: none; border: none; color: #ff5555; cursor: pointer; margin-right: 10px;">Clear</button>
                    <button id="mkb-debug-close" style="background: none; border: none; color: #ff5555; cursor: pointer;">Close</button>
                </div>
            </div>
            <div style="height: 1px; background-color: #333; margin-bottom: 10px;"></div>
        `;
        
        // Create log content
        const content = document.createElement('div');
        content.id = 'mkb-debug-content';
        content.className = 'mkb-debug-content';
        
        // Add to container
        logContainer.appendChild(header);
        logContainer.appendChild(content);
        
        // Add to document
        document.body.appendChild(logContainer);
        
        // Set up event listeners
        document.getElementById('mkb-debug-clear').addEventListener('click', clearLog);
        document.getElementById('mkb-debug-close').addEventListener('click', toggleLogContainer);
        
        // Add keyboard shortcut to toggle log container (Ctrl+Shift+D)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                toggleLogContainer();
            }
        });
    }
    
    /**
     * Toggle log container visibility
     */
    function toggleLogContainer() {
        if (!logContainer) return;
        
        const isVisible = logContainer.style.display !== 'none';
        logContainer.style.display = isVisible ? 'none' : 'block';
    }
    
    /**
     * Clear log
     */
    function clearLog() {
        if (!logContainer) return;
        
        const content = document.getElementById('mkb-debug-content');
        if (content) {
            content.innerHTML = '';
        }
        
        logEntries.length = 0;
    }
    
    /**
     * Add log entry
     */
    function addLogEntry(message, type = 'info', data = null) {
        // Log to console
        if (config.logToConsole) {
            const consoleMethod = type === 'error' ? console.error : 
                                type === 'warning' ? console.warn : 
                                type === 'success' ? console.info : console.log;
            
            if (data) {
                consoleMethod(`[MKB_DEBUG] ${message}`, data);
            } else {
                consoleMethod(`[MKB_DEBUG] ${message}`);
            }
        }
        
        // Log to UI
        if (config.logToUI && logContainer) {
            const content = document.getElementById('mkb-debug-content');
            if (!content) return;
            
            // Create entry
            const entry = {
                timestamp: new Date(),
                message: message,
                type: type,
                data: data
            };
            
            // Add to log entries
            logEntries.push(entry);
            
            // Limit log entries to 100
            if (logEntries.length > 100) {
                logEntries.shift();
                content.firstChild && content.removeChild(content.firstChild);
            }
            
            // Create log entry element
            const entryEl = document.createElement('div');
            entryEl.className = `mkb-debug-entry ${type}`;
            entryEl.style.cssText = `
                margin-bottom: 5px;
                padding-bottom: 5px;
                border-bottom: 1px solid #333;
                color: ${type === 'error' ? '#ff5555' : 
                       type === 'warning' ? '#ffaa55' : 
                       type === 'success' ? '#55ff55' : '#ffffff'};
            `;
            
            // Create timestamp
            const timestamp = document.createElement('span');
            timestamp.className = 'mkb-debug-timestamp';
            timestamp.textContent = entry.timestamp.toISOString().substring(11, 19);
            timestamp.style.cssText = `
                color: #888;
                margin-right: 8px;
            `;
            
            // Create message
            const messageEl = document.createElement('span');
            messageEl.className = 'mkb-debug-message';
            messageEl.textContent = entry.message;
            
            // Add to entry
            entryEl.appendChild(timestamp);
            entryEl.appendChild(messageEl);
            
            // Add data if available
            if (data) {
                const dataEl = document.createElement('pre');
                dataEl.className = 'mkb-debug-data';
                dataEl.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data.toString();
                dataEl.style.cssText = `
                    margin-top: 5px;
                    margin-left: 20px;
                    padding: 5px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 3px;
                    white-space: pre-wrap;
                    font-size: 11px;
                    display: none;
                `;
                
                // Create toggle
                const toggle = document.createElement('span');
                toggle.className = 'mkb-debug-toggle';
                toggle.textContent = ' [+]';
                toggle.style.cssText = `
                    color: #888;
                    cursor: pointer;
                `;
                
                // Add toggle event
                toggle.addEventListener('click', function() {
                    const isVisible = dataEl.style.display !== 'none';
                    dataEl.style.display = isVisible ? 'none' : 'block';
                    toggle.textContent = isVisible ? ' [+]' : ' [-]';
                });
                
                messageEl.appendChild(toggle);
                entryEl.appendChild(dataEl);
            }
            
            // Add to content
            content.appendChild(entryEl);
            
            // Scroll to bottom
            content.scrollTop = content.scrollHeight;
        }
    }
    
    /**
     * Set up error handlers
     */
    function setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', function(event) {
            const error = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null
            };
            
            addLogEntry(`Error: ${error.message}`, 'error', error);
            
            // Don't prevent default error handling
            return false;
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(event) {
            const error = {
                message: event.reason?.message || 'Unhandled Promise rejection',
                stack: event.reason?.stack || null
            };
            
            addLogEntry(`Promise Error: ${error.message}`, 'error', error);
            
            // Don't prevent default error handling
            return false;
        });
    }
    
    /**
     * Expose debug methods
     */
    function exposeDebugMethods() {
        window.MKB_DEBUG = {
            log: function(message, data) {
                addLogEntry(message, 'info', data);
            },
            info: function(message, data) {
                addLogEntry(message, 'info', data);
            },
            success: function(message, data) {
                addLogEntry(message, 'success', data);
            },
            warn: function(message, data) {
                addLogEntry(message, 'warning', data);
            },
            error: function(message, data) {
                addLogEntry(message, 'error', data);
            },
            clear: clearLog,
            toggle: toggleLogContainer,
            getState: getBuilderState,
            inspect: inspectGlobalObjects,
            fix: applyFixes
        };
    }
    
    /**
     * Get builder state
     */
    function getBuilderState() {
        // Check if MediaKitBuilder is available
        if (!window.MediaKitBuilder) {
            addLogEntry('MediaKitBuilder not found', 'error');
            return null;
        }
        
        // Get builder state
        const state = {
            global: window.MediaKitBuilder.global || {},
            instance: window.MediaKitBuilder.global?.instance || null,
            adapter: window.wpAdapter || null,
            initialized: !!(window.MediaKitBuilder.global?.initialized)
        };
        
        addLogEntry('Builder state retrieved', 'info', state);
        return state;
    }
    
    /**
     * Inspect global objects
     */
    function inspectGlobalObjects() {
        // Check MediaKitBuilder
        const mkbState = {
            exists: typeof window.MediaKitBuilder !== 'undefined',
            isFunction: typeof window.MediaKitBuilder === 'function',
            hasInit: typeof window.MediaKitBuilder?.init === 'function',
            hasGlobal: typeof window.MediaKitBuilder?.global !== 'undefined',
            hasInstance: typeof window.MediaKitBuilder?.global?.instance !== 'undefined',
            instanceInitialized: !!(window.MediaKitBuilder?.global?.instance?.state?.initialized)
        };
        
        // Check WordPress adapter
        const wpState = {
            adapterExists: typeof window.wpAdapter !== 'undefined',
            builderAttached: !!(window.wpAdapter?.builder),
            builderInitialized: !!(window.wpAdapter?.builder?.state?.initialized),
            isInitialized: !!(window.wpAdapter?.isInitialized)
        };
        
        // Check jQuery
        const jQueryState = {
            exists: typeof jQuery !== 'undefined',
            version: jQuery?.fn?.jquery || 'unknown'
        };
        
        // Log results
        addLogEntry('Global object inspection', 'info', {
            MediaKitBuilder: mkbState,
            WordPressAdapter: wpState,
            jQuery: jQueryState,
            window: {
                mediaKitBuilder: typeof window.mediaKitBuilder !== 'undefined'
            }
        });
        
        // Check for issues
        if (!mkbState.exists) {
            addLogEntry('MediaKitBuilder not found in global scope', 'error');
        } else if (!mkbState.hasGlobal) {
            addLogEntry('MediaKitBuilder.global namespace not found', 'error');
        } else if (!mkbState.hasInstance) {
            addLogEntry('MediaKitBuilder.global.instance not found', 'error');
        } else if (!mkbState.instanceInitialized) {
            addLogEntry('MediaKitBuilder instance not initialized', 'warning');
        }
        
        if (!wpState.adapterExists) {
            addLogEntry('WordPress adapter not found', 'error');
        } else if (!wpState.builderAttached) {
            addLogEntry('Builder not attached to WordPress adapter', 'error');
        } else if (!wpState.isInitialized) {
            addLogEntry('WordPress adapter not initialized', 'warning');
        }
        
        return {
            MediaKitBuilder: mkbState,
            WordPressAdapter: wpState,
            jQuery: jQueryState
        };
    }
    
    /**
     * Apply fixes
     */
    function applyFixes() {
        addLogEntry('Applying fixes...', 'info');
        
        // Fix 1: Ensure MediaKitBuilder global namespace
        if (typeof window.MediaKitBuilder === 'undefined') {
            window.MediaKitBuilder = function() {};
            window.MediaKitBuilder.global = {};
            window.MediaKitBuilder.init = function() {
                console.log('MediaKitBuilder.init called (from fix)');
                if (window.MediaKitBuilder.global.instance) {
                    window.MediaKitBuilder.global.instance.init();
                }
            };
            addLogEntry('Created MediaKitBuilder global namespace', 'success');
        }
        
        // Fix 2: Create WordPress adapter if needed
        if (typeof window.wpAdapter === 'undefined' && typeof WordPressAdapter === 'function') {
            // Create default config
            const defaultConfig = {
                ajaxUrl: '/wp-admin/admin-ajax.php',
                debugMode: true
            };
            
            try {
                window.wpAdapter = new WordPressAdapter(defaultConfig);
                addLogEntry('Created WordPress adapter with default config', 'success');
            } catch (error) {
                addLogEntry('Failed to create WordPress adapter', 'error', error);
            }
        }
        
        // Fix 3: Try to initialize MediaKitBuilder
        if (typeof window.MediaKitBuilder.init === 'function') {
            try {
                window.MediaKitBuilder.init();
                addLogEntry('Called MediaKitBuilder.init()', 'success');
            } catch (error) {
                addLogEntry('Failed to call MediaKitBuilder.init()', 'error', error);
            }
        }
        
        // Re-inspect global objects
        setTimeout(inspectGlobalObjects, 500);
        
        return true;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
