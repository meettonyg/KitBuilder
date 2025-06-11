/**
 * Section Templates System
 * Integrates with Component Registry and Template Management for dynamic templates
 */

// Template storage (populated dynamically from Component Registry)
let sectionTemplates = {};

/**
 * Fetch section templates from the server's Template Management System
 * @returns {Promise<Object>} - Templates object
 */
async function fetchSectionTemplates() {
    try {
        console.log('📡 Fetching section templates from registry...');
        
        // Get nonce from multiple possible sources to ensure authentication works
        const nonce = window.MediaKitBuilder?.config?.nonce || 
                    window.mkbConfig?.nonce || 
                    document.querySelector('#_wpnonce')?.value || 
                    '';
        
        console.log('🔑 Using nonce for templates API:', nonce ? 'Found' : 'Not found');
        
        // Use WordPress REST API endpoint for templates with improved authentication
        const response = await fetch('/wp-json/media-kit/v1/templates', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const templates = await response.json();
        console.log(`✅ Successfully loaded ${Object.keys(templates).length} templates from registry`);
        return templates;
    } catch (error) {
        console.error('❌ Failed to fetch templates from registry:', error.message);
        
        // Attempt to get templates directly from builder if available
        if (window.MediaKitBuilder?.templates && typeof window.MediaKitBuilder.templates === 'object') {
            console.log('🔄 Using templates from MediaKitBuilder');
            return window.MediaKitBuilder.templates;
        }
        
        // Last resort - check for templates in window global
        if (window.__sectionTemplates && typeof window.__sectionTemplates === 'object') {
            console.log('🔄 Using templates from window.__sectionTemplates');
            return window.__sectionTemplates;
        }
        
        // Load default templates from fallback object if REST API fails
        console.warn('⚠️ Using default templates object as fallback');
        
        // Default templates (provide at least one basic template)
        const defaultTemplates = {
            'basic-content': {
                name: 'Basic Content Section',
                type: 'content',
                layout: 'full-width',
                description: 'Simple content section with title and text',
                premium: false,
                components: [
                    {
                        type: 'bio',
                        content: {
                            title: 'About Me',
                            text: 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.'
                        }
                    }
                ]
            },
            'basic-hero': {
                name: 'Simple Hero Section',
                type: 'hero',
                layout: 'full-width',
                description: 'Basic hero section with name and title',
                premium: false,
                components: [
                    {
                        type: 'hero',
                        content: {
                            name: 'Your Name',
                            title: 'Your Professional Title',
                            bio: 'Add a short introduction about yourself'
                        }
                    }
                ]
            }
        };
        
        console.log('📋 Loaded default templates:', Object.keys(defaultTemplates).length);
        return defaultTemplates;
    }
}

/**
 * Create the section template modal
 */
function createAddSectionModal() {
    console.log('Creating section template modal');
    
    // Check if modal already exists
    if (document.getElementById('add-section-modal')) {
        return;
    }
    
    // Create modal HTML
    const modalHtml = `
        <div id="add-section-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content section-template-modal">
                <div class="modal-header">
                    <div class="modal-title">Add Section Template</div>
                    <button class="close-modal" id="close-section-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="section-filters">
                        <select id="section-type-filter">
                            <option value="all">All Section Types</option>
                            <option value="hero">Hero</option>
                            <option value="content">Content</option>
                            <option value="features">Features</option>
                            <option value="media">Media</option>
                            <option value="contact">Contact</option>
                        </select>
                        <div class="section-search">
                            <input type="text" id="section-search" placeholder="Search templates...">
                        </div>
                    </div>
                    <div id="section-template-gallery" class="section-template-gallery"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    const closeBtn = document.getElementById('close-section-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAddSectionModal);
    }
    
    // Add filter functionality
    const typeFilter = document.getElementById('section-type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            renderSectionTemplates(this.value);
        });
    }
    
    // Add search functionality
    const searchInput = document.getElementById('section-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filter = typeFilter ? typeFilter.value : 'all';
            renderSectionTemplates(filter, searchTerm);
        });
    }
    
    console.log('Section template modal created successfully');
}

/**
 * Render section templates in the gallery
 * @param {string} typeFilter - Section type to filter by
 * @param {string} searchTerm - Search term to filter by
 */
function renderSectionTemplates(typeFilter = 'all', searchTerm = '') {
    console.log('Rendering section templates', typeFilter, searchTerm);
    
    const gallery = document.getElementById('section-template-gallery');
    if (!gallery) {
        console.error('Section template gallery not found');
        return;
    }
    
    // Check if templates are loaded
    if (!sectionTemplates || Object.keys(sectionTemplates).length === 0) {
        gallery.innerHTML = '<div class="loading-templates">Loading templates... <div class="spinner"></div></div>';
        
        // Attempt to load templates if not already loaded
        initializeTemplates().then(() => {
            renderSectionTemplates(typeFilter, searchTerm);
        });
        
        return;
    }
    
    // Clear existing templates
    gallery.innerHTML = '';
    
    // Filter templates
    const filteredTemplates = Object.entries(sectionTemplates).filter(([id, template]) => {
        // Type filter
        const typeMatch = typeFilter === 'all' || template.type === typeFilter;
        
        // Search filter
        const searchMatch = searchTerm === '' || 
            template.name.toLowerCase().includes(searchTerm) || 
            (template.description && template.description.toLowerCase().includes(searchTerm));
        
        return typeMatch && searchMatch;
    });
    
    // Check if no results
    if (filteredTemplates.length === 0) {
        gallery.innerHTML = '<div class="no-templates">No templates match your criteria</div>';
        return;
    }
    
    // Render templates
    filteredTemplates.forEach(([id, template]) => {
        const templateCard = `
            <div class="template-card ${template.premium ? 'premium' : ''}" data-template-id="${id}" data-type="${template.type}">
                <div class="template-preview ${template.type}-preview ${template.layout}-preview">
                    ${getTemplatePreviewIcon(template.type)}
                </div>
                <div class="template-info">
                    <div class="template-name">${template.name}</div>
                    <div class="template-description">${template.description || ''}</div>
                    <span class="template-layout-badge">${template.layout}</span>
                    ${template.premium ? '<span class="premium-indicator">PRO</span>' : ''}
                </div>
            </div>
        `;
        
        gallery.insertAdjacentHTML('beforeend', templateCard);
    });
    
    // Set up template selection handlers
    setupTemplateSelectionHandlers();
    
    console.log(`Rendered ${filteredTemplates.length} templates`);
}

/**
 * Get template preview icon based on type
 * @param {string} type - Section type
 * @returns {string} - Icon HTML
 */
function getTemplatePreviewIcon(type) {
    const icons = {
        hero: '<div class="icon-preview">👤</div>',
        content: '<div class="icon-preview">📝</div>',
        features: '<div class="icon-preview">✨</div>',
        media: '<div class="icon-preview">🖼️</div>',
        contact: '<div class="icon-preview">📞</div>'
    };
    
    return icons[type] || '<div class="icon-preview">📄</div>';
}

/**
 * Show section template modal
 */
function showAddSectionModal() {
    console.log('Opening template modal');
    
    // Ensure templates are loaded before showing modal
    initializeTemplates().then(() => {
        const modal = document.getElementById('add-section-modal');
        if (modal) {
            modal.style.display = 'flex';
            renderSectionTemplates();
            
            // Make sure handlers are setup (in case modal is dynamically created)
            setupTemplateSelectionHandlers();
        } else {
            console.error('Template modal not found in DOM');
            createAddSectionModal();
            
            const newModal = document.getElementById('add-section-modal');
            if (newModal) {
                newModal.style.display = 'flex';
                renderSectionTemplates();
                setupTemplateSelectionHandlers();
            }
        }
    });
}

/**
 * Hide section template modal
 */
function hideAddSectionModal() {
    const modal = document.getElementById('add-section-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Setup template selection handlers
 */
function setupTemplateSelectionHandlers() {
    console.log('Setting up template selection handlers');
    
    // Add event listener to template gallery
    const gallery = document.getElementById('section-template-gallery');
    if (gallery) {
        // Remove existing listeners first to avoid duplicates
        const newGallery = gallery.cloneNode(true);
        gallery.parentNode.replaceChild(newGallery, gallery);
        
        newGallery.addEventListener('click', function(e) {
            const templateCard = e.target.closest('.template-card');
            if (!templateCard) return;
            
            const templateId = templateCard.getAttribute('data-template-id');
            if (!templateId) {
                console.error('Template card missing data-template-id attribute');
                return;
            }
            
            console.log('Template selected:', templateId);
            insertSectionTemplate(templateId);
        });
    }
}

/**
 * Inserts a section template into the builder
 * @param {string} templateId - The ID of the template to insert
 * @returns {Promise<string|boolean>} - The ID of the new section or false if unsuccessful
 */
async function insertSectionTemplate(templateId) {
    console.log('🚀 Inserting template:', templateId);
    
    // Ensure templates are loaded
    await initializeTemplates();
    
    // 1. Retrieve template configuration
    const template = sectionTemplates[templateId];
    if (!template) {
        console.error('❌ Template not found:', templateId);
        return false;
    }
    
    // 2. Verify builder function availability
    if (typeof window.addSection !== 'function') {
        console.error('❌ Builder addSection function not available');
        
        // Wait for builder to initialize if needed
        if (typeof window.MediaKitBuilder !== 'undefined' && typeof window.MediaKitBuilder.addSection === 'function') {
            console.log('🔄 Using MediaKitBuilder.addSection instead');
            window.addSection = window.MediaKitBuilder.addSection.bind(window.MediaKitBuilder);
        } else {
            console.error('❌ No compatible addSection function found');
            return false;
        }
    }
    
    // 3. Premium access check
    if (template.premium) {
        const hasPremiumAccess = window.premiumAccess && 
                                typeof window.premiumAccess.hasAccess === 'function' && 
                                window.premiumAccess.hasAccess('premiumTemplates');
        
        if (!hasPremiumAccess) {
            console.log('🔒 Premium template access denied');
            if (window.premiumAccess && typeof window.premiumAccess.showUpgradePrompt === 'function') {
                window.premiumAccess.showUpgradePrompt('premium-template', template.name || 'Premium Template');
            } else {
                alert('This is a premium template. Please upgrade to access it.');
            }
            return false;
        }
    }
    
    // 4. Create section with proper error handling
    let sectionId;
    try {
        // Call addSection directly with template configuration
        sectionId = window.addSection(template.type, template.layout);
        
        if (!sectionId) {
            throw new Error('Section creation returned empty ID');
        }
        
        console.log('✅ Section created successfully:', sectionId);
    } catch (error) {
        console.error('❌ Failed to create section:', error.message);
        return false;
    }
    
    // 5. Get section element
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) {
        console.error('❌ Cannot find newly created section element');
        return false;
    }
    
    // 6. Add components based on template layout
    try {
        if (template.layout === 'full-width') {
            // Single column layout
            const dropZone = section.querySelector('.section-column .drop-zone');
            if (!dropZone) {
                throw new Error('Drop zone not found in full-width layout');
            }
            
            // Add each component from the template
            if (Array.isArray(template.components)) {
                for (let i = 0; i < template.components.length; i++) {
                    const comp = template.components[i];
                    console.log(`➕ Adding component ${i + 1}:`, comp.type);
                    await addTemplateComponent(comp.type, dropZone, comp.content);
                }
            }
        } else {
            // Multi-column layout
            if (template.components && typeof template.components === 'object') {
                for (const [column, components] of Object.entries(template.components)) {
                    const dropZone = section.querySelector(`[data-column="${column}"] .drop-zone`);
                    if (!dropZone) {
                        console.warn(`⚠️ Column "${column}" not found, skipping components`);
                        continue;
                    }
                    
                    if (Array.isArray(components)) {
                        for (let i = 0; i < components.length; i++) {
                            const comp = components[i];
                            console.log(`➕ Adding component ${i + 1} to ${column}:`, comp.type);
                            await addTemplateComponent(comp.type, dropZone, comp.content);
                        }
                    }
                }
            }
        }
        
        console.log('✅ Components added successfully to section:', sectionId);
    } catch (error) {
        console.error('❌ Failed to add components:', error.message);
        // Continue even if components fail - we already have the section
    }
    
    // 7. Initialize section functionality
    try {
        // Reinitialize event listeners and setup
        if (typeof window.addSectionControls === 'function') {
            window.addSectionControls();
        }
        
        if (typeof window.setupSectionEventListeners === 'function') {
            window.setupSectionEventListeners();
        }
        
        if (typeof window.setupElementSelection === 'function') {
            window.setupElementSelection();
        }
        
        if (typeof window.setupContentEditableUpdates === 'function') {
            window.setupContentEditableUpdates();
        }
        
        console.log('✅ Section initialization completed');
    } catch (error) {
        console.warn('⚠️ Section post-initialization error:', error.message);
        // Continue - basic functionality should still work
    }
    
    // 8. Close modal and mark as dirty
    hideAddSectionModal();
    
    if (typeof window.markDirty === 'function') {
        window.markDirty();
    } else if (typeof window.markUnsaved === 'function') {
        window.markUnsaved();
    }
    
    // 9. Scroll to the new section
    try {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
        // Ignore scroll errors
    }
    
    console.log('✅ Template insertion completed successfully');
    return sectionId;
}

/**
 * Adds a component to a drop zone based on template configuration
 * @param {string} type - Component type
 * @param {HTMLElement} dropZone - Drop zone to add component to
 * @param {Object} content - Component content configuration
 * @returns {Promise<HTMLElement|null>} - The added component or null if unsuccessful
 */
async function addTemplateComponent(type, dropZone, content) {
    if (!type || !dropZone) {
        console.error('❌ Invalid parameters for addTemplateComponent');
        return null;
    }
    
    let component = null;
    
    // Try multiple methods to add component, in order of preference
    const methods = [
        // Method 1: Use Component Registry if available
        async function() {
            if (typeof window.ComponentRegistry?.createComponent === 'function') {
                return await window.ComponentRegistry.createComponent(type, dropZone, content);
            }
            return null;
        },
        
        // Method 2: Use MediaKitBuilder's addComponent if available
        async function() {
            if (typeof window.MediaKitBuilder?.addComponent === 'function') {
                return window.MediaKitBuilder.addComponent(type, dropZone, content);
            }
            return null;
        },
        
        // Method 3: Use global addComponent function if available
        async function() {
            if (typeof window.addComponent === 'function') {
                return window.addComponent(type, dropZone, content);
            }
            return null;
        },
        
        // Method 4: Use getComponentTemplate and build manually
        async function() {
            if (typeof window.getComponentTemplate !== 'function') {
                return null;
            }
            
            const template = window.getComponentTemplate(type);
            if (!template) {
                return null;
            }
            
            // Create component from template HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template.trim();
            const newComponent = tempDiv.firstElementChild;
            
            if (!newComponent) {
                return null;
            }
            
            // Generate unique component ID
            const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            newComponent.setAttribute('data-component-id', componentId);
            newComponent.setAttribute('data-component', type);
            
            // Populate with content if provided
            if (content && typeof populateComponentWithContent === 'function') {
                populateComponentWithContent(newComponent, type, content);
            } else if (content && typeof window.populateComponentWithContent === 'function') {
                window.populateComponentWithContent(newComponent, type, content);
            }
            
            // Add to drop zone
            dropZone.appendChild(newComponent);
            dropZone.classList.remove('empty');
            
            // Re-initialize event listeners if available
            if (typeof window.setupElementEventListeners === 'function') {
                window.setupElementEventListeners(newComponent);
            }
            
            return newComponent;
        }
    ];
    
    // Try each method until one succeeds
    for (const method of methods) {
        try {
            component = await method();
            if (component) {
                break;
            }
        } catch (error) {
            console.warn('⚠️ Component addition method failed:', error.message);
        }
    }
    
    if (!component) {
        console.error('❌ All component addition methods failed for type:', type);
        return null;
    }
    
    return component;
}

/**
 * Populate a component with template content
 * @param {HTMLElement} component - Component element
 * @param {string} type - Component type
 * @param {Object} content - Content data
 */
function populateComponentWithContent(component, type, content) {
    if (!content) return;
    
    try {
        // Handle different component types
        switch (type) {
            case 'hero':
                if (content.name) {
                    const nameEl = component.querySelector('.hero-name');
                    if (nameEl) nameEl.textContent = content.name;
                }
                if (content.title) {
                    const titleEl = component.querySelector('.hero-title');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.bio) {
                    const bioEl = component.querySelector('.hero-bio');
                    if (bioEl) bioEl.textContent = content.bio;
                }
                if (content.avatar) {
                    const avatarEl = component.querySelector('.hero-avatar img');
                    if (avatarEl) avatarEl.src = content.avatar;
                }
                break;
                
            case 'bio':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.text) {
                    const textEl = component.querySelector('p[contenteditable="true"]');
                    if (textEl) textEl.textContent = content.text;
                }
                break;
                
            case 'topics':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.topics && Array.isArray(content.topics)) {
                    const topicItems = component.querySelectorAll('.topic-item');
                    content.topics.forEach((topic, index) => {
                        if (index < topicItems.length) {
                            topicItems[index].textContent = topic;
                        }
                    });
                }
                break;
                
            case 'social':
                // Social links typically handled through attributes
                // Implementation depends on social component structure
                break;
                
            case 'stats':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.stats && Array.isArray(content.stats)) {
                    const statItems = component.querySelectorAll('.stat-item');
                    content.stats.forEach((stat, index) => {
                        if (index < statItems.length) {
                            const numberEl = statItems[index].querySelector('.stat-number');
                            const labelEl = statItems[index].querySelector('.stat-label');
                            
                            if (numberEl && stat.number) numberEl.textContent = stat.number;
                            if (labelEl && stat.label) labelEl.textContent = stat.label;
                        }
                    });
                }
                break;
                
            default:
                // For other component types, use generic content population
                // Find all contenteditable elements and populate with matching properties
                if (typeof content === 'object') {
                    const editableElements = component.querySelectorAll('[contenteditable="true"]');
                    if (editableElements.length > 0) {
                        Object.entries(content).forEach(([key, value]) => {
                            // Try to find elements with matching class or ID
                            const matchingElement = component.querySelector(`.${key}`) || 
                                                   component.querySelector(`#${key}`) ||
                                                   component.querySelector(`[data-field="${key}"]`);
                            
                            if (matchingElement && typeof value === 'string') {
                                matchingElement.textContent = value;
                            }
                        });
                    }
                }
                break;
        }
        
        console.log('Component populated with content successfully');
    } catch (error) {
        console.error('Error populating component with content:', error);
    }
}

