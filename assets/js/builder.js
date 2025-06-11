/**
 * Media Kit Builder - Core Builder Class
 * 
 * This file contains the core functionality for the Media Kit Builder,
 * independent of WordPress or any other platform.
 */

(function() {
    'use strict';
    
    /**
     * MediaKitBuilder Class
     * Core builder functionality in a clean class-based architecture
     */
    class MediaKitBuilder {
        /**
         * Constructor
         * @param {Object} config - Configuration options
         */
        constructor(config = {}) {
            // Configuration with defaults
            this.config = {
                container: '#media-kit-builder',
                previewContainer: '#media-kit-preview',
                componentPalette: '#component-palette',
                autoSaveInterval: 30000,  // 30 seconds
                maxUndoStackSize: 50,
                debugging: false,
                ...config
            };
            
            // State management
            this.state = {
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
            
            // Sub-system managers
            this.managers = {
                template: null,
                component: null,
                section: null,
                drag: null,
                export: null
            };
            
            // DOM Elements cache
            this.elements = {
                container: null,
                preview: null,
                palette: null,
                designPanel: null,
                saveButton: null,
                undoButton: null,
                redoButton: null,
                saveStatus: null
            };
            
            // Event handlers
            this.eventHandlers = {};
            
            // Auto-save timer
            this.autoSaveTimer = null;
            
            // Initialize
            this.init();
        }
        
        /**
         * Initialize the builder
         */
        init() {
            try {
                this.log('Initializing Media Kit Builder...');
                
                // Get DOM elements
                this.cacheElements();
                
                // Check required elements
                if (!this.elements.container || !this.elements.preview || !this.elements.palette) {
                    throw new Error('Required DOM elements not found');
                }
                
                // Initialize components
                this.setupTabs();
                this.setupComponentPalette();
                this.setupDragAndDrop();
                this.setupUndoRedo();
                this.setupEventListeners();
                this.setupAutoSave();
                
                // Emit initialized event
                this.emit('initialized', { timestamp: new Date() });
                this.log('Media Kit Builder initialized');
            } catch (error) {
                this.handleError(error, 'initialization');
            }
        }
        
        /**
         * Cache DOM elements for better performance
         */
        cacheElements() {
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
        }
        
        /**
         * Setup sidebar tabs
         */
        setupTabs() {
            if (!this.elements.tabs || !this.elements.tabContents) {
                this.log('Tabs elements not found', 'warn');
                return;
            }
            
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
                            this.log(`Tab content #${tabId}-tab not found`, 'warn');
                        }
                    } catch (error) {
                        this.handleError(error, 'tab switching');
                    }
                });
            });
        }
        
        /**
         * Setup component palette
         */
        setupComponentPalette() {
            try {
                const components = this.elements.palette.querySelectorAll('.component-item');
                
                components.forEach(component => {
                    // Drag start
                    component.addEventListener('dragstart', e => {
                        try {
                            const componentType = component.getAttribute('data-component');
                            e.dataTransfer.setData('text/plain', componentType);
                            e.dataTransfer.effectAllowed = 'copy';
                            
                            // Add dragging class
                            component.classList.add('dragging');
                            
                            this.emit('component-drag-start', { type: componentType, element: component });
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
            } catch (error) {
                this.handleError(error, 'component palette setup');
            }
        }
        
        /**
         * Setup drag and drop functionality
         */
        setupDragAndDrop() {
            try {
                const dropZones = this.elements.preview.querySelectorAll('.drop-zone');
                
                dropZones.forEach(zone => {
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
                                }
                            }
                        } catch (error) {
                            this.handleError(error, 'drop handling');
                        }
                    });
                });
            } catch (error) {
                this.handleError(error, 'drag and drop setup');
            }
        }
        
        /**
         * Add component to the preview
         * @param {string} componentType - Component type to add
         */
        addComponent(componentType) {
            try {
                // Find the first drop zone
                const dropZone = this.elements.preview.querySelector('.drop-zone');
                if (dropZone) {
                    this.addComponentToZone(componentType, dropZone);
                } else {
                    throw new Error('No drop zone found in preview');
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
                // Get component template
                const template = this.getComponentTemplate(componentType);
                if (!template) {
                    throw new Error(`Component template not found: ${componentType}`);
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
         * Setup event listeners for a component
         * @param {HTMLElement} element - Component element
         */
        setupElementEventListeners(element) {
            try {
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
         * Setup undo/redo functionality
         */
        setupUndoRedo() {
            try {
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
            } catch (error) {
                this.handleError(error, 'undo/redo setup');
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
         * Setup general event listeners
         */
        setupEventListeners() {
            try {
                // Save button
                if (this.elements.saveButton) {
                    this.elements.saveButton.addEventListener('click', () => this.saveMediaKit());
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
            } catch (error) {
                this.handleError(error, 'setup event listeners');
            }
        }
        
        /**
         * Setup auto-save functionality
         */
        setupAutoSave() {
            try {
                // Clear any existing timer
                if (this.autoSaveTimer) {
                    clearInterval(this.autoSaveTimer);
                }
                
                // Auto-save every 30 seconds if changes exist
                this.autoSaveTimer = setInterval(() => {
                    if (this.state.isDirty) {
                        this.emit('auto-save-triggered', { timestamp: new Date() });
                    }
                }, this.config.autoSaveInterval);
            } catch (error) {
                this.handleError(error, 'auto-save setup');
            }
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
                    this.log('No state provided to populate builder', 'warn');
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
                this.setupDragAndDrop();
                this.setupSectionEventListeners();
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
         * Move section up
         * @param {HTMLElement} section - Section to move
         */
        moveSectionUp(section) {
            try {
                const previousSection = section.previousElementSibling;
                if (previousSection && previousSection.classList.contains('media-kit-section')) {
                    section.parentNode.insertBefore(section, previousSection);
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('section-moved', {
                        section: section,
                        direction: 'up',
                        previous: previousSection
                    });
                }
            } catch (error) {
                this.handleError(error, 'move section up');
            }
        }
        
        /**
         * Move section down
         * @param {HTMLElement} section - Section to move
         */
        moveSectionDown(section) {
            try {
                const nextSection = section.nextElementSibling;
                if (nextSection && nextSection.classList.contains('media-kit-section')) {
                    section.parentNode.insertBefore(nextSection, section);
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('section-moved', {
                        section: section,
                        direction: 'down',
                        next: nextSection
                    });
                }
            } catch (error) {
                this.handleError(error, 'move section down');
            }
        }
        
        /**
         * Duplicate section
         * @param {HTMLElement} section - Section to duplicate
         */
        duplicateSection(section) {
            try {
                // Create a deep clone
                const clone = section.cloneNode(true);
                
                // Generate new section ID
                const newSectionId = 'section-' + Date.now();
                clone.setAttribute('data-section-id', newSectionId);
                
                // Generate new component IDs
                const components = clone.querySelectorAll('.editable-element');
                components.forEach(component => {
                    const newComponentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    component.setAttribute('data-component-id', newComponentId);
                });
                
                // Insert after original section
                section.parentNode.insertBefore(clone, section.nextSibling);
                
                // Setup event listeners
                this.setupSectionEventListeners();
                this.setupSectionControlListeners(clone);
                
                // Setup component event listeners
                components.forEach(component => {
                    this.setupElementEventListeners(component);
                });
                
                // Save state and mark dirty
                this.saveStateToHistory();
                this.markDirty();
                
                this.emit('section-duplicated', {
                    original: section,
                    duplicate: clone,
                    sectionId: newSectionId
                });
                
                return clone;
            } catch (error) {
                this.handleError(error, 'duplicate section');
                return null;
            }
        }
        
        /**
         * Delete section
         * @param {HTMLElement} section - Section to delete
         */
        deleteSection(section) {
            try {
                // Count total sections
                const totalSections = this.elements.preview.querySelectorAll('.media-kit-section').length;
                
                // Prevent deleting the last section
                if (totalSections <= 1) {
                    alert('Cannot delete the last section. At least one section is required.');
                    return;
                }
                
                // Ask for confirmation
                if (confirm('Are you sure you want to delete this section and all its contents?')) {
                    // Deselect if this section is selected
                    if (this.state.selectedSection === section) {
                        this.state.selectedSection = null;
                        this.clearDesignPanel();
                    }
                    
                    // Deselect any selected element within this section
                    if (this.state.selectedElement && section.contains(this.state.selectedElement)) {
                        this.selectElement(null);
                    }
                    
                    // Store section data for event
                    const sectionData = {
                        id: section.getAttribute('data-section-id'),
                        type: section.getAttribute('data-section-type'),
                        layout: section.getAttribute('data-section-layout')
                    };
                    
                    section.remove();
                    this.saveStateToHistory();
                    this.markDirty();
                    
                    this.emit('section-deleted', sectionData);
                }
            } catch (error) {
                this.handleError(error, 'delete section');
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
                
                // Return fallback single column
                return `
                    <div class="section-column" data-column="full">
                        <div class="drop-zone empty"></div>
                    </div>
                `;
            }
        }
        
        /**
         * Setup section event listeners
         */
        setupSectionEventListeners() {
            try {
                const sections = this.elements.preview.querySelectorAll('.media-kit-section');
                
                sections.forEach(section => {
                    // Add hover effect
                    section.addEventListener('mouseenter', function() {
                        this.classList.add('section-hover');
                    });
                    
                    section.addEventListener('mouseleave', function() {
                        this.classList.remove('section-hover');
                    });
                    
                    // Section selection
                    section.addEventListener('click', e => {
                        try {
                            // Don't select section if clicking on a component or controls
                            if (e.target.closest('.editable-element') || 
                                e.target.closest('.section-controls') ||
                                e.target.closest('.element-controls')) {
                                return;
                            }
                            
                            e.stopPropagation();
                            
                            // Deselect any selected components first
                            this.selectElement(null);
                            
                            // Select this section
                            this.selectSection(section);
                        } catch (error) {
                            this.handleError(error, 'section click');
                        }
                    });
                });
            } catch (error) {
                this.handleError(error, 'setup section event listeners');
            }
        }
        
        /**
         * Select section
         * @param {HTMLElement} section - Section to select
         */
        selectSection(section) {
            try {
                // Remove previous selection from all sections
                this.elements.preview.querySelectorAll('.media-kit-section').forEach(s => {
                    s.classList.remove('selected');
                });
                
                // Select new section
                section.classList.add('selected');
                this.state.selectedSection = section;
                
                // Update UI to show section options
                this.updateSectionDesignPanel(section);
                
                this.emit('section-selected', { section });
            } catch (error) {
                this.handleError(error, 'select section');
            }
        }
        
        /**
         * Update section design panel
         * @param {HTMLElement} section - Selected section
         */
        updateSectionDesignPanel(section) {
            try {
                if (!this.elements.designPanel) return;
                
                const sectionType = section.getAttribute('data-section-type');
                const sectionLayout = section.getAttribute('data-section-layout');
                const sectionId = section.getAttribute('data-section-id');
                
                this.elements.designPanel.innerHTML = `
                    <div class="section-design-panel">
                        <div class="panel-header">Section Settings</div>
                        
                        <div class="form-group">
                            <label>Layout</label>
                            <div class="layout-options">
                                <div class="layout-option ${sectionLayout === 'full-width' ? 'active' : ''}" data-layout="full-width">
                                    <div class="layout-preview full-width"></div>
                                    <div class="layout-name">Full Width</div>
                                </div>
                                <div class="layout-option ${sectionLayout === 'two-column' ? 'active' : ''}" data-layout="two-column">
                                    <div class="layout-preview two-column"></div>
                                    <div class="layout-name">Two Column</div>
                                </div>
                                <div class="layout-option ${sectionLayout === 'three-column' ? 'active' : ''}" data-layout="three-column">
                                    <div class="layout-preview three-column"></div>
                                    <div class="layout-name">Three Column</div>
                                </div>
                                <div class="layout-option ${sectionLayout === 'main-sidebar' ? 'active' : ''}" data-layout="main-sidebar">
                                    <div class="layout-preview sidebar"></div>
                                    <div class="layout-name">Main + Sidebar</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Background Color</label>
                            <div class="color-control">
                                <input type="color" class="control-input" id="section-bg-color" value="${section.style.backgroundColor || '#ffffff'}">
                                <input type="text" class="color-text" value="${section.style.backgroundColor || '#ffffff'}" data-for="section-bg-color">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Section Spacing</label>
                            <select class="form-input" id="section-spacing">
                                <option value="compact" ${section.style.paddingTop === '24px' ? 'selected' : ''}>Compact</option>
                                <option value="standard" ${section.style.paddingTop === '48px' || !section.style.paddingTop ? 'selected' : ''}>Standard</option>
                                <option value="spacious" ${section.style.paddingTop === '72px' ? 'selected' : ''}>Spacious</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Section Type</label>
                            <select class="form-input" id="section-type">
                                <option value="hero" ${sectionType === 'hero' ? 'selected' : ''}>Hero</option>
                                <option value="content" ${sectionType === 'content' ? 'selected' : ''}>Content</option>
                                <option value="features" ${sectionType === 'features' ? 'selected' : ''}>Features</option>
                                <option value="media" ${sectionType === 'media' ? 'selected' : ''}>Media</option>
                                <option value="contact" ${sectionType === 'contact' ? 'selected' : ''}>Contact</option>
                            </select>
                        </div>
                    </div>
                `;
                
                // Setup layout option clicks
                const layoutOptions = this.elements.designPanel.querySelectorAll('.layout-option');
                layoutOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        try {
                            const newLayout = option.getAttribute('data-layout');
                            
                            // Change section layout
                            this.changeSectionLayout(sectionId, newLayout);
                            
                            // Update active state
                            layoutOptions.forEach(opt => opt.classList.remove('active'));
                            option.classList.add('active');
                        } catch (error) {
                            this.handleError(error, 'layout option click');
                        }
                    });
                });
                
                // Setup background color
                const bgColorInput = this.elements.designPanel.querySelector('#section-bg-color');
                const bgColorText = this.elements.designPanel.querySelector('.color-text[data-for="section-bg-color"]');
                
                if (bgColorInput) {
                    bgColorInput.addEventListener('input', () => {
                        try {
                            section.style.backgroundColor = bgColorInput.value;
                            if (bgColorText) bgColorText.value = bgColorInput.value;
                            this.markDirty();
                        } catch (error) {
                            this.handleError(error, 'background color input');
                        }
                    });
                    
                    bgColorInput.addEventListener('change', () => {
                        this.saveStateToHistory();
                    });
                }
                
                if (bgColorText) {
                    bgColorText.addEventListener('input', () => {
                        try {
                            // Validate hex color
                            if (/^#[0-9A-F]{6}$/i.test(bgColorText.value)) {
                                section.style.backgroundColor = bgColorText.value;
                                bgColorInput.value = bgColorText.value;
                                this.markDirty();
                            }
                        } catch (error) {
                            this.handleError(error, 'background color text input');
                        }
                    });
                    
                    bgColorText.addEventListener('blur', () => {
                        bgColorText.value = bgColorInput.value;
                        this.saveStateToHistory();
                    });
                }
                
                // Setup spacing
                const spacingSelect = this.elements.designPanel.querySelector('#section-spacing');
                if (spacingSelect) {
                    spacingSelect.addEventListener('change', () => {
                        try {
                            const spacing = spacingSelect.value;
                            let paddingTop, paddingBottom;
                            
                            switch(spacing) {
                                case 'compact':
                                    paddingTop = '24px';
                                    paddingBottom = '24px';
                                    break;
                                case 'spacious':
                                    paddingTop = '72px';
                                    paddingBottom = '72px';
                                    break;
                                default:
                                    paddingTop = '48px';
                                    paddingBottom = '48px';
                            }
                            
                            section.style.paddingTop = paddingTop;
                            section.style.paddingBottom = paddingBottom;
                            
                            this.markDirty();
                            this.saveStateToHistory();
                        } catch (error) {
                            this.handleError(error, 'spacing select change');
                        }
                    });
                }
                
                // Setup section type
                const typeSelect = this.elements.designPanel.querySelector('#section-type');
                if (typeSelect) {
                    typeSelect.addEventListener('change', () => {
                        try {
                            const newType = typeSelect.value;
                            section.setAttribute('data-section-type', newType);
                            
                            this.markDirty();
                            this.saveStateToHistory();
                        } catch (error) {
                            this.handleError(error, 'section type change');
                        }
                    });
                }
                
                // Switch to design tab
                const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
                if (designTab) {
                    designTab.click();
                }
            } catch (error) {
                this.handleError(error, 'update section design panel');
            }
        }
        
        /**
         * Change section layout
         * @param {string} sectionId - Section ID
         * @param {string} newLayout - New layout
         */
        changeSectionLayout(sectionId, newLayout) {
            try {
                const section = this.elements.preview.querySelector(`[data-section-id="${sectionId}"]`);
                if (!section) {
                    throw new Error(`Section not found: ${sectionId}`);
                }
                
                const content = section.querySelector('.section-content');
                if (!content) {
                    throw new Error('Section content not found');
                }
                
                const oldLayout = section.getAttribute('data-section-layout');
                
                // Collect all components from all columns
                const allComponents = [];
                content.querySelectorAll('.editable-element').forEach(comp => {
                    allComponents.push(comp.cloneNode(true));
                });
                
                // Update layout attributes
                section.setAttribute('data-section-layout', newLayout);
                content.className = `section-content layout-${newLayout}`;
                
                // Regenerate columns
                content.innerHTML = this.generateColumnsForLayout(newLayout);
                
                // Redistribute components
                this.redistributeComponents(section, allComponents);
                
                // Re-initialize drop zones and event listeners
                this.setupDragAndDrop();
                
                // Re-setup component event listeners
                section.querySelectorAll('.editable-element').forEach(comp => {
                    this.setupElementEventListeners(comp);
                });
                
                // Save state and mark dirty
                this.saveStateToHistory();
                this.markDirty();
                
                this.emit('section-layout-changed', {
                    sectionId: sectionId,
                    oldLayout: oldLayout,
                    newLayout: newLayout
                });
            } catch (error) {
                this.handleError(error, 'change section layout');
            }
        }
        
        /**
         * Redistribute components between columns
         * @param {HTMLElement} section - Section element
         * @param {Array} components - Component elements
         */
        redistributeComponents(section, components) {
            try {
                const columns = section.querySelectorAll('.section-column');
                const numColumns = columns.length;
                
                if (numColumns === 0 || components.length === 0) {
                    this.log('No columns or components to redistribute');
                    return;
                }
                
                // Distribute components evenly across columns
                const componentsPerColumn = Math.ceil(components.length / numColumns);
                
                components.forEach((component, index) => {
                    const columnIndex = Math.floor(index / componentsPerColumn);
                    
                    if (columnIndex < columns.length) {
                        const dropZone = columns[columnIndex].querySelector('.drop-zone');
                        if (dropZone) {
                            dropZone.appendChild(component);
                            dropZone.classList.remove('empty');
                        }
                    }
                });
            } catch (error) {
                this.handleError(error, 'redistribute components');
            }
        }
        
        /**
         * Populate builder from components
         * @param {Object} components - Component data
         */
        populateFromComponents(components) {
            try {
                // Create a default section
                const sectionId = 'section-' + Date.now();
                const sectionEl = document.createElement('div');
                sectionEl.className = 'media-kit-section';
                sectionEl.setAttribute('data-section-id', sectionId);
                sectionEl.setAttribute('data-section-type', 'content');
                sectionEl.setAttribute('data-section-layout', 'full-width');
                
                // Add section controls
                const controls = document.createElement('div');
                controls.className = 'section-controls';
                controls.innerHTML = `
                    <button class="section-control-btn move-up-btn" title="Move Section Up">↑</button>
                    <button class="section-control-btn move-down-btn" title="Move Section Down">↓</button>
                    <button class="section-control-btn duplicate-btn" title="Duplicate Section">⧉</button>
                    <button class="section-control-btn delete-btn" title="Delete Section">✕</button>
                `;
                
                // Create section content
                const content = document.createElement('div');
                content.className = 'section-content layout-full-width';
                content.innerHTML = this.generateColumnsForLayout('full-width');
                
                sectionEl.appendChild(controls);
                sectionEl.appendChild(content);
                
                // Add section to preview
                this.elements.preview.appendChild(sectionEl);
                
                // Add components to section
                const dropZone = sectionEl.querySelector('.drop-zone');
                
                if (components && dropZone) {
                    Object.values(components).forEach(componentData => {
                        const componentEl = this.createComponentFromData(componentData);
                        if (componentEl) {
                            dropZone.appendChild(componentEl);
                            dropZone.classList.remove('empty');
                        }
                    });
                }
                
                // Setup event listeners
                this.setupSectionControlListeners(sectionEl);
                this.setupDragAndDrop();
                this.setupSectionEventListeners();
            } catch (error) {
                this.handleError(error, 'populate from components');
            }
        }
        
        /**
         * Create component from data
         * @param {Object} data - Component data
         * @returns {HTMLElement} Component element
         */
        createComponentFromData(data) {
            try {
                // Get component template
                const template = this.getComponentTemplate(data.type);
                if (!template) {
                    throw new Error(`Component template not found: ${data.type}`);
                }
                
                // Create component element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = template;
                const component = tempDiv.firstElementChild;
                
                if (!component) {
                    throw new Error('Failed to create component element');
                }
                
                // Set component ID
                component.setAttribute('data-component-id', data.id);
                
                // Populate content
                this.populateComponentContent(component, data);
                
                // Apply styles
                this.applyComponentStyles(component, data.styles);
                
                // Setup event listeners
                this.setupElementEventListeners(component);
                
                return component;
            } catch (error) {
                this.handleError(error, 'create component from data');
                return null;
            }
        }
        
        /**
         * Populate component content
         * @param {HTMLElement} component - Component element
         * @param {Object} data - Component data
         */
        populateComponentContent(component, data) {
            try {
                const type = data.type;
                const content = data.content || {};
                
                // Populate biography content
                if (type === 'biography' && content.text) {
                    const bioContent = component.querySelector('.editable-content');
                    if (bioContent) {
                        bioContent.innerHTML = content.text;
                    }
                }
                
                // Populate topics content
                else if (type === 'topics' && content.topics) {
                    const topicsContainer = component.querySelector('.topics-container');
                    if (topicsContainer) {
                        // Clear existing topics except the add button
                        const addTopic = topicsContainer.querySelector('.add-topic');
                        topicsContainer.innerHTML = '';
                        
                        // Add topics
                        content.topics.forEach(topic => {
                            const topicItem = document.createElement('div');
                            topicItem.className = 'topic-item';
                            topicItem.innerHTML = `<div class="topic-text" contenteditable="true">${topic}</div>`;
                            topicsContainer.appendChild(topicItem);
                        });
                        
                        // Add the add button back
                        if (addTopic) {
                            topicsContainer.appendChild(addTopic);
                        } else {
                            // Create new add button if it doesn't exist
                            const newAddTopic = document.createElement('div');
                            newAddTopic.className = 'add-topic';
                            newAddTopic.textContent = '+ Add Topic';
                            newAddTopic.addEventListener('click', () => this.addTopicItem(component));
                            topicsContainer.appendChild(newAddTopic);
                        }
                    }
                }
                
                // Populate questions content
                else if (type === 'questions' && content.questions) {
                    const questionsContainer = component.querySelector('.questions-container');
                    if (questionsContainer) {
                        // Clear existing questions except the add button
                        const addQuestion = questionsContainer.querySelector('.add-question');
                        questionsContainer.innerHTML = '';
                        
                        // Add questions
                        content.questions.forEach(question => {
                            const questionItem = document.createElement('div');
                            questionItem.className = 'question-item';
                            questionItem.innerHTML = `<div class="question-text" contenteditable="true">${question}</div>`;
                            questionsContainer.appendChild(questionItem);
                        });
                        
                        // Add the add button back
                        if (addQuestion) {
                            questionsContainer.appendChild(addQuestion);
                        } else {
                            // Create new add button if it doesn't exist
                            const newAddQuestion = document.createElement('div');
                            newAddQuestion.className = 'add-question';
                            newAddQuestion.textContent = '+ Add Question';
                            newAddQuestion.addEventListener('click', () => this.addQuestionItem(component));
                            questionsContainer.appendChild(newAddQuestion);
                        }
                    }
                }
                
                // Populate social content
                else if (type === 'social' && content.platforms) {
                    const socialContainer = component.querySelector('.social-container');
                    if (socialContainer) {
                        // Clear existing platforms except the add button
                        const addSocial = socialContainer.querySelector('.add-social');
                        socialContainer.innerHTML = '';
                        
                        // Add platforms
                        content.platforms.forEach(platform => {
                            const socialItem = document.createElement('div');
                            socialItem.className = 'social-item';
                            socialItem.innerHTML = `
                                <div class="social-platform">${platform.platform}</div>
                                <div class="social-link" contenteditable="true">${platform.link}</div>
                            `;
                            socialContainer.appendChild(socialItem);
                        });
                        
                        // Add the add button back
                        if (addSocial) {
                            socialContainer.appendChild(addSocial);
                        } else {
                            // Create new add button if it doesn't exist
                            const newAddSocial = document.createElement('div');
                            newAddSocial.className = 'add-social';
                            newAddSocial.textContent = '+ Add Platform';
                            newAddSocial.addEventListener('click', () => this.addSocialItem(component));
                            socialContainer.appendChild(newAddSocial);
                        }
                    }
                }
                
                // Populate logo content
                else if (type === 'logo' && content.url) {
                    const logoContainer = component.querySelector('.logo-container');
                    if (logoContainer) {
                        logoContainer.innerHTML = `
                            <img src="${content.url}" alt="${content.alt || 'Logo'}" class="logo-image">
                        `;
                    }
                }
            } catch (error) {
                this.handleError(error, 'populate component content');
            }
        }
        
        /**
         * Apply component styles
         * @param {HTMLElement} component - Component element
         * @param {Object} styles - Component styles
         */
        applyComponentStyles(component, styles) {
            try {
                if (!styles) return;
                
                // Apply inline styles
                Object.entries(styles).forEach(([name, value]) => {
                    // Skip custom attributes
                    if (!['columns', 'style', 'size'].includes(name)) {
                        component.style[name] = value;
                    }
                });
                
                // Apply custom attributes
                if (styles.columns) {
                    component.setAttribute('data-columns', styles.columns);
                    
                    // Apply to topics container if applicable
                    if (component.getAttribute('data-component') === 'topics') {
                        const topicsContainer = component.querySelector('.topics-container');
                        if (topicsContainer) {
                            topicsContainer.style.gridTemplateColumns = `repeat(${styles.columns}, 1fr)`;
                        }
                    }
                }
                
                if (styles.style) {
                    component.setAttribute('data-style', styles.style);
                    
                    // Apply to containers based on component type
                    const componentType = component.getAttribute('data-component');
                    
                    if (componentType === 'topics') {
                        const topicItems = component.querySelectorAll('.topic-item');
                        topicItems.forEach(item => {
                            item.className = `topic-item style-${styles.style}`;
                        });
                    } else if (componentType === 'questions') {
                        const container = component.querySelector('.questions-container');
                        if (container) {
                            container.className = `questions-container style-${styles.style}`;
                        }
                    } else if (componentType === 'social') {
                        const container = component.querySelector('.social-container');
                        if (container) {
                            container.className = `social-container style-${styles.style}`;
                        }
                    }
                }
                
                if (styles.size) {
                    component.setAttribute('data-size', styles.size);
                    
                    // Apply to social items if applicable
                    if (component.getAttribute('data-component') === 'social') {
                        const socialItems = component.querySelectorAll('.social-item');
                        socialItems.forEach(item => {
                            item.className = `social-item size-${styles.size}`;
                        });
                    }
                }
            } catch (error) {
                this.handleError(error, 'apply component styles');
            }
        }
        
        /**
         * Save media kit
         */
        saveMediaKit() {
            try {
                const data = this.getBuilderState();
                
                // Emit save event - adapter will handle actual saving
                this.emit('save-requested', data);
                
                return data;
            } catch (error) {
                this.handleError(error, 'save media kit');
                return null;
            }
        }
        
        /**
         * Load media kit
         * @param {Object} data - Media kit data
         */
        loadMediaKit(data) {
            try {
                this.setLoading(true);
                
                this.applyBuilderState(data);
                this.markClean();
                
                this.emit('load-completed', { data });
                
                return true;
            } catch (error) {
                this.handleError(error, 'load media kit');
                this.emit('load-failed', { error });
                return false;
            } finally {
                this.setLoading(false);
            }
        }
        
        /**
         * Add a new section to the builder
         * @param {string} type - Section type
         * @param {string} layout - Section layout
         * @param {Object|Array} components - Section components
         * @returns {string} Section ID
         */
        addSection(type, layout, components = []) {
            try {
                // Generate section ID
                const sectionId = 'section-' + Date.now();
                
                // Create section element
                const section = {
                    id: sectionId,
                    type: type || 'content',
                    layout: layout || 'full-width',
                    settings: {
                        background: '#ffffff',
                        padding: {
                            top: '48px',
                            bottom: '48px'
                        }
                    },
                    components: components
                };
                
                const sectionEl = this.createSectionElement(section);
                
                // Add to preview
                this.elements.preview.appendChild(sectionEl);
                
                // Re-initialize event listeners
                this.setupDragAndDrop();
                this.setupSectionEventListeners();
                
                // Save state and mark dirty
                this.saveStateToHistory();
                this.markDirty();
                
                // Emit event
                this.emit('section-added', {
                    id: sectionId,
                    type: type,
                    layout: layout
                });
                
                return sectionId;
            } catch (error) {
                this.handleError(error, 'add section');
                return null;
            }
        }
        
        /**
         * Handle error
         * @param {Error} error - Error object
         * @param {string} context - Error context
         */
        handleError(error, context) {
            // Log error
            console.error(`Media Kit Builder Error [${context}]:`, error);
            
            // Add to state errors
            this.state.errors.push({
                error: error.message || String(error),
                context,
                timestamp: new Date(),
                stack: error.stack
            });
            
            // Emit error event
            this.emit('error', {
                error: error.message || String(error),
                context,
                timestamp: new Date()
            });
        }
        
        /**
         * Log message to console
         * @param {string} message - Message to log
         * @param {string} level - Log level (log, info, warn, error)
         */
        log(message, level = 'log') {
            if (!this.config.debugging && level !== 'error') return;
            
            switch (level) {
                case 'info':
                    console.info(`[MediaKitBuilder] ${message}`);
                    break;
                case 'warn':
                    console.warn(`[MediaKitBuilder] ${message}`);
                    break;
                case 'error':
                    console.error(`[MediaKitBuilder] ${message}`);
                    break;
                default:
                    console.log(`[MediaKitBuilder] ${message}`);
            }
        }
        
        /**
         * Get error history
         * @returns {Array} Error history
         */
        getErrorHistory() {
            return [...this.state.errors];
        }
        
        /**
         * Clear error history
         */
        clearErrorHistory() {
            this.state.errors = [];
        }
        
        /**
         * Destroy the builder instance
         * Clear all references and event listeners
         */
        destroy() {
            try {
                // Clear auto-save timer
                if (this.autoSaveTimer) {
                    clearInterval(this.autoSaveTimer);
                    this.autoSaveTimer = null;
                }
                
                // Clear all event handlers
                this.eventHandlers = {};
                
                // Clear DOM references
                this.elements = {};
                
                // Clear state
                this.state = {};
                
                // Clear builder content
                if (this.elements.preview) {
                    this.elements.preview.innerHTML = '';
                }
                
                // Remove global reference
                if (window.mediaKitBuilder === this) {
                    delete window.mediaKitBuilder;
                }
                
                this.log('MediaKitBuilder instance destroyed');
            } catch (error) {
                console.error('Error destroying MediaKitBuilder:', error);
            }
        }
    }
    
    // Expose MediaKitBuilder to global scope
    window.MediaKitBuilder = MediaKitBuilder;
})();
