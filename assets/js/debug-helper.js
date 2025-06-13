/**
 * Media Kit Builder - Debug Helper
 *
 * This script provides debugging tools to help troubleshoot issues with the Media Kit Builder.
 * It monitors initialization, catches errors, and provides a debugging interface.
 */

(function() {
    'use strict';

    console.log('📊 Media Kit Builder Debug Helper - Loading...');

    // Debug panel HTML
    const debugPanelHTML = `
        <div id="mkb-debug-panel" style="position: fixed; bottom: 0; right: 0; width: 350px; height: 30px; background: #2a2a2a; color: #0ea5e9; z-index: 99999; font-family: monospace; font-size: 12px; overflow: hidden; transition: height 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <div id="mkb-debug-header" style="padding: 5px 10px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                <div>Media Kit Builder Debug Console</div>
                <div id="mkb-debug-status">Initializing...</div>
            </div>
            <div id="mkb-debug-content" style="padding: 10px; height: calc(100% - 30px); overflow-y: auto;">
                <div id="mkb-debug-performance">
                    <h3>Initialization Stages</h3>
                    <div id="mkb-performance-metrics"></div>
                </div>
                <div id="mkb-debug-errors" style="margin-top: 15px;">
                    <h3>Errors (0)</h3>
                    <div id="mkb-error-list"></div>
                </div>
                <div id="mkb-debug-state" style="margin-top: 15px;">
                    <h3>Builder State</h3>
                    <div id="mkb-state-summary"></div>
                </div>
                <div id="mkb-debug-actions" style="margin-top: 15px;">
                    <h3>Debug Actions</h3>
                    <button id="mkb-debug-force-init" style="background: #0ea5e9; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Force Init</button>
                    <button id="mkb-debug-reload-scripts" style="background: #0ea5e9; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Reload Scripts</button>
                </div>
                <div id="mkb-debug-console" style="margin-top: 15px;">
                    <h3>Console</h3>
                    <div id="mkb-console-output" style="background: #1a1a1a; padding: 5px; height: 100px; overflow-y: auto; font-family: monospace; font-size: 11px; white-space: pre-wrap;"></div>
                </div>
            </div>
        </div>
    `;

    // Debug state
    const debugState = {
        errors: [],
        logs: [],
        initialized: false,
        performanceMetrics: {}
    };

    // Add debug panel to DOM
    function addDebugPanel() {
        // Check if debug panel already exists
        if (document.getElementById('mkb-debug-panel')) {
            return;
        }

        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.innerHTML = debugPanelHTML;
        document.body.appendChild(debugPanel.firstElementChild);

        // Setup toggle functionality
        const debugHeader = document.getElementById('mkb-debug-header');
        const debugPanel2 = document.getElementById('mkb-debug-panel');
        
        debugHeader.addEventListener('click', function() {
            const isExpanded = debugPanel2.style.height !== '30px';
            debugPanel2.style.height = isExpanded ? '30px' : '400px';
        });

        // Setup debug actions
        const forceInitButton = document.getElementById('mkb-debug-force-init');
        forceInitButton.addEventListener('click', function() {
            forceInitialization();
        });

        const reloadScriptsButton = document.getElementById('mkb-debug-reload-scripts');
        reloadScriptsButton.addEventListener('click', function() {
            reloadScripts();
        });

        // Update metrics initially
        updatePerformanceMetrics();
        updateErrorList();
        updateStateView();
    }

    // Force initialization
    function forceInitialization() {
        try {
            if (!window.MediaKitBuilder) {
                logToConsole('ERROR: MediaKitBuilder global object not available');
                return;
            }

            // Ensure initQueue is properly initialized
            if (!Array.isArray(window.MediaKitBuilder.initQueue)) {
                logToConsole('Fixing initQueue - it was not an array');
                window.MediaKitBuilder.initQueue = [];
            }
            
            // Check if global instance exists and is initialized
            const isInitialized = window.MediaKitBuilder.global && 
                window.MediaKitBuilder.global.instance && 
                window.MediaKitBuilder.global.instance.state && 
                window.MediaKitBuilder.global.instance.state.initialized;
            
            if (isInitialized) {
                logToConsole('Builder is already initialized, no action needed');
                return;
            }
            
            // Try initialization methods in order of preference
            if (window.MediaKitBuilder.emergencyInit) {
                logToConsole('Forcing initialization via MediaKitBuilder.emergencyInit()');
                window.MediaKitBuilder.emergencyInit();
            } else if (window.MediaKitBuilder.safeInit) {
                logToConsole('Forcing initialization via MediaKitBuilder.safeInit()');
                window.MediaKitBuilder.safeInit();
            } else if (window.MediaKitBuilder.init) {
                logToConsole('Forcing initialization via MediaKitBuilder.init()');
                window.MediaKitBuilder.init();
            } else {
                logToConsole('ERROR: No initialization methods available');
            }
        } catch (error) {
            logToConsole(`ERROR: Force initialization failed: ${error.message}`);
            console.error('Force initialization error:', error);
        }
    }

    // Reload scripts
    function reloadScripts() {
        try {
            logToConsole('Reloading MediaKitBuilder scripts...');
            
            // Get script paths from existing scripts
            const scriptPaths = [];
            document.querySelectorAll('script').forEach(script => {
                if (script.src && script.src.includes('media-kit-builder')) {
                    scriptPaths.push(script.src);
                }
            });
            
            // Remove existing scripts
            document.querySelectorAll('script').forEach(script => {
                if (script.src && script.src.includes('media-kit-builder')) {
                    script.remove();
                }
            });
            
            // Reload scripts in sequence
            function loadNextScript(index) {
                if (index >= scriptPaths.length) {
                    logToConsole('All scripts reloaded, attempting initialization');
                    setTimeout(forceInitialization, 500);
                    return;
                }
                
                const script = document.createElement('script');
                script.src = scriptPaths[index];
                script.onload = function() {
                    logToConsole(`Loaded script: ${scriptPaths[index]}`);
                    loadNextScript(index + 1);
                };
                script.onerror = function() {
                    logToConsole(`ERROR: Failed to load script: ${scriptPaths[index]}`);
                    loadNextScript(index + 1);
                };
                document.head.appendChild(script);
            }
            
            loadNextScript(0);
        } catch (error) {
            logToConsole(`ERROR: Script reload failed: ${error.message}`);
            console.error('Script reload error:', error);
        }
    }

    // Update performance metrics
    function updatePerformanceMetrics() {
        const metricsContainer = document.getElementById('mkb-performance-metrics');
        if (!metricsContainer) return;

        // Get performance metrics from MediaKitBuilder
        const metrics = window.MediaKitBuilder && window.MediaKitBuilder.performance ? 
            window.MediaKitBuilder.performance.stages : {};
        
        // Store metrics in debug state
        debugState.performanceMetrics = metrics;

        // Calculate times
        const startTime = window.MediaKitBuilder && window.MediaKitBuilder.performance ? 
            window.MediaKitBuilder.performance.loadStart : 0;
        
        let html = '';
        if (startTime) {
            Object.entries(metrics).forEach(([stage, timestamp]) => {
                if (timestamp) {
                    const timeDiff = timestamp - startTime;
                    html += `<div><span style="color: #94a3b8;">${stage}:</span> ${timeDiff}ms</div>`;
                }
            });
        } else {
            html = '<div style="color: #dc2626;">Performance metrics not available</div>';
        }

        metricsContainer.innerHTML = html;
    }

    // Update error list
    function updateErrorList() {
        const errorList = document.getElementById('mkb-error-list');
        const errorCount = document.querySelector('#mkb-debug-errors h3');
        if (!errorList || !errorCount) return;

        // Get errors from MediaKitBuilder
        let errors = [];
        if (window.MediaKitBuilder && window.MediaKitBuilder.errors) {
            errors = window.MediaKitBuilder.errors;
        } else if (window.MediaKitBuilder && window.MediaKitBuilder.global && 
                  window.MediaKitBuilder.global.instance && 
                  window.MediaKitBuilder.global.instance.state && 
                  window.MediaKitBuilder.global.instance.state.errors) {
            errors = window.MediaKitBuilder.global.instance.state.errors;
        }
        
        // Store errors in debug state
        debugState.errors = errors;

        // Update error count
        errorCount.textContent = `Errors (${errors.length})`;

        // Update error list
        if (errors.length === 0) {
            errorList.innerHTML = '<div style="color: #22c55e;">No errors detected</div>';
            return;
        }

        let html = '';
        errors.forEach((error, index) => {
            const message = error.message || (error.error ? error.error.message : 'Unknown error');
            const context = error.context || 'unknown';
            
            html += `
                <div style="margin-bottom: 10px; padding: 5px; background: #2a2a2a; border-left: 3px solid #dc2626;">
                    <div style="color: #dc2626; font-weight: bold;">${index + 1}. ${message}</div>
                    <div style="color: #94a3b8; font-size: 11px;">Context: ${context}</div>
                </div>
            `;
        });

        errorList.innerHTML = html;
    }

    // Update state view
    function updateStateView() {
        const stateView = document.getElementById('mkb-state-summary');
        if (!stateView) return;

        // Get state from MediaKitBuilder
        let state = {};
        if (window.MediaKitBuilder && window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            window.MediaKitBuilder.global.instance.state) {
            state = window.MediaKitBuilder.global.instance.state;
        }

        let html = '';
        if (Object.keys(state).length === 0) {
            html = '<div style="color: #dc2626;">Builder state not available</div>';
        } else {
            html += `
                <div><span style="color: #94a3b8;">Initialized:</span> ${state.initialized ? '✅' : '❌'}</div>
                <div><span style="color: #94a3b8;">Dirty:</span> ${state.isDirty ? '✅' : '❌'}</div>
                <div><span style="color: #94a3b8;">Loading:</span> ${state.isLoading ? '✅' : '❌'}</div>
                <div><span style="color: #94a3b8;">Has Selected Element:</span> ${state.selectedElement ? '✅' : '❌'}</div>
                <div><span style="color: #94a3b8;">Has Selected Section:</span> ${state.selectedSection ? '✅' : '❌'}</div>
                <div><span style="color: #94a3b8;">Undo Stack Size:</span> ${state.undoStack ? state.undoStack.length : 0}</div>
                <div><span style="color: #94a3b8;">Redo Stack Size:</span> ${state.redoStack ? state.redoStack.length : 0}</div>
            `;
        }

        stateView.innerHTML = html;
    }

    // Log to debug console
    function logToConsole(message) {
        const consoleOutput = document.getElementById('mkb-console-output');
        if (!consoleOutput) return;

        // Add timestamp
        const timestamp = new Date().toISOString().substring(11, 19);
        const logEntry = `[${timestamp}] ${message}`;
        
        // Store in debug state
        debugState.logs.push(logEntry);
        
        // Limit logs to 100 entries
        if (debugState.logs.length > 100) {
            debugState.logs.shift();
        }

        // Update console output
        consoleOutput.innerHTML = debugState.logs.join('\n');
        
        // Scroll to bottom
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Check initialization status
    function checkInitializationStatus() {
        // Check if MediaKitBuilder is initialized
        const isInitialized = window.MediaKitBuilder && 
            window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            window.MediaKitBuilder.global.instance.state && 
            window.MediaKitBuilder.global.instance.state.initialized;
        
        // Update status
        const statusElement = document.getElementById('mkb-debug-status');
        if (statusElement) {
            if (isInitialized) {
                statusElement.textContent = 'Initialized ✅';
                statusElement.style.color = '#22c55e';
            } else {
                statusElement.textContent = 'Not Initialized ❌';
                statusElement.style.color = '#dc2626';
            }
        }

        // Store in debug state
        debugState.initialized = isInitialized;

        return isInitialized;
    }

    // Update debug panel
    function updateDebugPanel() {
        checkInitializationStatus();
        updatePerformanceMetrics();
        updateErrorList();
        updateStateView();
    }

    // Initialize debug helper
    function initDebugHelper() {
        console.log('Initializing Media Kit Builder Debug Helper');
        
        // Add debug panel to DOM
        if (document.body) {
            addDebugPanel();
        } else {
            window.addEventListener('DOMContentLoaded', addDebugPanel);
        }

        // Setup periodic updates
        setInterval(updateDebugPanel, 1000);

        // Hook console methods to capture logs
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        console.log = function() {
            originalConsoleLog.apply(console, arguments);
            const message = Array.from(arguments).map(arg => {
                if (typeof arg === 'object') return JSON.stringify(arg);
                return arg;
            }).join(' ');
            
            if (message.includes('Media Kit Builder')) {
                logToConsole(message);
            }
        };

        console.error = function() {
            originalConsoleError.apply(console, arguments);
            const message = Array.from(arguments).map(arg => {
                if (typeof arg === 'object') return JSON.stringify(arg);
                return arg;
            }).join(' ');
            
            if (message.includes('Media Kit Builder')) {
                logToConsole(`ERROR: ${message}`);
            }
        };

        console.warn = function() {
            originalConsoleWarn.apply(console, arguments);
            const message = Array.from(arguments).map(arg => {
                if (typeof arg === 'object') return JSON.stringify(arg);
                return arg;
            }).join(' ');
            
            if (message.includes('Media Kit Builder')) {
                logToConsole(`WARNING: ${message}`);
            }
        };

        // Log initialization
        logToConsole('Media Kit Builder Debug Helper initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugHelper);
    } else {
        initDebugHelper();
    }

    console.log('📊 Media Kit Builder Debug Helper - Loaded');
})();