/**
 * Initialize templates from Component Registry
 * @returns {Promise<Object>} - Templates object
 */
async function initializeTemplates() {
    // Check if templates are already loaded
    if (sectionTemplates && Object.keys(sectionTemplates).length > 0) {
        return sectionTemplates;
    }
    
    // Fetch templates from server or component registry
    sectionTemplates = await fetchSectionTemplates();
    
    // If no templates found, try to use template definitions from window
    if (Object.keys(sectionTemplates).length === 0) {
        console.warn('⚠️ No templates found from registry, checking inline data');
        
        // Check for templates in data attribute
        const templateData = document.querySelector('#section-template-data');
        if (templateData && templateData.textContent) {
            try {
                const parsedTemplates = JSON.parse(templateData.textContent);
                if (parsedTemplates && typeof parsedTemplates === 'object') {
                    sectionTemplates = parsedTemplates;
                    console.log(`✅ Loaded ${Object.keys(sectionTemplates).length} templates from inline data`);
                }
            } catch (error) {
                console.error('❌ Failed to parse inline template data:', error.message);
            }
        }
    }
    
    // Make templates globally available
    window.sectionTemplates = sectionTemplates;
    
    console.log(`✅ Templates initialized with ${Object.keys(sectionTemplates).length} templates`);
    return sectionTemplates;
}

