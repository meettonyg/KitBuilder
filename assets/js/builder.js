/**
 * Media Kit Builder - Core Builder Class
 * 
 * This file contains the core functionality for the Media Kit Builder,
 * independent of WordPress or any other platform.
 */

console.log('🔧 builder.js loading... ' + new Date().toISOString());

// Make sure global namespace is set up correctly
if (!window.MediaKitBuilder) {
    window.MediaKitBuilder = {};
}

// Set up global reference object
window.MediaKitBuilder.global = window.MediaKitBuilder.global || {};
// Store the MediaKitBuilder class in the global object
window.MediaKitBuilder.Core = MediaKitBuilder;

// Define init function if it doesn't exist yet
if (!window.MediaKitBuilder.init) {
    window.MediaKitBuilder.init = function() {
        console.log('MediaKitBuilder.init called from builder.js');
        if (window.MediaKitBuilder.global.instance) {
            window.MediaKitBuilder.global.instance.init();
        } else {
            console.log('MediaKitBuilder instance not found yet');
            window.MediaKitBuilder.shouldInitialize = true;
        }
    };
}

(function($) {
    'use strict';
    
    // Ensure jQuery is available
    if (typeof $ === 'undefined') {
        console.error('jQuery is not loaded. Media Kit Builder requires jQuery.');
        return;
    }
    
    /**
     * MediaKitBuilder Class
     * Core builder functionality for the Media Kit Builder
     */
    class MediaKitBuilder {
        /**
         * Constructor
         * @param {Object} config - Configuration options
         */
        constructor(config = {}) {
            console.log('MediaKitBuilder constructor called with config:', config);
            
            // Configuration with defaults
            this.config = {
                container: '#media-kit-builder',
                previewContainer: '#media-kit-preview',
                componentPalette: '#component-palette',
                autoSaveInterval: 30000,  // 30 seconds
                maxUndoStackSize: 50,
                debugging: true,
                ...config
            };
            
            // State management
            this.state = {
                initialized: false,
                isDirty: false,
                isLoading: false,
                selectedElement: null,
                selectedSection: null,
                undoStack: [],
                redoStack: [],
                currentEntryKey: null,
                lastSaved: null,
                errors: []
            };
            
            // DOM Elements cache
            this.elements = {};
            
            // Event handlers
            this.eventHandlers = {};
            
            // Expose properties globally
            this.exposePropertiesGlobally();
            
            // Initialize
            this.init();
        }
        
        /**
         * Expose important properties and methods globally for cross-file access
         */
        exposePropertiesGlobally() {
            // Make sure global namespace exists
            if (!window.MediaKitBuilder.global) {
                window.MediaKitBuilder.global = {};
            }
            
            // Store reference to this instance
            window.MediaKitBuilder.global.instance = this;
            
            // Expose important properties
            window.MediaKitBuilder.global.state = this.state;
            window.MediaKitBuilder.global.config = this.config;
            window.MediaKitBuilder.global.elements = this.elements;
            
            // Expose essential methods
            window.MediaKitBuilder.global.getComponentTemplate = this.getComponentTemplate.bind(this);
            window.MediaKitBuilder.global.addComponent = this.addComponent.bind(this);
            window.MediaKitBuilder.global.addComponentToZone = this.addComponentToZone.bind(this);
            window.MediaKitBuilder.global.saveStateToHistory = this.saveStateToHistory.bind(this);
            window.MediaKitBuilder.global.getBuilderState = this.getBuilderState.bind(this);
            window.MediaKitBuilder.global.markDirty = this.markDirty.bind(this);
            window.MediaKitBuilder.global.markClean = this.markClean.bind(this);
            
            // Expose event system
            window.MediaKitBuilder.global.on = this.on.bind(this);
            window.MediaKitBuilder.global.off = this.off.bind(this);
            window.MediaKitBuilder.global.emit = this.emit.bind(this);
            
            console.log('Exposed MediaKitBuilder properties globally');
        }
        
        /**
         * Initialize the builder
         */
        init() {
            try {
                console.log('Initializing Media Kit Builder...');
                
                if (this.state.initialized) {
                    console.log('Media Kit Builder already initialized');
                    return;
                }
                
                // Get DOM elements
                this.cacheElements();
                
                // Check required elements - use elements from initializer if available
                if ((!this.elements.container || !this.elements.preview || !this.elements.palette) && window.MediaKitBuilder.elements) {
                    console.log('Using elements from initializer');
                    this.elements = window.MediaKitBuilder.elements;
                }
                
                // Final check if elements exist
                if (!this.elements.container || !this.elements.preview || !this.elements.palette) {
                    console.warn('Required DOM elements still not found. Builder containers might not be ready yet.');
                    this.setupDelayedInitialization();
                    return;
                }
                
                // Initialize components
                this.setupTabs();
                this.setupComponentPalette();
                this.setupDragAndDrop();
                this.setupUndoRedo();
                this.setupEventListeners();
                this.setupAutoSave();
                
                // Mark as initialized
                this.state.initialized = true;
                
                // Emit initialized event
                this.emit('initialized', { timestamp: new Date() });
                console.log('Media Kit Builder initialized successfully');
                
                // Update global references now that everything is initialized
                this.exposePropertiesGlobally();
                    
                // Export global instance for backward compatibility
                window.mediaKitBuilder = this;
                    
                // Expose initialization complete flag
                window.MediaKitBuilder.global.initialized = true;
                    
                // Dispatch global event for other modules
                document.dispatchEvent(new CustomEvent('mediakit-builder-initialized', { detail: this }));
            } catch (error) {
                console.error('Error initializing Media Kit Builder:', error);
                this.handleError(error, 'initialization');
            }
        }
        
        /**
         * Setup delayed initialization to wait for DOM elements
         */
        setupDelayedInitialization() {
            console.log('Setting up delayed initialization...');
            
            let attempts = 0;
            const maxAttempts = 20; // Increased max attempts for better reliability
            
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`Attempt ${attempts} to find builder containers...`);
                
                this.cacheElements();
                
                if (this.elements.container && this.elements.preview && this.elements.palette) {
                    console.log('Builder containers found, continuing initialization...');
                    clearInterval(checkInterval);
                    this.init();
                } else if (attempts >= maxAttempts) {
                    console.error('Failed to find builder containers after multiple attempts');
                    clearInterval(checkInterval);
                    
                    // Try to create containers as a last resort
                    this.createContainers();
                    
                    // Also emit an error event that can be handled by debug tools
                    if (this.emit) {
                        this.emit('initialization-failed', {
                            reason: 'containers-not-found',
                            attempts: attempts,
                            elements: {
                                container: !!this.elements.container,
                                preview: !!this.elements.preview,
                                palette: !!this.elements.palette
                            }
                        });
                    }
                }
            }, 500);
        }
        
        /**
         * Create containers if they don't exist
         */
        createContainers() {
            console.log('Attempting to create builder containers...');
            
            // Check if containers already exist
            if (document.querySelector(this.config.container)) {
                console.log('Builder container already exists');
                return;
            }
            
            // Find a suitable location for the builder
            const content = document.querySelector('.content-area, .entry-content, main, #content, .site-content');
            
            // Create builder container
            const container = document.createElement('div');
            container.id = this.config.container.replace('#', '');
            container.className = 'media-kit-builder';
            
            // Create preview container
            const preview = document.createElement('div');
            preview.id = this.config.previewContainer.replace('#', '');
            preview.className = 'media-kit-preview';
            
            // Create component palette
            const palette = document.createElement('div');
            palette.id = this.config.componentPalette.replace('#', '');
            palette.className = 'component-palette';
            
            // Add components to builder
            container.appendChild(preview);
            container.appendChild(palette);
            
            // Add builder to page
            if (content) {
                content.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
            
            console.log('Builder containers created');
            
            // Cache elements and try initialization again
            this.cacheElements();
            this.init();
        }
        
        /**
         * Cache DOM elements for better performance
         */
        cacheElements() {
            console.log('Caching DOM elements...');
            
            this.elements = {
                container: document.querySelector(this.config.container),
                preview: document.querySelector(this.config.previewContainer),
                palette: document.querySelector(this.config.componentPalette),
                designPanel: document.querySelector('#design-panel'),
                saveButton: document.querySelector('#save-btn'),
                undoButton: document.querySelector('#undo-btn'),
                redoButton: document.querySelector('#redo-btn'),
                saveStatus: document.querySelector('#save-status'),
                tabs: document.querySelectorAll('.sidebar-tab'),
                tabContents: document.querySelectorAll('.tab-content')
            };
            
            console.log('DOM elements cached:', 
                        'container:', !!this.elements.container, 
                        'preview:', !!this.elements.preview, 
                        'palette:', !!this.elements.palette);
        }
        
        /**
         * Setup sidebar tabs
         */
        setupTabs() {
            if (!this.elements.tabs || !this.elements.tabContents) {
                console.warn('Tabs elements not found');
                return;
            }
            
            console.log('Setting up tabs...');
            
            this.elements.tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    try {
                        // Remove active class from all tabs and contents
                        this.elements.tabs.forEach(t => t.classList.remove('active'));
                        this.elements.tabContents.forEach(c => c.classList.remove('active'));
                        
                        // Add active class to clicked tab and corresponding content
                        tab.classList.add('active');
                        const tabId = tab.getAttribute('data-tab');
                        const tabContent = this.elements.container.querySelector(`#${tabId}-tab`);
                        if (tabContent) {
                            tabContent.classList.add('active');
                            this.emit('tab-changed', { tab: tabId });
                        } else {
                            console.warn(`Tab content #${tabId}-tab not found`);
                        }
                    } catch (error) {
                        this.handleError(error, 'tab switching');
                    }
                });
            });
            
            console.log('Tabs setup complete');
        }
        
        /**
         * Setup component palette
         */
        setupComponentPalette() {
            try {
                console.log('Setting up component palette...');
                
                if (!this.elements.palette) {
                    console.warn('Component palette not found');
                    return;
                }
                
                const components = this.elements.palette.querySelectorAll('.component-item');
                console.log(`Found ${components.length} components in palette`);
                
                components.forEach((component, index) => {
                    console.log(`Setting up component ${index + 1}: ${component.getAttribute('data-component')}`);
                    
                    // Drag start
                    component.addEventListener('dragstart', e => {
                        try {
                            const componentType = component.getAttribute('data-component');
                            e.dataTransfer.setData('text/plain', componentType);
                            e.dataTransfer.effectAllowed = 'copy';
                            
                            // Add dragging class
                            component.classList.add('dragging');
                            
                            this.emit('component-drag-start', { type: componentType, element: component });
                            
                            console.log(`Component drag started: ${componentType}`);
                        } catch (error) {
                            this.handleError(error, 'component drag start');
                        }
                    });
                    
                    // Drag end
                    component.addEventListener('dragend', () => {
                        component.classList.remove('dragging');
                    });
                    
                    // Click to add
                    component.addEventListener('click', () => {
                        try {
                            const componentType = component.getAttribute('data-component');
                            const isPremium = component.hasAttribute('data-premium') && 
                                              component.getAttribute('data-premium') === 'true';
                            
                            console.log(`Component clicked: ${componentType}, premium: ${isPremium}`);
                            
                            // Check if premium component is allowed
                            if (isPremium && this.config.wpData && 
                                this.config.wpData.accessTier !== 'pro' && 
                                this.config.wpData.accessTier !== 'agency' && 
                                !this.config.wpData.isAdmin) {
                                
                                this.emit('premium-access-required', {
                                    feature: 'component',
                                    type: componentType
                                });
                                return;
                            }
                            
                            this.addComponent(componentType);
                        } catch (error) {
                            this.handleError(error, 'component click');
                        }
                    });
                });
                
                console.log('Component palette setup complete');
            } catch (error) {
                this.handleError(error, 'component palette setup');
            }
        }
        
        /**
         * Setup drag and drop functionality
         */
        setupDragAndDrop() {
            try {
                console.log('Setting up drag and drop...');
                
                if (!this.elements.preview) {
                    console.warn('Preview container not found');
                    return;
                }
                
                const dropZones = this.elements.preview.querySelectorAll('.drop-zone');
                console.log(`Found ${dropZones.length} drop zones`);
                
                if (dropZones.length === 0) {
                    console.log('No drop zones found, creating initial drop zone');
                    this.createInitialDropZone();
                    return;
                }
                
                dropZones.forEach((zone, index) => {
                    console.log(`Setting up drop zone ${index + 1}`);
                    
                    // Handle dragover
                    zone.addEventListener('dragover', e => {
                        e.preventDefault();
                        zone.classList.add('drag-over');
                    });
                    
                    // Handle dragleave
                    zone.addEventListener('dragleave', () => {
                        zone.classList.remove('drag-over');
                    });
                    
                    // Handle drop
                    zone.addEventListener('drop', e => {
                        try {
                            e.preventDefault();
                            zone.classList.remove('drag-over');
                            
                            const transferData = e.dataTransfer.getData('text/plain');
                            console.log(`Drop event with data: ${transferData}`);
                            
                            // Handle component drop from palette
                            if (transferData && !transferData.includes('component-')) {
                                const componentType = transferData;
                                this.addComponentToZone(componentType, zone);
                                return;
                            }
                            
                            // Handle existing component move
                            if (transferData && transferData.includes('component-')) {
                                const componentId = transferData;
                                const component = document.querySelector(`[data-component-id="${componentId}"]`);
                                
                                if (component && component.parentNode !== zone) {
                                    zone.appendChild(component);
                                    zone.classList.remove('empty');
                                    
                                    if (component.parentNode.querySelectorAll('.editable-element').length === 0) {
                                        component.parentNode.classList.add('empty');
                                    }
                                    
                                    this.saveStateToHistory();
                                    this.markDirty();
                                    
                                    this.emit('component-moved', { 
                                        id: componentId, 
                                        component: component,
                                        target: zone
                                    });
                                    
                                    console.log(`Component ${componentId} moved`);
                                }
                            }
                        } catch (error) {
                            this.handleError(error, 'drop handling');
                        }
                    });
                });
                
                console.log('Drag and drop setup complete');
            } catch (error) {
                this.handleError(error, 'drag and drop setup');
            }
        }
        
        /**
         * Create initial drop zone
         */
        createInitialDropZone() {
            try {
                console.log('Creating initial drop zone...');
                
                if (!this.elements.preview) {
                    console.warn('Preview container not found');
                    return;
                }
                
                // Clear preview container
                this.elements.preview.innerHTML = '';
                
                // Create initial section if using sections
                const section = document.createElement('div');
                section.className = 'media-kit-section';
                section.setAttribute('data-section-id', 'section-' + Date.now());
                section.setAttribute('data-section-type', 'content');
                section.setAttribute('data-section-layout', 'full-width');
                
                // Create section content
                const sectionContent = document.createElement('div');
                sectionContent.className = 'section-content layout-full-width';
                
                // Create column
                const column = document.createElement('div');
                column.className = 'section-column';
                column.setAttribute('data-column', 'full');
                
                // Create drop zone
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone empty';
                dropZone.setAttribute('data-zone', 'zone-' + Date.now());
                
                // Add empty state message
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-title">Your Media Kit is Empty</div>
                    <div class="empty-state-desc">Drag components from the sidebar or click the "Add Component" button to get started.</div>
                `;
                
                dropZone.appendChild(emptyState);
                
                // Assemble the structure
                column.appendChild(dropZone);
                sectionContent.appendChild(column);
                section.appendChild(sectionContent);
                this.elements.preview.appendChild(section);
                
                // Setup drop zone event listeners
                this.setupDragAndDrop();
                
                console.log('Initial drop zone created');
            } catch (error) {
                this.handleError(error, 'create initial drop zone');
            }
        }
        
        /**
         * Add component to the preview
         * @param {string} componentType - Component type to add
         */
        addComponent(componentType) {
            try {
                console.log(`Adding component: ${componentType}`);
                
                // Find the first drop zone
                const dropZone = this.elements.preview.querySelector('.drop-zone');
                if (dropZone) {
                    this.addComponentToZone(componentType, dropZone);
                } else {
                    console.warn('No drop zone found in preview');
                    this.createInitialDropZone();
                    
                    // Try again with the new drop zone
                    setTimeout(() => {
                        const newDropZone = this.elements.preview.querySelector('.drop-zone');
                        if (newDropZone) {
                            this.addComponentToZone(componentType, newDropZone);
                        } else {
                            throw new Error('Failed to create drop zone');
                        }
                    }, 100);
                }
            } catch (error) {
                this.handleError(error, 'add component');
            }
        }
        
        /**
         * Add component to a specific drop zone
         * @param {string} componentType - Component type
         * @param {HTMLElement} dropZone - Drop zone element
         */
        addComponentToZone(componentType, dropZone) {
            try {
                console.log(`Adding component ${componentType} to drop zone`);
                
                // Get component template
                const template = this.getComponentTemplate(componentType);
                if (!template) {
                    throw new Error(`Component template not found: ${componentType}`);
                }
                
                // Remove empty state if present
                const emptyState = dropZone.querySelector('.empty-state');
                if (emptyState) {
                    emptyState.remove();
                }
                
                // Create component element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = template;
                const component = tempDiv.firstElementChild;
                
                if (!component) {
                    throw new Error('Failed to create component element');
                }
                
                // Generate unique component ID
                const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                component.setAttribute('data-component-id', componentId);
                
                // Add to drop zone
                dropZone.appendChild(component);
                dropZone.classList.remove('empty');
                
                // Setup event listeners
                this.setupElementEventListeners(component);
                
                // Save state to history
                this.saveStateToHistory();
                
                // Mark as dirty
                this.markDirty();
                
                // Emit event
                this.emit('component-added', {
                    type: componentType,
                    id: componentId,
                    element: component
                });
                
                console.log(`Component ${componentType} added with ID: ${componentId}`);
                
                return componentId;
            } catch (error) {
                this.handleError(error, 'add component to zone');
                return null;
            }
        }
        
        /**
         * Get component template HTML
         * @param {string} componentType - Component type
         * @returns {string} Component template HTML
         */
        getComponentTemplate(componentType) {
            // This would be populated with actual templates
            const templates = {
                'biography': `
                    <div class="editable-element" data-component="biography">
                        <div class="element-header">
                            <div class="element-title">Biography</div>
                            <div class="element-controls">
                                <button class="control-btn move-up-btn" title="Move Up">↑</button>
                                <button class="control-btn move-down-btn" title="Move Down">↓</button>
                                <button class="control-btn duplicate-btn" title="Duplicate">⧉</button>
                                <button class="control-btn delete-btn" title="Delete">✕</button>
                            </div>
                        </div>
                        <div class="editable-content" contenteditable="true">
                            Enter your biography here. This should be 300-500 words about yourself, your expertise, and what makes you unique.
                        </div>
                    </div>
                `,
                'topics': `
                    <div class="editable-element" data-component="topics">
                        <div class="element-header">
                            <div class="element-title">Topics</div>
                            <div class="element-controls">
                                <button class="control-btn move-up-btn" title="Move Up">↑</button>
                                <button class="control-btn move-down-btn" title="Move Down">↓</button>
                                <button class="control-btn duplicate-btn" title="Duplicate">⧉</button>
                                <button class="control-btn delete-btn" title="Delete">✕</button>
                            </div>
                        </div>
                        <div class="topics-container">
                            <div class="topic-item">
                                <div class="topic-text" contenteditable="true">Topic 1</div>
                            </div>
                            <div class="topic-item">
                                <div class="topic-text" contenteditable="true">Topic 2</div>
                            </div>
                            <div class="topic-item">
                                <div class="topic-text" contenteditable="true">Topic 3</div>
                            </div>
                            <div class="add-topic">+ Add Topic</div>
                        </div>
                    </div>
                `,
                'questions': `
                    <div class="editable-element" data-component="questions">
                        <div class="element-header">
                            <div class="element-title">Questions</div>
                            <div class="element-controls">
                                <button class="control-btn move-up-btn" title="Move Up">↑</button>
                                <button class="control-btn move-down-btn" title="Move Down">↓</button>
                                <button class="control-btn duplicate-btn" title="Duplicate">⧉</button>
                                <button class="control-btn delete-btn" title="Delete">✕</button>
                            </div>
                        </div>
                        <div class="questions-container">
                            <div class="question-item">
                                <div class="question-text" contenteditable="true">What inspired you to start your career?</div>
                            </div>
                            <div class="question-item">
                                <div class="question-text" contenteditable="true">What's your favorite part of your work?</div>
                            </div>
                            <div class="question-item">
                                <div class="question-text" contenteditable="true">What do you want people to know about your expertise?</div>
                            </div>
                            <div class="add-question">+ Add Question</div>
                        </div>
                    </div>
                `,
                'social': `
                    <div class="editable-element" data-component="social">
                        <div class="element-header">
                            <div class="element-title">Social Media</div>
                            <div class="element-controls">
                                <button class="control-btn move-up-btn" title="Move Up">↑</button>
                                <button class="control-btn move-down-btn" title="Move Down">↓</button>
                                <button class="control-btn duplicate-btn" title="Duplicate">⧉</button>
                                <button class="control-btn delete-btn" title="Delete">✕</button>
                            </div>
                        </div>
                        <div class="social-container">
                            <div class="social-item">
                                <div class="social-platform">Twitter</div>
                                <div class="social-link" contenteditable="true">https://twitter.com/yourusername</div>
                            </div>
                            <div class="social-item">
                                <div class="social-platform">LinkedIn</div>
                                <div class="social-link" contenteditable="true">https://linkedin.com/in/yourusername</div>
                            </div>
                            <div class="social-item">
                                <div class="social-platform">Instagram</div>
                                <div class="social-link" contenteditable="true">https://instagram.com/yourusername</div>
                            </div>
                            <div class="add-social">+ Add Platform</div>
                        </div>
                    </div>
                `,
                'logo': `
                    <div class="editable-element" data-component="logo">
                        <div class="element-header">
                            <div class="element-title">Logo</div>
                            <div class="element-controls">
                                <button class="control-btn move-up-btn" title="Move Up">↑</button>
                                <button class="control-btn move-down-btn" title="Move Down">↓</button>
                                <button class="control-btn duplicate-btn" title="Duplicate">⧉</button>
                                <button class="control-btn delete-btn" title="Delete">✕</button>
                            </div>
                        </div>
                        <div class="logo-container">
                            <div class="logo-placeholder">
                                <div class="upload-button">Upload Logo</div>
                            </div>
                        </div>
                    </div>
                `
            };
            
            return templates[componentType] || null;
        }
        
        /**
         * Event system: Add event listener
         * @param {string} event - Event name
         * @param {Function} handler - Event handler
         */
        on(event, handler) {
            try {
                if (!this.eventHandlers[event]) {
                    this.eventHandlers[event] = [];
                }
                this.eventHandlers[event].push(handler);
                
                return () => this.off(event, handler); // Return unsubscribe function
            } catch (error) {
                this.handleError(error, 'event subscription');
            }
        }
        
        /**
         * Event system: Remove event listener
         * @param {string} event - Event name
         * @param {Function} handler - Event handler
         */
        off(event, handler) {
            try {
                if (!this.eventHandlers[event]) return;
                this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
            } catch (error) {
                this.handleError(error, 'event unsubscription');
            }
        }
        
        /**
         * Event system: Emit event
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        emit(event, data) {
            try {
                if (!this.eventHandlers[event]) return;
                
                // Include event name and timestamp in data
                const eventData = {
                    ...data,
                    _event: event,
                    _timestamp: new Date()
                };
                
                // Call each handler with data
                this.eventHandlers[event].forEach(handler => {
                    try {
                        handler(eventData);
                    } catch (error) {
                        this.handleError(error, `event handler for ${event}`);
                    }
                });
            } catch (error) {
                this.handleError(error, 'event emission');
            }
        }
        
        /**
         * Setup element event listeners
         * @param {HTMLElement} element - Component element
         */
        setupElementEventListeners(element) {
            try {
                console.log(`Setting up event listeners for component: ${element.getAttribute('data-component')}`);
                
                // Select element on click
                element.addEventListener('click', e => {
                    try {
                        // Prevent triggering if clicking on controls
                        if (e.target.closest('.element-controls')) {
                            return;
                        }
                        
                        // Select the element
                        this.selectElement(element);
                    } catch (error) {
                        this.handleError(error, 'element click');
                    }
                });
                
                // Setup control buttons
                const moveUpBtn = element.querySelector('.move-up-btn');
                const moveDownBtn = element.querySelector('.move-down-btn');
                const duplicateBtn = element.querySelector('.duplicate-btn');
                const deleteBtn = element.querySelector('.delete-btn');
                
                if (moveUpBtn) {
                    moveUpBtn.addEventListener('click', () => this.moveElementUp(element));
                }
                
                if (moveDownBtn) {
                    moveDownBtn.addEventListener('click', () => this.moveElementDown(element));
                }
                
                if (duplicateBtn) {
                    duplicateBtn.addEventListener('click', () => this.duplicateElement(element));
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteElement(element));
                }
                
                // Setup content editing
                const editableContent = element.querySelectorAll('[contenteditable="true"]');
                editableContent.forEach(content => {
                    // Debounce input events
                    let inputTimeout;
                    content.addEventListener('input', () => {
                        clearTimeout(inputTimeout);
                        this.markDirty();
                        
                        // Save state after 1 second of inactivity
                        inputTimeout = setTimeout(() => {
                            this.saveStateToHistory();
                        }, 1000);
                    });
                    
                    content.addEventListener('blur', () => {
                        clearTimeout(inputTimeout);
                        this.saveStateToHistory();
                    });
                    
                    // Prevent enter key in some elements
                    content.addEventListener('keydown', e => {
                        // Prevent enter key in single-line elements
                        const isSingleLine = content.classList.contains('topic-text') || 
                                            content.classList.contains('social-link');
                        
                        if (isSingleLine && e.key === 'Enter') {
                            e.preventDefault();
                        }
                    });
                });
                
                // Dynamic item buttons
                const addTopicBtn = element.querySelector('.add-topic');
                if (addTopicBtn) {
                    addTopicBtn.addEventListener('click', () => this.addTopicItem(element));
                }
                
                const addQuestionBtn = element.querySelector('.add-question');
                if (addQuestionBtn) {
                    addQuestionBtn.addEventListener('click', () => this.addQuestionItem(element));
                }
                
                const addSocialBtn = element.querySelector('.add-social');
                if (addSocialBtn) {
                    addSocialBtn.addEventListener('click', () => this.addSocialItem(element));
                }
                
                // Make element draggable
                element.setAttribute('draggable', 'true');
                
                element.addEventListener('dragstart', e => {
                    try {
                        e.dataTransfer.setData('text/plain', element.getAttribute('data-component-id'));
                        e.dataTransfer.effectAllowed = 'move';
                        element.classList.add('dragging');
                    } catch (error) {
                        this.handleError(error, 'element drag start');
                    }
                });
                
                element.addEventListener('dragend', () => {
                    element.classList.remove('dragging');
                });
            } catch (error) {
                this.handleError(error, 'setup element event listeners');
            }
        }
        
        /**
         * Setup undo/redo functionality
         */
        setupUndoRedo() {
            try {
                console.log('Setting up undo/redo functionality...');
                
                // Get undo/redo buttons
                if (this.elements.undoButton) {
                    this.elements.undoButton.addEventListener('click', () => this.undo());
                }
                
                if (this.elements.redoButton) {
                    this.elements.redoButton.addEventListener('click', () => this.redo());
                }
                
                // Keyboard shortcuts
                document.addEventListener('keydown', e => {
                    try {
                        // Skip if within editable content
                        if (e.target.closest('[contenteditable="true"]')) {
                            return;
                        }
                        
                        // Ctrl+Z for undo
                        if (e.ctrlKey && e.key === 'z') {
                            e.preventDefault();
                            this.undo();
                        }
                        
                        // Ctrl+Y or Ctrl+Shift+Z for redo
                        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                            e.preventDefault();
                            this.redo();
                        }
                    } catch (error) {
                        this.handleError(error, 'keyboard shortcut');
                    }
                });
                
                // Update undo/redo button states
                this.updateUndoRedoButtons();
                
                console.log('Undo/redo functionality setup complete');
            } catch (error) {
                this.handleError(error, 'undo/redo setup');
            }
        }
        
        /**
         * Setup event listeners
         */
        setupEventListeners() {
            try {
                console.log('Setting up event listeners...');
                
                // Save button
                if (this.elements.saveButton) {
                    this.elements.saveButton.addEventListener('click', () => {
                        this.emit('save-requested', this.getBuilderState());
                    });
                }
                
                // Window unload warning
                window.addEventListener('beforeunload', e => {
                    if (this.state.isDirty) {
                        const message = 'You have unsaved changes. Are you sure you want to leave?';
                        e.returnValue = message;
                        return message;
                    }
                });
                
                // Click outside to deselect
                document.addEventListener('click', e => {
                    try {
                        // Skip if clicking within the builder or on controls
                        if (e.target.closest(this.config.container) || 
                            e.target.closest('.mkb-notification')) {
                            return;
                        }
                        
                        // Deselect current element
                        this.selectElement(null);
                        
                        // Deselect current section
                        if (this.state.selectedSection) {
                            this.state.selectedSection.classList.remove('selected');
                            this.state.selectedSection = null;
                            this.clearDesignPanel();
                        }
                    } catch (error) {
                        this.handleError(error, 'document click');
                    }
                });
                
                console.log('Event listeners setup complete');
            } catch (error) {
                this.handleError(error, 'setup event listeners');
            }
        }
        
        /**
         * Setup auto-save functionality
         */
        setupAutoSave() {
            try {
                console.log('Setting up auto-save...');
                
                // Clear any existing timer
                if (this.autoSaveTimer) {
                    clearInterval(this.autoSaveTimer);
                }
                
                // Auto-save every 30 seconds if changes exist
                this.autoSaveTimer = setInterval(() => {
                    if (this.state.isDirty) {
                        this.emit('auto-save-triggered', {
                            timestamp: new Date(),
                            data: this.getBuilderState()
                        });
                    }
                }, this.config.autoSaveInterval);
                
                console.log(`Auto-save setup complete with interval: ${this.config.autoSaveInterval}ms`);
            } catch (error) {
                this.handleError(error, 'auto-save setup');
            }
        }
        
        /**
         * Mark the builder as dirty (unsaved changes)
         */
        markDirty() {
            try {
                if (!this.state.isDirty) {
                    this.state.isDirty = true;
                    this.emit('dirty-state-changed', { isDirty: true });
                    
                    // Update UI to show unsaved changes
                    if (this.elements.saveStatus) {
                        this.elements.saveStatus.textContent = 'Unsaved changes';
                        this.elements.saveStatus.classList.add('unsaved');
                    }
                    
                    // Update save button
                    if (this.elements.saveButton) {
                        this.elements.saveButton.classList.add('needs-save');
                    }
                }
            } catch (error) {
                this.handleError(error, 'mark dirty');
            }
        }
        
        /**
         * Mark the builder as clean (no unsaved changes)
         */
        markClean() {
            try {
                if (this.state.isDirty) {
                    this.state.isDirty = false;
                    this.emit('dirty-state-changed', { isDirty: false });
                    
                    // Update UI to show saved
                    if (this.elements.saveStatus) {
                        this.elements.saveStatus.textContent = 'Saved';
                        this.elements.saveStatus.classList.remove('unsaved');
                    }
                    
                    // Update save button
                    if (this.elements.saveButton) {
                        this.elements.saveButton.classList.remove('needs-save');
                    }
                    
                    // Update last saved time
                    this.state.lastSaved = new Date();
                }
            } catch (error) {
                this.handleError(error, 'mark clean');
            }
        }
        
        /**
         * Set loading state
         * @param {boolean} isLoading - Loading state
         */
        setLoading(isLoading) {
            try {
                this.state.isLoading = isLoading;
                this.emit('loading-state-changed', { isLoading });
                
                // Update UI
                if (this.elements.container) {
                    if (isLoading) {
                        this.elements.container.classList.add('is-loading');
                    } else {
                        this.elements.container.classList.remove('is-loading');
                    }
                }
            } catch (error) {
                this.handleError(error, 'set loading');
            }
        }
        
        /**
         * Select an element
         * @param {HTMLElement} element - Element to select
         */
        selectElement(element) {
            try {
                // Deselect current element
                if (this.state.selectedElement) {
                    this.state.selectedElement.classList.remove('selected');
                }
                
                // Select new element
                if (element) {
                    element.classList.add('selected');
                    this.state.selectedElement = element;
                    this.updateDesignPanel(element);
                    
                    // Deselect current section
                    if (this.state.selectedSection) {
                        this.state.selectedSection.classList.remove('selected');
                        this.state.selectedSection = null;
                    }
                } else {
                    this.state.selectedElement = null;
                    this.clearDesignPanel();
                }
                
                this.emit('element-selected', { element });
            } catch (error) {
                this.handleError(error, 'select element');
            }
        }
        
        /**
         * Update design panel for selected element
         * @param {HTMLElement} element - Selected element
         */
        updateDesignPanel(element) {
            try {
                if (!this.elements.designPanel) return;
                
                const componentType = element.getAttribute('data-component');
                if (!componentType) return;
                
                // Get component properties and render controls
                const properties = this.getComponentProperties(componentType, element);
                this.elements.designPanel.innerHTML = this.renderDesignControls(properties);
                
                // Setup event handlers for controls
                this.setupDesignControls(this.elements.designPanel, element);
                
                // Switch to design tab
                const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
                if (designTab) {
                    designTab.click();
                }
            } catch (error) {
                this.handleError(error, 'update design panel');
            }
        }
        
        /**
         * Clear design panel
         */
        clearDesignPanel() {
            try {
                if (this.elements.designPanel) {
                    this.elements.designPanel.innerHTML = `
                        <div class="panel-message">
                            <p>Select an element to edit its properties</p>
                            <p>OR</p>
                            <p>Select a section to change its layout</p>
                        </div>
                    `;
                }
            } catch (error) {
                this.handleError(error, 'clear design panel');
            }
        }
        
        /**
         * Get component properties
         * @param {string} componentType - Component type
         * @param {HTMLElement} element - Component element
         * @returns {Object} Component properties
         */
        getComponentProperties(componentType, element) {
            try {
                // This would be populated with actual properties
                const properties = {
                    'biography': [
                        { name: 'fontSize', label: 'Font Size', type: 'select', options: ['small', 'medium', 'large'] },
                        { name: 'textAlign', label: 'Text Alignment', type: 'select', options: ['left', 'center', 'right'] },
                        { name: 'fontColor', label: 'Text Color', type: 'color', value: '#000000' }
                    ],
                    'topics': [
                        { name: 'columns', label: 'Columns', type: 'select', options: ['1', '2', '3'] },
                        { name: 'style', label: 'Style', type: 'select', options: ['default', 'pills', 'cards'] },
                        { name: 'backgroundColor', label: 'Background Color', type: 'color', value: '#f5f5f5' }
                    ],
                    'questions': [
                        { name: 'style', label: 'Style', type: 'select', options: ['default', 'accordion', 'cards'] },
                        { name: 'questionColor', label: 'Question Color', type: 'color', value: '#000000' }
                    ],
                    'social': [
                        { name: 'style', label: 'Style', type: 'select', options: ['icons', 'buttons', 'text'] },
                        { name: 'size', label: 'Size', type: 'select', options: ['small', 'medium', 'large'] },
                        { name: 'color', label: 'Icon Color', type: 'color', value: '#3b5998' }
                    ],
                    'logo': [
                        { name: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
                        { name: 'maxWidth', label: 'Max Width', type: 'range', min: 100, max: 500, step: 10, value: 200 },
                        { name: 'margin', label: 'Margin', type: 'range', min: 0, max: 100, step: 5, value: 20 }
                    ]
                };
                
                // Set current values from element
                const props = properties[componentType] || [];
                
                props.forEach(prop => {
                    // Get current value from element
                    if (prop.type === 'select') {
                        if (prop.name === 'fontSize') {
                            const fontSize = element.style.fontSize;
                            if (fontSize) {
                                if (fontSize.includes('small')) prop.value = 'small';
                                else if (fontSize.includes('large')) prop.value = 'large';
                                else prop.value = 'medium';
                            } else {
                                prop.value = 'medium';
                            }
                        } else if (prop.name === 'textAlign') {
                            prop.value = element.style.textAlign || 'left';
                        } else if (prop.name === 'columns') {
                            prop.value = element.getAttribute('data-columns') || '2';
                        } else if (prop.name === 'style') {
                            prop.value = element.getAttribute('data-style') || 'default';
                        } else if (prop.name === 'alignment') {
                            const justifyContent = element.style.justifyContent;
                            if (justifyContent === 'flex-start') prop.value = 'left';
                            else if (justifyContent === 'flex-end') prop.value = 'right';
                            else prop.value = 'center';
                        } else if (prop.name === 'size') {
                            prop.value = element.getAttribute('data-size') || 'medium';
                        }
                    } else if (prop.type === 'range') {
                        if (prop.name === 'maxWidth') {
                            const maxWidth = element.style.maxWidth;
                            prop.value = maxWidth ? parseInt(maxWidth) : 200;
                        } else if (prop.name === 'margin') {
                            const margin = element.style.margin;
                            prop.value = margin ? parseInt(margin) : 20;
                        }
                    } else if (prop.type === 'color') {
                        if (prop.name === 'fontColor') {
                            prop.value = element.style.color || '#000000';
                        } else if (prop.name === 'backgroundColor') {
                            prop.value = element.style.backgroundColor || '#f5f5f5';
                        } else if (prop.name === 'questionColor') {
                            const questions = element.querySelectorAll('.question-text');
                            if (questions.length > 0) {
                                prop.value = questions[0].style.color || '#000000';
                            }
                        } else if (prop.name === 'color') {
                            prop.value = element.style.color || '#3b5998';
                        }
                    }
                });
                
                return props;
            } catch (error) {
                this.handleError(error, 'get component properties');
                return [];
            }
        }
        
        /**
         * Render design controls
         * @param {Array} properties - Component properties
         * @returns {string} HTML for design controls
         */
        renderDesignControls(properties) {
            try {
                let html = '<div class="design-controls">';
                
                properties.forEach(prop => {
                    html += `<div class="control-group">`;
                    html += `<label class="control-label">${prop.label}</label>`;
                    
                    if (prop.type === 'select') {
                        html += `<select class="control-input" data-property="${prop.name}">`;
                        prop.options.forEach(option => {
                            const selected = option === prop.value ? 'selected' : '';
                            html += `<option value="${option}" ${selected}>${option}</option>`;
                        });
                        html += `</select>`;
                    } else if (prop.type === 'range') {
                        html += `
                            <div class="range-control">
                                <input type="range" class="control-input" data-property="${prop.name}" 
                                       min="${prop.min}" max="${prop.max}" step="${prop.step}" value="${prop.value || prop.min}">
                                <span class="range-value">${prop.value || prop.min}${prop.unit || ''}</span>
                            </div>
                        `;
                    } else if (prop.type === 'color') {
                        html += `
                            <div class="color-control">
                                <input type="color" class="control-input" data-property="${prop.name}" value="${prop.value || '#000000'}">
                                <input type="text" class="color-text" value="${prop.value || '#000000'}" data-for="${prop.name}">
                            </div>
                        `;
                    }
                    
                    html += `</div>`;
                });
                
                html += '</div>';
                return html;
            } catch (error) {
                this.handleError(error, 'render design controls');
                return '<div class="error-message">Error rendering controls</div>';
            }
        }
        
        /**
         * Setup design controls event handlers
         * @param {HTMLElement} panel - Design panel element
         * @param {HTMLElement} element - Component element
         */
        setupDesignControls(panel, element) {
            try {
                const controls = panel.querySelectorAll('.control-input');
                
                controls.forEach(control => {
                    const property = control.getAttribute('data-property');
                    const type = control.type;
                    
                    if (type === 'select' || type === 'range') {
                        control.addEventListener('change', () => {
                            const value = control.value;
                            
                            // Update range value display
                            if (type === 'range') {
                                const valueDisplay = control.nextElementSibling;
                                if (valueDisplay) {
                                    valueDisplay.textContent = value + (control.dataset.unit || '');
                                }
                            }
                            
                            // Apply property to element
                            this.applyPropertyToElement(element, property, value);
                            
                            // Mark as dirty
                            this.markDirty();
                            
                            // Save state to history
                            this.saveStateToHistory();
                        });
                    } else if (type === 'color') {
                        // Update text input when color changes
                        control.addEventListener('input', () => {
                            const value = control.value;
                            const textInput = control.parentNode.querySelector('.color-text');
                            if (textInput) {
                                textInput.value = value;
                            }
                            
                            // Apply property to element
                            this.applyPropertyToElement(element, property, value);
                            
                            // Mark as dirty
                            this.markDirty();
                        });
                        
                        control.addEventListener('change', () => {
                            // Save state to history on final change
                            this.saveStateToHistory();
                        });
                        
                        // Update color input when text changes
                        const textInput = control.parentNode.querySelector('.color-text');
                        if (textInput) {
                            textInput.addEventListener('input', () => {
                                const value = textInput.value;
                                // Validate as hex color
                                if (/^#[0-9A-F]{6}$/i.test(value)) {
                                    control.value = value;
                                    
                                    // Apply property to element
                                    this.applyPropertyToElement(element, property, value);
                                    
                                    // Mark as dirty
                                    this.markDirty();
                                }
                            });
                            
                            textInput.addEventListener('blur', () => {
                                // Revert to control value if invalid
                                textInput.value = control.value;
                                
                                // Save state to history
                                this.saveStateToHistory();
                            });
                        }
                    }
                });
            } catch (error) {
                this.handleError(error, 'setup design controls');
            }
        }
        
        /**
         * Apply property to element
         * @param {HTMLElement} element - Component element
         * @param {string} property - Property name
         * @param {string} value - Property value
         */
        applyPropertyToElement(element, property, value) {
            try {
                const componentType = element.getAttribute('data-component');
                
                switch (property) {
                    case 'fontSize':
                        element.style.fontSize = value;
                        break;
                    case 'textAlign':
                        element.style.textAlign = value;
                        break;
                    case 'fontColor':
                        element.style.color = value;
                        break;
                    case 'columns':
                        element.setAttribute('data-columns', value);
                        // Apply column layout to topics container
                        if (componentType === 'topics') {
                            const topicsContainer = element.querySelector('.topics-container');
                            if (topicsContainer) {
                                topicsContainer.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
                            }
                        }
                        break;
                    case 'style':
                        element.setAttribute('data-style', value);
                        // Apply styles based on component type
                        if (componentType === 'topics') {
                            const topicItems = element.querySelectorAll('.topic-item');
                            topicItems.forEach(item => {
                                item.className = `topic-item style-${value}`;
                            });
                        } else if (componentType === 'questions') {
                            element.querySelector('.questions-container').className = `questions-container style-${value}`;
                        } else if (componentType === 'social') {
                            element.querySelector('.social-container').className = `social-container style-${value}`;
                        }
                        break;
                    case 'backgroundColor':
                        if (componentType === 'topics') {
                            const topicItems = element.querySelectorAll('.topic-item');
                            topicItems.forEach(item => {
                                item.style.backgroundColor = value;
                            });
                        } else {
                            element.style.backgroundColor = value;
                        }
                        break;
                    case 'questionColor':
                        if (componentType === 'questions') {
                            const questions = element.querySelectorAll('.question-text');
                            questions.forEach(question => {
                                question.style.color = value;
                            });
                        }
                        break;
                    case 'alignment':
                        if (componentType === 'logo') {
                            const logoContainer = element.querySelector('.logo-container');
                            if (logoContainer) {
                                logoContainer.style.textAlign = value;
                            }
                        } else {
                            element.style.justifyContent = value === 'left' ? 'flex-start' : (value === 'right' ? 'flex-end' : 'center');
                        }
                        break;
                    case 'maxWidth':
                        if (componentType === 'logo') {
                            const logoImg = element.querySelector('img');
                            if (logoImg) {
                                logoImg.style.maxWidth = value + 'px';
                            }
                        } else {
                            element.style.maxWidth = value + 'px';
                        }
                        break;
                    case 'margin':
                        element.style.margin = value + 'px';
                        break;
                    case 'size':
                        element.setAttribute('data-size', value);
                        if (componentType === 'social') {
                            const socialItems = element.querySelectorAll('.social-item');
                            socialItems.forEach(item => {
                                item.className = `social-item size-${value}`;
                            });
                        }
                        break;
                    case 'color':
                        if (componentType === 'social') {
                            const socialItems = element.querySelectorAll('.social-item');
                            socialItems.forEach(item => {
                                item.style.color = value;
                            });
                        } else {
                            element.style.color = value;
                        }
                        break;
                }
                
                // Emit property changed event
                this.emit('property-changed', {
                    element: element,
                    property: property,
                    value: value,
                    componentType: componentType
                });
            } catch (error) {
                this.handleError(error, 'apply property to element');
            }
        }
        
        /**
         * Add a new topic item
         * @param {HTMLElement} element - Topics component
         */
        addTopicItem(element) {
            try {
                const topicsContainer = element.querySelector('.topics-container');
                const addButton = element.querySelector('.add-topic');
                
                if (topicsContainer && addButton) {
                    // Create new topic item
                    const topicItem = document.createElement('div');
                    topicItem.className = 'topic-item';
                    topicItem.innerHTML = `<div class="topic-text" contenteditable="true">New Topic</div>`;
                    
                    // Insert before add button
                    topicsContainer.insertBefore(topicItem, addButton);
                    
                    // Setup contenteditable
                    const textElement = topicItem.querySelector('.topic-text');
                    textElement.addEventListener('input', () => this.markDirty());
                    textElement.addEventListener('blur', () => this.saveStateToHistory());
                    
                    // Select the new topic text
                    textElement.focus();
                    document.execCommand('selectAll', false, null);
                    
                    // Save state to history
                    this.saveStateToHistory();
                    this.markDirty();
                }
            } catch (error) {
                this.handleError(error, 'add topic item');
            }
        }
        
        /**
         * Add a new question item
         * @param {HTMLElement} element - Questions component
         */
        addQuestionItem(element) {
            try {
                const questionsContainer = element.querySelector('.questions-container');
                const addButton = element.querySelector('.add-question');
                
                if (questionsContainer && addButton) {
                    // Create new question item
                    const questionItem = document.createElement('div');
                    questionItem.className = 'question-item';
                    questionItem.innerHTML = `<div class="question-text" contenteditable="true">New Question</div>`;
                    
                    // Insert before add button
                    questionsContainer.insertBefore(questionItem, addButton);
                    
                    // Setup contenteditable
                    const textElement = questionItem.querySelector('.question-text');
                    textElement.addEventListener('input', () => this.markDirty());
                    textElement.addEventListener('blur', () => this.saveStateToHistory());
                    
                    // Select the new question text
                    textElement.focus();
                    document.execCommand('selectAll', false, null);
                    
                    // Save state to history
                    this.saveStateToHistory();
                    this.markDirty();
                }
            } catch (error) {
                this.handleError(error, 'add question item');
            }
        }
        
        /**
         * Add a new social media item
         * @param {HTMLElement} element - Social component
         */
        addSocialItem(element) {
            try {
                const socialContainer = element.querySelector('.social-container');
                const addButton = element.querySelector('.add-social');
                
                if (socialContainer && addButton) {
                    // Create new social item
                    const socialItem = document.createElement('div');
                    socialItem.className = 'social-item';
                    socialItem.innerHTML = `
                        <div class="social-platform">
                            <select class="platform-select">
                                <option value="Facebook">Facebook</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Instagram">Instagram</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="YouTube">YouTube</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Pinterest">Pinterest</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="social-link" contenteditable="true">https://</div>
                    `;
                    
                    // Insert before add button
                    socialContainer.insertBefore(socialItem, addButton);
                    
                    // Setup contenteditable
                    const linkElement = socialItem.querySelector('.social-link');
                    linkElement.addEventListener('input', () => this.markDirty());
                    linkElement.addEventListener('blur', () => this.saveStateToHistory());
                    
                    // Setup select
                    const selectElement = socialItem.querySelector('.platform-select');
                    selectElement.addEventListener('change', () => {
                        const platform = selectElement.value;
                        
                        // If "Other" is selected, replace with a text input
                        if (platform === 'Other') {
                            const platformElement = socialItem.querySelector('.social-platform');
                            platformElement.innerHTML = `<input type="text" class="platform-input" placeholder="Platform Name" value="Custom">`;
                            
                            // Setup input
                            const inputElement = platformElement.querySelector('.platform-input');
                            inputElement.addEventListener('input', () => this.markDirty());
                            inputElement.addEventListener('blur', () => this.saveStateToHistory());
                            
                            // Focus the input
                            inputElement.focus();
                            inputElement.select();
                        } else {
                            // Update the default URL placeholder based on platform
                            const defaultUrls = {
                                'Facebook': 'https://facebook.com/',
                                'Twitter': 'https://twitter.com/',
                                'Instagram': 'https://instagram.com/',
                                'LinkedIn': 'https://linkedin.com/in/',
                                'YouTube': 'https://youtube.com/c/',
                                'TikTok': 'https://tiktok.com/@',
                                'Pinterest': 'https://pinterest.com/'
                            };
                            
                            linkElement.textContent = defaultUrls[platform] || 'https://';
                        }
                        
                        this.markDirty();
                        this.saveStateToHistory();
                    });
                    
                    // Focus the link element
                    linkElement.focus();
                    document.execCommand('selectAll', false, null);
                    
                    // Save state to history
                    this.saveStateToHistory();
                    this.markDirty();
                }
            } catch (error) {
                this.handleError(error, 'add social item');
            }
        }
        
        /**
         * Move element up
         * @param {HTMLElement} element - Element to move
         */
        moveElementUp(element) {
            try {
                const previousElement = element.previousElementSibling;
                if (previousElement && previousElement.classList.contains('editable-element')) {
                    element.parentNode.insertBefore(element, previousElement);
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('element-moved', {
                        element: element,
                        direction: 'up',
                        previous: previousElement
                    });
                }
            } catch (error) {
                this.handleError(error, 'move element up');
            }
        }
        
        /**
         * Move element down
         * @param {HTMLElement} element - Element to move
         */
        moveElementDown(element) {
            try {
                const nextElement = element.nextElementSibling;
                if (nextElement && nextElement.classList.contains('editable-element')) {
                    element.parentNode.insertBefore(nextElement, element);
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('element-moved', {
                        element: element,
                        direction: 'down',
                        next: nextElement
                    });
                }
            } catch (error) {
                this.handleError(error, 'move element down');
            }
        }
        
        /**
         * Duplicate element
         * @param {HTMLElement} element - Element to duplicate
         */
        duplicateElement(element) {
            try {
                const clone = element.cloneNode(true);
                const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                clone.setAttribute('data-component-id', componentId);
                
                element.parentNode.insertBefore(clone, element.nextSibling);
                this.setupElementEventListeners(clone);
                
                this.saveStateToHistory();
                this.markDirty();
                
                this.emit('element-duplicated', {
                    original: element,
                    duplicate: clone,
                    componentId: componentId
                });
                
                return clone;
            } catch (error) {
                this.handleError(error, 'duplicate element');
                return null;
            }
        }
        
        /**
         * Delete element
         * @param {HTMLElement} element - Element to delete
         */
        deleteElement(element) {
            try {
                // Ask for confirmation
                if (confirm('Are you sure you want to delete this element?')) {
                    // Deselect if this element is selected
                    if (this.state.selectedElement === element) {
                        this.selectElement(null);
                    }
                    
                    // Store element data for undo/event
                    const elementData = {
                        id: element.getAttribute('data-component-id'),
                        type: element.getAttribute('data-component'),
                        parentNode: element.parentNode,
                        nextSibling: element.nextSibling
                    };
                    
                    element.remove();
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('element-deleted', elementData);
                }
            } catch (error) {
                this.handleError(error, 'delete element');
            }
        }
        
        /**
         * Save state to history
         */
        saveStateToHistory() {
            try {
                // Capture current state
                const currentState = this.getBuilderState();
                
                // Add to undo stack
                this.state.undoStack.push(currentState);
                
                // Clear redo stack when new state is added
                this.state.redoStack = [];
                
                // Limit undo stack size
                if (this.state.undoStack.length > this.config.maxUndoStackSize) {
                    this.state.undoStack.shift();
                }
                
                // Update undo/redo buttons
                this.updateUndoRedoButtons();
                
                this.emit('history-updated', {
                    undoStackSize: this.state.undoStack.length,
                    redoStackSize: this.state.redoStack.length
                });
            } catch (error) {
                this.handleError(error, 'save state to history');
            }
        }
        
        /**
         * Update undo/redo button states
         */
        updateUndoRedoButtons() {
            try {
                if (this.elements.undoButton) {
                    if (this.state.undoStack.length > 0) {
                        this.elements.undoButton.classList.remove('disabled');
                    } else {
                        this.elements.undoButton.classList.add('disabled');
                    }
                }
                
                if (this.elements.redoButton) {
                    if (this.state.redoStack.length > 0) {
                        this.elements.redoButton.classList.remove('disabled');
                    } else {
                        this.elements.redoButton.classList.add('disabled');
                    }
                }
            } catch (error) {
                this.handleError(error, 'update undo/redo buttons');
            }
        }
        
        /**
         * Undo the last action
         */
        undo() {
            try {
                if (this.state.undoStack.length === 0) return;
                
                // Get current state for redo
                const currentState = this.getBuilderState();
                
                // Add to redo stack
                this.state.redoStack.push(currentState);
                
                // Get previous state
                const previousState = this.state.undoStack.pop();
                
                // Apply previous state
                this.applyBuilderState(previousState);
                
                // Update undo/redo buttons
                this.updateUndoRedoButtons();
                
                // Mark as dirty
                this.markDirty();
                
                this.emit('undo-performed', { state: previousState });
            } catch (error) {
                this.handleError(error, 'undo');
            }
        }
        
        /**
         * Redo the last undone action
         */
        redo() {
            try {
                if (this.state.redoStack.length === 0) return;
                
                // Get current state for undo
                const currentState = this.getBuilderState();
                
                // Add to undo stack
                this.state.undoStack.push(currentState);
                
                // Get next state
                const nextState = this.state.redoStack.pop();
                
                // Apply next state
                this.applyBuilderState(nextState);
                
                // Update undo/redo buttons
                this.updateUndoRedoButtons();
                
                // Mark as dirty
                this.markDirty();
                
                this.emit('redo-performed', { state: nextState });
            } catch (error) {
                this.handleError(error, 'redo');
            }
        }
        
        /**
         * Get current builder state
         * @returns {Object} Builder state
         */
        getBuilderState() {
            try {
                // Return serialized builder state
                return {
                    components: this.collectComponentData(),
                    sections: this.collectSectionData(),
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                this.handleError(error, 'get builder state');
                return { components: {}, sections: [], timestamp: new Date().toISOString() };
            }
        }
        
        /**
         * Collect component data
         * @returns {Object} Component data
         */
        collectComponentData() {
            try {
                const components = {};
                const componentElements = this.elements.preview.querySelectorAll('.editable-element');
                
                componentElements.forEach(element => {
                    const componentId = element.getAttribute('data-component-id');
                    const componentType = element.getAttribute('data-component');
                    
                    if (componentId && componentType) {
                        components[componentId] = {
                            id: componentId,
                            type: componentType,
                            content: this.extractComponentContent(element),
                            styles: this.extractComponentStyles(element)
                        };
                    }
                });
                
                return components;
            } catch (error) {
                this.handleError(error, 'collect component data');
                return {};
            }
        }
        
        /**
         * Collect section data
         * @returns {Array} Section data
         */
        collectSectionData() {
            try {
                const sections = [];
                const sectionElements = this.elements.preview.querySelectorAll('.media-kit-section');
                
                sectionElements.forEach((section, index) => {
                    const sectionId = section.getAttribute('data-section-id') || `section-${Date.now()}-${index}`;
                    const sectionType = section.getAttribute('data-section-type') || 'content';
                    const sectionLayout = section.getAttribute('data-section-layout') || 'full-width';
                    
                    const sectionData = {
                        id: sectionId,
                        type: sectionType,
                        layout: sectionLayout,
                        order: index,
                        settings: this.extractSectionSettings(section),
                        components: this.extractSectionComponents(section)
                    };
                    
                    sections.push(sectionData);
                });
                
                return sections;
            } catch (error) {
                this.handleError(error, 'collect section data');
                return [];
            }
        }
        
        /**
         * Extract component content
         * @param {HTMLElement} element - Component element
         * @returns {Object} Component content
         */
        extractComponentContent(element) {
            try {
                const content = {};
                const componentType = element.getAttribute('data-component');
                
                // Extract biography content
                if (componentType === 'biography') {
                    const bioContent = element.querySelector('.editable-content');
                    if (bioContent) {
                        content.text = bioContent.innerHTML;
                    }
                }
                
                // Extract topics content
                else if (componentType === 'topics') {
                    content.topics = [];
                    const topicItems = element.querySelectorAll('.topic-text');
                    topicItems.forEach(topic => {
                        content.topics.push(topic.innerHTML);
                    });
                }
                
                // Extract questions content
                else if (componentType === 'questions') {
                    content.questions = [];
                    const questionItems = element.querySelectorAll('.question-text');
                    questionItems.forEach(question => {
                        content.questions.push(question.innerHTML);
                    });
                }
                
                // Extract social content
                else if (componentType === 'social') {
                    content.platforms = [];
                    const socialItems = element.querySelectorAll('.social-item');
                    socialItems.forEach(item => {
                        const platform = item.querySelector('.social-platform');
                        const link = item.querySelector('.social-link');
                        if (platform && link) {
                            content.platforms.push({
                                platform: platform.textContent,
                                link: link.textContent
                            });
                        }
                    });
                }
                
                // Extract logo content
                else if (componentType === 'logo') {
                    const logoImg = element.querySelector('img');
                    if (logoImg) {
                        content.url = logoImg.src;
                        content.alt = logoImg.alt;
                    }
                }
                
                return content;
            } catch (error) {
                this.handleError(error, 'extract component content');
                return {};
            }
        }
        
        /**
         * Extract component styles
         * @param {HTMLElement} element - Component element
         * @returns {Object} Component styles
         */
        extractComponentStyles(element) {
            try {
                const styles = {};
                
                // Extract inline styles
                const inlineStyles = element.getAttribute('style');
                if (inlineStyles) {
                    const styleProps = inlineStyles.split(';');
                    styleProps.forEach(prop => {
                        const parts = prop.split(':');
                        if (parts.length === 2) {
                            const [name, value] = parts.map(p => p.trim());
                            if (name && value) {
                                styles[name] = value;
                            }
                        }
                    });
                }
                
                // Extract custom attributes
                const dataColumns = element.getAttribute('data-columns');
                if (dataColumns) {
                    styles.columns = dataColumns;
                }
                
                const dataStyle = element.getAttribute('data-style');
                if (dataStyle) {
                    styles.style = dataStyle;
                }
                
                const dataSize = element.getAttribute('data-size');
                if (dataSize) {
                    styles.size = dataSize;
                }
                
                return styles;
            } catch (error) {
                this.handleError(error, 'extract component styles');
                return {};
            }
        }
        
        /**
         * Extract section settings
         * @param {HTMLElement} section - Section element
         * @returns {Object} Section settings
         */
        extractSectionSettings(section) {
            try {
                const settings = {
                    background: section.style.backgroundColor || '#ffffff',
                    padding: {
                        top: section.style.paddingTop || '48px',
                        bottom: section.style.paddingBottom || '48px'
                    }
                };
                
                return settings;
            } catch (error) {
                this.handleError(error, 'extract section settings');
                return {
                    background: '#ffffff',
                    padding: { top: '48px', bottom: '48px' }
                };
            }
        }
        
        /**
         * Extract section components
         * @param {HTMLElement} section - Section element
         * @returns {Object|Array} Section components
         */
        extractSectionComponents(section) {
            try {
                const sectionLayout = section.getAttribute('data-section-layout') || 'full-width';
                
                if (sectionLayout === 'full-width') {
                    // Single column layout - return array of component IDs
                    const componentIds = [];
                    const components = section.querySelectorAll('.editable-element');
                    components.forEach(comp => {
                        const componentId = comp.getAttribute('data-component-id');
                        if (componentId) {
                            componentIds.push(componentId);
                        }
                    });
                    return componentIds;
                } else {
                    // Multi-column layout - return object with column keys
                    const columns = section.querySelectorAll('.section-column');
                    const componentsByColumn = {};
                    
                    columns.forEach(column => {
                        const columnType = column.getAttribute('data-column');
                        if (columnType) {
                            componentsByColumn[columnType] = [];
                            const components = column.querySelectorAll('.editable-element');
                            components.forEach(comp => {
                                const componentId = comp.getAttribute('data-component-id');
                                if (componentId) {
                                    componentsByColumn[columnType].push(componentId);
                                }
                            });
                        }
                    });
                    
                    return componentsByColumn;
                }
            } catch (error) {
                this.handleError(error, 'extract section components');
                return [];
            }
        }
        
        /**
         * Apply builder state
         * @param {Object} state - Builder state
         */
        applyBuilderState(state) {
            try {
                // Clear builder
                this.clearBuilder();
                
                // Apply state to builder
                this.populateBuilder(state);
                
                this.emit('state-applied', { state });
            } catch (error) {
                this.handleError(error, 'apply builder state');
            }
        }
        
        /**
         * Clear builder
         */
        clearBuilder() {
            try {
                if (this.elements.preview) {
                    this.elements.preview.innerHTML = '';
                }
                
                // Clear selection state
                this.state.selectedElement = null;
                this.state.selectedSection = null;
                
                // Clear design panel
                this.clearDesignPanel();
            } catch (error) {
                this.handleError(error, 'clear builder');
            }
        }
        
        /**
         * Populate builder with state
         * @param {Object} state - Builder state
         */
        populateBuilder(state) {
            try {
                if (!state) {
                    console.warn('No state provided to populate builder');
                    return;
                }
                
                // Populate sections
                if (state.sections && state.sections.length > 0) {
                    this.populateFromSections(state);
                } else {
                    // Fallback to components only
                    this.populateFromComponents(state.components);
                }
            } catch (error) {
                this.handleError(error, 'populate builder');
            }
        }
        
        /**
         * Populate builder from sections
         * @param {Object} state - Builder state
         */
        populateFromSections(state) {
            try {
                // Sort sections by order
                const sortedSections = [...state.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
                
                sortedSections.forEach(section => {
                    const sectionEl = this.createSectionElement(section);
                    
                    // Add components to section based on layout
                    if (section.layout === 'full-width' && Array.isArray(section.components)) {
                        // Single column layout
                        const dropZone = sectionEl.querySelector('.section-column .drop-zone');
                        section.components.forEach(componentId => {
                            const componentData = state.components[componentId];
                            if (componentData) {
                                const componentEl = this.createComponentFromData(componentData);
                                if (dropZone && componentEl) {
                                    dropZone.appendChild(componentEl);
                                    dropZone.classList.remove('empty');
                                }
                            }
                        });
                    } else if (typeof section.components === 'object') {
                        // Multi-column layout
                        Object.entries(section.components).forEach(([columnType, componentIds]) => {
                            const dropZone = sectionEl.querySelector(`[data-column="${columnType}"] .drop-zone`);
                            componentIds.forEach(componentId => {
                                const componentData = state.components[componentId];
                                if (componentData) {
                                    const componentEl = this.createComponentFromData(componentData);
                                    if (dropZone && componentEl) {
                                        dropZone.appendChild(componentEl);
                                        dropZone.classList.remove('empty');
                                    }
                                }
                            });
                        });
                    }
                    
                    this.elements.preview.appendChild(sectionEl);
                });
                
                // Re-initialize event listeners
                this.setupElementSelection();
                this.setupDragAndDrop();
            } catch (error) {
                this.handleError(error, 'populate from sections');
            }
        }
        
        /**
         * Create section element
         * @param {Object} section - Section data
         * @returns {HTMLElement} Section element
         */
        createSectionElement(section) {
            try {
                const sectionEl = document.createElement('div');
                sectionEl.className = 'media-kit-section';
                sectionEl.setAttribute('data-section-id', section.id);
                sectionEl.setAttribute('data-section-type', section.type);
                sectionEl.setAttribute('data-section-layout', section.layout);
                
                // Apply section settings
                if (section.settings) {
                    if (section.settings.background) {
                        sectionEl.style.backgroundColor = section.settings.background;
                    }
                    
                    if (section.settings.padding) {
                        sectionEl.style.paddingTop = section.settings.padding.top;
                        sectionEl.style.paddingBottom = section.settings.padding.bottom;
                    }
                }
                
                // Create section content with appropriate layout
                const content = document.createElement('div');
                content.className = `section-content layout-${section.layout}`;
                
                // Generate columns based on layout
                content.innerHTML = this.generateColumnsForLayout(section.layout);
                
                // Add section controls
                const controls = document.createElement('div');
                controls.className = 'section-controls';
                controls.innerHTML = `
                    <button class="section-control-btn move-up-btn" title="Move Section Up">↑</button>
                    <button class="section-control-btn move-down-btn" title="Move Section Down">↓</button>
                    <button class="section-control-btn duplicate-btn" title="Duplicate Section">⧉</button>
                    <button class="section-control-btn delete-btn" title="Delete Section">✕</button>
                `;
                
                sectionEl.appendChild(controls);
                sectionEl.appendChild(content);
                
                // Add event listeners for section controls
                this.setupSectionControlListeners(sectionEl);
                
                return sectionEl;
            } catch (error) {
                this.handleError(error, 'create section element');
                
                // Return empty section as fallback
                const fallbackSection = document.createElement('div');
                fallbackSection.className = 'media-kit-section';
                fallbackSection.setAttribute('data-section-id', 'fallback-' + Date.now());
                fallbackSection.setAttribute('data-section-type', 'content');
                fallbackSection.setAttribute('data-section-layout', 'full-width');
                
                const content = document.createElement('div');
                content.className = 'section-content layout-full-width';
                content.innerHTML = this.generateColumnsForLayout('full-width');
                
                fallbackSection.appendChild(content);
                
                return fallbackSection;
            }
        }
        
        /**
         * Generate columns for layout
         * @param {string} layout - Layout type
         * @returns {string} Columns HTML
         */
        generateColumnsForLayout(layout) {
            try {
                // Generate unique IDs for drop zones
                const generateId = () => 'drop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                
                switch(layout) {
                    case 'two-column':
                        return `
                            <div class="section-column" data-column="left">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                            <div class="section-column" data-column="right">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                        `;
                    case 'three-column':
                        return `
                            <div class="section-column" data-column="left">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                            <div class="section-column" data-column="center">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                            <div class="section-column" data-column="right">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                        `;
                    case 'main-sidebar':
                        return `
                            <div class="section-column" data-column="main">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                            <div class="section-column" data-column="sidebar">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                        `;
                    default: // full-width
                        return `
                            <div class="section-column" data-column="full">
                                <div class="drop-zone empty" data-zone="${generateId()}"></div>
                            </div>
                        `;
                }
            } catch (error) {
                this.handleError(error, 'generate columns for layout');
                
                // Return default single column as fallback
                return `
                    <div class="section-column" data-column="full">
                        <div class="drop-zone empty" data-zone="fallback-${Date.now()}"></div>
                    </div>
                `;
            }
        }
        
        /**
         * Setup section control event listeners
         * @param {HTMLElement} section - Section element
         */
        setupSectionControlListeners(section) {
            try {
                const moveUpBtn = section.querySelector('.move-up-btn');
                const moveDownBtn = section.querySelector('.move-down-btn');
                const duplicateBtn = section.querySelector('.duplicate-btn');
                const deleteBtn = section.querySelector('.delete-btn');
                
                if (moveUpBtn) {
                    moveUpBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        this.moveSectionUp(section);
                    });
                }
                
                if (moveDownBtn) {
                    moveDownBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        this.moveSectionDown(section);
                    });
                }
                
                if (duplicateBtn) {
                    duplicateBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        this.duplicateSection(section);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        this.deleteSection(section);
                    });
                }
            } catch (error) {
                this.handleError(error, 'setup section control listeners');
            }
        }
        
        /**
         * Create component from data
         * @param {Object} componentData - Component data
         * @returns {HTMLElement} Component element
         */
        createComponentFromData(componentData) {
            try {
                if (!componentData || !componentData.type) {
                    console.warn('Invalid component data:', componentData);
                    return null;
                }
                
                // Get component template
                const template = this.getComponentTemplate(componentData.type);
                if (!template) {
                    console.warn(`Component template not found for type: ${componentData.type}`);
                    return null;
                }
                
                // Create component element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = template;
                const component = tempDiv.firstElementChild;
                
                if (!component) {
                    console.warn('Failed to create component element from template');
                    return null;
                }
                
                // Set component ID
                component.setAttribute('data-component-id', componentData.id);
                
                // Apply styles
                if (componentData.styles) {
                    Object.entries(componentData.styles).forEach(([prop, value]) => {
                        // Apply style properties
                        if (prop && value && !prop.includes('data-')) {
                            component.style[prop] = value;
                        }
                        
                        // Apply data attributes
                        if (prop === 'columns') {
                            component.setAttribute('data-columns', value);
                        } else if (prop === 'style') {
                            component.setAttribute('data-style', value);
                        } else if (prop === 'size') {
                            component.setAttribute('data-size', value);
                        }
                    });
                }
                
                // Apply content
                if (componentData.content) {
                    this.applyComponentContent(component, componentData.type, componentData.content);
                }
                
                // Setup event listeners
                this.setupElementEventListeners(component);
                
                return component;
            } catch (error) {
                this.handleError(error, 'create component from data');
                return null;
            }
        }
        
        /**
         * Apply component content
         * @param {HTMLElement} component - Component element
         * @param {string} type - Component type
         * @param {Object} content - Component content
         */
        applyComponentContent(component, type, content) {
            try {
                switch (type) {
                    case 'biography':
                        if (content.text) {
                            const bioContent = component.querySelector('.editable-content');
                            if (bioContent) {
                                bioContent.innerHTML = content.text;
                            }
                        }
                        break;
                    
                    case 'topics':
                        if (content.topics && Array.isArray(content.topics)) {
                            const topicsContainer = component.querySelector('.topics-container');
                            const addButton = component.querySelector('.add-topic');
                            
                            if (topicsContainer && addButton) {
                                // Remove existing topics
                                topicsContainer.querySelectorAll('.topic-item').forEach(item => item.remove());
                                
                                // Add topics from content
                                content.topics.forEach(topic => {
                                    const topicItem = document.createElement('div');
                                    topicItem.className = 'topic-item';
                                    topicItem.innerHTML = `<div class="topic-text" contenteditable="true">${topic}</div>`;
                                    
                                    // Insert before add button
                                    topicsContainer.insertBefore(topicItem, addButton);
                                    
                                    // Setup contenteditable
                                    const textElement = topicItem.querySelector('.topic-text');
                                    textElement.addEventListener('input', () => this.markDirty());
                                    textElement.addEventListener('blur', () => this.saveStateToHistory());
                                });
                            }
                        }
                        break;
                    
                    case 'questions':
                        if (content.questions && Array.isArray(content.questions)) {
                            const questionsContainer = component.querySelector('.questions-container');
                            const addButton = component.querySelector('.add-question');
                            
                            if (questionsContainer && addButton) {
                                // Remove existing questions
                                questionsContainer.querySelectorAll('.question-item').forEach(item => item.remove());
                                
                                // Add questions from content
                                content.questions.forEach(question => {
                                    const questionItem = document.createElement('div');
                                    questionItem.className = 'question-item';
                                    questionItem.innerHTML = `<div class="question-text" contenteditable="true">${question}</div>`;
                                    
                                    // Insert before add button
                                    questionsContainer.insertBefore(questionItem, addButton);
                                    
                                    // Setup contenteditable
                                    const textElement = questionItem.querySelector('.question-text');
                                    textElement.addEventListener('input', () => this.markDirty());
                                    textElement.addEventListener('blur', () => this.saveStateToHistory());
                                });
                            }
                        }
                        break;
                    
                    case 'social':
                        if (content.platforms && Array.isArray(content.platforms)) {
                            const socialContainer = component.querySelector('.social-container');
                            const addButton = component.querySelector('.add-social');
                            
                            if (socialContainer && addButton) {
                                // Remove existing social items
                                socialContainer.querySelectorAll('.social-item').forEach(item => item.remove());
                                
                                // Add platforms from content
                                content.platforms.forEach(platform => {
                                    const socialItem = document.createElement('div');
                                    socialItem.className = 'social-item';
                                    
                                    if (platform.platform && platform.link) {
                                        socialItem.innerHTML = `
                                            <div class="social-platform">${platform.platform}</div>
                                            <div class="social-link" contenteditable="true">${platform.link}</div>
                                        `;
                                        
                                        // Insert before add button
                                        socialContainer.insertBefore(socialItem, addButton);
                                        
                                        // Setup contenteditable
                                        const linkElement = socialItem.querySelector('.social-link');
                                        linkElement.addEventListener('input', () => this.markDirty());
                                        linkElement.addEventListener('blur', () => this.saveStateToHistory());
                                    }
                                });
                            }
                        }
                        break;
                    
                    case 'logo':
                        if (content.url) {
                            const logoContainer = component.querySelector('.logo-container');
                            if (logoContainer) {
                                logoContainer.innerHTML = `
                                    <img src="${content.url}" alt="${content.alt || 'Logo'}" class="logo-image">
                                    <div class="upload-button">Change Logo</div>
                                `;
                            }
                        }
                        break;
                }
            } catch (error) {
                this.handleError(error, 'apply component content');
            }
        }
        
        /**
         * Populate builder from components (fallback for old data)
         * @param {Object} components - Component data
         */
        populateFromComponents(components) {
            try {
                if (!components || Object.keys(components).length === 0) {
                    console.warn('No components provided to populate builder');
                    this.createInitialDropZone();
                    return;
                }
                
                // Create initial section
                const section = this.createSectionElement({
                    id: 'section-' + Date.now(),
                    type: 'content',
                    layout: 'full-width',
                    order: 0,
                    settings: {
                        background: '#ffffff',
                        padding: { top: '48px', bottom: '48px' }
                    }
                });
                
                // Get drop zone
                const dropZone = section.querySelector('.drop-zone');
                if (!dropZone) {
                    console.warn('Drop zone not found in section');
                    return;
                }
                
                // Add components to drop zone
                Object.values(components).forEach(componentData => {
                    const componentEl = this.createComponentFromData(componentData);
                    if (componentEl) {
                        dropZone.appendChild(componentEl);
                        dropZone.classList.remove('empty');
                    }
                });
                
                // Add section to preview
                this.elements.preview.appendChild(section);
                
                // Re-initialize event listeners
                this.setupElementSelection();
                this.setupDragAndDrop();
            } catch (error) {
                this.handleError(error, 'populate from components');
            }
        }
        
        /**
         * Setup element selection
         */
        setupElementSelection() {
            try {
                const elements = this.elements.preview.querySelectorAll('.editable-element');
                
                elements.forEach(element => {
                    this.setupElementEventListeners(element);
                });
            } catch (error) {
                this.handleError(error, 'setup element selection');
            }
        }
        
        /**
         * Handle error
         * @param {Error} error - Error object
         * @param {string} context - Error context
         */
        handleError(error, context) {
            console.error(`Error in ${context}:`, error);
            
            // Track error in state
            this.state.errors.push({
                error: error.message,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString()
            });
            
            // Emit error event
            this.emit('error', {
                error: error.message,
                context,
                timestamp: new Date()
            });
        }
    }
    
	// Store the MediaKitBuilder class in the global object
	window.MediaKitBuilder.Core = MediaKitBuilder;
    
})(jQuery);
