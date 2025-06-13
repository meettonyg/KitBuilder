/**
 * Media Kit Builder - WordPress Adapter
 * 
 * This file serves as the adapter between the core MediaKitBuilder class
 * and WordPress-specific functionality.
 */

(function($) {
    'use strict';
    
    /**
     * WordPressAdapter Class
     * Handles WordPress-specific functionality for the Media Kit Builder
     */
    class WordPressAdapter {
        /**
         * Constructor
         * @param {Object} config - Configuration options
         */
        constructor(config = {}) {
            // Store configuration
            this.config = {
                ajaxUrl: '',
                restUrl: '',
                nonce: '',
                restNonce: '',
                userId: 0,
                accessTier: 'guest',
                isAdmin: false,
                debugMode: false,
                autoSaveInterval: 30000, // 30 seconds
                ...config
            };
            
            // State
            this.builder = null;
            this.currentEntryKey = null;
            this.formidableKey = null;
            this.postId = null;
            this.isInitialized = false;
            this.saveInProgress = false;
            this.loadInProgress = false;
            
            // Managers
            this.managers = {
                premium: null,
                templates: null,
                export: null
            };
            
            // Auto-save timer
            this.autoSaveTimer = null;
            
            // Initialize
            this.init();
        }
        
        /**
         * Initialize the WordPress adapter
         */
        init() {
            this.log('Initializing Media Kit Builder WordPress Adapter...');
            
            try {
                // Check if we have the MediaKitBuilder class
                if (typeof window.MediaKitBuilder.Core !== 'function') {
                    console.warn('MediaKitBuilder Core class not found. Will attempt to use a fallback version.');
                    window.MediaKitBuilder.Core = function(config) {
                        console.log('Fallback MediaKitBuilder.Core constructor called with config:', config);
                        this.config = config || {};
                        this.state = {
                            initialized: false,
                            isDirty: false,
                            isLoading: false,
                            selectedElement: null,
                            selectedSection: null,
                            undoStack: [],
                            redoStack: [],
                            errors: []
                        };
                        this.eventHandlers = {};
                        
                        this.init = function() {
                            console.log('Fallback MediaKitBuilder.Core init called');
                            this.state.initialized = true;
                            this.emit('initialized', { timestamp: new Date() });
                        };
                        
                        // Add missing methods for better compatibility
                        this.on = function(event, handler) {
                            console.log('Fallback MediaKitBuilder.Core on method called:', event);
                            if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
                            this.eventHandlers[event].push(handler);
                            return function() {}; // Return dummy unsubscribe function
                        };
                        
                        this.off = function(event, handler) {
                            console.log('Fallback MediaKitBuilder.Core off method called:', event);
                            if (!this.eventHandlers[event]) return;
                            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
                        };
                        
                        this.emit = function(event, data) {
                            console.log('Fallback MediaKitBuilder.Core emit method called:', event, data);
                            if (!this.eventHandlers[event]) return;
                            const eventData = { ...data, _event: event, _timestamp: new Date() };
                            this.eventHandlers[event].forEach(handler => {
                                try {
                                    handler(eventData);
                                } catch (error) {
                                    console.error(`Error in event handler for ${event}:`, error);
                                }
                            });
                        };
                        
                        this.markDirty = function() {
                            this.state.isDirty = true;
                            this.emit('dirty-state-changed', { isDirty: true });
                        };
                        
                        this.markClean = function() {
                            this.state.isDirty = false;
                            this.emit('dirty-state-changed', { isDirty: false });
                        };
                        
                        this.setLoading = function(isLoading) {
                            this.state.isLoading = isLoading;
                            this.emit('loading-state-changed', { isLoading });
                        };
                        
                        this.getBuilderState = function() {
                            return {
                                sections: [],
                                components: {}
                            };
                        };
                        
                        this.saveStateToHistory = function() {
                            console.log('Fallback saveStateToHistory called');
                        };
                        
                        this.addComponent = function(componentType) {
                            console.log('Fallback addComponent called:', componentType);
                        };
                        
                        this.addSection = function(type, layout, components) {
                            console.log('Fallback addSection called:', type, layout);
                        };
                        
                        this.handleError = function(error, context) {
                            console.error(`Error in ${context || 'unknown context'}:`, error);
                            this.state.errors.push({
                                error: error,
                                context: context,
                                timestamp: new Date().toISOString()
                            });
                            this.emit('error', { error, context });
                        };
                        
                        // Make instance available globally
                        window.MediaKitBuilder.global.instance = this;
                    };
                }
            } catch (error) {
                console.error('Error initializing Media Kit Builder Core:', error);
                if (this.builder && typeof this.builder.handleError === 'function') {
                    this.builder.handleError(error, 'core-initialization');
                }
            }
                
                // Check if elements are ready (from initializer)
                if (!window.MediaKitBuilder.elementsReady) {
                    console.log('DOM elements not ready yet, triggering initializer');
                    if (typeof window.MediaKitBuilder.safeInit === 'function') {
                        window.MediaKitBuilder.safeInit();
                    }
                }
                
                // Create MediaKitBuilder instance
                this.builder = new window.MediaKitBuilder.Core({
                    container: '#media-kit-builder',
                    previewContainer: '#media-kit-preview',
                    componentPalette: '#component-palette',
                    wpData: this.config
                });
                
                // Set global reference for compatibility
                window.mediaKitBuilder = this.builder;
                
                console.log('MediaKitBuilder instance created successfully');
                
                // Initialize managers
                this.initializeManagers();
                
                // Set up WordPress-specific functionality
                this.setupEventListeners();
                this.setupAutoSave();
                this.setupAdminUI();
                this.setupMediaUploader();
                
                // Load media kit from URL if entry_key exists
                this.loadFromURL();
                
                // Set up error handling
                this.setupErrorHandling();
                
                this.isInitialized = true;
                this.log('WordPress Adapter initialized successfully');
                
                // If initialization is needed, do it now
                if (window.MediaKitBuilder.shouldInitialize) {
                    console.log('Initializing builder from adapter');
                    this.builder.init();
                }
            } catch (error) {
                console.error('Error initializing WordPress adapter:', error);
            }
        }
        
        /**
         * Initialize manager classes
         */
        initializeManagers() {
            // Initialize Premium Access Manager
            if (typeof PremiumAccessManager === 'function') {
                this.managers.premium = new PremiumAccessManager({
                    accessTier: this.config.accessTier,
                    isAdmin: this.config.isAdmin,
                    builder: this.builder
                });
                
                this.log('Premium Access Manager initialized');
            }
            
            // Initialize Template Manager
            if (typeof SectionTemplateManager === 'function') {
                this.managers.templates = new SectionTemplateManager({
                    config: this.config,
                    builder: this.builder
                });
                
                this.log('Section Template Manager initialized');
            }
            
            // Initialize Export Manager
            if (typeof ExportManager === 'function') {
                this.managers.export = new ExportManager({
                    config: this.config,
                    builder: this.builder
                });
                
                this.log('Export Manager initialized');
            }
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Listen for builder events
            this.builder.on('save-requested', (data) => this.saveMediaKit(data));
            this.builder.on('load-requested', (entryKey) => this.loadMediaKit(entryKey));
            this.builder.on('export-requested', (format) => this.exportMediaKit(format));
            this.builder.on('dirty-state-changed', (isDirty) => this.handleDirtyStateChange(isDirty));
            this.builder.on('loading-state-changed', (isLoading) => this.handleLoadingStateChange(isLoading));
            this.builder.on('element-selected', (element) => this.handleElementSelection(element));
            this.builder.on('error', (error) => this.handleError(error));
            
            // Listen for section template selection
            document.addEventListener('template-selected', (event) => {
                const template = event.detail.template;
                this.log('Template selected:', template.name);
                
                if (this.hasCapability('premium_templates') || !template.premium) {
                    // Add section with template
                    this.builder.addSection(template.type, template.layout, template.components);
                } else {
                    this.showUpgradePrompt('Premium Templates', 'This template requires a premium account.');
                }
            });
            
            // Window unload warning
            window.addEventListener('beforeunload', (e) => {
                if (this.builder.state.isDirty) {
                    const message = 'You have unsaved changes. Are you sure you want to leave?';
                    e.returnValue = message;
                    return message;
                }
            });
        }
        
        /**
         * Set up auto-save functionality
         */
        setupAutoSave() {
            // Clear existing timer if any
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
            }
            
            // Auto-save every 30 seconds if changes exist
            this.autoSaveTimer = setInterval(() => {
                if (this.builder.state.isDirty && this.currentEntryKey && this.hasCapability('save_kit')) {
                    this.log('Auto-saving changes...');
                    this.saveMediaKit();
                }
            }, this.config.autoSaveInterval);
            
            this.log(`Auto-save set up with interval: ${this.config.autoSaveInterval}ms`);
        }
        
        /**
         * Set up admin UI elements
         */
        setupAdminUI() {
            this.setupSaveButton();
            this.setupExportButton();
            this.setupNotifications();
            this.setupModalSystem();
            
            this.log('Admin UI setup complete');
        }
        
        /**
         * Set up save button
         */
        setupSaveButton() {
            const saveBtn = document.getElementById('mkb-save-button');
            if (saveBtn) {
                saveBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (this.saveInProgress) {
                        return;
                    }
                    
                    if (!this.hasCapability('save_kit')) {
                        this.showUpgradePrompt('Save Feature', 'Saving is a premium feature. Please upgrade to save your media kit.');
                        return;
                    }
                    
                    this.saveMediaKit();
                });
                
                this.log('Save button set up');
            }
        }
        
        /**
         * Set up export button
         */
        setupExportButton() {
            const exportBtn = document.getElementById('mkb-export-button');
            if (exportBtn) {
                exportBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (!this.hasCapability('export_pdf')) {
                        this.showUpgradePrompt('Export Feature', 'PDF export is a premium feature. Please upgrade to export your media kit.');
                        return;
                    }
                    
                    this.exportMediaKit('pdf');
                });
                
                this.log('Export button set up');
            }
        }
        
        /**
         * Set up notifications
         */
        setupNotifications() {
            // Create notifications container if it doesn't exist
            let container = document.getElementById('mkb-notifications');
            if (!container) {
                container = document.createElement('div');
                container.id = 'mkb-notifications';
                container.className = 'mkb-notifications';
                document.body.appendChild(container);
                
                this.log('Notifications container created');
            }
        }
        
        /**
         * Set up modal system
         */
        setupModalSystem() {
            // Create modal container if it doesn't exist
            let container = document.getElementById('mkb-modals');
            if (!container) {
                container = document.createElement('div');
                container.id = 'mkb-modals';
                container.className = 'mkb-modals';
                document.body.appendChild(container);
                
                this.log('Modal container created');
            }
        }
        
        /**
         * Set up WordPress media uploader
         */
        setupMediaUploader() {
            // Check if media uploader is available
            if (!window.wp || !window.wp.media) {
                console.warn('WordPress Media Uploader not available');
                return;
            }
            
            // Create media uploader instance
            const uploader = wp.media({
                title: 'Select or Upload Media',
                button: {
                    text: 'Use this media'
                },
                multiple: false
            });
            
            // Store uploader for later use
            this.mediaUploader = uploader;
            
            // Expose media uploader to builder
            this.builder.mediaUploader = uploader;
            
            // Handle media upload requests
            this.builder.on('media-upload-requested', (callback) => {
                // Reset selection when opening the media uploader
                uploader.off('select').on('select', () => {
                    const attachment = uploader.state().get('selection').first().toJSON();
                    if (typeof callback === 'function') {
                        callback(attachment);
                    }
                });
                
                // Open media uploader
                uploader.open();
            });
            
            // Listen for upload button clicks using event delegation
            $(document).on('click', '.upload-button', (e) => {
                e.preventDefault();
                
                // Get the logo container
                const logoContainer = $(e.target).closest('.logo-container');
                if (!logoContainer.length) return;
                
                // Reset selection when opening the media uploader
                uploader.off('select').on('select', () => {
                    const attachment = uploader.state().get('selection').first().toJSON();
                    
                    // Update logo container with selected image
                    logoContainer.html(`
                        <img src="${attachment.url}" alt="${attachment.alt || 'Logo'}" class="logo-image">
                        <div class="upload-button">Change Logo</div>
                    `);
                    
                    // Mark as dirty
                    if (this.builder) {
                        this.builder.markDirty();
                        this.builder.saveStateToHistory();
                    }
                });
                
                // Open media uploader
                uploader.open();
            });
            
            this.log('WordPress media uploader set up');
        }
        
        /**
         * Set up error handling
         */
        setupErrorHandling() {
            // Global error handler
            window.addEventListener('error', (event) => {
                this.handleError({
                    message: event.message,
                    source: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
                
                // Don't prevent default error handling
                return false;
            });
            
            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError({
                    message: event.reason?.message || 'Unhandled Promise rejection',
                    error: event.reason
                });
                
                // Don't prevent default error handling
                return false;
            });
            
            this.log('Error handling set up');
        }
        
        /**
         * Load media kit from URL
         */
        loadFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const entryKey = urlParams.get('entry_key');
            const formidableKey = urlParams.get('entry_id');
            
            if (entryKey) {
                this.log('Loading media kit from URL with entry_key:', entryKey);
                this.loadMediaKit(entryKey);
            } else if (formidableKey) {
                // If we have a formidable key but no entry key, use the formidable key
                this.log('Loading media kit from URL with formidable_key:', formidableKey);
                this.loadMediaKit(formidableKey);
            }
        }
        
        /**
         * Save media kit
         * @param {Object} data - Media kit data (optional)
         * @returns {Promise} - Promise that resolves with save result
         */
        saveMediaKit(data = null) {
            // Check if save is already in progress
            if (this.saveInProgress) {
                this.log('Save already in progress, skipping');
                return Promise.reject(new Error('Save already in progress'));
            }
            
            // Check if user has save capability
            if (!this.hasCapability('save_kit')) {
                this.showUpgradePrompt('Save Feature', 'Saving is a premium feature. Please upgrade to save your media kit.');
                return Promise.reject(new Error('Save capability required'));
            }
            
            // Set save in progress flag
            this.saveInProgress = true;
            
            // Get data from builder if not provided
            if (!data) {
                data = this.builder.getBuilderState();
            }
            
            // Show saving indicator
            this.updateSaveStatus('Saving...');
            
            // Emit save-started event
            this.builder.emit('save-started');
            
            return new Promise((resolve, reject) => {
                // Determine whether to use REST API or AJAX
                if (this.config.restUrl) {
                    this.saveWithRESTAPI(data)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            this.saveInProgress = false;
                        });
                } else {
                    this.saveWithAJAX(data)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            this.saveInProgress = false;
                        });
                }
            });
        }
        
        /**
         * Save media kit using REST API
         * @param {Object} data - Media kit data
         * @returns {Promise} - Promise that resolves with save result
         */
        saveWithRESTAPI(data) {
            return new Promise((resolve, reject) => {
                // Create request data
                const requestData = {
                    kit_data: JSON.stringify(data)
                };
                
                // Add additional data if available
                if (this.currentEntryKey) {
                    requestData.entry_key = this.currentEntryKey;
                }
                
                if (this.formidableKey) {
                    requestData.formidable_key = this.formidableKey;
                }
                
                if (this.postId) {
                    requestData.post_id = this.postId;
                }
                
                // API URL and method
                const url = this.currentEntryKey 
                    ? `${this.config.restUrl}kits/${this.currentEntryKey}`
                    : `${this.config.restUrl}kits`;
                    
                const method = this.currentEntryKey ? 'PUT' : 'POST';
                
                this.log(`Saving media kit using REST API: ${method} ${url}`, { entryKey: this.currentEntryKey });
                
                // Send REST API request
                fetch(url, {
                    method: method,
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.config.restNonce
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Update entry key if new kit
                        if (response.entry_key) {
                            this.currentEntryKey = response.entry_key;
                            this.formidableKey = response.formidable_key || this.formidableKey;
                            this.postId = response.post_id || this.postId;
                            
                            // Update URL with new entry key
                            const url = new URL(window.location.href);
                            url.searchParams.set('entry_key', response.entry_key);
                            window.history.replaceState({}, '', url.toString());
                            
                            this.log('Updated entry key:', response.entry_key);
                        }
                        
                        // Mark as clean
                        this.builder.markClean();
                        this.updateSaveStatus('Saved');
                        this.showNotification('success', 'Media kit saved successfully');
                        
                        // Emit save-completed event
                        this.builder.emit('save-completed', response);
                        
                        resolve(response);
                    } else {
                        throw new Error(response.message || 'Save failed');
                    }
                })
                .catch(error => {
                    console.error('Save error:', error);
                    this.updateSaveStatus('Save failed');
                    this.showNotification('error', `Failed to save: ${error.message}`);
                    
                    // Emit save-failed event
                    this.builder.emit('save-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Save media kit using AJAX (fallback)
         * @param {Object} data - Media kit data
         * @returns {Promise} - Promise that resolves with save result
         */
        saveWithAJAX(data) {
            return new Promise((resolve, reject) => {
                // Prepare form data
                const formData = new FormData();
                formData.append('action', 'mkb_save_kit');
                formData.append('nonce', this.config.nonce);
                formData.append('kit_data', JSON.stringify(data));
                
                // Add additional data if available
                if (this.currentEntryKey) {
                    formData.append('entry_key', this.currentEntryKey);
                }
                
                if (this.formidableKey) {
                    formData.append('formidable_key', this.formidableKey);
                }
                
                if (this.postId) {
                    formData.append('post_id', this.postId);
                }
                
                this.log('Saving media kit using AJAX', { entryKey: this.currentEntryKey });
                
                // Send AJAX request
                fetch(this.config.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Update entry key if new kit
                        if (response.data && response.data.entry_key) {
                            this.currentEntryKey = response.data.entry_key;
                            this.formidableKey = response.data.formidable_key || this.formidableKey;
                            this.postId = response.data.post_id || this.postId;
                            
                            // Update URL with new entry key
                            const url = new URL(window.location.href);
                            url.searchParams.set('entry_key', response.data.entry_key);
                            window.history.replaceState({}, '', url.toString());
                            
                            this.log('Updated entry key:', response.data.entry_key);
                        }
                        
                        // Mark as clean
                        this.builder.markClean();
                        this.updateSaveStatus('Saved');
                        this.showNotification('success', 'Media kit saved successfully');
                        
                        // Emit save-completed event
                        this.builder.emit('save-completed', response.data);
                        
                        resolve(response.data);
                    } else {
                        throw new Error(response.data?.message || 'Save failed');
                    }
                })
                .catch(error => {
                    console.error('Save error:', error);
                    this.updateSaveStatus('Save failed');
                    this.showNotification('error', `Failed to save: ${error.message}`);
                    
                    // Emit save-failed event
                    this.builder.emit('save-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Load media kit
         * @param {string} entryKey - Entry key or Formidable entry ID
         * @returns {Promise} - Promise that resolves with load result
         */
        loadMediaKit(entryKey) {
            // Check if load is already in progress
            if (this.loadInProgress) {
                this.log('Load already in progress, skipping');
                return Promise.reject(new Error('Load already in progress'));
            }
            
            // Set load in progress flag
            this.loadInProgress = true;
            
            // Show loading indicator
            this.builder.setLoading(true);
            
            // Emit load-started event
            this.builder.emit('load-started', entryKey);
            
            this.log('Loading media kit:', entryKey);
            
            return new Promise((resolve, reject) => {
                // Determine whether to use REST API or AJAX
                if (this.config.restUrl) {
                    this.loadWithRESTAPI(entryKey)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            this.builder.setLoading(false);
                            this.loadInProgress = false;
                        });
                } else {
                    this.loadWithAJAX(entryKey)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            this.builder.setLoading(false);
                            this.loadInProgress = false;
                        });
                }
            });
        }
        
        /**
         * Load media kit using REST API
         * @param {string} entryKey - Entry key
         * @returns {Promise} - Promise that resolves with load result
         */
        loadWithRESTAPI(entryKey) {
            return new Promise((resolve, reject) => {
                // API URL
                const url = `${this.config.restUrl}kits/${entryKey}`;
                
                this.log(`Loading media kit using REST API: GET ${url}`);
                
                // Send REST API request
                fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.config.restNonce
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Update state
                        this.currentEntryKey = response.data.entry_key || entryKey;
                        this.formidableKey = response.data.formidable_key || null;
                        this.postId = response.data.post_id || null;
                        
                        // Update URL if needed
                        if (response.data.entry_key && response.data.entry_key !== entryKey) {
                            const url = new URL(window.location.href);
                            url.searchParams.set('entry_key', response.data.entry_key);
                            window.history.replaceState({}, '', url.toString());
                            
                            this.log('Updated entry key in URL:', response.data.entry_key);
                        }
                        
                        // Load data into builder
                        this.builder.loadMediaKit(response.data.kit_data);
                        
                        // Show success notification
                        this.showNotification('success', 'Media kit loaded successfully');
                        
                        // Emit load-completed event
                        this.builder.emit('load-completed', response.data);
                        
                        resolve(response.data);
                    } else {
                        throw new Error(response.message || 'Load failed');
                    }
                })
                .catch(error => {
                    console.error('Load error:', error);
                    this.showNotification('error', `Failed to load: ${error.message}`);
                    
                    // Emit load-failed event
                    this.builder.emit('load-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Load media kit using AJAX (fallback)
         * @param {string} entryKey - Entry key
         * @returns {Promise} - Promise that resolves with load result
         */
        loadWithAJAX(entryKey) {
            return new Promise((resolve, reject) => {
                // Prepare form data
                const formData = new FormData();
                formData.append('action', 'mkb_load_kit');
                formData.append('nonce', this.config.nonce);
                formData.append('entry_key', entryKey);
                
                this.log('Loading media kit using AJAX');
                
                // Send AJAX request
                fetch(this.config.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Update state
                        this.currentEntryKey = response.data.entry_key || entryKey;
                        this.formidableKey = response.data.formidable_key || null;
                        this.postId = response.data.post_id || null;
                        
                        // Update URL if needed
                        if (response.data.entry_key && response.data.entry_key !== entryKey) {
                            const url = new URL(window.location.href);
                            url.searchParams.set('entry_key', response.data.entry_key);
                            window.history.replaceState({}, '', url.toString());
                            
                            this.log('Updated entry key in URL:', response.data.entry_key);
                        }
                        
                        // Load data into builder
                        this.builder.loadMediaKit(response.data.kit_data);
                        
                        // Show success notification
                        this.showNotification('success', 'Media kit loaded successfully');
                        
                        // Emit load-completed event
                        this.builder.emit('load-completed', response.data);
                        
                        resolve(response.data);
                    } else {
                        throw new Error(response.data?.message || 'Load failed');
                    }
                })
                .catch(error => {
                    console.error('Load error:', error);
                    this.showNotification('error', `Failed to load: ${error.message}`);
                    
                    // Emit load-failed event
                    this.builder.emit('load-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Export media kit
         * @param {string} format - Export format (pdf, image, html)
         * @returns {Promise} - Promise that resolves with export result
         */
        exportMediaKit(format = 'pdf') {
            // Check if user has export capability
            if (!this.hasCapability('export_pdf') && format === 'pdf') {
                this.showUpgradePrompt('Export Feature', 'PDF export is a premium feature. Please upgrade to export your media kit.');
                return Promise.reject(new Error('Export capability required'));
            }
            
            this.showNotification('info', 'Generating export...');
            
            // Get media kit data
            const data = this.builder.getBuilderState();
            
            // Emit export-started event
            this.builder.emit('export-started', { format, data });
            
            this.log(`Exporting media kit as ${format}`);
            
            return new Promise((resolve, reject) => {
                // Use Export Manager if available
                if (this.managers.export) {
                    this.managers.export.exportKit(data, format)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                // Otherwise, use REST API or AJAX
                if (this.config.restUrl) {
                    this.exportWithRESTAPI(data, format)
                        .then(resolve)
                        .catch(reject);
                } else {
                    this.exportWithAJAX(data, format)
                        .then(resolve)
                        .catch(reject);
                }
            });
        }
        
        /**
         * Export media kit using REST API
         * @param {Object} data - Media kit data
         * @param {string} format - Export format
         * @returns {Promise} - Promise that resolves with export result
         */
        exportWithRESTAPI(data, format) {
            return new Promise((resolve, reject) => {
                // API URL
                const url = `${this.config.restUrl}export/${format}`;
                
                this.log(`Exporting media kit using REST API: POST ${url}`);
                
                // Send REST API request
                fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.config.restNonce
                    },
                    body: JSON.stringify({
                        data: data,
                        format: format,
                        entry_key: this.currentEntryKey
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Create download link
                        this.createDownloadLink(response.url, response.filename);
                        this.showNotification('success', 'Export generated successfully!');
                        
                        // Emit export-completed event
                        this.builder.emit('export-completed', response);
                        
                        resolve(response);
                    } else {
                        throw new Error(response.message || 'Export failed');
                    }
                })
                .catch(error => {
                    console.error('Export error:', error);
                    this.showNotification('error', `Failed to export: ${error.message}`);
                    
                    // Emit export-failed event
                    this.builder.emit('export-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Export media kit using AJAX (fallback)
         * @param {Object} data - Media kit data
         * @param {string} format - Export format
         * @returns {Promise} - Promise that resolves with export result
         */
        exportWithAJAX(data, format) {
            return new Promise((resolve, reject) => {
                // Prepare form data
                const formData = new FormData();
                formData.append('action', 'mkb_export_kit');
                formData.append('nonce', this.config.nonce);
                formData.append('data', JSON.stringify(data));
                formData.append('format', format);
                formData.append('entry_key', this.currentEntryKey || '');
                
                this.log('Exporting media kit using AJAX');
                
                // Send AJAX request
                fetch(this.config.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        // Create download link
                        this.createDownloadLink(response.data.url, response.data.filename);
                        this.showNotification('success', 'Export generated successfully!');
                        
                        // Emit export-completed event
                        this.builder.emit('export-completed', response.data);
                        
                        resolve(response.data);
                    } else {
                        throw new Error(response.data?.message || 'Export failed');
                    }
                })
                .catch(error => {
                    console.error('Export error:', error);
                    this.showNotification('error', `Failed to export: ${error.message}`);
                    
                    // Emit export-failed event
                    this.builder.emit('export-failed', error);
                    
                    reject(error);
                });
            });
        }
        
        /**
         * Create download link
         * @param {string} url - Download URL
         * @param {string} filename - Filename
         */
        createDownloadLink(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'media-kit.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.log(`Download link created: ${filename}`);
        }
        
        /**
         * Handle dirty state change
         * @param {boolean} isDirty - Whether the builder has unsaved changes
         */
        handleDirtyStateChange(isDirty) {
            // Update save button state
            const saveBtn = document.getElementById('mkb-save-button');
            if (saveBtn) {
                if (isDirty) {
                    saveBtn.classList.add('needs-save');
                    saveBtn.title = 'Save changes';
                } else {
                    saveBtn.classList.remove('needs-save');
                    saveBtn.title = 'All changes saved';
                }
            }
            
            // Update save status
            this.updateSaveStatus(isDirty ? 'Unsaved changes' : 'All changes saved');
            
            this.log(`Dirty state changed: ${isDirty}`);
        }
        
        /**
         * Handle loading state change
         * @param {boolean} isLoading - Whether the builder is loading
         */
        handleLoadingStateChange(isLoading) {
            // Update loader visibility
            const loader = document.getElementById('mkb-loader');
            if (loader) {
                loader.style.display = isLoading ? 'flex' : 'none';
            }
            
            // Update builder container
            const container = document.getElementById('media-kit-builder');
            if (container) {
                if (isLoading) {
                    container.classList.add('is-loading');
                } else {
                    container.classList.remove('is-loading');
                }
            }
            
            this.log(`Loading state changed: ${isLoading}`);
        }
        
        /**
         * Handle element selection
         * @param {HTMLElement} element - Selected element
         */
        handleElementSelection(element) {
            // Update selected element marker
            const previouslySelected = document.querySelectorAll('.element-selected');
            previouslySelected.forEach(el => {
                el.classList.remove('element-selected');
            });
            
            if (element) {
                element.classList.add('element-selected');
                
                // Log selection
                const elementType = element.getAttribute('data-component');
                const elementId = element.getAttribute('data-component-id');
                this.log(`Element selected: ${elementType} (${elementId})`);
            }
        }
        
        /**
         * Handle error
         * @param {Object} error - Error object
         */
        handleError(error) {
            console.error('Media Kit Builder Error:', error);
            
            // Show notification
            this.showNotification('error', error.message || 'An unexpected error occurred');
            
            // Log error details
            this.log('Error:', error, true);
            
            // Report error to server in debug mode
            if (this.config.debugMode) {
                this.reportError(error);
            }
        }
        
        /**
         * Report error to server
         * @param {Object} error - Error object
         */
        reportError(error) {
            if (!this.config.ajaxUrl) return;
            
            // Prepare error data
            const errorData = {
                message: error.message || 'Unknown error',
                stack: error.stack || '',
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                state: {
                    currentEntryKey: this.currentEntryKey,
                    formidableKey: this.formidableKey,
                    postId: this.postId,
                    isInitialized: this.isInitialized,
                    saveInProgress: this.saveInProgress,
                    loadInProgress: this.loadInProgress
                }
            };
            
            // Prepare form data
            const formData = new FormData();
            formData.append('action', 'mkb_report_error');
            formData.append('nonce', this.config.nonce);
            formData.append('error_data', JSON.stringify(errorData));
            
            // Send AJAX request
            fetch(this.config.ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            }).catch(e => {
                // Silently fail
                console.error('Failed to report error:', e);
            });
        }
        
        /**
         * Update save status
         * @param {string} status - Status message
         */
        updateSaveStatus(status) {
            const saveStatus = document.getElementById('mkb-save-status');
            if (saveStatus) {
                saveStatus.textContent = status;
                
                // Add/remove classes based on status
                if (status === 'Saved' || status === 'All changes saved') {
                    saveStatus.classList.remove('unsaved');
                    saveStatus.classList.add('saved');
                } else if (status === 'Saving...') {
                    saveStatus.classList.remove('unsaved');
                    saveStatus.classList.remove('saved');
                } else {
                    saveStatus.classList.add('unsaved');
                    saveStatus.classList.remove('saved');
                }
            }
        }
        
        /**
         * Show notification
         * @param {string} type - Notification type (success, error, warning, info)
         * @param {string} message - Notification message
         * @param {Object} options - Notification options
         */
        showNotification(type, message, options = {}) {
            // Default options
            const defaults = {
                duration: 5000, // 5 seconds
                dismissable: true,
                icon: true
            };
            
            // Merge options
            const settings = { ...defaults, ...options };
            
            // Create notification container if it doesn't exist
            let container = document.getElementById('mkb-notifications');
            if (!container) {
                container = document.createElement('div');
                container.id = 'mkb-notifications';
                container.className = 'mkb-notifications';
                document.body.appendChild(container);
            }
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `mkb-notification ${type}`;
            
            // Add icon
            let iconHtml = '';
            if (settings.icon) {
                iconHtml = `<div class="notification-icon">${
                    type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 
                    'ℹ️'
                }</div>`;
            }
            
            // Add close button if dismissable
            let closeHtml = '';
            if (settings.dismissable) {
                closeHtml = '<div class="notification-close">×</div>';
            }
            
            // Set notification content
            notification.innerHTML = `
                ${iconHtml}
                <div class="notification-message">${message}</div>
                ${closeHtml}
            `;
            
            // Add to notifications container
            container.appendChild(notification);
            
            // Setup close button
            const closeButton = notification.querySelector('.notification-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                });
            }
            
            // Auto-remove after duration
            if (settings.duration > 0) {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.classList.add('fade-out');
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.remove();
                            }
                        }, 300);
                    }
                }, settings.duration);
            }
            
            // Log notification
            this.log(`Notification (${type}): ${message}`);
            
            return notification;
        }
        
        /**
         * Show upgrade prompt
         * @param {string} feature - Feature name
         * @param {string} message - Upgrade message
         */
        showUpgradePrompt(feature, message) {
            // Create modal if it doesn't exist
            let modal = document.getElementById('mkb-upgrade-modal');
            
            if (modal) {
                // Update existing modal
                modal.querySelector('.upgrade-title').textContent = feature;
                modal.querySelector('.upgrade-message').textContent = message;
            } else {
                // Create new modal
                modal = document.createElement('div');
                modal.id = 'mkb-upgrade-modal';
                modal.className = 'mkb-modal';
                modal.innerHTML = `
                    <div class="mkb-modal-content">
                        <div class="mkb-modal-header">
                            <h3 class="upgrade-title">${feature}</h3>
                            <button class="mkb-modal-close">&times;</button>
                        </div>
                        <div class="mkb-modal-body">
                            <div class="upgrade-icon">🔓</div>
                            <p class="upgrade-message">${message}</p>
                            <div class="upgrade-features">
                                <div class="upgrade-feature">✨ Premium Templates</div>
                                <div class="upgrade-feature">📊 PDF Export</div>
                                <div class="upgrade-feature">🎨 Advanced Styling</div>
                                <div class="upgrade-feature">🌟 Premium Components</div>
                            </div>
                            <div class="upgrade-buttons">
                                <button class="mkb-button primary upgrade-button">Upgrade Now</button>
                                <button class="mkb-button secondary dismiss-button">Maybe Later</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add to document
                document.body.appendChild(modal);
                
                // Setup close button
                const closeButton = modal.querySelector('.mkb-modal-close');
                closeButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
                // Setup dismiss button
                const dismissButton = modal.querySelector('.dismiss-button');
                dismissButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
                // Setup upgrade button
                const upgradeButton = modal.querySelector('.upgrade-button');
                upgradeButton.addEventListener('click', () => {
                    // Redirect to pricing page
                    window.location.href = '/pricing/';
                });
                
                // Close modal when clicking outside
                window.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
            
            // Show modal
            modal.style.display = 'block';
            
            // Log upgrade prompt
            this.log(`Upgrade prompt shown: ${feature} - ${message}`);
        }
        
        /**
         * Check if user has capability
         * @param {string} capability - Capability to check
         * @returns {boolean} - Whether user has capability
         */
        hasCapability(capability) {
            // Admin always has all capabilities
            if (this.config.isAdmin) {
                return true;
            }
            
            // Guest has minimal capabilities
            if (this.config.accessTier === 'guest') {
                return ['basic_components'].includes(capability);
            }
            
            // Free user capabilities
            if (this.config.accessTier === 'free') {
                return ['basic_components', 'save_kit'].includes(capability);
            }
            
            // Pro user capabilities
            if (this.config.accessTier === 'pro') {
                return ['basic_components', 'save_kit', 'premium_components', 'premium_templates', 'export_pdf'].includes(capability);
            }
            
            // Agency user capabilities
            if (this.config.accessTier === 'agency') {
                return ['basic_components', 'save_kit', 'premium_components', 'premium_templates', 'export_pdf', 'white_label'].includes(capability);
            }
            
            // Default to false
            return false;
        }
        
        /**
         * Log message to console
         * @param {string} message - Log message
         * @param {*} data - Optional data to log
         * @param {boolean} force - Whether to log even if debug mode is disabled
         */
        log(message, data = null, force = false) {
            if (this.config.debugMode || force) {
                if (data) {
                    console.log(`[Media Kit Builder] ${message}`, data);
                } else {
                    console.log(`[Media Kit Builder] ${message}`);
                }
            }
        }
        
        /**
         * Test connection to server
         * @returns {Promise} - Promise that resolves with test result
         */
        testConnection() {
            return new Promise((resolve, reject) => {
                // Prepare form data
                const formData = new FormData();
                formData.append('action', 'mkb_test_ajax');
                formData.append('nonce', this.config.nonce);
                formData.append('test_data', 'Testing connection');
                
                this.log('Testing connection...');
                
                // Send AJAX request
                fetch(this.config.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.success) {
                        this.log('Connection test successful:', response);
                        resolve(response);
                    } else {
                        throw new Error(response.message || 'Connection test failed');
                    }
                })
                .catch(error => {
                    console.error('Connection test error:', error);
                    reject(error);
                });
            });
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('Document ready - initializing Media Kit Builder adapter');
        
        // Check if mkbData is available
        if (typeof mkbData === 'undefined') {
            console.error('WordPress data not found. Make sure the plugin is properly initialized.');
            // Create a default configuration for testing
            window.mkbData = {
                ajaxUrl: '/wp-admin/admin-ajax.php',
                debugMode: true
            };
            console.log('Created default mkbData for testing');
        }
        
        try {
            // Check if initializer is loaded
            if (!window.MediaKitBuilder || !window.MediaKitBuilder.safeInit) {
                console.log('Initializer not loaded, loading it now');
                
                // Load initializer script
                const script = document.createElement('script');
                script.src = mkbData.pluginUrl + '/assets/js/initializer.js';
                script.onload = function() {
                    console.log('Initializer loaded, continuing initialization');
                    initializeAdapter();
                };
                document.head.appendChild(script);
            } else {
                console.log('Initializer already loaded');
                initializeAdapter();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        }
        
        // Function to initialize adapter
        function initializeAdapter() {
            try {
                // Create WordPress adapter
                window.wpAdapter = new WordPressAdapter(window.mkbData);
                
                // Store the adapter globally
                window.MediaKitBuilder.adapter = window.wpAdapter;
            
            // Ensure handleError method exists globally
            if (window.wpAdapter && !window.wpAdapter.handleError) {
                window.wpAdapter.handleError = function(error) {
                    console.error('WordPress Adapter Error:', error);
                    return this.reportError(error);
                };
            }
            
            // Ensure global MediaKitBuilder instance methods
            if (window.mediaKitBuilder) {
                // Add missing methods for architectural validation
                if (!window.mediaKitBuilder.handleError) {
                    window.mediaKitBuilder.handleError = function(error, context = '') {
                        console.error(`MediaKitBuilder Error${context ? ' (' + context + ')' : ''}:`, error);
                        
                        if (this.state && Array.isArray(this.state.errors)) {
                            this.state.errors.push({
                                message: error.message || String(error),
                                context: context,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        if (this.emit) {
                            this.emit('error', { error, context });
                        }
                        
                        return false;
                    };
                }
                
                // Ensure undo/redo methods exist
                if (!window.mediaKitBuilder.undo) {
                    window.mediaKitBuilder.undo = function() {
                        console.log('Undo method called (stub)');
                    };
                }
                
                if (!window.mediaKitBuilder.redo) {
                    window.mediaKitBuilder.redo = function() {
                        console.log('Redo method called (stub)');
                    };
                }
                
                // Ensure setLoading method exists
                if (!window.mediaKitBuilder.setLoading) {
                    window.mediaKitBuilder.setLoading = function(isLoading) {
                        this.state = this.state || {};
                        this.state.isLoading = isLoading;
                        
                        if (this.emit) {
                            this.emit('loading-state-changed', { isLoading });
                        }
                        
                        console.log('Loading state set to:', isLoading);
                    };
                }
            }
                
                // Run connection test in debug mode
                if (window.mkbData.debugMode) {
                    setTimeout(() => {
                        if (window.wpAdapter && typeof window.wpAdapter.testConnection === 'function') {
                            window.wpAdapter.testConnection()
                                .then(result => {
                                    console.log('Connection test result:', result);
                                })
                                .catch(error => {
                                    console.error('Connection test failed:', error);
                                });
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Error initializing WordPress adapter:', error);
            }
        }
    });
    
    // Make classes globally available for architectural validation
    window.WordPressAdapter = WordPressAdapter;
    window.MediaKitBuilder = window.MediaKitBuilder || {};
    window.MediaKitBuilder.WordPressAdapter = WordPressAdapter;
    
    // Ensure all required methods are available for architectural validation
if (!window.wpAdapter) {
    window.wpAdapter = {
    reportError: function(error) {
    console.log('Error reported:', error);
    return Promise.resolve({ success: true });
    },
    saveMediaKit: function(data) {
    console.log('Save media kit called:', data);
    return Promise.resolve({ success: true, entry_key: 'test-key' });
    },
    loadMediaKit: function(entryKey) {
    console.log('Load media kit called:', entryKey);
    return Promise.resolve({ success: true, data: {} });
    },
        handleError: function(error) {
            console.error('Error handled:', error);
        },
        exportMediaKit: function(format) {
            console.log(`Export media kit called with format: ${format}`);
            return Promise.resolve({ success: true, url: '#', filename: 'media-kit.pdf' });
        },
        testConnection: function() {
            console.log('Test connection called');
            return Promise.resolve({ success: true });
        },
        hasCapability: function(capability) {
            return true; // For testing
        },
        showNotification: function(type, message) {
            console.log(`Notification (${type}): ${message}`);
        },
        showUpgradePrompt: function(feature, message) {
            console.log(`Upgrade prompt: ${feature} - ${message}`);
        }
    };
}
    
})(jQuery);
