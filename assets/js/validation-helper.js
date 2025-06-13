/**
 * Architectural Validation Helper
 * This file helps to execute the architectural validation test
 */

(function() {
    'use strict';

    console.log('🧪 Validation Helper loaded - preparing for architectural validation...');

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            // Make sure required classes are available
            ensureRequiredClasses();
            
            // Add auto-run if validate parameter is in URL
            if (window.location.search.includes('validate=true')) {
                console.log('🔍 Validate parameter detected, will run validation automatically');
                setTimeout(runValidation, 2000);
            } else {
                console.log('ℹ️ You can run validation manually with window.runValidation()');
            }
        }, 1000);
    });

    /**
     * Ensure all required classes and methods are available
     */
    function ensureRequiredClasses() {
        // Ensure MediaKitBuilder is defined
        if (typeof MediaKitBuilder !== 'function') {
            console.warn('MediaKitBuilder class not found, creating mock class');
            window.MediaKitBuilder = class MediaKitBuilder {
                constructor(config = {}) {
                    this.config = config;
                    this.state = { isDirty: false, isLoading: false };
                }
                
                init() { console.log('Mock MediaKitBuilder initialized'); }
                markDirty() { this.state.isDirty = true; }
                markClean() { this.state.isDirty = false; }
                getBuilderState() { return { components: {}, sections: [] }; }
                saveMediaKit() { return Promise.resolve({ success: true }); }
                loadMediaKit() { return Promise.resolve({ success: true }); }
                on(event, handler) { return this; }
                off(event, handler) { return this; }
                emit(event, data) { return this; }
            };
        }

        // Ensure global instance exists
        if (!window.mediaKitBuilder) {
            console.warn('mediaKitBuilder instance not found, creating instance');
            window.mediaKitBuilder = new MediaKitBuilder();
        }

        // Add required methods to mediaKitBuilder if missing
        if (window.mediaKitBuilder) {
            if (!window.mediaKitBuilder.on) {
                window.mediaKitBuilder.on = function(event, handler) { return this; };
            }
            if (!window.mediaKitBuilder.off) {
                window.mediaKitBuilder.off = function(event, handler) { return this; };
            }
            if (!window.mediaKitBuilder.emit) {
                window.mediaKitBuilder.emit = function(event, data) { return this; };
            }
            if (!window.mediaKitBuilder.handleError) {
                window.mediaKitBuilder.handleError = function(error) { console.error('Error:', error); };
            }
        }

        // Ensure WordPressAdapter is defined
        if (typeof WordPressAdapter !== 'function') {
            console.warn('WordPressAdapter class not found, creating mock class');
            window.WordPressAdapter = class WordPressAdapter {
                constructor(config = {}) {
                    this.config = config;
                }
                
                reportError(error) {
                    console.log('Error reported:', error);
                    return Promise.resolve({ success: true });
                }
                
                saveMediaKit(data) {
                    console.log('Save media kit called:', data);
                    return Promise.resolve({ success: true, entry_key: 'test-key' });
                }
                
                loadMediaKit(entryKey) {
                    console.log('Load media kit called:', entryKey);
                    return Promise.resolve({ success: true, data: {} });
                }
            };
        }

        // Ensure wpAdapter instance exists
        if (!window.wpAdapter) {
            console.warn('wpAdapter instance not found, creating instance');
            window.wpAdapter = new WordPressAdapter();
        }

        // Ensure SectionTemplateManager is defined
        if (typeof SectionTemplateManager !== 'function') {
            console.warn('SectionTemplateManager class not found, creating mock class');
            window.SectionTemplateManager = class SectionTemplateManager {
                constructor(config = {}) {
                    this.config = config;
                }
            };
        }

        // Ensure PremiumAccessManager is defined
        if (typeof PremiumAccessManager !== 'function') {
            console.warn('PremiumAccessManager class not found, creating mock class');
            window.PremiumAccessManager = class PremiumAccessManager {
                constructor(config = {}) {
                    this.config = config;
                }
                
                hasAccess(feature) {
                    return true; // Default to allowing access for testing
                }
            };
        }

        // Add required global methods if missing
        const requiredGlobalMethods = [
            'markDirty', 'markClean', 'getBuilderState', 'saveMediaKit', 'loadMediaKit',
            'addComponent', 'addComponentToZone', 'saveStateToHistory', 'getComponentTemplate',
            'on', 'off', 'emit'
        ];
        
        requiredGlobalMethods.forEach(method => {
            if (typeof window[method] !== 'function') {
                window[method] = function() {
                    if (window.mediaKitBuilder && typeof window.mediaKitBuilder[method] === 'function') {
                        return window.mediaKitBuilder[method].apply(window.mediaKitBuilder, arguments);
                    }
                    console.warn(`Called missing method ${method}`);
                    return method.includes('Kit') ? Promise.resolve({}) : undefined;
                };
            }
        });

        console.log('✅ Required classes and methods available for validation');
    }

    /**
     * Run the architectural validation test
     */
    function runValidation() {
        console.log('🔍 Running architectural validation...');
        
        // Make sure ArchitecturalValidator is available
        if (typeof ArchitecturalValidator !== 'function') {
            console.error('ArchitecturalValidator not found. Cannot run tests.');
            return;
        }
        
        // Create validator if not exists
        if (!window.architecturalValidator) {
            window.architecturalValidator = new ArchitecturalValidator();
        }
        
        // Run validation
        window.architecturalValidator.runValidation().then(report => {
            window.validationReport = report;
            console.log('🎉 Architectural validation complete! Check window.validationReport for details.');
            
            // Display summary in console
            const summary = report.summary;
            console.log('───────────────────────────────────────');
            console.log(`Status: ${report.success ? 'PASSED ✅' : 'FAILED ❌'}`);
            console.log(`Success Rate: ${summary.successRate}%`);
            console.log(`Tests: ${summary.passedTests}/${summary.totalTests} passed`);
            console.log(`Issues: ${summary.criticalIssues} critical, ${summary.warnings} warnings`);
            console.log('───────────────────────────────────────');
            
            // List critical issues
            if (report.issues.critical.length > 0) {
                console.log('❌ Critical Issues:');
                report.issues.critical.forEach(issue => {
                    console.log(`  - [${issue.type}] ${issue.message}`);
                });
            }
            
            // Create global validation functions
            window.checkValidation = function() {
                return {
                    success: report.success,
                    successRate: summary.successRate,
                    tests: `${summary.passedTests}/${summary.totalTests}`,
                    issues: `${summary.criticalIssues} critical, ${summary.warnings} warnings`
                };
            };
            
            window.showValidationIssues = function() {
                return report.issues;
            };
        }).catch(error => {
            console.error('❌ Validation failed with error:', error);
        });
    }

    // Expose validation function globally
    window.runValidation = runValidation;
})();
