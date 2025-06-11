/**
 * Media Kit Builder Debug Script
 * This script helps diagnose issues with the Media Kit Builder plugin
 */

// Create a global debug namespace
window.MKBDebug = {
    version: '1.0.0',
    log: [],
    initialized: false
};

/**
 * Initialize debugging tools
 */
function initDebugTools() {
    console.log('🛠️ Initializing Media Kit Builder Debug Tools...');
    
    // Ensure we only initialize once
    if (window.MKBDebug.initialized) {
        console.log('Debug tools already initialized');
        return;
    }
    
    // Store original console methods to enable logging while preserving them
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    // Enhance console methods to add debug log tracking
    console.log = function(...args) {
        window.MKBDebug.log.push({
            type: 'log',
            timestamp: new Date().toISOString(),
            message: args
        });
        originalConsole.log.apply(console, args);
    };
    
    console.error = function(...args) {
        window.MKBDebug.log.push({
            type: 'error',
            timestamp: new Date().toISOString(),
            message: args
        });
        originalConsole.error.apply(console, args);
    };
    
    console.warn = function(...args) {
        window.MKBDebug.log.push({
            type: 'warn',
            timestamp: new Date().toISOString(),
            message: args
        });
        originalConsole.warn.apply(console, args);
    };
    
    console.info = function(...args) {
        window.MKBDebug.log.push({
            type: 'info',
            timestamp: new Date().toISOString(),
            message: args
        });
        originalConsole.info.apply(console, args);
    };
    
    // Add fetch debugging
    enhanceFetch();
    
    // Track script loading issues
    trackScriptLoading();
    
    // Setup error tracking
    window.addEventListener('error', function(event) {
        window.MKBDebug.log.push({
            type: 'global-error',
            timestamp: new Date().toISOString(),
            message: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
        });
        console.error(`Global error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
    });
    
    // Setup promise rejection tracking
    window.addEventListener('unhandledrejection', function(event) {
        window.MKBDebug.log.push({
            type: 'promise-rejection',
            timestamp: new Date().toISOString(),
            message: event.reason
        });
        console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Add debug methods
    window.MKBDebug.getSystemInfo = getSystemInfo;
    window.MKBDebug.testAjax = testAjax;
    window.MKBDebug.checkDependencies = checkDependencies;
    window.MKBDebug.dumpLog = dumpLog;
    window.MKBDebug.inspectScripts = inspectScripts;
    window.MKBDebug.testNonce = testNonce;
    window.MKBDebug.fixNonceIssue = fixNonceIssue;
    window.MKBDebug.fixPremiumHandler = fixPremiumHandler;
    
    // Mark as initialized
    window.MKBDebug.initialized = true;
    console.log('✅ Media Kit Builder Debug Tools initialized');
    
    // Run initial diagnostics
    console.info('Running initial diagnostics...');
    getSystemInfo();
    checkDependencies();
    testNonce();
}

/**
 * Enhance fetch API with debug logging
 */
function enhanceFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const startTime = new Date().getTime();
        const url = args[0];
        const options = args[1] || {};
        
        console.log(`🌐 Fetch request to ${typeof url === 'object' ? url.url : url}`, options);
        window.MKBDebug.log.push({
            type: 'fetch-start',
            timestamp: new Date().toISOString(),
            url: typeof url === 'object' ? url.url : url,
            options: options
        });
        
        return originalFetch.apply(this, args)
            .then(response => {
                const endTime = new Date().getTime();
                const duration = endTime - startTime;
                
                console.log(`✅ Fetch response from ${typeof url === 'object' ? url.url : url} (${duration}ms)`, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Array.from(response.headers.entries())
                });
                
                window.MKBDebug.log.push({
                    type: 'fetch-success',
                    timestamp: new Date().toISOString(),
                    url: typeof url === 'object' ? url.url : url,
                    status: response.status,
                    statusText: response.statusText,
                    duration: duration
                });
                
                // Clone the response so we can still use it in the chain
                const clonedResponse = response.clone();
                
                // Try to parse and log the response body if it's JSON
                clonedResponse.json()
                    .then(data => {
                        console.log(`📄 JSON response from ${typeof url === 'object' ? url.url : url}:`, data);
                        window.MKBDebug.log.push({
                            type: 'fetch-body',
                            timestamp: new Date().toISOString(),
                            url: typeof url === 'object' ? url.url : url,
                            body: data
                        });
                    })
                    .catch(e => {
                        // Not JSON, that's fine, just don't log body
                        console.log(`📄 Non-JSON response from ${typeof url === 'object' ? url.url : url}`);
                    });
                
                return response;
            })
            .catch(error => {
                const endTime = new Date().getTime();
                const duration = endTime - startTime;
                
                console.error(`❌ Fetch error for ${typeof url === 'object' ? url.url : url} (${duration}ms):`, error);
                window.MKBDebug.log.push({
                    type: 'fetch-error',
                    timestamp: new Date().toISOString(),
                    url: typeof url === 'object' ? url.url : url,
                    error: error.toString(),
                    duration: duration
                });
                
                throw error;
            });
    };
    
    console.log('✅ Fetch API enhanced with debug logging');
}

/**
 * Track script loading issues
 */
function trackScriptLoading() {
    // Track script errors
    document.addEventListener('error', function(event) {
        if (event.target.tagName === 'SCRIPT') {
            window.MKBDebug.log.push({
                type: 'script-error',
                timestamp: new Date().toISOString(),
                src: event.target.src,
                message: 'Failed to load script'
            });
            console.error(`❌ Failed to load script: ${event.target.src}`);
        }
    }, true);
    
    // Monkey patch script creation to add load/error handlers
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            element.addEventListener('load', function() {
                window.MKBDebug.log.push({
                    type: 'script-load',
                    timestamp: new Date().toISOString(),
                    src: this.src,
                    message: 'Script loaded successfully'
                });
                console.log(`✅ Script loaded: ${this.src}`);
            });
            
            element.addEventListener('error', function() {
                window.MKBDebug.log.push({
                    type: 'script-error',
                    timestamp: new Date().toISOString(),
                    src: this.src,
                    message: 'Failed to load script'
                });
                console.error(`❌ Failed to load script: ${this.src}`);
            });
        }
        
        return element;
    };
    
    console.log('✅ Script loading tracking enabled');
}

/**
 * Get system information for debugging
 */
function getSystemInfo() {
    const info = {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer
    };
    
    // Get information from Media Kit Builder
    if (window.MediaKitBuilder) {
        info.MediaKitBuilder = {
            version: window.MediaKitBuilder.version || 'unknown',
            config: {...window.MediaKitBuilder.config} || {},
            fieldMappingsCount: window.MediaKitBuilder.fieldMappings ? 
                Object.keys(window.MediaKitBuilder.fieldMappings).length : 0
        };
        
        // Remove sensitive data
        if (info.MediaKitBuilder.config && info.MediaKitBuilder.config.nonce) {
            info.MediaKitBuilder.config.nonce = '***redacted***';
        }
    }
    
    // Get information about premium access
    if (window.premiumAccess) {
        info.premiumAccess = {
            initialized: window.premiumAccess.initialized || false,
            userTier: window.premiumAccess.userTier || 'unknown',
            observerActive: window.premiumAccess.observerActive || false,
            handlerSetupInProgress: window.premiumAccess.handlerSetupInProgress || false
        };
    }
    
    // Get information about section templates
    if (window.sectionTemplates) {
        info.sectionTemplates = {
            count: Object.keys(window.sectionTemplates).length,
            types: [...new Set(Object.values(window.sectionTemplates).map(t => t.type))]
        };
    }
    
    // Check for error overlay
    const hasErrorOverlay = !!document.querySelector('.error-overlay, .error-message');
    if (hasErrorOverlay) {
        info.hasErrorOverlay = true;
        info.errorMessage = document.querySelector('.error-overlay, .error-message').textContent;
    }
    
    // Log system info
    window.MKBDebug.systemInfo = info;
    console.info('System Info:', info);
    
    return info;
}

/**
 * Test AJAX functionality
 */
async function testAjax() {
    console.log('🔄 Testing AJAX functionality...');
    
    // Get nonce for test
    const nonce = getNonce();
    
    // Get AJAX URL
    const ajaxUrl = window.MediaKitBuilder?.config?.ajaxUrl || 
                   window.ajaxurl || 
                   '/wp-admin/admin-ajax.php';
    
    console.log(`Using AJAX URL: ${ajaxUrl}`);
    console.log(`Using nonce: ${nonce ? 'Found' : 'Not found'}`);
    
    // Create test data
    const testData = new FormData();
    testData.append('action', 'mkb_test_ajax');
    testData.append('nonce', nonce);
    testData.append('test_data', 'This is a test');
    
    try {
        // Make test request
        const response = await fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: testData
        });
        
        // Check response
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        // Parse response
        const result = await response.json();
        
        console.log('AJAX test result:', result);
        
        // Test result
        if (result.success) {
            console.log('✅ AJAX test successful');
            return {
                success: true,
                message: 'AJAX test successful',
                result: result
            };
        } else {
            console.warn('⚠️ AJAX test returned success: false');
            return {
                success: false,
                message: result.data?.message || 'AJAX test failed',
                result: result
            };
        }
    } catch (error) {
        console.error('❌ AJAX test failed:', error);
        return {
            success: false,
            message: `AJAX test failed: ${error.message}`,
            error: error
        };
    }
}

/**
 * Check for required dependencies
 */
function checkDependencies() {
    console.log('🔍 Checking for required dependencies...');
    
    const dependencies = {
        MediaKitBuilder: {
            present: typeof window.MediaKitBuilder !== 'undefined',
            config: window.MediaKitBuilder?.config ? true : false,
            nonce: window.MediaKitBuilder?.config?.nonce ? true : false
        },
        PremiumAccess: {
            present: typeof window.premiumAccess !== 'undefined',
            initialized: window.premiumAccess?.initialized || false,
            handlers: typeof window.setupPremiumComponentHandlers === 'function'
        },
        SectionTemplates: {
            present: typeof window.sectionTemplates !== 'undefined',
            showModal: typeof window.showAddSectionModal === 'function',
            insertTemplate: typeof window.insertSectionTemplate === 'function'
        },
        Builder: {
            addComponent: typeof window.addComponent === 'function',
            getComponentTemplate: typeof window.getComponentTemplate === 'function',
            save: typeof window.save === 'function',
            loadMediaKitData: typeof window.loadMediaKitData === 'function'
        },
        AjaxFunctions: {
            present: document.querySelector('script[src*="ajax-functions.js"]') !== null
        }
    };
    
    // Check for nonce element
    dependencies.NonceElement = {
        present: document.getElementById('media_kit_builder_nonce') !== null,
        value: document.getElementById('media_kit_builder_nonce')?.value ? true : false
    };
    
    // Determine overall status
    const criticalIssues = [];
    
    if (!dependencies.MediaKitBuilder.present) {
        criticalIssues.push('MediaKitBuilder object missing');
    }
    if (!dependencies.MediaKitBuilder.nonce && !dependencies.NonceElement.value) {
        criticalIssues.push('No nonce available - AJAX operations will fail');
    }
    if (!dependencies.Builder.save || !dependencies.Builder.loadMediaKitData) {
        criticalIssues.push('Core builder functions missing');
    }
    
    // Log results
    console.log('Dependency check results:', dependencies);
    
    if (criticalIssues.length > 0) {
        console.error('❌ Critical issues found:', criticalIssues);
    } else {
        console.log('✅ All critical dependencies present');
    }
    
    window.MKBDebug.dependencies = dependencies;
    window.MKBDebug.criticalIssues = criticalIssues;
    
    return {
        dependencies,
        criticalIssues
    };
}

/**
 * Dump debug log to console
 */
function dumpLog() {
    console.log('📋 Debug log entries:', window.MKBDebug.log.length);
    
    // Count by type
    const counts = {};
    window.MKBDebug.log.forEach(entry => {
        counts[entry.type] = (counts[entry.type] || 0) + 1;
    });
    
    console.log('Log entry types:', counts);
    
    // Show errors and warnings
    const errors = window.MKBDebug.log.filter(entry => entry.type.includes('error'));
    const warnings = window.MKBDebug.log.filter(entry => entry.type === 'warn');
    
    if (errors.length > 0) {
        console.log(`❌ Errors (${errors.length}):`, errors);
    }
    if (warnings.length > 0) {
        console.log(`⚠️ Warnings (${warnings.length}):`, warnings);
    }
    
    return {
        totalEntries: window.MKBDebug.log.length,
        counts,
        errors,
        warnings
    };
}

/**
 * Inspect loaded scripts
 */
function inspectScripts() {
    console.log('📜 Inspecting loaded scripts...');
    
    const scripts = Array.from(document.querySelectorAll('script'));
    
    const scriptInfo = scripts.map(script => ({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
        loaded: script.complete,
        crossOrigin: script.crossOrigin,
        size: script.innerHTML?.length || 0
    }));
    
    // Filter out scripts that are likely from core WordPress
    const coreScripts = scriptInfo.filter(script => script.src.includes('/wp-includes/'));
    const pluginScripts = scriptInfo.filter(script => script.src.includes('/plugins/'));
    const mediaKitScripts = scriptInfo.filter(script => script.src.includes('media-kit-builder') || script.src.includes('KitBuilder'));
    const otherScripts = scriptInfo.filter(script => 
        !script.src.includes('/wp-includes/') && 
        !script.src.includes('/plugins/') &&
        !script.src.includes('media-kit-builder') &&
        !script.src.includes('KitBuilder')
    );
    
    console.log(`Found ${scripts.length} total scripts:`);
    console.log(`- ${coreScripts.length} WordPress core scripts`);
    console.log(`- ${pluginScripts.length} plugin scripts`);
    console.log(`- ${mediaKitScripts.length} Media Kit Builder scripts`);
    console.log(`- ${otherScripts.length} other scripts`);
    
    console.log('Media Kit Builder scripts:', mediaKitScripts);
    
    // Check for key scripts
    const keySrcs = [
        'builder-wordpress.js',
        'premium-access-control.js',
        'section-templates.js',
        'ajax-functions.js'
    ];
    
    const keyScripts = {};
    keySrcs.forEach(src => {
        const script = scripts.find(s => s.src.includes(src));
        keyScripts[src] = script ? true : false;
    });
    
    console.log('Key scripts loaded:', keyScripts);
    
    return {
        totalScripts: scripts.length,
        mediaKitScripts,
        keyScripts
    };
}

/**
 * Get nonce from available sources
 */
function getNonce() {
    // Try multiple sources
    const sources = [
        // MediaKitBuilder config
        window.MediaKitBuilder?.config?.nonce,
        
        // Hidden field
        document.getElementById('media_kit_builder_nonce')?.value,
        
        // WP Nonce field
        document.querySelector('[name="_wpnonce"]')?.value,
        
        // Data attribute
        document.querySelector('[data-nonce]')?.getAttribute('data-nonce')
    ];
    
    // Return first valid nonce found
    for (const source of sources) {
        if (source) {
            return source;
        }
    }
    
    return '';
}

/**
 * Test if nonce is working properly
 */
async function testNonce() {
    console.log('🔑 Testing nonce functionality...');
    
    // Get nonce from available sources
    const nonce = getNonce();
    
    if (!nonce) {
        console.error('❌ No nonce found, AJAX operations will fail');
        return {
            success: false,
            message: 'No nonce found'
        };
    }
    
    console.log(`Found nonce: ${nonce.substring(0, 4)}...`);
    
    // Check if nonce field exists in the DOM
    const nonceField = document.getElementById('media_kit_builder_nonce');
    console.log(`Nonce field exists in DOM: ${nonceField ? 'Yes' : 'No'}`);
    
    // Check if MediaKitBuilder config has nonce
    const configNonce = window.MediaKitBuilder?.config?.nonce;
    console.log(`MediaKitBuilder config has nonce: ${configNonce ? 'Yes' : 'No'}`);
    
    // If we have both, check if they match
    if (nonceField && configNonce) {
        const match = nonceField.value === configNonce;
        console.log(`Nonce values match: ${match ? 'Yes' : 'No'}`);
        
        if (!match) {
            console.warn('⚠️ Nonce values do not match, this may cause issues');
        }
    }
    
    // Test nonce with server
    try {
        // Prepare test data
        const testData = new FormData();
        testData.append('action', 'mkb_verify_nonce');
        testData.append('nonce', nonce);
        
        // Get AJAX URL
        const ajaxUrl = window.MediaKitBuilder?.config?.ajaxUrl || 
                       window.ajaxurl || 
                       '/wp-admin/admin-ajax.php';
        
        // Make test request
        const response = await fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: testData
        });
        
        // Parse response
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Nonce verification successful');
            return {
                success: true,
                message: 'Nonce verification successful',
                result: result
            };
        } else {
            console.warn('⚠️ Nonce verification failed:', result.data?.message);
            return {
                success: false,
                message: result.data?.message || 'Nonce verification failed',
                result: result
            };
        }
    } catch (error) {
        console.error('❌ Nonce verification test failed:', error);
        
        // If fetch or server error, assume nonce verification endpoint not available
        // In this case, we'll just check if the nonce exists
        return {
            success: !!nonce,
            message: `Nonce verification endpoint not available, nonce exists: ${!!nonce}`,
            error: error.message
        };
    }
}

/**
 * Fix nonce issue by adding or updating nonce field
 */
function fixNonceIssue() {
    console.log('🔧 Attempting to fix nonce issue...');
    
    // Check if MediaKitBuilder config has nonce
    const configNonce = window.MediaKitBuilder?.config?.nonce;
    
    if (!configNonce) {
        console.warn('⚠️ MediaKitBuilder.config.nonce is missing');
        
        // Try to get nonce from field
        const nonceField = document.getElementById('media_kit_builder_nonce');
        if (nonceField && nonceField.value) {
            console.log('Found nonce in DOM field, adding to MediaKitBuilder.config');
            
            // Initialize config if needed
            if (!window.MediaKitBuilder) {
                window.MediaKitBuilder = {};
            }
            if (!window.MediaKitBuilder.config) {
                window.MediaKitBuilder.config = {};
            }
            
            // Add nonce to config
            window.MediaKitBuilder.config.nonce = nonceField.value;
            console.log('✅ Added nonce to MediaKitBuilder.config');
        } else {
            console.error('❌ No nonce found in DOM field, cannot fix issue');
            
            // Create nonce field as last resort
            if (!nonceField) {
                console.log('Creating nonce field as last resort');
                const newNonce = 'mkb_' + Math.random().toString(36).substring(2, 15);
                
                const newField = document.createElement('input');
                newField.type = 'hidden';
                newField.id = 'media_kit_builder_nonce';
                newField.value = newNonce;
                document.body.appendChild(newField);
                
                // Add to config
                if (!window.MediaKitBuilder) {
                    window.MediaKitBuilder = {};
                }
                if (!window.MediaKitBuilder.config) {
                    window.MediaKitBuilder.config = {};
                }
                
                window.MediaKitBuilder.config.nonce = newNonce;
                console.log('⚠️ Created new nonce as last resort, but this may not work with server validation');
            }
        }
    } else {
        // Check if field exists
        let nonceField = document.getElementById('media_kit_builder_nonce');
        
        if (!nonceField) {
            console.log('Config has nonce but field is missing, creating field');
            
            // Create field
            nonceField = document.createElement('input');
            nonceField.type = 'hidden';
            nonceField.id = 'media_kit_builder_nonce';
            nonceField.value = configNonce;
            document.body.appendChild(nonceField);
            
            console.log('✅ Created nonce field with value from config');
        } else if (nonceField.value !== configNonce) {
            console.log('Nonce field exists but value doesn\'t match config, updating field');
            nonceField.value = configNonce;
            console.log('✅ Updated nonce field to match config');
        } else {
            console.log('✅ Nonce field exists and matches config, no fix needed');
        }
    }
    
    return {
        success: true,
        message: 'Attempted to fix nonce issue'
    };
}

/**
 * Fix premium handler issues
 */
function fixPremiumHandler() {
    console.log('🔧 Attempting to fix premium component handler...');
    
    // Check if premium access object exists
    if (!window.premiumAccess) {
        console.log('Creating premiumAccess object');
        window.premiumAccess = {
            initialized: false,
            userTier: 'guest',
            features: {},
            config: {},
            handlerSetupInProgress: false,
            pauseObserver: false,
            observerActive: false,
            observer: null
        };
    }
    
    // Define feature access tiers if needed
    if (!window.premiumAccess.features || Object.keys(window.premiumAccess.features).length === 0) {
        window.premiumAccess.features = {
            guest: {
                premiumTemplates: false,
                premiumComponents: false
            },
            free: {
                premiumTemplates: false,
                premiumComponents: false
            },
            pro: {
                premiumTemplates: true,
                premiumComponents: true
            },
            agency: {
                premiumTemplates: true,
                premiumComponents: true
            },
            admin: {
                premiumTemplates: true,
                premiumComponents: true
            }
        };
    }
    
    // Set user tier from MediaKitBuilder if available
    if (window.MediaKitBuilder && window.MediaKitBuilder.config && window.MediaKitBuilder.config.accessTier) {
        window.premiumAccess.userTier = window.MediaKitBuilder.config.accessTier;
    }
    
    // Create hasAccess function if needed
    if (typeof window.premiumAccess.hasAccess !== 'function') {
        window.premiumAccess.hasAccess = function(featureName) {
            const userTier = window.premiumAccess.userTier;
            const features = window.premiumAccess.features[userTier];
            
            if (!features) {
                console.warn(`Unknown user tier: ${userTier}`);
                return false;
            }
            
            return features[featureName] === true;
        };
    }
    
    // Create showUpgradePrompt function if needed
    if (typeof window.premiumAccess.showUpgradePrompt !== 'function') {
        window.premiumAccess.showUpgradePrompt = function(featureName) {
            alert(`This is a premium feature (${featureName}). Please upgrade to access it.`);
        };
    }
    
    // Create basic handler setup function if needed
    if (typeof window.setupPremiumComponentHandlers !== 'function') {
        window.setupPremiumComponentHandlers = function() {
            console.log('Setting up premium component handlers (fixed version)');
            
            // Find all premium components
            const premiumComponents = document.querySelectorAll('.component-item.premium');
            
            premiumComponents.forEach(component => {
                // Remove any existing handlers
                const newComponent = component.cloneNode(true);
                if (component.parentNode) {
                    component.parentNode.replaceChild(newComponent, component);
                }
                
                // Add new handler
                newComponent.addEventListener('click', function(e) {
                    if (!window.premiumAccess.hasAccess('premiumComponents')) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.premiumAccess.showUpgradePrompt('premium component');
                        return false;
                    }
                });
                
                // Also prevent dragging
                newComponent.addEventListener('dragstart', function(e) {
                    if (!window.premiumAccess.hasAccess('premiumComponents')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                });
                
                // Update visual state
                if (!window.premiumAccess.hasAccess('premiumComponents')) {
                    newComponent.setAttribute('draggable', 'false');
                    newComponent.classList.add('restricted');
                }
            });
            
            console.log(`Fixed handlers for ${premiumComponents.length} premium components`);
            window.premiumAccess.initialized = true;
            
            return true;
        };
    }
    
    // Run the handler setup
    if (typeof window.setupPremiumComponentHandlers === 'function') {
        const result = window.setupPremiumComponentHandlers();
        console.log('✅ Premium component handler setup result:', result);
    }
    
    return {
        success: true,
        message: 'Attempted to fix premium component handler'
    };
}

// Initialize debug tools when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugTools);
} else {
    initDebugTools();
}

// Export to global scope for console access
window.MKBDebugInit = initDebugTools;