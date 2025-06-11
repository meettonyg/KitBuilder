/**
 * Performance Validation Suite - Phase 3 Day 15 Completion
 * Comprehensive performance monitoring and validation for Media Kit Builder
 * 
 * Monitors load times, memory usage, rendering performance, and user interactions
 * Ensures production-ready performance across all target environments
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

class PerformanceValidator {
    constructor() {
        this.metrics = {
            loadTime: {},
            renderTime: {},
            memoryUsage: {},
            networkRequests: {},
            interactionLatency: {},
            framerate: {}
        };
        
        this.thresholds = {
            maxLoadTime: 3000,          // 3 seconds
            maxRenderTime: 50,          // 50ms for 60fps
            maxMemoryUsage: 50 * 1024 * 1024, // 50MB
            maxNetworkRequests: 20,     // Per page load
            maxInteractionDelay: 100,   // 100ms
            minFramerate: 55            // fps
        };
        
        this.isMonitoring = false;
        this.performanceObserver = null;
        this.startTime = performance.now();
        
        this.init();
    }

    /**
     * Initialize performance monitoring
     */
    init() {
        console.log('⚡ Performance Validator initialized');
        
        // Start monitoring immediately
        this.startMonitoring();
        
        // Setup performance observers
        this.setupPerformanceObservers();
        
        // Monitor critical user interactions
        this.monitorUserInteractions();
        
        // Setup memory monitoring
        this.setupMemoryMonitoring();
        
        // Monitor network requests
        this.monitorNetworkRequests();
        
        // Setup frame rate monitoring
        this.monitorFrameRate();
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.startTime = performance.now();
        
        // Monitor page load performance
        this.measurePageLoad();
        
        console.log('⚡ Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        console.log('⚡ Performance monitoring stopped');
    }

    /**
     * Measure page load performance
     */
    measurePageLoad() {
        // Use Navigation Timing API
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                this.metrics.loadTime = {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    totalTime: navigation.loadEventEnd - navigation.fetchStart,
                    dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcpTime: navigation.connectEnd - navigation.connectStart,
                    serverTime: navigation.responseEnd - navigation.requestStart,
                    domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
                    resourceLoading: navigation.loadEventStart - navigation.domContentLoadedEventEnd
                };
                
                console.log('📊 Page load metrics:', this.metrics.loadTime);
                this.validateLoadTime();
            }
        });
    }

    /**
     * Setup performance observers
     */
    setupPerformanceObservers() {
        if ('PerformanceObserver' in window) {
            // Observe paint metrics
            this.observePaintMetrics();
            
            // Observe resource loading
            this.observeResourceLoading();
            
            // Observe long tasks
            this.observeLongTasks();
            
            // Observe largest contentful paint
            this.observeLargestContentfulPaint();
        }
    }

    /**
     * Observe paint metrics
     */
    observePaintMetrics() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-paint') {
                        this.metrics.renderTime.firstPaint = entry.startTime;
                    } else if (entry.name === 'first-contentful-paint') {
                        this.metrics.renderTime.firstContentfulPaint = entry.startTime;
                    }
                });
                
                this.validateRenderTime();
            });
            
            observer.observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.warn('Paint metrics not supported:', error);
        }
    }

    /**
     * Observe resource loading
     */
    observeResourceLoading() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                this.analyzeResourceLoading(entries);
            });
            
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Resource timing not supported:', error);
        }
    }

    /**
     * Observe long tasks
     */
    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn('🐌 Long task detected:', {
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name
                        });
                        
                        this.metrics.renderTime.longTasks = this.metrics.renderTime.longTasks || [];
                        this.metrics.renderTime.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime
                        });
                    }
                });
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        } catch (error) {
            console.warn('Long task monitoring not supported:', error);
        }
    }

    /**
     * Observe largest contentful paint
     */
    observeLargestContentfulPaint() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.renderTime.largestContentfulPaint = lastEntry.startTime;
                
                console.log('📊 Largest Contentful Paint:', lastEntry.startTime + 'ms');
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
            console.warn('LCP monitoring not supported:', error);
        }
    }

    /**
     * Monitor user interactions
     */
    monitorUserInteractions() {
        const interactionTypes = ['click', 'keydown', 'touchstart', 'dragstart'];
        
        interactionTypes.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.measureInteractionLatency(event);
            }, { passive: true });
        });
    }

    /**
     * Measure interaction latency
     */
    measureInteractionLatency(event) {
        const startTime = performance.now();
        
        // Measure time to next frame
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            if (!this.metrics.interactionLatency[event.type]) {
                this.metrics.interactionLatency[event.type] = [];
            }
            
            this.metrics.interactionLatency[event.type].push(latency);
            
            // Log slow interactions
            if (latency > this.thresholds.maxInteractionDelay) {
                console.warn(`🐌 Slow ${event.type} interaction:`, latency + 'ms');
            }
        });
    }

    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if (performance.memory) {
            // Initial memory snapshot
            this.takeMemorySnapshot('initial');
            
            // Monitor memory periodically
            setInterval(() => {
                if (this.isMonitoring) {
                    this.takeMemorySnapshot('periodic');
                    this.checkMemoryUsage();
                }
            }, 10000); // Every 10 seconds
            
            // Monitor memory on significant events
            document.addEventListener('mkb:template:switched', () => {
                setTimeout(() => this.takeMemorySnapshot('template-switch'), 1000);
            });
            
            document.addEventListener('mkb:component:added', () => {
                setTimeout(() => this.takeMemorySnapshot('component-add'), 100);
            });
        }
    }

    /**
     * Take memory snapshot
     */
    takeMemorySnapshot(label) {
        if (performance.memory) {
            const snapshot = {
                timestamp: performance.now(),
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
            
            if (!this.metrics.memoryUsage[label]) {
                this.metrics.memoryUsage[label] = [];
            }
            
            this.metrics.memoryUsage[label].push(snapshot);
            
            // Log significant memory usage
            const usageMB = Math.round(snapshot.usedJSHeapSize / 1024 / 1024);
            if (usageMB > 30) {
                console.log(`💾 Memory usage (${label}):`, usageMB + 'MB');
            }
        }
    }

    /**
     * Check memory usage against thresholds
     */
    checkMemoryUsage() {
        if (performance.memory) {
            const currentUsage = performance.memory.usedJSHeapSize;
            
            if (currentUsage > this.thresholds.maxMemoryUsage) {
                console.warn('⚠️ Memory usage exceeds threshold:', {
                    current: Math.round(currentUsage / 1024 / 1024) + 'MB',
                    threshold: Math.round(this.thresholds.maxMemoryUsage / 1024 / 1024) + 'MB'
                });
                
                // Suggest garbage collection
                if (window.gc && typeof window.gc === 'function') {
                    console.log('🗑️ Suggesting garbage collection...');
                    window.gc();
                }
            }
        }
    }

    /**
     * Monitor network requests
     */
    monitorNetworkRequests() {
        // Count requests using Performance Observer
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                this.analyzeNetworkRequests(entries);
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
        
        // Hook into fetch and XMLHttpRequest
        this.monitorFetchRequests();
        this.monitorXHRRequests();
    }

    /**
     * Monitor fetch requests
     */
    monitorFetchRequests() {
        const originalFetch = window.fetch;
        let requestCount = 0;
        
        window.fetch = function(...args) {
            requestCount++;
            const startTime = performance.now();
            
            return originalFetch.apply(this, args)
                .then(response => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    console.log(`🌐 Fetch request (${requestCount}):`, {
                        url: args[0],
                        duration: Math.round(duration) + 'ms',
                        status: response.status
                    });
                    
                    return response;
                })
                .catch(error => {
                    console.error('🚫 Fetch request failed:', error);
                    throw error;
                });
        };
    }

    /**
     * Monitor XHR requests
     */
    monitorXHRRequests() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._startTime = performance.now();
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('loadend', () => {
                const duration = performance.now() - this._startTime;
                
                console.log('🌐 XHR request:', {
                    method: this._method,
                    url: this._url,
                    duration: Math.round(duration) + 'ms',
                    status: this.status
                });
            });
            
            return originalSend.apply(this, args);
        };
    }

    /**
     * Monitor frame rate
     */
    monitorFrameRate() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            if (!this.isMonitoring) return;
            
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (!this.metrics.framerate.samples) {
                    this.metrics.framerate.samples = [];
                }
                
                this.metrics.framerate.samples.push({
                    timestamp: currentTime,
                    fps: fps
                });
                
                // Log low framerate
                if (fps < this.thresholds.minFramerate) {
                    console.warn('🐌 Low framerate detected:', fps + 'fps');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    /**
     * Analyze resource loading performance
     */
    analyzeResourceLoading(entries) {
        let totalSize = 0;
        let totalDuration = 0;
        const resourceTypes = {};
        
        entries.forEach(entry => {
            if (entry.name.includes('mkb') || entry.name.includes('media-kit-builder')) {
                totalSize += entry.transferSize || 0;
                totalDuration += entry.duration;
                
                const type = this.getResourceType(entry.name);
                if (!resourceTypes[type]) {
                    resourceTypes[type] = { count: 0, size: 0, duration: 0 };
                }
                
                resourceTypes[type].count++;
                resourceTypes[type].size += entry.transferSize || 0;
                resourceTypes[type].duration += entry.duration;
            }
        });
        
        this.metrics.networkRequests = {
            totalSize,
            totalDuration,
            resourceTypes,
            timestamp: performance.now()
        };
    }

    /**
     * Analyze network requests
     */
    analyzeNetworkRequests(entries) {
        const mkbRequests = entries.filter(entry => 
            entry.name.includes('mkb') || 
            entry.name.includes('media-kit-builder') ||
            entry.name.includes('admin-ajax.php')
        );
        
        if (mkbRequests.length > this.thresholds.maxNetworkRequests) {
            console.warn('⚠️ Too many network requests:', mkbRequests.length);
        }
        
        // Analyze slow requests
        mkbRequests.forEach(request => {
            if (request.duration > 1000) {
                console.warn('🐌 Slow network request:', {
                    url: request.name,
                    duration: Math.round(request.duration) + 'ms',
                    size: request.transferSize
                });
            }
        });
    }

    /**
     * Validation methods
     */
    
    validateLoadTime() {
        const loadTime = this.metrics.loadTime.totalTime;
        
        if (loadTime > this.thresholds.maxLoadTime) {
            console.warn('⚠️ Load time exceeds threshold:', {
                actual: Math.round(loadTime) + 'ms',
                threshold: this.thresholds.maxLoadTime + 'ms'
            });
            return false;
        }
        
        console.log('✅ Load time within threshold:', Math.round(loadTime) + 'ms');
        return true;
    }

    validateRenderTime() {
        const fcp = this.metrics.renderTime.firstContentfulPaint;
        
        if (fcp && fcp > this.thresholds.maxLoadTime) {
            console.warn('⚠️ First Contentful Paint exceeds threshold:', {
                actual: Math.round(fcp) + 'ms',
                threshold: this.thresholds.maxLoadTime + 'ms'
            });
            return false;
        }
        
        if (fcp) {
            console.log('✅ First Contentful Paint within threshold:', Math.round(fcp) + 'ms');
        }
        return true;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            metrics: this.metrics,
            thresholds: this.thresholds,
            validation: this.runValidation(),
            recommendations: this.generateRecommendations(),
            environment: this.getEnvironmentInfo()
        };
        
        console.log('📊 Performance Report:', report);
        return report;
    }

    /**
     * Run comprehensive validation
     */
    runValidation() {
        return {
            loadTime: this.validateLoadTime(),
            renderTime: this.validateRenderTime(),
            memoryUsage: this.validateMemoryUsage(),
            framerate: this.validateFramerate(),
            interactions: this.validateInteractions()
        };
    }

    validateMemoryUsage() {
        if (!performance.memory) return true;
        
        const currentUsage = performance.memory.usedJSHeapSize;
        return currentUsage <= this.thresholds.maxMemoryUsage;
    }

    validateFramerate() {
        if (!this.metrics.framerate.samples) return true;
        
        const recent = this.metrics.framerate.samples.slice(-10);
        const avgFPS = recent.reduce((sum, sample) => sum + sample.fps, 0) / recent.length;
        
        return avgFPS >= this.thresholds.minFramerate;
    }

    validateInteractions() {
        const interactions = Object.values(this.metrics.interactionLatency);
        
        for (const interaction of interactions) {
            const avgLatency = interaction.reduce((sum, latency) => sum + latency, 0) / interaction.length;
            if (avgLatency > this.thresholds.maxInteractionDelay) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Load time recommendations
        if (this.metrics.loadTime.totalTime > this.thresholds.maxLoadTime) {
            recommendations.push('Optimize initial bundle size with code splitting');
            recommendations.push('Implement lazy loading for non-critical components');
        }
        
        // Memory recommendations
        if (performance.memory && performance.memory.usedJSHeapSize > this.thresholds.maxMemoryUsage) {
            recommendations.push('Review component cleanup and prevent memory leaks');
            recommendations.push('Implement virtual scrolling for large lists');
        }
        
        // Network recommendations
        const requestCount = Object.values(this.metrics.networkRequests.resourceTypes || {})
            .reduce((sum, type) => sum + type.count, 0);
        
        if (requestCount > this.thresholds.maxNetworkRequests) {
            recommendations.push('Reduce number of HTTP requests through bundling');
            recommendations.push('Implement request caching and deduplication');
        }
        
        return recommendations;
    }

    /**
     * Get environment information
     */
    getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            memory: performance.memory ? {
                limit: performance.memory.jsHeapSizeLimit,
                total: performance.memory.totalJSHeapSize,
                used: performance.memory.usedJSHeapSize
            } : null
        };
    }

    /**
     * Utility methods
     */
    
    getResourceType(url) {
        if (url.includes('.js')) return 'javascript';
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
        if (url.includes('.woff') || url.includes('.ttf')) return 'font';
        return 'other';
    }
}

// Global access
window.mkbPerformanceValidator = new PerformanceValidator();

// Auto-generate report when page unloads
window.addEventListener('beforeunload', () => {
    if (window.mkbPerformanceValidator) {
        const report = window.mkbPerformanceValidator.generateReport();
        
        // Send to analytics if available
        if (navigator.sendBeacon && window.mkbConfig?.ajaxUrl) {
            const formData = new FormData();
            formData.append('action', 'mkb_performance_report');
            formData.append('nonce', window.mkbConfig.nonce);
            formData.append('report', JSON.stringify(report));
            
            navigator.sendBeacon(window.mkbConfig.ajaxUrl, formData);
        }
    }
});

console.log('⚡ Performance Validator loaded and monitoring started');
