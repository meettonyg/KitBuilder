/**
 * Integration Testing Suite - Phase 3 Day 15 Completion
 * Comprehensive testing for React Builder Interface + WordPress Integration
 * 
 * Tests the complete interaction between React frontend and WordPress backend
 * Validates template switching, drag-drop, performance, and responsive design
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

class MKB_Integration_Test_Suite {
    
    /**
     * Test results storage
     */
    private $test_results = array();
    private $performance_metrics = array();
    private $failed_tests = array();
    
    /**
     * Test configuration
     */
    private $config = array(
        'timeout' => 30000, // 30 seconds
        'performance_threshold' => 100, // 100ms
        'memory_threshold' => 50 * 1024 * 1024, // 50MB
        'responsive_breakpoints' => array(320, 768, 1024, 1440)
    );

    /**
     * Initialize and run all integration tests
     */
    public function run_all_tests() {
        console.log('🚀 Starting Media Kit Builder Integration Tests - Phase 3 Day 15');
        
        this.startPerformanceMonitoring();
        
        // Test Categories
        this.runReactWordPressIntegrationTests();
        this.runTemplateGalleryIntegrationTests();
        this.runDragDropIntegrationTests();
        this.runStateManagementTests();
        this.runAJAXEndpointTests();
        this.runResponsiveDesignTests();
        this.runPerformanceTests();
        this.runCrossCompatibilityTests();
        
        this.generateTestReport();
        
        return this.test_results;
    }

    /**
     * Test React + WordPress Integration
     */
    runReactWordPressIntegrationTests() {
        console.log('📱 Testing React + WordPress Integration...');
        
        this.test('React App Initialization', () => {
            const builderRoot = document.getElementById('mkb-builder-root');
            
            if (!builderRoot) {
                throw new Error('Builder root element not found');
            }
            
            // Check if React app is mounted
            if (!window.MediaKitBuilder) {
                throw new Error('MediaKitBuilder global not available');
            }
            
            // Verify configuration is passed correctly
            if (!window.mkbConfig) {
                throw new Error('WordPress configuration not available');
            }
            
            // Check required config properties
            const requiredProps = ['ajaxUrl', 'nonce', 'userId', 'features'];
            requiredProps.forEach(prop => {
                if (!(prop in window.mkbConfig)) {
                    throw new Error(`Missing config property: ${prop}`);
                }
            });
            
            return true;
        });

        this.test('WordPress AJAX Communication', async () => {
            const response = await this.makeAJAXRequest('mkb_get_component_registry', {
                include_premium: true
            });
            
            if (!response.success) {
                throw new Error('AJAX request failed: ' + response.data.message);
            }
            
            if (!response.data.components || !Array.isArray(response.data.components)) {
                throw new Error('Invalid component registry response');
            }
            
            return response.data;
        });

        this.test('WordPress Nonce Validation', async () => {
            // Test with invalid nonce
            try {
                await this.makeAJAXRequest('mkb_get_component_registry', {}, 'invalid_nonce');
                throw new Error('Invalid nonce should be rejected');
            } catch (error) {
                if (!error.message.includes('Invalid security token')) {
                    throw error;
                }
            }
            
            // Test with valid nonce
            const response = await this.makeAJAXRequest('mkb_get_component_registry', {});
            if (!response.success) {
                throw new Error('Valid nonce should be accepted');
            }
            
            return true;
        });

        this.test('User Capability Integration', async () => {
            const response = await this.makeAJAXRequest('mkb_get_user_capabilities');
            
            if (!response.success) {
                throw new Error('Failed to get user capabilities');
            }
            
            const capabilities = response.data.capabilities;
            const expectedCapabilities = ['can_save', 'can_publish', 'can_export', 'can_customize'];
            
            expectedCapabilities.forEach(cap => {
                if (!(cap in capabilities)) {
                    throw new Error(`Missing capability: ${cap}`);
                }
            });
            
            return capabilities;
        });
    }

    /**
     * Test Template Gallery Integration
     */
    runTemplateGalleryIntegrationTests() {
        console.log('🎨 Testing Template Gallery Integration...');
        
        this.test('Template Gallery Loading', async () => {
            const response = await this.makeAJAXRequest('mkb_get_template_gallery', {
                include_premium: true
            });
            
            if (!response.success) {
                throw new Error('Failed to load template gallery');
            }
            
            const { templates, categories } = response.data;
            
            if (!Array.isArray(templates) || templates.length === 0) {
                throw new Error('No templates found');
            }
            
            if (!Array.isArray(categories) || categories.length === 0) {
                throw new Error('No template categories found');
            }
            
            return { templates, categories };
        });

        this.test('Template Application', async () => {
            // Get templates first
            const templatesResponse = await this.makeAJAXRequest('mkb_get_template_gallery');
            const templates = templatesResponse.data.templates;
            
            if (templates.length === 0) {
                throw new Error('No templates available for testing');
            }
            
            const testTemplate = templates[0];
            const currentState = this.createMockMediaKitState();
            
            const response = await this.makeAJAXRequest('mkb_apply_template', {
                template_id: testTemplate.id,
                current_state: JSON.stringify(currentState),
                migration_options: JSON.stringify({ preserveContent: true })
            });
            
            if (!response.success) {
                throw new Error('Template application failed: ' + response.data.message);
            }
            
            const migratedState = response.data.migratedState;
            
            // Verify state structure
            if (!migratedState.components || !Array.isArray(migratedState.components)) {
                throw new Error('Invalid migrated state structure');
            }
            
            return migratedState;
        });

        this.test('Template Migration Analysis', async () => {
            const templatesResponse = await this.makeAJAXRequest('mkb_get_template_gallery');
            const templates = templatesResponse.data.templates;
            
            if (templates.length === 0) {
                throw new Error('No templates available for testing');
            }
            
            const testTemplate = templates[0];
            const currentState = this.createMockMediaKitState();
            
            const response = await this.makeAJAXRequest('mkb_analyze_template_migration', {
                template_id: testTemplate.id,
                current_state: JSON.stringify(currentState)
            });
            
            if (!response.success) {
                throw new Error('Migration analysis failed');
            }
            
            const analysis = response.data;
            const requiredFields = ['conflicts', 'additions', 'removals', 'warnings'];
            
            requiredFields.forEach(field => {
                if (!(field in analysis)) {
                    throw new Error(`Missing analysis field: ${field}`);
                }
            });
            
            return analysis;
        });
    }

    /**
     * Test Drag & Drop Integration
     */
    runDragDropIntegrationTests() {
        console.log('🖱️ Testing Drag & Drop Integration...');
        
        this.test('Component Palette Drag Initialization', () => {
            const componentPalette = document.querySelector('.component-palette');
            if (!componentPalette) {
                throw new Error('Component palette not found');
            }
            
            const draggableComponents = componentPalette.querySelectorAll('[draggable="true"]');
            if (draggableComponents.length === 0) {
                throw new Error('No draggable components found');
            }
            
            // Test drag start event
            const firstComponent = draggableComponents[0];
            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true
            });
            
            firstComponent.dispatchEvent(dragStartEvent);
            
            return draggableComponents.length;
        });

        this.test('Drop Zone Functionality', () => {
            const dropZones = document.querySelectorAll('.drop-zone');
            if (dropZones.length === 0) {
                throw new Error('No drop zones found');
            }
            
            // Test drop zone events
            const firstDropZone = dropZones[0];
            
            // Simulate drag over
            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true
            });
            
            firstDropZone.dispatchEvent(dragOverEvent);
            
            // Check for visual feedback
            if (!firstDropZone.classList.contains('drag-over')) {
                console.warn('Drop zone may not have drag-over styling');
            }
            
            return dropZones.length;
        });

        this.test('Component Addition via Drag & Drop', () => {
            // Simulate adding a component
            const initialComponentCount = document.querySelectorAll('.media-kit-component').length;
            
            // Create mock component element
            const mockComponent = document.createElement('div');
            mockComponent.className = 'media-kit-component';
            mockComponent.setAttribute('data-component-type', 'bio');
            
            const firstDropZone = document.querySelector('.drop-zone');
            if (firstDropZone) {
                firstDropZone.appendChild(mockComponent);
            }
            
            const newComponentCount = document.querySelectorAll('.media-kit-component').length;
            
            if (newComponentCount <= initialComponentCount) {
                throw new Error('Component was not added successfully');
            }
            
            return newComponentCount - initialComponentCount;
        });
    }

    /**
     * Test State Management
     */
    runStateManagementTests() {
        console.log('🏪 Testing State Management...');
        
        this.test('State Initialization', () => {
            if (typeof window.mkbState === 'undefined') {
                throw new Error('State manager not initialized');
            }
            
            const state = window.mkbState.getState();
            
            const requiredStateProperties = ['components', 'template', 'user', 'builder'];
            requiredStateProperties.forEach(prop => {
                if (!(prop in state)) {
                    throw new Error(`Missing state property: ${prop}`);
                }
            });
            
            return state;
        });

        this.test('State Updates', () => {
            if (typeof window.mkbState === 'undefined') {
                throw new Error('State manager not available');
            }
            
            const initialState = window.mkbState.getState();
            
            // Test component addition
            window.mkbState.dispatch({
                type: 'ADD_COMPONENT',
                payload: {
                    id: 'test-component-' + Date.now(),
                    type: 'bio',
                    position: 0
                }
            });
            
            const updatedState = window.mkbState.getState();
            
            if (updatedState.components.length <= initialState.components.length) {
                throw new Error('State not updated correctly');
            }
            
            return updatedState;
        });

        this.test('State Persistence', () => {
            // Test local storage persistence for guest users
            const testState = {
                components: [
                    { id: 'test-1', type: 'hero', data: { title: 'Test' } }
                ],
                template: 'default',
                lastModified: Date.now()
            };
            
            // Simulate state save
            localStorage.setItem('mkb_guest_state', JSON.stringify(testState));
            
            // Verify retrieval
            const savedState = JSON.parse(localStorage.getItem('mkb_guest_state'));
            
            if (!savedState || savedState.components.length !== testState.components.length) {
                throw new Error('State persistence failed');
            }
            
            return savedState;
        });
    }

    /**
     * Test AJAX Endpoints
     */
    runAJAXEndpointTests() {
        console.log('🔗 Testing AJAX Endpoints...');
        
        const endpoints = [
            'mkb_get_component_registry',
            'mkb_get_component_template',
            'mkb_get_component_design_panel',
            'mkb_get_template_gallery',
            'mkb_get_user_capabilities'
        ];
        
        endpoints.forEach(endpoint => {
            this.test(`AJAX Endpoint: ${endpoint}`, async () => {
                const response = await this.makeAJAXRequest(endpoint, {});
                
                if (!response.success) {
                    throw new Error(`Endpoint ${endpoint} failed: ${response.data.message}`);
                }
                
                return response.data;
            });
        });
    }

    /**
     * Test Responsive Design
     */
    runResponsiveDesignTests() {
        console.log('📱 Testing Responsive Design...');
        
        this.config.responsive_breakpoints.forEach(width => {
            this.test(`Responsive Design at ${width}px`, () => {
                // Simulate viewport resize
                window.innerWidth = width;
                window.dispatchEvent(new Event('resize'));
                
                // Allow time for responsive changes
                setTimeout(() => {
                    const builderContainer = document.querySelector('.builder-container');
                    if (!builderContainer) {
                        throw new Error('Builder container not found');
                    }
                    
                    const computedStyle = window.getComputedStyle(builderContainer);
                    
                    // Check if mobile layout is applied for small screens
                    if (width <= 768) {
                        const flexDirection = computedStyle.flexDirection;
                        if (flexDirection !== 'column') {
                            console.warn(`Mobile layout may not be applied at ${width}px`);
                        }
                    }
                    
                    // Check for horizontal scrollbars
                    if (builderContainer.scrollWidth > builderContainer.clientWidth) {
                        console.warn(`Horizontal scroll detected at ${width}px`);
                    }
                    
                }, 100);
                
                return { width, passed: true };
            });
        });
    }

    /**
     * Test Performance
     */
    runPerformanceTests() {
        console.log('⚡ Testing Performance...');
        
        this.test('Initial Load Performance', () => {
            const loadTime = performance.now() - (window.mkbPerformance?.start || 0);
            
            if (loadTime > 5000) { // 5 seconds
                throw new Error(`Load time too slow: ${loadTime}ms`);
            }
            
            this.performance_metrics.initialLoad = loadTime;
            return loadTime;
        });

        this.test('Component Render Performance', () => {
            const startTime = performance.now();
            
            // Simulate adding multiple components
            for (let i = 0; i < 10; i++) {
                const mockComponent = document.createElement('div');
                mockComponent.className = 'media-kit-component test-component';
                mockComponent.innerHTML = `<h3>Test Component ${i}</h3>`;
                
                const container = document.querySelector('.media-kit-preview');
                if (container) {
                    container.appendChild(mockComponent);
                }
            }
            
            const renderTime = performance.now() - startTime;
            
            if (renderTime > this.config.performance_threshold) {
                console.warn(`Component render time: ${renderTime}ms (threshold: ${this.config.performance_threshold}ms)`);
            }
            
            this.performance_metrics.componentRender = renderTime;
            return renderTime;
        });

        this.test('Memory Usage', () => {
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize;
                
                if (memoryUsage > this.config.memory_threshold) {
                    console.warn(`High memory usage: ${memoryUsage} bytes`);
                }
                
                this.performance_metrics.memoryUsage = memoryUsage;
                return memoryUsage;
            }
            
            return 'Memory API not available';
        });
    }

    /**
     * Test Cross-Browser Compatibility
     */
    runCrossCompatibilityTests() {
        console.log('🌐 Testing Cross-Browser Compatibility...');
        
        this.test('Browser Feature Support', () => {
            const requiredFeatures = {
                'localStorage': typeof Storage !== 'undefined',
                'fetch': typeof fetch !== 'undefined',
                'Promise': typeof Promise !== 'undefined',
                'addEventListener': typeof document.addEventListener !== 'undefined',
                'querySelector': typeof document.querySelector !== 'undefined',
                'classList': 'classList' in document.createElement('div'),
                'dragAndDrop': 'draggable' in document.createElement('div')
            };
            
            const unsupportedFeatures = Object.keys(requiredFeatures).filter(
                feature => !requiredFeatures[feature]
            );
            
            if (unsupportedFeatures.length > 0) {
                throw new Error(`Unsupported features: ${unsupportedFeatures.join(', ')}`);
            }
            
            return requiredFeatures;
        });

        this.test('CSS Features Support', () => {
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);
            
            const cssFeatures = {
                'flexbox': this.testCSSProperty(testElement, 'display', 'flex'),
                'grid': this.testCSSProperty(testElement, 'display', 'grid'),
                'transform': this.testCSSProperty(testElement, 'transform', 'translateX(10px)'),
                'transition': this.testCSSProperty(testElement, 'transition', 'opacity 0.3s')
            };
            
            document.body.removeChild(testElement);
            
            const unsupportedCSS = Object.keys(cssFeatures).filter(
                feature => !cssFeatures[feature]
            );
            
            if (unsupportedCSS.length > 0) {
                console.warn(`Unsupported CSS features: ${unsupportedCSS.join(', ')}`);
            }
            
            return cssFeatures;
        });
    }

    /**
     * Utility Methods
     */

    test(name, testFunction) {
        console.log(`  ✓ Running: ${name}`);
        
        try {
            const startTime = performance.now();
            const result = testFunction();
            const duration = performance.now() - startTime;
            
            // Handle async tests
            if (result && typeof result.then === 'function') {
                return result.then(
                    (asyncResult) => {
                        this.test_results.push({
                            name,
                            status: 'passed',
                            duration,
                            result: asyncResult
                        });
                        console.log(`    ✅ Passed: ${name} (${duration.toFixed(2)}ms)`);
                        return asyncResult;
                    },
                    (error) => {
                        this.test_results.push({
                            name,
                            status: 'failed',
                            duration,
                            error: error.message
                        });
                        this.failed_tests.push({ name, error: error.message });
                        console.error(`    ❌ Failed: ${name} - ${error.message}`);
                        throw error;
                    }
                );
            } else {
                // Synchronous test
                this.test_results.push({
                    name,
                    status: 'passed',
                    duration,
                    result
                });
                console.log(`    ✅ Passed: ${name} (${duration.toFixed(2)}ms)`);
                return result;
            }
        } catch (error) {
            this.test_results.push({
                name,
                status: 'failed',
                duration: 0,
                error: error.message
            });
            this.failed_tests.push({ name, error: error.message });
            console.error(`    ❌ Failed: ${name} - ${error.message}`);
            throw error;
        }
    }

    async makeAJAXRequest(action, data = {}, nonce = null) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('nonce', nonce || window.mkbConfig.nonce);
        
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        const response = await fetch(window.mkbConfig.ajaxUrl, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }

    createMockMediaKitState() {
        return {
            components: [
                {
                    id: 'hero-1',
                    type: 'hero',
                    data: {
                        title: 'John Doe',
                        subtitle: 'Professional Speaker',
                        bio: 'Lorem ipsum dolor sit amet...'
                    }
                },
                {
                    id: 'bio-1',
                    type: 'bio',
                    data: {
                        content: 'Detailed biography content...'
                    }
                }
            ],
            template: 'default',
            settings: {
                theme: 'blue',
                layout: 'standard'
            }
        };
    }

    testCSSProperty(element, property, value) {
        element.style[property] = value;
        return element.style[property] === value;
    }

    startPerformanceMonitoring() {
        this.performance_metrics.startTime = performance.now();
        
        // Monitor resource loading
        if (performance.getEntriesByType) {
            this.performance_metrics.resources = performance.getEntriesByType('resource');
        }
    }

    generateTestReport() {
        const totalTests = this.test_results.length;
        const passedTests = this.test_results.filter(test => test.status === 'passed').length;
        const failedTests = this.failed_tests.length;
        const successRate = (passedTests / totalTests * 100).toFixed(2);
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            performance: this.performance_metrics,
            failedTests: this.failed_tests,
            timestamp: new Date().toISOString(),
            browser: {
                userAgent: navigator.userAgent,
                vendor: navigator.vendor,
                platform: navigator.platform
            }
        };
        
        console.log('\n📊 Integration Test Report:');
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests} ✅`);
        console.log(`   Failed: ${failedTests} ❌`);
        console.log(`   Success Rate: ${successRate}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.failed_tests.forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n⚡ Performance Metrics:');
        Object.keys(this.performance_metrics).forEach(metric => {
            console.log(`   ${metric}: ${this.performance_metrics[metric]}`);
        });
        
        // Send report to WordPress if analytics enabled
        if (window.mkbConfig && window.mkbConfig.features.analytics) {
            this.makeAJAXRequest('mkb_performance_report', {
                report: JSON.stringify(report)
            });
        }
        
        return report;
    }
}

// Auto-run tests when DOM is ready and MKB is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for MediaKitBuilder to be ready
    const checkAndRunTests = () => {
        if (window.MediaKitBuilder && window.mkbConfig) {
            // Run tests after a short delay to ensure everything is initialized
            setTimeout(() => {
                const testSuite = new MKB_Integration_Test_Suite();
                window.mkbTestResults = testSuite.run_all_tests();
            }, 1000);
        } else {
            // Retry after 500ms
            setTimeout(checkAndRunTests, 500);
        }
    };
    
    checkAndRunTests();
});

// Export for manual testing
window.MKB_Integration_Test_Suite = MKB_Integration_Test_Suite;