// Add initialization sequence to ensure builder integration
function initTemplateSystem() {
    console.log('🎨 Initializing Section Templates System...');
    
    // Wait for builder to be ready
    const checkBuilderReady = () => {
        const builderFunctions = [
            typeof window.addSection === 'function',
            typeof window.getComponentTemplate === 'function',
            typeof window.setupElementEventListeners === 'function'
        ];
        
        console.log('🔍 Builder function availability:', builderFunctions);
        
        if (builderFunctions.every(Boolean)) {
            console.log('✅ Builder functions available, initializing templates');
            completeTemplateInitialization();
            return true;
        }
        
        return false;
    };
    
    // Try immediate initialization
    if (checkBuilderReady()) {
        return;
    }
    
    // Set up retry mechanism
    let attempts = 0;
    const maxAttempts = 5;
    const retryInterval = 200;
    
    const retryInitialization = () => {
        attempts++;
        console.log(`🔄 Section templates initialization attempt ${attempts}...`);
        
        if (checkBuilderReady()) {
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(retryInitialization, retryInterval);
        } else {
            console.error(`❌ Failed to initialize templates after ${attempts} attempts`);
            
            // Final attempt - try to use MediaKitBuilder directly
            if (typeof window.MediaKitBuilder !== 'undefined') {
                console.log('🔄 Attempting to use MediaKitBuilder directly...');
                
                // Map functions if available
                if (typeof window.MediaKitBuilder.addSection === 'function') {
                    window.addSection = window.MediaKitBuilder.addSection.bind(window.MediaKitBuilder);
                }
                
                if (typeof window.MediaKitBuilder.getComponentTemplate === 'function') {
                    window.getComponentTemplate = window.MediaKitBuilder.getComponentTemplate.bind(window.MediaKitBuilder);
                }
                
                // Retry one more time
                if (checkBuilderReady()) {
                    return;
                }
            }
            
            // Give up - will require manual intervention
            console.error('❌ Template system initialization failed - builder functions unavailable');
            
            // Create fallback message
            const builderContainer = document.querySelector('.builder-container');
            if (builderContainer) {
                const fallbackMessage = document.createElement('div');
                fallbackMessage.className = 'template-system-error';
                fallbackMessage.innerHTML = `
                    <div class="error-icon">❌</div>
                    <h3>Template System Error</h3>
                    <p>Failed to initialize section template system. Please refresh the page or contact support.</p>
                `;
                builderContainer.prepend(fallbackMessage);
            }
        }
    };
    
    // Start retry sequence
    setTimeout(retryInitialization, retryInterval);
}

