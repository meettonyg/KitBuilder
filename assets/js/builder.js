/**
 * Media Kit Builder - Core Builder Class
 * Following nuclear efficiency architecture principles
 */

(function(window, document, $) {
    'use strict';

    // Main Builder Class
    class MediaKitBuilder {
        constructor(config) {
            this.config = {
                containerId: 'media-kit-builder',
                apiUrl: mkb_ajax.ajax_url,
                nonce: mkb_ajax.nonce,
                autosaveInterval: 30000, // 30 seconds
                ...config
            };

            this.state = {
                isDirty: false,
                selectedElement: null,
                draggedComponent: null,
                currentTheme: 'blue',
                previewMode: 'desktop',
                undoStack: [],
                redoStack: [],
                mediaKitId: null,
                isGuest: true,
                userData: {}
            };

            this.components = {};
            this.dropZones = [];
            
            this.init();
        }

        init() {
            console.log('Initializing Media Kit Builder v2');
            
            // Setup core systems
            this.setupContainer();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.loadInitialData();
            this.startAutosave();
            
            // Initialize subsystems
            this.dragDropManager = new DragDropManager(this);
            this.templateManager = new TemplateManager(this);
            this.exportManager = new ExportManager(this);
            this.sessionManager = new SessionManager(this);
            
            // Track initial state for undo
            this.saveCurrentState();
        }

        setupContainer() {
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                console.error('Media Kit Builder container not found');
                return;
            }
            
            container.innerHTML = this.getBuilderHTML();
            document.body.classList.add('mkb-builder-active');
        }

        getBuilderHTML() {
            return `
                <div class="mkb-builder-container">
                    ${this.getToolbarHTML()}
                    ${this.getSidebarHTML()}
                    ${this.getPreviewAreaHTML()}
                    ${this.getModalsHTML()}
                </div>
            `;
        }

        getToolbarHTML() {
            return `
                <div class="mkb-top-toolbar">
                    <div class="mkb-toolbar-left">
                        <div class="mkb-logo">Guestify</div>
                        <div class="mkb-guest-name">${this.state.userData.name || 'Guest'}'s Media Kit</div>
                        <div class="mkb-status-indicator">
                            <div class="mkb-status-dot"></div>
                            <span>Saved</span>
                        </div>
                    </div>
                    
                    <div class="mkb-toolbar-center">
                        <div class="mkb-preview-toggle">
                            <button class="active" data-preview="desktop">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                                Desktop
                            </button>
                            <button data-preview="tablet">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                    <line x1="9" y1="9" x2="15" y2="9"></line>
                                </svg>
                                Tablet
                            </button>
                            <button data-preview="mobile">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                                Mobile
                            </button>
                        </div>
                    </div>
                    
                    <div class="mkb-toolbar-right">
                        <button class="mkb-toolbar-btn" id="mkb-global-theme-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Theme
                        </button>
                        <button class="mkb-toolbar-btn export" id="mkb-export-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7,10 12,15 17,10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export
                        </button>
                        <button class="mkb-toolbar-btn" id="mkb-share-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            Share
                        </button>
                        <button class="mkb-toolbar-btn" id="mkb-undo-btn" disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 7v6h6"></path>
                                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                            </svg>
                        </button>
                        <button class="mkb-toolbar-btn" id="mkb-redo-btn" disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 7v6h-6"></path>
                                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                            </svg>
                        </button>
                        <button class="mkb-toolbar-btn primary" id="mkb-save-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                <polyline points="7,3 7,8 15,8"></polyline>
                            </svg>
                            Save
                        </button>
                    </div>
                </div>
            `;
        }

        getSidebarHTML() {
            return `
                <div class="mkb-left-sidebar">
                    <div class="mkb-sidebar-tabs">
                        <button class="mkb-sidebar-tab active" data-tab="components">Components</button>
                        <button class="mkb-sidebar-tab" data-tab="design">Design</button>
                        <button class="mkb-sidebar-tab" data-tab="layout">Layout</button>
                    </div>

                    <div class="mkb-sidebar-content">
                        ${this.getComponentsTabHTML()}
                        ${this.getDesignTabHTML()}
                        ${this.getLayoutTabHTML()}
                    </div>
                </div>
            `;
        }

        getComponentsTabHTML() {
            return `
                <div id="mkb-components-tab" class="mkb-tab-content active">
                    <div class="mkb-components-section">
                        <div class="mkb-section-title">Essential Components</div>
                        <div class="mkb-component-grid">
                            ${this.getComponentItemsHTML('essential')}
                        </div>
                    </div>

                    <div class="mkb-components-section">
                        <div class="mkb-section-title">Media & Content</div>
                        <div class="mkb-component-grid">
                            ${this.getComponentItemsHTML('media')}
                        </div>
                    </div>

                    <div class="mkb-components-section">
                        <div class="mkb-section-title">
                            Premium Components
                            <span class="mkb-premium-badge">PRO</span>
                        </div>
                        <div class="mkb-component-grid">
                            ${this.getComponentItemsHTML('premium')}
                        </div>
                    </div>

                    <button class="mkb-toolbar-btn mkb-add-component-btn" id="mkb-add-component-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Component
                    </button>
                </div>
            `;
        }

        getComponentItemsHTML(category) {
            const components = this.getComponentsByCategory(category);
            return components.map(comp => `
                <div class="mkb-component-item ${comp.premium ? 'premium' : ''}" 
                     draggable="true" 
                     data-component="${comp.id}">
                    ${comp.icon}
                    <div class="mkb-component-name">${comp.name}</div>
                </div>
            `).join('');
        }

        getDesignTabHTML() {
            return `
                <div id="mkb-design-tab" class="mkb-tab-content">
                    <div class="mkb-element-editor" id="mkb-element-editor">
                        <div class="mkb-editor-title">
                            Select an element to edit
                        </div>
                        <div class="mkb-editor-subtitle">
                            Click on any element in the preview to edit its properties
                        </div>
                    </div>
                </div>
            `;
        }

        getLayoutTabHTML() {
            return `
                <div id="mkb-layout-tab" class="mkb-tab-content">
                    <div class="mkb-section-title">Section Layouts</div>
                    <div class="mkb-layout-options">
                        <div class="mkb-layout-option active" data-layout="full-width">
                            <div class="mkb-layout-preview full-width"></div>
                            <div class="mkb-layout-name">Full Width</div>
                        </div>
                        <div class="mkb-layout-option" data-layout="two-column">
                            <div class="mkb-layout-preview two-column"></div>
                            <div class="mkb-layout-name">Two Column</div>
                        </div>
                    </div>
                </div>
            `;
        }

        getPreviewAreaHTML() {
            return `
                <div class="mkb-preview-area">
                    <div class="mkb-preview-container" id="mkb-preview-container">
                        <div class="mkb-media-kit-preview" id="mkb-media-kit-preview">
                            ${this.getDefaultMediaKitHTML()}
                        </div>
                    </div>
                </div>
            `;
        }

        getDefaultMediaKitHTML() {
            // This would be populated from saved data or template
            return `
                <div class="mkb-drop-zone empty" data-zone="0"></div>
            `;
        }

        getModalsHTML() {
            return `
                ${this.getGlobalSettingsModalHTML()}
                ${this.getExportModalHTML()}
                ${this.getComponentLibraryModalHTML()}
            `;
        }

        getGlobalSettingsModalHTML() {
            return `
                <div class="mkb-modal-overlay" id="mkb-global-settings-modal">
                    <div class="mkb-modal-content">
                        <div class="mkb-modal-header">
                            <div class="mkb-modal-title">Global Theme Settings</div>
                            <button class="mkb-close-modal" id="mkb-close-global-settings">&times;</button>
                        </div>
                        <div class="mkb-modal-body">
                            <div class="mkb-form-group">
                                <label class="mkb-form-label">Color Palette</label>
                                <div class="mkb-theme-palette">
                                    <div class="mkb-palette-option blue active" data-palette="blue"></div>
                                    <div class="mkb-palette-option green" data-palette="green"></div>
                                    <div class="mkb-palette-option purple" data-palette="purple"></div>
                                    <div class="mkb-palette-option orange" data-palette="orange"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        getExportModalHTML() {
            return `
                <div class="mkb-modal-overlay" id="mkb-export-modal">
                    <div class="mkb-modal-content">
                        <div class="mkb-modal-header">
                            <div class="mkb-modal-title">Export Your Media Kit</div>
                            <button class="mkb-close-modal" id="mkb-close-export-modal">&times;</button>
                        </div>
                        <div class="mkb-modal-body">
                            <div class="mkb-export-options">
                                <div class="mkb-export-option" data-export="pdf">
                                    <div class="mkb-export-icon">📄</div>
                                    <div class="mkb-export-title">PDF Document</div>
                                    <div class="mkb-export-description">Download as a PDF file</div>
                                </div>
                                <div class="mkb-export-option" data-export="image">
                                    <div class="mkb-export-icon">🖼️</div>
                                    <div class="mkb-export-title">Image (PNG)</div>
                                    <div class="mkb-export-description">Export as high-res image</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        getComponentLibraryModalHTML() {
            return `
                <div class="mkb-modal-overlay" id="mkb-component-library-overlay">
                    <div class="mkb-component-library-modal">
                        <div class="mkb-library-header">
                            <div class="mkb-library-title">Component Library</div>
                            <button class="mkb-close-modal" id="mkb-close-library">&times;</button>
                        </div>
                        <div class="mkb-library-content">
                            <div class="mkb-library-main">
                                <div class="mkb-components-grid" id="mkb-library-components">
                                    <!-- Components will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        setupEventListeners() {
            // Toolbar buttons
            this.addClickListener('#mkb-save-btn', () => this.saveMediaKit());
            this.addClickListener('#mkb-undo-btn', () => this.undo());
            this.addClickListener('#mkb-redo-btn', () => this.redo());
            this.addClickListener('#mkb-export-btn', () => this.showExportModal());
            this.addClickListener('#mkb-share-btn', () => this.shareMediaKit());
            this.addClickListener('#mkb-global-theme-btn', () => this.showGlobalSettings());
            
            // Sidebar tabs
            document.querySelectorAll('.mkb-sidebar-tab').forEach(tab => {
                tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });
            
            // Preview toggle
            document.querySelectorAll('.mkb-preview-toggle button').forEach(btn => {
                btn.addEventListener('click', (e) => this.switchPreviewMode(e.currentTarget.dataset.preview));
            });
            
            // Modal close buttons
            document.querySelectorAll('.mkb-close-modal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.closest('.mkb-modal-overlay').style.display = 'none';
                });
            });
            
            // Component library
            this.addClickListener('#mkb-add-component-btn', () => this.showComponentLibrary());
        }

        addClickListener(selector, handler) {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('click', handler);
            }
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 's':
                            e.preventDefault();
                            this.saveMediaKit();
                            break;
                        case 'z':
                            e.preventDefault();
                            if (e.shiftKey) {
                                this.redo();
                            } else {
                                this.undo();
                            }
                            break;
                        case 'e':
                            e.preventDefault();
                            this.showExportModal();
                            break;
                    }
                }
                
                if (e.key === 'Delete' && this.state.selectedElement) {
                    this.deleteSelectedElement();
                }
            });
        }

        loadInitialData() {
            // Load user data, media kit data, etc.
            const urlParams = new URLSearchParams(window.location.search);
            const kitId = urlParams.get('kit_id');
            
            if (kitId) {
                this.loadMediaKit(kitId);
            } else {
                this.createNewMediaKit();
            }
        }

        async loadMediaKit(kitId) {
            try {
                const response = await this.api('load_media_kit', { kit_id: kitId });
                if (response.success) {
                    this.state.mediaKitId = kitId;
                    this.renderMediaKit(response.data);
                }
            } catch (error) {
                console.error('Failed to load media kit:', error);
            }
        }

        createNewMediaKit() {
            // Initialize with default template
            this.state.mediaKitId = null;
            this.renderDefaultTemplate();
        }

        renderDefaultTemplate() {
            const preview = document.getElementById('mkb-media-kit-preview');
            if (preview) {
                preview.innerHTML = `
                    <div class="mkb-hero-section mkb-editable-element" data-element="hero" data-component="hero">
                        <div class="mkb-element-controls">
                            <button class="mkb-control-btn" title="Duplicate">⧉</button>
                            <button class="mkb-control-btn" title="Delete">×</button>
                        </div>
                        <div class="mkb-hero-avatar">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='50' text-anchor='middle' x='50' fill='%2364748b'%3E👤%3C/text%3E%3C/svg%3E" alt="Profile">
                        </div>
                        <h1 class="mkb-hero-name" contenteditable="true">Your Name</h1>
                        <div class="mkb-hero-title" contenteditable="true">Your Title</div>
                        <p class="mkb-hero-bio" contenteditable="true">Tell your story here...</p>
                    </div>
                    <div class="mkb-drop-zone empty" data-zone="1"></div>
                `;
                
                this.setupEditableElements();
                this.dragDropManager.setupDropZones();
            }
        }

        setupEditableElements() {
            document.querySelectorAll('.mkb-editable-element').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectElement(element);
                });
            });
            
            document.querySelectorAll('[contenteditable="true"]').forEach(element => {
                element.addEventListener('blur', () => {
                    this.markDirty();
                    this.saveCurrentState();
                });
            });
        }

        selectElement(element) {
            // Remove previous selection
            document.querySelectorAll('.mkb-editable-element').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Select new element
            element.classList.add('selected');
            this.state.selectedElement = element;
            
            // Update design panel
            this.updateDesignPanel(element);
            
            // Switch to design tab
            this.switchTab('design');
        }

        updateDesignPanel(element) {
            const editor = document.getElementById('mkb-element-editor');
            if (!editor) return;
            
            const componentType = element.dataset.component;
            const componentConfig = this.getComponentConfig(componentType);
            
            editor.innerHTML = this.getDesignPanelHTML(componentConfig, element);
            this.setupDesignPanelListeners(element);
        }

        getDesignPanelHTML(config, element) {
            // Generate form fields based on component configuration
            return `
                <div class="mkb-editor-title">${config.name} Settings</div>
                <div class="mkb-editor-subtitle">Customize this component</div>
                ${config.fields.map(field => this.getFieldHTML(field, element)).join('')}
            `;
        }

        getFieldHTML(field, element) {
            // Generate appropriate field based on type
            const value = this.getFieldValue(field, element);
            
            switch(field.type) {
                case 'text':
                    return `
                        <div class="mkb-form-group">
                            <label class="mkb-form-label">${field.label}</label>
                            <input type="text" class="mkb-form-input" 
                                   data-field="${field.id}" 
                                   value="${value}">
                        </div>
                    `;
                case 'textarea':
                    return `
                        <div class="mkb-form-group">
                            <label class="mkb-form-label">${field.label}</label>
                            <textarea class="mkb-form-input mkb-form-textarea" 
                                      data-field="${field.id}">${value}</textarea>
                        </div>
                    `;
                case 'color':
                    return `
                        <div class="mkb-form-group">
                            <label class="mkb-form-label">${field.label}</label>
                            <div class="mkb-color-picker">
                                <input type="color" class="mkb-color-input" 
                                       data-field="${field.id}" 
                                       value="${value}">
                                <input type="text" class="mkb-form-input" 
                                       value="${value}" style="flex: 1;">
                            </div>
                        </div>
                    `;
                default:
                    return '';
            }
        }

        setupDesignPanelListeners(element) {
            const inputs = document.querySelectorAll('#mkb-element-editor input, #mkb-element-editor textarea');
            
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.updateElementProperty(element, e.target.dataset.field, e.target.value);
                    this.markDirty();
                });
            });
        }

        updateElementProperty(element, field, value) {
            // Update the element based on the field
            // This is simplified - actual implementation would be more complex
            console.log('Updating', field, 'to', value);
        }

        switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.mkb-sidebar-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });
            
            // Update tab content
            document.querySelectorAll('.mkb-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `mkb-${tabName}-tab`);
            });
        }

        switchPreviewMode(mode) {
            const container = document.getElementById('mkb-preview-container');
            const buttons = document.querySelectorAll('.mkb-preview-toggle button');
            
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.preview === mode);
            });
            
            container.classList.remove('mobile-preview', 'tablet-preview');
            if (mode === 'mobile') {
                container.classList.add('mobile-preview');
            } else if (mode === 'tablet') {
                container.classList.add('tablet-preview');
            }
            
            this.state.previewMode = mode;
        }

        async saveMediaKit() {
            const saveBtn = document.getElementById('mkb-save-btn');
            const statusDot = document.querySelector('.mkb-status-dot');
            const statusText = document.querySelector('.mkb-status-indicator span');
            
            // Update UI
            if (saveBtn) saveBtn.disabled = true;
            if (statusDot) statusDot.classList.add('saving');
            if (statusText) statusText.textContent = 'Saving...';
            
            try {
                const data = this.collectMediaKitData();
                const response = await this.api('save_media_kit', data);
                
                if (response.success) {
                    this.state.isDirty = false;
                    this.state.mediaKitId = response.data.kit_id;
                    
                    if (statusText) statusText.textContent = 'Saved';
                    
                    // Update URL if this was a new kit
                    if (!window.location.search.includes('kit_id')) {
                        const newUrl = window.location.pathname + '?kit_id=' + response.data.kit_id;
                        window.history.replaceState({}, '', newUrl);
                    }
                }
            } catch (error) {
                console.error('Save failed:', error);
                if (statusText) statusText.textContent = 'Save failed';
            } finally {
                if (saveBtn) saveBtn.disabled = false;
                if (statusDot) statusDot.classList.remove('saving');
            }
        }

        collectMediaKitData() {
            const preview = document.getElementById('mkb-media-kit-preview');
            
            return {
                kit_id: this.state.mediaKitId,
                theme: this.state.currentTheme,
                content: preview.innerHTML,
                components: this.collectComponentData(),
                metadata: {
                    last_modified: new Date().toISOString(),
                    preview_mode: this.state.previewMode
                }
            };
        }

        collectComponentData() {
            const components = [];
            
            document.querySelectorAll('.mkb-editable-element').forEach((element, index) => {
                components.push({
                    type: element.dataset.component,
                    order: index,
                    data: this.extractComponentData(element)
                });
            });
            
            return components;
        }

        extractComponentData(element) {
            const data = {};
            
            // Extract text content
            element.querySelectorAll('[contenteditable="true"]').forEach(editable => {
                const fieldName = editable.className.replace('mkb-', '').replace(/-/g, '_');
                data[fieldName] = editable.textContent;
            });
            
            // Extract other attributes
            // This would be expanded based on component types
            
            return data;
        }

        markDirty() {
            this.state.isDirty = true;
            const statusText = document.querySelector('.mkb-status-indicator span');
            if (statusText) statusText.textContent = 'Unsaved changes';
        }

        startAutosave() {
            setInterval(() => {
                if (this.state.isDirty) {
                    this.autoSave();
                }
            }, this.config.autosaveInterval);
        }

        async autoSave() {
            const statusText = document.querySelector('.mkb-status-indicator span');
            if (statusText) statusText.textContent = 'Auto-saving...';
            
            try {
                await this.saveMediaKit();
            } catch (error) {
                console.error('Autosave failed:', error);
            }
        }

        saveCurrentState() {
            const preview = document.getElementById('mkb-media-kit-preview');
            if (!preview) return;
            
            const state = preview.innerHTML;
            this.state.undoStack.push(state);
            this.state.redoStack = [];
            
            // Limit undo stack size
            if (this.state.undoStack.length > 50) {
                this.state.undoStack.shift();
            }
            
            this.updateUndoRedoButtons();
        }

        undo() {
            if (this.state.undoStack.length === 0) return;
            
            const preview = document.getElementById('mkb-media-kit-preview');
            const currentState = preview.innerHTML;
            
            this.state.redoStack.push(currentState);
            const previousState = this.state.undoStack.pop();
            
            preview.innerHTML = previousState;
            this.setupEditableElements();
            this.dragDropManager.setupDropZones();
            this.updateUndoRedoButtons();
            this.markDirty();
        }

        redo() {
            if (this.state.redoStack.length === 0) return;
            
            const preview = document.getElementById('mkb-media-kit-preview');
            const currentState = preview.innerHTML;
            
            this.state.undoStack.push(currentState);
            const nextState = this.state.redoStack.pop();
            
            preview.innerHTML = nextState;
            this.setupEditableElements();
            this.dragDropManager.setupDropZones();
            this.updateUndoRedoButtons();
            this.markDirty();
        }

        updateUndoRedoButtons() {
            const undoBtn = document.getElementById('mkb-undo-btn');
            const redoBtn = document.getElementById('mkb-redo-btn');
            
            if (undoBtn) undoBtn.disabled = this.state.undoStack.length === 0;
            if (redoBtn) redoBtn.disabled = this.state.redoStack.length === 0;
        }

        deleteSelectedElement() {
            if (!this.state.selectedElement) return;
            
            // Don't allow deleting certain essential components
            if (this.state.selectedElement.dataset.component === 'hero') {
                alert('The hero section cannot be deleted');
                return;
            }
            
            this.state.selectedElement.remove();
            this.state.selectedElement = null;
            this.markDirty();
            this.saveCurrentState();
        }

        showExportModal() {
            const modal = document.getElementById('mkb-export-modal');
            if (modal) modal.style.display = 'flex';
        }

        async shareMediaKit() {
            // Generate share link
            const shareUrl = `${window.location.origin}/media-kit/view/${this.state.mediaKitId}`;
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'My Media Kit',
                        text: 'Check out my professional media kit',
                        url: shareUrl
                    });
                } catch (error) {
                    console.log('Share cancelled');
                }
            } else {
                // Fallback - copy to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Share link copied to clipboard!');
                });
            }
        }

        showGlobalSettings() {
            const modal = document.getElementById('mkb-global-settings-modal');
            if (modal) modal.style.display = 'flex';
        }

        showComponentLibrary() {
            const modal = document.getElementById('mkb-component-library-overlay');
            if (modal) modal.style.display = 'flex';
        }

        async api(action, data = {}) {
            const formData = new FormData();
            formData.append('action', 'mkb_' + action);
            formData.append('nonce', this.config.nonce);
            
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object') {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            });
            
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                body: formData
            });
            
            return response.json();
        }

        getComponentsByCategory(category) {
            // This would be populated from configuration
            const components = {
                essential: [
                    { id: 'hero', name: 'Hero', icon: this.getSvgIcon('user'), premium: false },
                    { id: 'bio', name: 'Biography', icon: this.getSvgIcon('file-text'), premium: false },
                    { id: 'topics', name: 'Topics', icon: this.getSvgIcon('tag'), premium: false },
                    { id: 'social', name: 'Social', icon: this.getSvgIcon('share-2'), premium: false }
                ],
                media: [
                    { id: 'logo-grid', name: 'Logo Grid', icon: this.getSvgIcon('grid'), premium: false },
                    { id: 'testimonials', name: 'Testimonials', icon: this.getSvgIcon('message-square'), premium: false }
                ],
                premium: [
                    { id: 'video', name: 'Video Intro', icon: this.getSvgIcon('video'), premium: true },
                    { id: 'gallery', name: 'Photo Gallery', icon: this.getSvgIcon('image'), premium: true }
                ]
            };
            
            return components[category] || [];
        }

        getComponentConfig(type) {
            const configs = {
                hero: {
                    name: 'Hero Section',
                    fields: [
                        { id: 'name', type: 'text', label: 'Full Name' },
                        { id: 'title', type: 'text', label: 'Professional Title' },
                        { id: 'bio', type: 'textarea', label: 'Bio Description' },
                        { id: 'bg_color', type: 'color', label: 'Background Color' }
                    ]
                },
                bio: {
                    name: 'Biography',
                    fields: [
                        { id: 'heading', type: 'text', label: 'Section Heading' },
                        { id: 'content', type: 'textarea', label: 'Biography Content' }
                    ]
                }
                // Add more component configurations
            };
            
            return configs[type] || { name: 'Component', fields: [] };
        }

        getFieldValue(field, element) {
            // Get current value from element
            // This is simplified - actual implementation would be more complex
            return '';
        }

        getSvgIcon(name) {
            const icons = {
                'user': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
                'file-text': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>',
                'tag': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
                'share-2': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
                'grid': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
                'message-square': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
                'video': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
                'image': '<svg class="mkb-component-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg>'
            };
            
            return icons[name] || '';
        }
    }

    // Initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.mkBuilder = new MediaKitBuilder();
        });
    } else {
        window.mkBuilder = new MediaKitBuilder();
    }

})(window, document, jQuery);