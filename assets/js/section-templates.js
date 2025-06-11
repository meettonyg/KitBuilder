/**
 * Section Templates System
 * Integrates with Component Registry and Template Management for dynamic templates
 */

// Template storage (populated dynamically from Component Registry)
let sectionTemplates = {};

// Fallback templates for when API is unavailable
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
    },
    'two-column-bio': {
        name: 'Two Column Bio',
        type: 'content',
        layout: 'two-column',
        description: 'Biography with image',
        premium: false,
        components: {
            'left': [
                {
                    type: 'bio',
                    content: {
                        title: 'About Me',
                        text: 'Your professional biography goes here...'
                    }
                }
            ],
            'right': [
                {
                    type: 'image',
                    content: {
                        url: '',
                        alt: 'Profile Image'
                    }
                }
            ]
        }
    },
    'social-links': {
        name: 'Social Links',
        type: 'contact',
        layout: 'full-width',
        description: 'Social media links',
        premium: false,
        components: [
            {
                type: 'social',
                content: {}
            }
        ]
    }
};

/**
 * Fetch section templates from the server's Template Management System
 * @returns {Promise<Object>} - Templates object
 */
async function fetchSectionTemplates() {
    try {
        console.log('📡 Fetching section templates from registry...');
        
        // Enhanced nonce retrieval from multiple sources
        const nonce = getAuthNonce();
        
        console.log('🔑 Using nonce for templates API:', nonce ? 'Found' : 'Not found');
        
        // FIXED: Use WordPress REST API endpoint for templates with improved authentication
        // Use current site URL instead of hardcoded domain (guestify.ai)
        const localApiUrl = `${window.location.origin}/wp-json/media-kit/v1/templates`;
        console.log('🌐 Using local API URL:', localApiUrl);
        
        const response = await fetch(localApiUrl, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Local template API returned ${response.status}: ${response.statusText}`);
            
            // If local API fails, try to use embedded templates from page
            const templateDataElement = document.getElementById('media-kit-templates-data');
            if (templateDataElement) {
                try {
                    const embeddedTemplates = JSON.parse(templateDataElement.textContent);
                    console.log(`✅ Using embedded templates: ${Object.keys(embeddedTemplates).length} found`);
                    return embeddedTemplates;
                } catch (parseError) {
                    console.warn('⚠️ Failed to parse embedded templates:', parseError.message);
                }
            }
            
            // If all else fails, throw the error to use fallback templates
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const templates = await response.json();
        console.log(`✅ Successfully loaded ${Object.keys(templates).length} templates from registry`);
        return templates;
    } catch (error) {
        console.error('❌ Failed to fetch templates from registry:', error.message);
        
        // IMPROVED ERROR HANDLING SEQUENCE:
        
        // 1. Try to get templates directly from builder if available
        if (window.MediaKitBuilder?.templates && typeof window.MediaKitBuilder.templates === 'object') {
            console.log('🔄 Using templates from MediaKitBuilder');
            return window.MediaKitBuilder.templates;
        }
        
        // 2. Check for templates in window global
        if (window.__sectionTemplates && typeof window.__sectionTemplates === 'object') {
            console.log('🔄 Using templates from window.__sectionTemplates');
            return window.__sectionTemplates;
        }
        
        // 3. Check for templates in data attributes
        const templateElements = [
            document.getElementById('media-kit-templates-data'),
            document.getElementById('section-templates-data'),
            document.querySelector('[data-templates]')
        ];
        
        for (const element of templateElements) {
            if (element) {
                try {
                    const dataSource = element.textContent || element.getAttribute('data-templates');
                    if (dataSource) {
                        const parsedTemplates = JSON.parse(dataSource);
                        if (parsedTemplates && typeof parsedTemplates === 'object') {
                            console.log('🔄 Using templates from data attribute');
                            return parsedTemplates;
                        }
                    }
                } catch (parseError) {
                    console.warn('⚠️ Failed to parse template data:', parseError.message);
                }
            }
        }
        
        // 4. Load default templates from fallback object if all other methods fail
        console.warn('⚠️ Using default templates object as fallback');
        return defaultTemplates;
    }
}

/**
 * Enhanced nonce retrieval function that checks multiple sources
 * and ensures we always get a valid nonce for API requests.
 * @returns {string} - WordPress nonce for REST API authentication
 */
function getAuthNonce() {
    // Try all possible sources for the nonce
    const possibleSources = [
        // Primary source - from the MediaKitBuilder config
        window.MediaKitBuilder?.config?.nonce,
        
        // Secondary source - from mkbConfig if available
        window.mkbConfig?.nonce,
        
        // Get from any nonce fields in the DOM
        document.querySelector('#_wpnonce')?.value,
        document.querySelector('[name="_wpnonce"]')?.value,
        
        // Look for data attributes that might contain nonce
        document.querySelector('[data-nonce]')?.getAttribute('data-nonce'),
        
        // Last resort - check if there's a global nonce variable
        window._wpnonce
    ];
    
    // Return the first non-empty value
    for (const source of possibleSources) {
        if (source) {
            console.log('📌 Found nonce from source:', source.substring(0, 4) + '...');
            return source;
        }
    }
    
    // If no nonce found, log error and return empty string
    console.error('❌ No valid nonce found from any source');
    return '';
}

/**
 * Create the section template modal with enhanced reliability
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
    
    // Add CSS for modal styling if needed
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .section-template-modal {
            background-color: #2a2a2a;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #444;
        }
        
        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #e2e8f0;
        }
        
        .close-modal {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
        }
        
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .section-filters {
            display: flex;
            margin-bottom: 20px;
            gap: 12px;
        }
        
        #section-type-filter {
            background: #333;
            border: 1px solid #555;
            color: #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
            flex: 0 0 200px;
        }
        
        .section-search {
            flex: 1;
        }
        
        #section-search {
            width: 100%;
            background: #333;
            border: 1px solid #555;
            color: #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
        }
        
        .section-template-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap: 16px;
        }
        
        .template-card {
            background: #333;
            border-radius: 6px;
            border: 1px solid #444;
            overflow: hidden;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .template-card:hover {
            border-color: #0ea5e9;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .template-preview {
            height: 120px;
            background: #222;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .icon-preview {
            font-size: 32px;
        }
        
        .template-info {
            padding: 12px;
        }
        
        .template-name {
            font-weight: 600;
            margin-bottom: 4px;
            color: #e2e8f0;
        }
        
        .template-description {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        
        .template-layout-badge {
            display: inline-block;
            background: #444;
            color: #94a3b8;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .premium-indicator {
            display: inline-block;
            background: linear-gradient(45deg, #f472b6 0%, #ec4899 100%);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 6px;
            font-weight: 600;
        }
    `;
    document.head.appendChild(modalStyle);
    
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
    
    // Add ESC key handler to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAddSectionModal();
        }
    });
    
    // Click outside modal to close
    const modal = document.getElementById('add-section-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideAddSectionModal();
            }
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
 * Show section template modal with improved reliability
 */
