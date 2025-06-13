/**
 * Media Kit Builder - Core Builder Class
 *
 * This file contains the core functionality for the Media Kit Builder,
 * independent of WordPress or any other platform.
 */
(function($) {
    'use strict';
    if (typeof $ === 'undefined') {
        console.error('jQuery is not loaded. Media Kit Builder requires jQuery.');
        $ = function(selector) { return document.querySelector(selector); };
        $.fn = {};
    }
    class MediaKitBuilder {
        static create(config = {}) {
            return new MediaKitBuilder(config);
        }
        constructor(config = {}) {
            this.config = {
                container: '#media-kit-builder',
                previewContainer: '#media-kit-preview',
                componentPalette: '#component-palette',
                autoSaveInterval: 30000,
                maxUndoStackSize: 50,
                debugging: true,
                ...config
            };
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
            this.elements = {};
            this.eventHandlers = {};
            this.exposePropertiesGlobally();
            this.init();
        }
        exposePropertiesGlobally() {
            if (!window.MediaKitBuilder) window.MediaKitBuilder = {};
            if (!window.MediaKitBuilder.global) window.MediaKitBuilder.global = {};
            window.MediaKitBuilder.global.instance = this;
            window.MediaKitBuilder.global.state = this.state;
            window.MediaKitBuilder.global.config = this.config;
            window.MediaKitBuilder.global.elements = this.elements;
            window.MediaKitBuilder.global.getComponentTemplate = this.getComponentTemplate.bind(this);
            window.MediaKitBuilder.global.addComponent = this.addComponent.bind(this);
            window.MediaKitBuilder.global.addComponentToZone = this.addComponentToZone.bind(this);
            window.MediaKitBuilder.global.saveStateToHistory = this.saveStateToHistory.bind(this);
            window.MediaKitBuilder.global.getBuilderState = this.getBuilderState.bind(this);
            window.MediaKitBuilder.global.markDirty = this.markDirty.bind(this);
            window.MediaKitBuilder.global.markClean = this.markClean.bind(this);
            window.MediaKitBuilder.global.on = this.on.bind(this);
            window.MediaKitBuilder.global.off = this.off.bind(this);
            window.MediaKitBuilder.global.emit = this.emit.bind(this);
        }
        init() {
            try {
                if (this.state.initialized) return;
                this.cacheElements();
                if ((!this.elements.container || !this.elements.preview || !this.elements.palette) && window.MediaKitBuilder.elements) {
                    this.elements = window.MediaKitBuilder.elements;
                }
                if (!this.elements.container || !this.elements.preview || !this.elements.palette) {
                    this.setupDelayedInitialization();
                    return;
                }
                this.setupTabs();
                this.setupComponentPalette();
                this.setupDragAndDrop();
                this.setupSectionReordering();
                this.setupAddSectionButton();
                this.setupUndoRedo();
                this.setupEventListeners();
                this.setupAutoSave();
                this.state.initialized = true;
                this.emit('initialized', { timestamp: new Date() });
                this.exposePropertiesGlobally();
                window.mediaKitBuilder = this;
                window.MediaKitBuilder.global.initialized = true;
                document.dispatchEvent(new CustomEvent('mediakit-builder-initialized', { detail: this }));
            } catch (error) {
                this.handleError(error, 'initialization');
            }
        }
        setupDelayedInitialization() {
            let attempts = 0;
            const maxAttempts = 20;
            const checkInterval = setInterval(() => {
                attempts++;
                this.cacheElements();
                if (this.elements.container && this.elements.preview && this.elements.palette) {
                    clearInterval(checkInterval);
                    this.init();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    this.createContainers();
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
        createContainers() {
            if (document.querySelector(this.config.container)) return;
            const content = document.querySelector('.content-area, .entry-content, main, #content, .site-content');
            const container = document.createElement('div');
            container.id = this.config.container.replace('#', '');
            container.className = 'media-kit-builder';
            const preview = document.createElement('div');
            preview.id = this.config.previewContainer.replace('#', '');
            preview.className = 'media-kit-preview';
            const palette = document.createElement('div');
            palette.id = this.config.componentPalette.replace('#', '');
            palette.className = 'component-palette';
            container.appendChild(preview);
            container.appendChild(palette);
            if (content) {
                content.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
            this.cacheElements();
            this.init();
        }
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
        setupTabs() {
            if (!this.elements.tabs || !this.elements.tabContents) return;
            this.elements.tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    try {
                        this.elements.tabs.forEach(t => t.classList.remove('active'));
                        this.elements.tabContents.forEach(c => c.classList.remove('active'));
                        tab.classList.add('active');
                        const tabId = tab.getAttribute('data-tab');
                        const tabContent = this.elements.container.querySelector(`#${tabId}-tab`);
                        if (tabContent) {
                            tabContent.classList.add('active');
                            this.emit('tab-changed', { tab: tabId });
                        }
                    } catch (error) {
                        this.handleError(error, 'tab switching');
                    }
                });
            });
        }
        setupComponentPalette() {
            try {
                if (!this.elements.palette) return;
                const components = this.elements.palette.querySelectorAll('.component-item');
                components.forEach(component => {
                    component.addEventListener('dragstart', e => {
                        try {
                            const componentType = component.getAttribute('data-component');
                            e.dataTransfer.setData('text/plain', componentType);
                            e.dataTransfer.effectAllowed = 'copy';
                            component.classList.add('dragging');
                            this.emit('component-drag-start', { type: componentType, element: component });
                        } catch (error) {
                            this.handleError(error, 'component drag start');
                        }
                    });
                    component.addEventListener('dragend', () => component.classList.remove('dragging'));
                    component.addEventListener('click', () => {
                        try {
                            const componentType = component.getAttribute('data-component');
                            const isPremium = component.hasAttribute('data-premium') && component.getAttribute('data-premium') === 'true';
                            if (isPremium && this.config.wpData && this.config.wpData.accessTier !== 'pro' && this.config.wpData.accessTier !== 'agency' && !this.config.wpData.isAdmin) {
                                this.emit('premium-access-required', { feature: 'component', type: componentType });
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
        setupDragAndDrop() {
            try {
                if (!this.elements.preview) return;
                const dropZones = this.elements.preview.querySelectorAll('.drop-zone');
                if (dropZones.length === 0) {
                    this.createInitialDropZone();
                    return;
                }
                dropZones.forEach(zone => {
                    zone.addEventListener('dragover', e => {
                        e.preventDefault();
                        zone.classList.add('drag-over');
                    });
                    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
                    zone.addEventListener('drop', e => {
                        try {
                            e.preventDefault();
                            zone.classList.remove('drag-over');
                            const transferData = e.dataTransfer.getData('text/plain');
                            if (transferData && !transferData.includes('component-')) {
                                this.addComponentToZone(transferData, zone);
                                return;
                            }
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
                                    this.emit('component-moved', { id: componentId, component: component, target: zone });
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
         * Setup section reordering functionality
         */
        setupSectionReordering() {
            const preview = this.elements.preview;
            if (!preview) return;

            preview.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('media-kit-section')) {
                    e.target.classList.add('is-dragging');
                }
            });

            preview.addEventListener('dragend', (e) => {
                if (e.target.classList.contains('media-kit-section')) {
                    e.target.classList.remove('is-dragging');
                }
            });

            preview.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingElement = preview.querySelector('.is-dragging');
                if (!draggingElement) return;

                const afterElement = this.getDragAfterElement(preview, e.clientY);
                if (afterElement == null) {
                    preview.appendChild(draggingElement);
                } else {
                    preview.insertBefore(draggingElement, afterElement);
                }
                this.markDirty();
            });
            
            // Setup section control buttons
            preview.addEventListener('click', (e) => {
                // Delete section button
                if (e.target.closest('.section-control-btn.delete-btn')) {
                    const section = e.target.closest('.media-kit-section');
                    if (section && confirm('Are you sure you want to delete this section?')) {
                        section.remove();
                        this.saveStateToHistory();
                        this.markDirty();
                    }
                }
                
                // Move section button (toggle draggable state)
                if (e.target.closest('.section-control-btn.move-btn')) {
                    const section = e.target.closest('.media-kit-section');
                    if (section) {
                        // Flash the section to indicate it's ready to be dragged
                        section.classList.add('is-draggable-active');
                        setTimeout(() => {
                            section.classList.remove('is-draggable-active');
                        }, 1000);
                    }
                }
            });
        }
        
        getDragAfterElement(container, y) {
            // This selector handles both components (.editable-element) and sections (.media-kit-section)
            const draggableElements = [...container.querySelectorAll('.editable-element:not(.dragging), .media-kit-section:not(.is-dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        setupAddSectionButton() {
            const addSectionBtn = document.getElementById('add-section-btn');
            if (!addSectionBtn) return;
            
            addSectionBtn.addEventListener('click', () => {
                try {
                    this.addNewSection();
                } catch (error) {
                    this.handleError(error, 'add section button');
                }
            });
        }
        
        addNewSection() {
            const preview = this.elements.preview;
            if (!preview) return;
            
            const section = document.createElement('div');
            section.className = 'media-kit-section';
            section.setAttribute('data-section-id', 'section-' + Date.now());
            section.setAttribute('data-section-type', 'content');
            section.setAttribute('data-section-layout', 'full-width');
            section.setAttribute('draggable', 'true');
            
            // Add section controls
            const sectionControls = document.createElement('div');
            sectionControls.className = 'section-controls';
            sectionControls.innerHTML = `
                <button class="section-control-btn move-btn" title="Move Section">↕</button>
                <button class="section-control-btn delete-btn" title="Delete Section">✕</button>
            `;
            section.appendChild(sectionControls);
            
            const sectionContent = document.createElement('div');
            sectionContent.className = 'section-content layout-full-width';
            
            const column = document.createElement('div');
            column.className = 'section-column';
            column.setAttribute('data-column', 'full');
            
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone empty';
            dropZone.setAttribute('data-zone', 'zone-' + Date.now());
            
            column.appendChild(dropZone);
            sectionContent.appendChild(column);
            section.appendChild(sectionContent);
            
            preview.appendChild(section);
            
            // Setup drag and drop for the new drop zone
            this.setupDragAndDrop();
            
            this.saveStateToHistory();
            this.markDirty();
            
            return section;
        }
        createInitialDropZone() {
            try {
                if (!this.elements.preview) return;
                this.elements.preview.innerHTML = '';
                const section = document.createElement('div');
                section.className = 'media-kit-section';
                section.setAttribute('data-section-id', 'section-' + Date.now());
                section.setAttribute('data-section-type', 'content');
                section.setAttribute('data-section-layout', 'full-width');
                section.setAttribute('draggable', 'true');
                
                // Add section controls
                const sectionControls = document.createElement('div');
                sectionControls.className = 'section-controls';
                sectionControls.innerHTML = `
                    <button class="section-control-btn move-btn" title="Move Section">↕</button>
                    <button class="section-control-btn delete-btn" title="Delete Section">✕</button>
                `;
                section.appendChild(sectionControls);
                const sectionContent = document.createElement('div');
                sectionContent.className = 'section-content layout-full-width';
                const column = document.createElement('div');
                column.className = 'section-column';
                column.setAttribute('data-column', 'full');
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone empty';
                dropZone.setAttribute('data-zone', 'zone-' + Date.now());
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `<div class="empty-state-icon">📝</div><div class="empty-state-title">Your Media Kit is Empty</div><div class="empty-state-desc">Drag components from the sidebar or click the "Add Component" button to get started.</div>`;
                dropZone.appendChild(emptyState);
                column.appendChild(dropZone);
                sectionContent.appendChild(column);
                section.appendChild(sectionContent);
                this.elements.preview.appendChild(section);
                this.setupDragAndDrop();
            } catch (error) {
                this.handleError(error, 'create initial drop zone');
            }
        }
        addComponent(componentType) {
            try {
                const dropZone = this.elements.preview.querySelector('.drop-zone');
                if (dropZone) {
                    this.addComponentToZone(componentType, dropZone);
                } else {
                    this.createInitialDropZone();
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
        addComponentToZone(componentType, dropZone) {
            try {
                const template = this.getComponentTemplate(componentType);
                if (!template) throw new Error(`Component template not found: ${componentType}`);
                const emptyState = dropZone.querySelector('.empty-state');
                if (emptyState) emptyState.remove();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = template;
                const component = tempDiv.firstElementChild;
                if (!component) throw new Error('Failed to create component element');
                const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                component.setAttribute('data-component-id', componentId);
                dropZone.appendChild(component);
                dropZone.classList.remove('empty');
                this.setupElementEventListeners(component);
                this.saveStateToHistory();
                this.markDirty();
                this.emit('component-added', { type: componentType, id: componentId, element: component });
                return componentId;
            } catch (error) {
                this.handleError(error, 'add component to zone');
                return null;
            }
        }
        getComponentTemplate(componentType) {
            const templates = {
                'biography': `<div class="editable-element" data-component="biography"><div class="element-header"><div class="element-title">Biography</div><div class="element-controls"><button class="control-btn move-up-btn" title="Move Up">↑</button><button class="control-btn move-down-btn" title="Move Down">↓</button><button class="control-btn duplicate-btn" title="Duplicate">⧉</button><button class="control-btn delete-btn" title="Delete">✕</button></div></div><div class="editable-content" contenteditable="true">Enter your biography here. This should be 300-500 words about yourself, your expertise, and what makes you unique.</div></div>`,
                'topics': `<div class="editable-element" data-component="topics"><div class="element-header"><div class="element-title">Topics</div><div class="element-controls"><button class="control-btn move-up-btn" title="Move Up">↑</button><button class="control-btn move-down-btn" title="Move Down">↓</button><button class="control-btn duplicate-btn" title="Duplicate">⧉</button><button class="control-btn delete-btn" title="Delete">✕</button></div></div><div class="topics-container"><div class="topic-item"><div class="topic-text" contenteditable="true">Topic 1</div></div><div class="topic-item"><div class="topic-text" contenteditable="true">Topic 2</div></div><div class="topic-item"><div class="topic-text" contenteditable="true">Topic 3</div></div><div class="add-topic">+ Add Topic</div></div></div>`,
                'questions': `<div class="editable-element" data-component="questions"><div class="element-header"><div class="element-title">Questions</div><div class="element-controls"><button class="control-btn move-up-btn" title="Move Up">↑</button><button class="control-btn move-down-btn" title="Move Down">↓</button><button class="control-btn duplicate-btn" title="Duplicate">⧉</button><button class="control-btn delete-btn" title="Delete">✕</button></div></div><div class="questions-container"><div class="question-item"><div class="question-text" contenteditable="true">What inspired you to start your career?</div></div><div class="question-item"><div class="question-text" contenteditable="true">What's your favorite part of your work?</div></div><div class="add-question">+ Add Question</div></div></div>`,
                'social': `<div class="editable-element" data-component="social"><div class="element-header"><div class="element-title">Social Media</div><div class="element-controls"><button class="control-btn move-up-btn" title="Move Up">↑</button><button class="control-btn move-down-btn" title="Move Down">↓</button><button class="control-btn duplicate-btn" title="Duplicate">⧉</button><button class="control-btn delete-btn" title="Delete">✕</button></div></div><div class="social-container"><div class="social-item"><div class="social-platform">Twitter</div><div class="social-link" contenteditable="true">https://twitter.com/yourusername</div></div><div class="add-social">+ Add Platform</div></div></div>`,
                'logo': `<div class="editable-element" data-component="logo"><div class="element-header"><div class="element-title">Logo</div><div class="element-controls"><button class="control-btn move-up-btn" title="Move Up">↑</button><button class="control-btn move-down-btn" title="Move Down">↓</button><button class="control-btn duplicate-btn" title="Duplicate">⧉</button><button class="control-btn delete-btn" title="Delete">✕</button></div></div><div class="logo-container"><div class="logo-placeholder"><div class="upload-button">Upload Logo</div></div></div></div>`
            };
            return templates[componentType] || null;
        }
        on(event, handler) {
            try {
                if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
                this.eventHandlers[event].push(handler);
                return () => this.off(event, handler);
            } catch (error) {
                this.handleError(error, 'event subscription');
            }
        }
        off(event, handler) {
            try {
                if (!this.eventHandlers[event]) return;
                this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
            } catch (error) {
                this.handleError(error, 'event unsubscription');
            }
        }
        emit(event, data) {
            try {
                if (!this.eventHandlers[event]) return;
                const eventData = { ...data, _event: event, _timestamp: new Date() };
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
        setupElementEventListeners(element) { /* ... same as before ... */ }
        setupUndoRedo() { /* ... same as before ... */ }
        setupEventListeners() { /* ... same as before ... */ }
        setupAutoSave() { /* ... same as before ... */ }
        markDirty() { /* ... same as before ... */ }
        markClean() { /* ... same as before ... */ }
        setLoading(isLoading) { /* ... same as before ... */ }
        selectElement(element) { /* ... same as before ... */ }
        updateDesignPanel(element) { /* ... same as before ... */ }
        clearDesignPanel() { /* ... same as before ... */ }
        getComponentProperties(componentType, element) { /* ... same as before ... */ }
        renderDesignControls(properties) { /* ... same as before ... */ }
        setupDesignControls(panel, element) { /* ... same as before ... */ }
        applyPropertyToElement(element, property, value) { /* ... same as before ... */ }
        addTopicItem(element) { /* ... same as before ... */ }
        addQuestionItem(element) { /* ... same as before ... */ }
        addSocialItem(element) { /* ... same as before ... */ }
        moveElementUp(element) { /* ... same as before ... */ }
        moveElementDown(element) { /* ... same as before ... */ }
        duplicateElement(element) { /* ... same as before ... */ }
        deleteElement(element) { /* ... same as before ... */ }
        saveStateToHistory() { /* ... same as before ... */ }
        updateUndoRedoButtons() { /* ... same as before ... */ }
        undo() { /* ... same as before ... */ }
        redo() { /* ... same as before ... */ }
        getBuilderState() { /* ... same as before ... */ }
        collectComponentData() { /* ... same as before ... */ }
        collectSectionData() { /* ... same as before ... */ }
        extractComponentContent(element) { /* ... same as before ... */ }
        extractComponentStyles(element) { /* ... same as before ... */ }
        extractSectionSettings(section) { /* ... same as before ... */ }
        extractSectionComponents(section) { /* ... same as before ... */ }
        applyBuilderState(state) { /* ... same as before ... */ }
        clearBuilder() { /* ... same as before ... */ }
        populateBuilder(state) {
            try {
                if (!state) return;
                if (state.sections && state.sections.length > 0) {
                    this.populateFromSections(state);
                } else {
                    this.populateFromComponents(state.components);
                }
            } catch (error) {
                this.handleError(error, 'populate builder');
            }
        }
        populateFromSections(state) { /* ... same as before ... */ }
        createSectionElement(section) { /* ... same as before ... */ }
        generateColumnsForLayout(layout) { /* ... same as before ... */ }
        setupSectionControlListeners(section) { /* ... same as before ... */ }
        createComponentFromData(componentData) { /* ... same as before ... */ }
        applyComponentContent(component, type, content) { /* ... same as before ... */ }
        populateFromComponents(components) { /* ... same as before ... */ }
        setupElementSelection() { /* ... same as before ... */ }
        handleError(error, context) { /* ... same as before ... */ }
        saveMediaKit(data) { /* ... same as before ... */ }
        loadMediaKit(entryKey) { /* ... same as before ... */ }
    }
    // Store the MediaKitBuilder class in the Core property of the global object
	window.MediaKitBuilder.Core = MediaKitBuilder;
})(jQuery);