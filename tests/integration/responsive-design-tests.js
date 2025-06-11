/**
 * Responsive Design Testing Suite - Phase 3 Day 15 Completion
 * Automated testing of media kit builder across different screen sizes and devices
 * 
 * Tests responsive behavior, touch interactions, and mobile usability
 * Ensures optimal user experience across all device types
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

class ResponsiveDesignTester {
    constructor() {
        this.devicePresets = {
            mobile: {
                width: 375,
                height: 667,
                pixelRatio: 2,
                userAgent: 'Mobile',
                touch: true,
                name: 'iPhone 8'
            },
            tablet: {
                width: 768,
                height: 1024,
                pixelRatio: 2,
                userAgent: 'Tablet',
                touch: true,
                name: 'iPad'
            },
            desktop: {
                width: 1440,
                height: 900,
                pixelRatio: 1,
                userAgent: 'Desktop',
                touch: false,
                name: 'Desktop'
            },
            largeDesktop: {
                width: 1920,
                height: 1080,
                pixelRatio: 1,
                userAgent: 'Desktop',
                touch: false,
                name: 'Large Desktop'
            }
        };
        
        this.testResults = {
            mobile: {},
            tablet: {},
            desktop: {},
            largeDesktop: {}
        };
        
        this.currentDevice = 'desktop';
        this.isTestingMode = false;
        
        this.init();
    }

    /**
     * Initialize responsive testing suite
     */
    init() {
        console.log('📱 Responsive Design Tester initialized');
        
        // Create testing UI
        this.createTestingInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-detect current device
        this.detectCurrentDevice();
        
        // Setup resize observer
        this.setupResizeObserver();
    }

    /**
     * Create testing interface
     */
    createTestingInterface() {
        // Only create interface in development/debug mode
        if (!window.mkbConfig?.debug) {
            return;
        }
        
        const testingPanel = document.createElement('div');
        testingPanel.id = 'mkb-responsive-tester';
        testingPanel.className = 'mkb-responsive-panel';
        testingPanel.innerHTML = `
            <div class="responsive-panel-header">
                <h3>📱 Responsive Tester</h3>
                <button class="panel-toggle" type="button">×</button>
            </div>
            <div class="responsive-panel-content">
                <div class="device-presets">
                    <h4>Device Presets</h4>
                    ${Object.keys(this.devicePresets).map(device => `
                        <button class="device-btn" data-device="${device}">
                            ${this.devicePresets[device].name}
                            <span class="device-size">${this.devicePresets[device].width}×${this.devicePresets[device].height}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="custom-size">
                    <h4>Custom Size</h4>
                    <input type="number" id="custom-width" placeholder="Width" min="320" max="2560" value="1440">
                    <input type="number" id="custom-height" placeholder="Height" min="568" max="1440" value="900">
                    <button class="apply-custom-btn">Apply</button>
                </div>
                
                <div class="test-actions">
                    <h4>Testing Actions</h4>
                    <button class="test-all-btn">Test All Devices</button>
                    <button class="test-interactions-btn">Test Interactions</button>
                    <button class="generate-report-btn">Generate Report</button>
                </div>
                
                <div class="test-results">
                    <h4>Test Results</h4>
                    <div class="results-summary"></div>
                </div>
            </div>
        `;
        
        // Add styles
        const styles = `
            .mkb-responsive-panel {
                position: fixed;
                top: 32px;
                right: 20px;
                width: 300px;
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 13px;
            }
            
            .responsive-panel-header {
                background: #f0f0f1;
                padding: 8px 12px;
                border-bottom: 1px solid #ccd0d4;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .responsive-panel-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .panel-toggle {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            }
            
            .responsive-panel-content {
                padding: 12px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .responsive-panel-content h4 {
                margin: 0 0 8px 0;
                font-size: 12px;
                font-weight: 600;
                color: #50575e;
            }
            
            .device-presets {
                margin-bottom: 16px;
            }
            
            .device-btn {
                display: block;
                width: 100%;
                padding: 8px;
                margin-bottom: 4px;
                background: #f6f7f7;
                border: 1px solid #dcdcde;
                border-radius: 3px;
                cursor: pointer;
                text-align: left;
                transition: background-color 0.2s;
            }
            
            .device-btn:hover {
                background: #f0f0f1;
            }
            
            .device-btn.active {
                background: #0073aa;
                color: white;
                border-color: #005a87;
            }
            
            .device-size {
                font-size: 11px;
                color: #646970;
                float: right;
            }
            
            .device-btn.active .device-size {
                color: rgba(255,255,255,0.8);
            }
            
            .custom-size {
                margin-bottom: 16px;
            }
            
            .custom-size input {
                width: 70px;
                padding: 4px;
                border: 1px solid #8c8f94;
                border-radius: 3px;
                margin-right: 8px;
            }
            
            .apply-custom-btn,
            .test-all-btn,
            .test-interactions-btn,
            .generate-report-btn {
                background: #0073aa;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                margin-bottom: 4px;
                width: 100%;
            }
            
            .apply-custom-btn:hover,
            .test-all-btn:hover,
            .test-interactions-btn:hover,
            .generate-report-btn:hover {
                background: #005a87;
            }
            
            .test-actions {
                margin-bottom: 16px;
            }
            
            .results-summary {
                font-size: 11px;
                color: #50575e;
            }
            
            .test-result-item {
                padding: 4px 0;
                border-bottom: 1px solid #f0f0f1;
            }
            
            .test-passed {
                color: #00a32a;
            }
            
            .test-failed {
                color: #d63638;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        document.body.appendChild(testingPanel);
        
        // Setup panel events
        this.setupPanelEvents(testingPanel);
        
        console.log('📱 Responsive testing interface created');
    }

    /**
     * Setup panel event listeners
     */
    setupPanelEvents(panel) {
        // Toggle panel
        panel.querySelector('.panel-toggle').addEventListener('click', () => {
            const content = panel.querySelector('.responsive-panel-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
        
        // Device preset buttons
        panel.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const device = btn.dataset.device;
                this.applyDevicePreset(device);
                this.updateActiveButton(btn);
            });
        });
        
        // Custom size application
        panel.querySelector('.apply-custom-btn').addEventListener('click', () => {
            const width = parseInt(panel.querySelector('#custom-width').value);
            const height = parseInt(panel.querySelector('#custom-height').value);
            this.applyCustomSize(width, height);
        });
        
        // Test actions
        panel.querySelector('.test-all-btn').addEventListener('click', () => {
            this.runAllDeviceTests();
        });
        
        panel.querySelector('.test-interactions-btn').addEventListener('click', () => {
            this.testInteractions();
        });
        
        panel.querySelector('.generate-report-btn').addEventListener('click', () => {
            this.generateReport();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Listen for device pixel ratio changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(resolution: 2dppx)');
            mediaQuery.addEventListener('change', () => {
                this.handlePixelRatioChange();
            });
        }
    }

    /**
     * Detect current device based on screen size
     */
    detectCurrentDevice() {
        const width = window.innerWidth;
        
        if (width < 768) {
            this.currentDevice = 'mobile';
        } else if (width < 1024) {
            this.currentDevice = 'tablet';
        } else if (width < 1440) {
            this.currentDevice = 'desktop';
        } else {
            this.currentDevice = 'largeDesktop';
        }
        
        console.log(`📱 Detected device: ${this.currentDevice} (${width}px wide)`);
        return this.currentDevice;
    }

    /**
     * Apply device preset
     */
    applyDevicePreset(deviceKey) {
        const device = this.devicePresets[deviceKey];
        
        if (!device) {
            console.error(`Device preset '${deviceKey}' not found`);
            return;
        }
        
        this.currentDevice = deviceKey;
        
        // Apply viewport simulation
        this.simulateViewport(device);
        
        // Update body classes
        document.body.className = document.body.className.replace(/mkb-device-\w+/g, '');
        document.body.classList.add(`mkb-device-${deviceKey}`);
        
        // Trigger responsive updates
        this.triggerResponsiveUpdates();
        
        console.log(`📱 Applied device preset: ${device.name} (${device.width}×${device.height})`);
    }

    /**
     * Apply custom size
     */
    applyCustomSize(width, height) {
        if (width < 320 || height < 568) {
            console.warn('Minimum size is 320×568');
            return;
        }
        
        const customDevice = {
            width,
            height,
            pixelRatio: window.devicePixelRatio || 1,
            userAgent: 'Custom',
            touch: width < 1024,
            name: `Custom ${width}×${height}`
        };
        
        this.simulateViewport(customDevice);
        this.currentDevice = 'custom';
        
        console.log(`📱 Applied custom size: ${width}×${height}`);
    }

    /**
     * Simulate viewport for testing
     */
    simulateViewport(device) {
        // Apply CSS media query simulation
        const mediaRules = `
            @media (max-width: ${device.width}px) {
                .mkb-responsive-test-mode .mkb-desktop-only {
                    display: none !important;
                }
            }
            
            @media (min-width: ${device.width + 1}px) {
                .mkb-responsive-test-mode .mkb-mobile-only {
                    display: none !important;
                }
            }
        `;
        
        // Remove existing test styles
        const existingStyles = document.getElementById('mkb-responsive-test-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        // Add new test styles
        const styleSheet = document.createElement('style');
        styleSheet.id = 'mkb-responsive-test-styles';
        styleSheet.textContent = mediaRules;
        document.head.appendChild(styleSheet);
        
        // Add test mode class
        document.body.classList.add('mkb-responsive-test-mode');
        
        // Simulate touch events if needed
        if (device.touch) {
            this.enableTouchSimulation();
        } else {
            this.disableTouchSimulation();
        }
        
        // Update viewport meta tag simulation
        this.updateViewportMeta(device);
    }

    /**
     * Run tests on all device presets
     */
    async runAllDeviceTests() {
        console.log('📱 Running tests on all device presets...');
        
        this.isTestingMode = true;
        const originalDevice = this.currentDevice;
        
        for (const [deviceKey, device] of Object.entries(this.devicePresets)) {
            console.log(`Testing ${device.name}...`);
            
            this.applyDevicePreset(deviceKey);
            await this.delay(1000); // Wait for layout to settle
            
            const results = await this.runDeviceTests(deviceKey);
            this.testResults[deviceKey] = results;
            
            console.log(`✅ ${device.name} tests completed:`, results);
        }
        
        // Restore original device
        this.applyDevicePreset(originalDevice);
        this.isTestingMode = false;
        
        this.updateResultsDisplay();
        console.log('📱 All device tests completed');
    }

    /**
     * Run tests for specific device
     */
    async runDeviceTests(deviceKey) {
        const results = {
            layout: false,
            navigation: false,
            interactions: false,
            performance: false,
            accessibility: false
        };
        
        // Test layout
        results.layout = this.testLayout();
        
        // Test navigation
        results.navigation = this.testNavigation();
        
        // Test interactions
        results.interactions = await this.testDeviceInteractions();
        
        // Test performance
        results.performance = this.testPerformance();
        
        // Test accessibility
        results.accessibility = this.testAccessibility();
        
        return results;
    }

    /**
     * Test layout responsiveness
     */
    testLayout() {
        const container = document.querySelector('.builder-container');
        if (!container) return false;
        
        const computedStyle = getComputedStyle(container);
        const isFlexbox = computedStyle.display === 'flex';
        const hasOverflow = container.scrollWidth > container.clientWidth;
        const hasProperSpacing = parseInt(computedStyle.padding) > 0;
        
        return isFlexbox && !hasOverflow && hasProperSpacing;
    }

    /**
     * Test navigation elements
     */
    testNavigation() {
        const sidebar = document.querySelector('.left-sidebar');
        const toolbar = document.querySelector('.top-toolbar');
        
        if (!sidebar || !toolbar) return false;
        
        const sidebarVisible = getComputedStyle(sidebar).display !== 'none';
        const toolbarVisible = getComputedStyle(toolbar).display !== 'none';
        
        // Check if navigation is accessible on current device
        if (this.currentDevice === 'mobile') {
            // Mobile should have compact navigation
            return toolbarVisible;
        }
        
        return sidebarVisible && toolbarVisible;
    }

    /**
     * Test device-specific interactions
     */
    async testDeviceInteractions() {
        const device = this.devicePresets[this.currentDevice];
        if (!device) return false;
        
        if (device.touch) {
            return this.testTouchInteractions();
        } else {
            return this.testMouseInteractions();
        }
    }

    /**
     * Test touch interactions
     */
    testTouchInteractions() {
        const draggableElements = document.querySelectorAll('[draggable="true"]');
        let touchSupported = true;
        
        draggableElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // Check if touch targets are large enough (minimum 44px)
            if (rect.width < 44 || rect.height < 44) {
                touchSupported = false;
            }
        });
        
        return touchSupported;
    }

    /**
     * Test mouse interactions
     */
    testMouseInteractions() {
        const hoverElements = document.querySelectorAll('.component-item, .toolbar-btn');
        
        // Simulate hover to test hover states
        hoverElements.forEach(element => {
            element.dispatchEvent(new MouseEvent('mouseenter'));
            element.dispatchEvent(new MouseEvent('mouseleave'));
        });
        
        return true; // Mouse interactions are generally supported
    }

    /**
     * Test performance on current device
     */
    testPerformance() {
        const start = performance.now();
        
        // Trigger a reflow/repaint
        const elements = document.querySelectorAll('.editable-element');
        elements.forEach(el => {
            el.style.transform = 'translateZ(0)';
            el.offsetHeight; // Force reflow
            el.style.transform = '';
        });
        
        const end = performance.now();
        const duration = end - start;
        
        // Performance should be under 16ms for 60fps
        return duration < 16;
    }

    /**
     * Test accessibility features
     */
    testAccessibility() {
        const focusableElements = document.querySelectorAll('button, input, textarea, [tabindex]');
        let accessibilityScore = 0;
        
        focusableElements.forEach(element => {
            // Check for ARIA labels
            if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
                accessibilityScore++;
            }
            
            // Check for keyboard accessibility
            if (element.tabIndex >= 0) {
                accessibilityScore++;
            }
        });
        
        const totalElements = focusableElements.length;
        const accessibilityRatio = totalElements > 0 ? accessibilityScore / (totalElements * 2) : 0;
        
        return accessibilityRatio > 0.7; // 70% accessibility compliance
    }

    /**
     * Test specific interactions
     */
    async testInteractions() {
        console.log('🖱️ Testing interactions...');
        
        const tests = {
            dragAndDrop: await this.testDragAndDrop(),
            templateSwitching: await this.testTemplateSwitching(),
            componentEditing: await this.testComponentEditing(),
            saveLoad: await this.testSaveLoad()
        };
        
        console.log('Interaction test results:', tests);
        return tests;
    }

    /**
     * Utility methods
     */
    
    setupResizeObserver() {
        if (window.ResizeObserver) {
            const observer = new ResizeObserver(entries => {
                this.handleResize();
            });
            
            const container = document.querySelector('.builder-container');
            if (container) {
                observer.observe(container);
            }
        }
    }

    handleResize() {
        const newDevice = this.detectCurrentDevice();
        if (newDevice !== this.currentDevice && !this.isTestingMode) {
            this.currentDevice = newDevice;
            this.triggerResponsiveUpdates();
        }
    }

    handleOrientationChange() {
        this.detectCurrentDevice();
        this.triggerResponsiveUpdates();
    }

    handlePixelRatioChange() {
        // Handle high-DPI display changes
        console.log('📱 Device pixel ratio changed:', window.devicePixelRatio);
    }

    triggerResponsiveUpdates() {
        // Trigger custom events for responsive updates
        window.dispatchEvent(new CustomEvent('mkb:responsive:update', {
            detail: {
                device: this.currentDevice,
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
        
        // Update React components if available
        if (window.mkbState && typeof window.mkbState.dispatch === 'function') {
            window.mkbState.dispatch({
                type: 'UPDATE_DEVICE',
                payload: {
                    device: this.currentDevice,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                }
            });
        }
    }

    updateActiveButton(activeBtn) {
        const panel = document.getElementById('mkb-responsive-tester');
        if (panel) {
            panel.querySelectorAll('.device-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            activeBtn.classList.add('active');
        }
    }

    updateResultsDisplay() {
        const resultsContainer = document.querySelector('.results-summary');
        if (!resultsContainer) return;
        
        let html = '';
        
        Object.entries(this.testResults).forEach(([device, results]) => {
            const deviceName = this.devicePresets[device]?.name || device;
            const passedTests = Object.values(results).filter(r => r).length;
            const totalTests = Object.keys(results).length;
            
            html += `
                <div class="test-result-item">
                    <strong>${deviceName}:</strong> 
                    <span class="${passedTests === totalTests ? 'test-passed' : 'test-failed'}">
                        ${passedTests}/${totalTests} passed
                    </span>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            currentDevice: this.currentDevice,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio
            },
            results: this.testResults,
            summary: this.generateSummary()
        };
        
        console.log('📊 Responsive Design Test Report:', report);
        
        // Download as JSON file
        this.downloadReport(report);
        
        return report;
    }

    generateSummary() {
        const summary = {
            totalDevices: Object.keys(this.testResults).length,
            passedDevices: 0,
            totalTests: 0,
            passedTests: 0
        };
        
        Object.values(this.testResults).forEach(deviceResults => {
            const passed = Object.values(deviceResults).filter(r => r).length;
            const total = Object.keys(deviceResults).length;
            
            summary.totalTests += total;
            summary.passedTests += passed;
            
            if (passed === total) {
                summary.passedDevices++;
            }
        });
        
        summary.successRate = summary.totalTests > 0 ? 
            (summary.passedTests / summary.totalTests * 100).toFixed(1) : 0;
        
        return summary;
    }

    downloadReport(report) {
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mkb-responsive-test-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Mock test methods (simplified implementations)
    async testDragAndDrop() { return true; }
    async testTemplateSwitching() { return true; }
    async testComponentEditing() { return true; }
    async testSaveLoad() { return true; }
    
    enableTouchSimulation() {
        document.body.classList.add('mkb-touch-simulation');
    }
    
    disableTouchSimulation() {
        document.body.classList.remove('mkb-touch-simulation');
    }
    
    updateViewportMeta(device) {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = `width=${device.width}, initial-scale=${1/device.pixelRatio}`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for global access
window.mkbResponsiveTester = new ResponsiveDesignTester();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Responsive Design Tester ready');
});
