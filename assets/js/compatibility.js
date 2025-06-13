/**
 * Media Kit Builder - Cross-Browser Compatibility
 *
 * This file ensures compatibility across different browsers and environments
 * by providing polyfills and browser-specific fixes.
 */

(function() {
    'use strict';

    // Log initialization
    console.log('📱 Media Kit Builder Compatibility - Loading...');

    // Browser detection
    var userAgent = navigator.userAgent;
    var browser = {
        isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
        isFirefox: /Firefox/.test(userAgent),
        isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
        isEdge: /Edge/.test(userAgent) || /Edg/.test(userAgent),
        isIE: /Trident|MSIE/.test(userAgent),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
        isIOS: /iPad|iPhone|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent)
    };

    // Add browser-specific classes to body
    function addBrowserClasses() {
        try {
            if (document.body) {
                if (browser.isChrome) document.body.classList.add('browser-chrome');
                if (browser.isFirefox) document.body.classList.add('browser-firefox');
                if (browser.isSafari) document.body.classList.add('browser-safari');
                if (browser.isEdge) document.body.classList.add('browser-edge');
                if (browser.isIE) document.body.classList.add('browser-ie');
                if (browser.isMobile) document.body.classList.add('browser-mobile');
                if (browser.isIOS) document.body.classList.add('browser-ios');
                if (browser.isAndroid) document.body.classList.add('browser-android');
            } else {
                // Body not available yet, wait for DOMContentLoaded
                document.addEventListener('DOMContentLoaded', addBrowserClasses);
            }
        } catch (error) {
            console.error('Error adding browser classes:', error);
        }
    }

    // Add browser classes either now or when DOM is ready
    addBrowserClasses();

    // Element.closest polyfill for IE and older browsers
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(s) {
            var el = this;
            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    // Element.matches polyfill for IE
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            };
    }

    // Array.from polyfill for IE
    if (!Array.from) {
        Array.from = function(object) {
            return [].slice.call(object);
        };
    }

    // NodeList.forEach polyfill for IE
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    // Object.assign polyfill for IE
    if (typeof Object.assign !== 'function') {
        Object.assign = function(target) {
            if (target === null || target === undefined) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];
                if (nextSource !== null && nextSource !== undefined) {
                    for (var nextKey in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }

    // Promise polyfill
    if (typeof window.Promise !== 'function') {
        console.log('Promise not supported, loading polyfill');
        // Simple Promise polyfill
        // For a complete polyfill, consider loading a dedicated library
        window.Promise = function(executor) {
            var callbacks = [];
            var state = 'pending';
            var value;

            function resolve(newValue) {
                if (state !== 'pending') return;
                state = 'fulfilled';
                value = newValue;
                executeCallbacks();
            }

            function reject(reason) {
                if (state !== 'pending') return;
                state = 'rejected';
                value = reason;
                executeCallbacks();
            }

            function executeCallbacks() {
                for (var i = 0; i < callbacks.length; i++) {
                    var callback = callbacks[i];
                    if (state === 'fulfilled') {
                        callback.onFulfilled && callback.onFulfilled(value);
                    } else {
                        callback.onRejected && callback.onRejected(value);
                    }
                }
                callbacks = [];
            }

            this.then = function(onFulfilled, onRejected) {
                return new Promise(function(resolve, reject) {
                    var wrappedCallback = {
                        onFulfilled: typeof onFulfilled === 'function' ? function(value) {
                            try {
                                resolve(onFulfilled(value));
                            } catch (error) {
                                reject(error);
                            }
                        } : null,
                        onRejected: typeof onRejected === 'function' ? function(reason) {
                            try {
                                resolve(onRejected(reason));
                            } catch (error) {
                                reject(error);
                            }
                        } : null
                    };

                    if (state === 'pending') {
                        callbacks.push(wrappedCallback);
                    } else {
                        setTimeout(function() {
                            if (state === 'fulfilled') {
                                wrappedCallback.onFulfilled && wrappedCallback.onFulfilled(value);
                            } else {
                                wrappedCallback.onRejected && wrappedCallback.onRejected(value);
                            }
                        }, 0);
                    }
                });
            };

            try {
                executor(resolve, reject);
            } catch (error) {
                reject(error);
            }
        };

        window.Promise.resolve = function(value) {
            return new Promise(function(resolve) {
                resolve(value);
            });
        };

        window.Promise.reject = function(reason) {
            return new Promise(function(resolve, reject) {
                reject(reason);
            });
        };
    }

    // RAF polyfill for IE and older browsers
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame =
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                return window.setTimeout(function() {
                    callback(Date.now());
                }, 1000 / 60);
            };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame =
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function(id) {
                clearTimeout(id);
            };
    }

    // Safari-specific fixes
    if (browser.isSafari) {
        // Safari flex fixes
        var style = document.createElement('style');
        style.textContent = `
            @media not all and (min-resolution:.001dpcm) { 
                @supports (-webkit-appearance:none) {
                    .section-content {
                        display: -webkit-box !important;
                        display: -webkit-flex !important;
                    }
                    
                    .section-column {
                        -webkit-flex: 1 !important;
                        -webkit-flex-shrink: 0 !important;
                    }
                    
                    .section-content--main-sidebar .section-column[data-column="main"] {
                        -webkit-flex: 2 !important;
                    }
                    
                    .section-content--main-sidebar .section-column[data-column="sidebar"] {
                        -webkit-flex: 1 !important;
                    }
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Touch device detection and enhancements
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('touch-device');
            
            // Make controls larger and more touch-friendly
            var style = document.createElement('style');
            style.textContent = `
                .touch-device .section-control-btn,
                .touch-device .component-control-btn {
                    min-width: 44px !important;
                    min-height: 44px !important;
                    font-size: 18px !important;
                }
                
                .touch-device .component-item {
                    padding: 12px !important;
                    margin-bottom: 8px !important;
                }
                
                .touch-device .form-input,
                .touch-device .form-textarea {
                    padding: 12px !important;
                    font-size: 16px !important; /* Prevent iOS zoom on focus */
                }
                
                /* Always somewhat visible controls on touch devices */
                .touch-device .section:hover .section-controls,
                .touch-device .section-controls,
                .touch-device .component:hover .component-controls,
                .touch-device .component-controls {
                    opacity: 0.9 !important;
                    visibility: visible !important;
                    transform: translateY(0) !important;
                }
            `;
            document.head.appendChild(style);
        });
    }

    // Make error handling available globally
    window.MediaKitBuilder = window.MediaKitBuilder || {};
    window.MediaKitBuilder.compatibility = {
        browser: browser,
        detectBrowser: function() { return browser; },
        isTouchDevice: function() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }
    };

    console.log('📱 Media Kit Builder Compatibility - Loaded ✅');
    
    // Expose browser info
    console.log('Browser detected:', browser);
})();