function showAddSectionModal() {
    console.log('Opening template modal');
    
    // Ensure templates are loaded before showing modal
    initializeTemplates().then(() => {
        let modal = document.getElementById('add-section-modal');
        
        // If modal doesn't exist, create it
        if (!modal) {
            console.log('Modal not found, creating it first');
            createAddSectionModal();
            modal = document.getElementById('add-section-modal');
        }
        
        if (modal) {
            // Show modal
            modal.style.display = 'flex';
            
            // Render templates
            renderSectionTemplates();
            
            // Make sure handlers are setup
            setupTemplateSelectionHandlers();
            
            // Add animation class if not already present
            if (!modal.classList.contains('modal-open')) {
                modal.classList.add('modal-open');
            }
            
            console.log('Modal opened successfully');
        } else {
            console.error('Failed to create or find template modal');
            
            // Last resort - show alert if modal creation failed
            alert('Template system not available. Please try again or contact support.');
        }
    }).catch(error => {
        console.error('Error opening template modal:', error);
        alert('Could not load section templates. Please try again.');
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
 * Setup all template button event handlers
 * Ensures that all section and template buttons properly trigger the modal
 */
function setupTemplateButtonHandlers() {
    console.log('Setting up template button handlers');
    
    // Find all add section buttons
    const addSectionButtons = document.querySelectorAll('#add-section-btn, #add-section-btn-primary');
    const templateButtons = document.querySelectorAll('#section-templates-btn');
    
    console.log(`Found ${addSectionButtons.length} add section buttons and ${templateButtons.length} template buttons`);
    
    // Setup handlers for all add section buttons
    addSectionButtons.forEach((button, index) => {
        // Remove any existing handlers to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add reliable handler
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Add Section button ${index + 1} clicked`);
            showAddSectionModal();
        });
        
        console.log(`Handler attached to add section button ${index + 1}`);
    });
    
    // Setup handlers for template buttons
    templateButtons.forEach((button, index) => {
        // Remove any existing handlers to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add reliable handler
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Template button ${index + 1} clicked`);
            showAddSectionModal();
        });
        
        console.log(`Handler attached to template button ${index + 1}`);
    });
    
    console.log('Template button handlers setup complete');
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
            
            // Even if builder isn't fully ready, still attempt to setup button handlers
            // This can work independently from the full template system
            try {
                setupTemplateButtonHandlers();
                console.log('✅ Template button handlers set up despite builder initialization failure');
                
                // Create minimal templates modal if none exists
                if (!document.getElementById('add-section-modal')) {
                    createAddSectionModal();
                    console.log('✅ Template modal created despite builder initialization failure');
                }
            } catch (e) {
                console.error('Failed to set up template button handlers:', e);
            }
            
            // Fall back to default templates even if initialization fails
            sectionTemplates = defaultTemplates;
            window.sectionTemplates = defaultTemplates;
            console.log('✅ Default templates loaded as fallback');
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
    
    // Set up button handlers (new step)
    setupTemplateButtonHandlers();
    
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

// Initialize on DOM ready with enhanced reliability
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM ready - preparing to initialize section templates');
    // Increased delay to ensure builder components are fully loaded
    setTimeout(initTemplateSystem, 200);
});

// For cases where DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🔄 Document already ready - initializing templates now');
    setTimeout(initTemplateSystem, 200);
}

// Also expose key functions globally for direct access by builder
window.showAddSectionModal = showAddSectionModal;
window.hideAddSectionModal = hideAddSectionModal;
window.insertSectionTemplate = insertSectionTemplate;
window.setupTemplateButtonHandlers = setupTemplateButtonHandlers;