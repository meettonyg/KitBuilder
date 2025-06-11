/**
 * Media Kit Builder - State Management
 * Simple state management for the React application
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function(window) {
    'use strict';
    
    console.log('📦 State management loaded');
    
    /**
     * Simple state manager
     */
    const StateManager = {
        state: {},
        listeners: [],
        
        /**
         * Get current state
         */
        getState() {
            return { ...this.state };
        },
        
        /**
         * Set state
         */
        setState(newState) {
            this.state = { ...this.state, ...newState };
            this.notifyListeners();
        },
        
        /**
         * Subscribe to state changes
         */
        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        },
        
        /**
         * Notify all listeners
         */
        notifyListeners() {
            this.listeners.forEach(listener => {
                try {
                    listener(this.state);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        },
        
        /**
         * Initialize with default state
         */
        init(initialState = {}) {
            this.state = {
                isLoaded: false,
                components: [],
                selectedComponent: null,
                template: 'default',
                settings: {
                    theme: 'blue',
                    colors: {
                        primary: '#0ea5e9',
                        secondary: '#64748b'
                    }
                },
                ...initialState
            };
        }
    };
    
    // Initialize state manager
    StateManager.init();
    
    // Make it globally available
    window.mkbState = StateManager;
    
})(window);