// Complete template system initialization
async function completeTemplateInitialization() {
    // Initialize templates from registry
    await initializeTemplates();
    
    // Create modal if needed
    createAddSectionModal();
    
    // Set up event listeners
    setupTemplateEventListeners();
    
    // Make functions globally available
    window.showAddSectionModal = showAddSectionModal;
    window.hideAddSectionModal = hideAddSectionModal;
    window.insertSectionTemplate = insertSectionTemplate;
    window.addTemplateComponent = addTemplateComponent;
    window.populateComponentWithContent = populateComponentWithContent;
    
    // Register with Component Registry if available
    if (typeof window.ComponentRegistry?.registerTemplateSystem === 'function') {
        window.ComponentRegistry.registerTemplateSystem({
            showTemplateModal: showAddSectionModal,
            insertTemplate: insertSectionTemplate,
            getTemplates: () => sectionTemplates
        });
    }
    
    // Set initialization flag
    window.templateSystem = {
        initialized: true,
        version: '2.1',
        templateCount: Object.keys(sectionTemplates).length
    };
    
    console.log(`✅ Section Templates initialized with ${Object.keys(sectionTemplates).length} templates`);
}

/**
 * Setup event listeners for template system
 */
function setupTemplateEventListeners() {
    // Add event listener for add section button
    const addSectionBtn = document.getElementById('add-section-btn');
    if (addSectionBtn) {
        addSectionBtn.removeEventListener('click', showAddSectionModal);
        addSectionBtn.addEventListener('click', showAddSectionModal);
    }
    
    // Add event listener for section templates button
    const templatesBtn = document.getElementById('section-templates-btn');
    if (templatesBtn) {
        templatesBtn.removeEventListener('click', showAddSectionModal);
        templatesBtn.addEventListener('click', showAddSectionModal);
    }
    
    // Set up template selection handlers
    setupTemplateSelectionHandlers();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM ready - preparing to initialize section templates');
    setTimeout(initTemplateSystem, 100);
});

// For cases where DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🔄 Document already ready - initializing templates now');
    setTimeout(initTemplateSystem, 100);
}
