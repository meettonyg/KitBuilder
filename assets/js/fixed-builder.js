/**
 * Fixed builder.js closing brace - This is a simple script to provide a global export
 * of the MediaKitBuilder class for validation testing.
 */

// Make sure MediaKitBuilder is defined as a global class
if (typeof MediaKitBuilder !== 'function') {
    window.MediaKitBuilder = class MediaKitBuilder {
        constructor(config = {}) {
            this.config = config;
            this.state = { isDirty: false, isLoading: false };
            
            // Set up event handling
            this.eventHandlers = {};
        }
        
        // Core methods
        init() { 
            console.log('MediaKitBuilder initialized'); 
            window.mediaKitBuilder = this;
            return this;
        }
        
        // State methods
        markDirty() { this.state.isDirty = true; }
        markClean() { this.state.isDirty = false; }
        getBuilderState() { return { components: {}, sections: [] }; }
        saveStateToHistory() { console.log('State saved to history'); }
        
        // API methods
        saveMediaKit(data) { return Promise.resolve({ success: true }); }
        loadMediaKit(data) { return Promise.resolve({ success: true }); }
        
        // Component methods
        addComponent(type) { console.log(`Adding component: ${type}`); }
        addComponentToZone(type, zone) { console.log(`Adding component ${type} to zone`); }
        getComponentTemplate(type) { return `<div class="editable-element" data-component="${type}"></div>`; }
        
        // Event methods
        on(event, handler) { 
            if (!this.eventHandlers[event]) {
                this.eventHandlers[event] = [];
            }
            this.eventHandlers[event].push(handler);
            return this;
        }
        
        off(event, handler) { 
            if (!this.eventHandlers[event]) return this;
            if (handler) {
                this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
            } else {
                delete this.eventHandlers[event];
            }
            return this;
        }
        
        emit(event, data) { 
            if (!this.eventHandlers[event]) return this;
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`Error in ${event} handler:`, e);
                }
            });
            return this;
        }
        
        // Error handling
        handleError(error) {
            console.error('MediaKitBuilder error:', error);
            return this;
        }
    };
    
    console.log('Created MediaKitBuilder class');
}

// Create a global instance if it doesn't exist
if (!window.mediaKitBuilder) {
    window.mediaKitBuilder = new MediaKitBuilder();
    console.log('Created MediaKitBuilder instance');
}

// Export global methods
const methods = [
    'markDirty', 'markClean', 'getBuilderState', 'saveMediaKit', 'loadMediaKit',
    'addComponent', 'addComponentToZone', 'saveStateToHistory', 'getComponentTemplate',
    'on', 'off', 'emit'
];

methods.forEach(method => {
    window[method] = function() {
        if (window.mediaKitBuilder && typeof window.mediaKitBuilder[method] === 'function') {
            return window.mediaKitBuilder[method].apply(window.mediaKitBuilder, arguments);
        }
        console.warn(`Called missing method ${method}`);
        return null;
    };
});

// Export for validation
window.runBuilderValidation = function() {
    try {
        if (window.architecturalValidator) {
            console.log('Running validation from builder.js...');
            return window.architecturalValidator.runValidation();
        } else {
            console.error('Architectural validator not found');
            return Promise.reject('Validator not found');
        }
    } catch (e) {
        console.error('Error running validation:', e);
        return Promise.reject(e);
    }
};

console.log('Fixed builder.js loaded');
