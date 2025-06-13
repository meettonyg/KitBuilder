/**
 * Media Kit Builder - Cross-Browser Compatibility Module
 * 
 * Provides feature detection, browser identification, and compatibility
 * enhancements for the Media Kit Builder. Ensures consistent experience
 * across Chrome, Firefox, Safari, and Edge.
 */

(function() {
    'use strict';

    // MKBCompat - Cross-browser compatibility manager
    window.MKBCompat = {
        features: {
            flexbox: false,
            grid: false,
            customProperties: false,
            touch: false,
            passiveEvents: false,
            objectFit: false
        },
        
        browser: {
            name: '',
            version: '',
            isMobile: false,
            isIOS: false,
            isAndroid: false,
            isOldIE: false,
            isEdge: false
        },
        
        /**
         * Initialize compatibility module
         */
        init: function() {
            console.log('Initializing MKBCompat browser compatibility module...');
            this.detectFeatures();
            this.detectBrowser();
            this.addBrowserClasses();
            this.setupTouchSupport();
            console.log('Browser detected:', this.browser);
            console.log('Features detected:', this.features);
        },

        /**
         * Detect supported browser features
         */
        detectFeatures: function() {
            var self = this;

            // Check for flexbox support
            self.features.flexbox = (function() {
                var elem = document.createElement('div');
                return elem.style.flexBasis !== undefined || 
                       elem.style.webkitFlexBasis !== undefined || 
                       elem.style.msFlexBasis !== undefined;
            })();

            // Check for CSS Grid support
            self.features.grid = (function() {
                var elem = document.createElement('div');
                return elem.style.gridArea !== undefined || 
                       elem.style.msGridArea !== undefined;
            })();

            // Check for CSS Custom Properties (variables)
            self.features.customProperties = (function() {
                return window.CSS && window.CSS.supports && 
                       window.CSS.supports('(--a: 0)');
            })();

            // Check for touch support
            self.features.touch = (function() {
                return 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 || 
                       navigator.msMaxTouchPoints > 0;
            })();

            // Check for passive event support
            self.features.passiveEvents = (function() {
                var supportsPassive = false;
                try {
                    var opts = Object.defineProperty({}, 'passive', {
                        get: function() {
                            supportsPassive = true;
                            return true;
                        }
                    });
                    window.addEventListener('testPassive', null, opts);
                    window.removeEventListener('testPassive', null, opts);
                } catch (e) {}
                return supportsPassive;
            })();

            // Check for object-fit support
            self.features.objectFit = (function() {
                var elem = document.createElement('div');
                return 'objectFit' in elem.style;
            })();
        },

        /**
         * Detect browser and device information
         */
        detectBrowser: function() {
            var self = this;
            var ua = navigator.userAgent;
            
            // Detect mobile devices
            self.browser.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            self.browser.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
            self.browser.isAndroid = /Android/.test(ua);
            
            // Detect browser name and version
            if (/Edge\/\d+/.test(ua)) {
                self.browser.name = 'Edge';
                self.browser.isEdge = true;
                self.browser.version = ua.match(/Edge\/(\d+)/)[1];
            } else if (/MSIE |Trident\//.test(ua)) {
                self.browser.name = 'IE';
                self.browser.isOldIE = true;
                self.browser.version = ua.match(/(?:MSIE |rv:)(\d+)/)[1];
            } else if (/Chrome\//.test(ua)) {
                self.browser.name = 'Chrome';
                self.browser.version = ua.match(/Chrome\/(\d+)/)[1];
            } else if (/Firefox\//.test(ua)) {
                self.browser.name = 'Firefox';
                self.browser.version = ua.match(/Firefox\/(\d+)/)[1];
            } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
                self.browser.name = 'Safari';
                self.browser.version = ua.match(/Version\/(\d+)/)[1];
            } else {
                self.browser.name = 'Other';
                self.browser.version = '0';
            }
        },

        /**
         * Add browser-specific CSS classes to the body element
         */
        addBrowserClasses: function() {
            var self = this;
            var body = document.body;
            
            // Add browser name and version classes
            body.classList.add('browser-' + self.browser.name.toLowerCase());
            body.classList.add('browser-' + self.browser.name.toLowerCase() + '-' + self.browser.version);
            
            // Add device type classes
            if (self.browser.isMobile) {
                body.classList.add('mobile-device');
                
                if (self.browser.isIOS) {
                    body.classList.add('ios-device');
                } else if (self.browser.isAndroid) {
                    body.classList.add('android-device');
                }
            } else {
                body.classList.add('desktop-device');
            }
            
            // Add feature support classes
            if (!self.features.flexbox) body.classList.add('no-flexbox');
            if (!self.features.grid) body.classList.add('no-grid');
            if (!self.features.customProperties) body.classList.add('no-css-vars');
            if (!self.features.objectFit) body.classList.add('no-object-fit');
        },

        /**
         * Set up enhanced touch support for mobile devices
         */
        setupTouchSupport: function() {
            var self = this;
            
            // Only proceed if touch is supported
            if (!self.features.touch) return;
            
            console.log('Setting up enhanced touch support...');

            // Custom touch-based drag and drop implementation
            self.setupTouchDragDrop();
            
            // Make interface elements more touch-friendly
            self.enhanceTouchTargets();
        },

        /**
         * Implement touch-friendly drag and drop
         * This is separate from HTML5 drag and drop to ensure mobile compatibility
         */
        setupTouchDragDrop: function() {
            var self = this;
            
            // Only run once DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                // Find all draggable elements
                var draggables = document.querySelectorAll('[draggable="true"], .component-item');
                
                // Track drag state
                var touchDragState = {
                    isDragging: false,
                    currentElement: null,
                    startX: 0,
                    startY: 0,
                    offsetX: 0,
                    offsetY: 0,
                    ghost: null
                };
                
                // Add touch event handlers to all draggable elements
                draggables.forEach(function(element) {
                    element.addEventListener('touchstart', handleTouchStart, self.features.passiveEvents ? { passive: false } : false);
                });
                
                // Touch start handler
                function handleTouchStart(e) {
                    // Prevent default only if the element is draggable
                    if (this.getAttribute('draggable') === 'true' || this.classList.contains('component-item')) {
                        e.preventDefault();
                        
                        var touch = e.touches[0];
                        touchDragState.currentElement = this;
                        touchDragState.startX = touch.clientX;
                        touchDragState.startY = touch.clientY;
                        touchDragState.offsetX = 0;
                        touchDragState.offsetY = 0;
                        
                        // Create ghost element if needed
                        createDragGhost(this);
                        
                        // Add document level event listeners
                        document.addEventListener('touchmove', handleTouchMove, self.features.passiveEvents ? { passive: false } : false);
                        document.addEventListener('touchend', handleTouchEnd, self.features.passiveEvents ? { passive: false } : false);
                    }
                }
                
                // Touch move handler
                function handleTouchMove(e) {
                    if (!touchDragState.currentElement) return;
                    
                    e.preventDefault();
                    
                    var touch = e.touches[0];
                    touchDragState.offsetX = touch.clientX - touchDragState.startX;
                    touchDragState.offsetY = touch.clientY - touchDragState.startY;
                    
                    // Only start dragging after a threshold
                    if (Math.abs(touchDragState.offsetX) > 10 || Math.abs(touchDragState.offsetY) > 10) {
                        touchDragState.isDragging = true;
                        touchDragState.currentElement.classList.add('touch-dragging');
                        
                        // Move ghost element
                        if (touchDragState.ghost) {
                            touchDragState.ghost.style.transform = 'translate(' + 
                                (touchDragState.offsetX) + 'px, ' + 
                                (touchDragState.offsetY) + 'px)';
                            touchDragState.ghost.style.opacity = '0.8';
                        }
                        
                        // Find drop targets below
                        var elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        
                        // Highlight drop zones
                        var dropZone = elementBelow ? elementBelow.closest('.drop-zone') : null;
                        if (dropZone) {
                            // Remove highlight from all drop zones
                            document.querySelectorAll('.drop-zone-hover').forEach(function(el) {
                                el.classList.remove('drop-zone-hover');
                            });
                            
                            // Add highlight to current drop zone
                            dropZone.classList.add('drop-zone-hover');
                        }
                    }
                }
                
                // Touch end handler
                function handleTouchEnd(e) {
                    if (!touchDragState.currentElement) return;
                    
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                    
                    // Only process if dragging actually occurred
                    if (touchDragState.isDragging) {
                        var touch = e.changedTouches[0];
                        var elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        var dropZone = elementBelow ? elementBelow.closest('.drop-zone') : null;
                        
                        // Remove highlighting
                        document.querySelectorAll('.drop-zone-hover').forEach(function(el) {
                            el.classList.remove('drop-zone-hover');
                        });
                        
                        // If we have a drop zone, trigger the drop
                        if (dropZone) {
                            // Create a synthetic event
                            var dragEndEvent = new CustomEvent('mkb:touchdragend', {
                                bubbles: true,
                                detail: {
                                    draggedElement: touchDragState.currentElement,
                                    dropZone: dropZone,
                                    touch: touch
                                }
                            });
                            
                            // Dispatch the event on the drop zone
                            dropZone.dispatchEvent(dragEndEvent);
                            
                            // If there's a global handler for this, call it
                            if (typeof window.handleTouchDrop === 'function') {
                                window.handleTouchDrop(touchDragState.currentElement, dropZone, touch);
                            }
                        }
                    }
                    
                    // Clean up
                    if (touchDragState.ghost) {
                        touchDragState.ghost.parentNode.removeChild(touchDragState.ghost);
                        touchDragState.ghost = null;
                    }
                    
                    touchDragState.currentElement.classList.remove('touch-dragging');
                    touchDragState.isDragging = false;
                    touchDragState.currentElement = null;
                }
                
                // Create a ghost element for dragging
                function createDragGhost(element) {
                    // Create ghost
                    var ghost = element.cloneNode(true);
                    ghost.classList.add('touch-drag-ghost');
                    ghost.style.position = 'fixed';
                    ghost.style.zIndex = '9999';
                    ghost.style.opacity = '0';
                    ghost.style.pointerEvents = 'none';
                    
                    // Position ghost at original element position
                    var rect = element.getBoundingClientRect();
                    ghost.style.width = rect.width + 'px';
                    ghost.style.height = rect.height + 'px';
                    ghost.style.left = rect.left + 'px';
                    ghost.style.top = rect.top + 'px';
                    
                    // Add ghost to body
                    document.body.appendChild(ghost);
                    touchDragState.ghost = ghost;
                }
            });
        },

        /**
         * Make interface elements more touch-friendly on mobile devices
         */
        enhanceTouchTargets: function() {
            var self = this;
            
            // Only run once DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                if (!self.browser.isMobile) return;
                
                // Find small control buttons and make them larger
                var smallControls = document.querySelectorAll('.control-btn, .section-control-btn, .option-btn');
                smallControls.forEach(function(control) {
                    // Ensure minimum touch target size (44x44px is recommended)
                    if (control.offsetWidth < 44 || control.offsetHeight < 44) {
                        control.style.minWidth = '44px';
                        control.style.minHeight = '44px';
                        control.classList.add('touch-enhanced');
                    }
                });
                
                // Add extra spacing to dropdown menus
                var dropdownItems = document.querySelectorAll('.dropdown-item, .menu-item');
                dropdownItems.forEach(function(item) {
                    item.style.padding = '12px';
                    item.classList.add('touch-enhanced');
                });
            });
        },

        /**
         * Add object-fit fallback for browsers that don't support it
         * @param {string} selector - CSS selector for images that need object-fit
         * @param {string} objectFit - object-fit value (cover, contain, etc.)
         */
        objectFitFallback: function(selector, objectFit) {
            // Only apply if object-fit is not supported
            if (this.features.objectFit) return;
            
            var images = document.querySelectorAll(selector);
            
            images.forEach(function(img) {
                // Get image source
                var src = img.getAttribute('src');
                if (!src) return;
                
                // Hide the image
                img.style.opacity = '0';
                
                // Add a background image to the parent
                var parent = img.parentNode;
                parent.style.backgroundImage = 'url(' + src + ')';
                parent.style.backgroundRepeat = 'no-repeat';
                
                // Set background size based on object-fit value
                if (objectFit === 'cover') {
                    parent.style.backgroundSize = 'cover';
                    parent.style.backgroundPosition = 'center center';
                } else if (objectFit === 'contain') {
                    parent.style.backgroundSize = 'contain';
                    parent.style.backgroundPosition = 'center center';
                }
                
                // Mark as processed
                parent.classList.add('object-fit-fallback');
            });
        }
    };

    // Initialize compatibility features when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        MKBCompat.init();
    });
})();