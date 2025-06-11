/**
 * Section Template Integration
 * Bridges section-templates.js with builder-wordpress.js for seamless template insertion
 */

(function() {
    console.log('🔗 Section Template Integration module loaded');
    
    // Configuration
    const config = {
        debug: true,
        insertionDelay: 100,
        controlsDelay: 150,
        logPrefix: '🧩 [Template Integration]:'
    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeIntegration();
    });
    
    // For cases where DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initializeIntegration, 100);
    }
    
    /**
     * Initialize the integration
     */
    function initializeIntegration() {
        if (config.debug) console.log(`${config.logPrefix} Initializing...`);
        
        // Check if necessary components exist
        const builderLoaded = typeof window.MediaKitBuilder !== 'undefined' || 
                             (typeof window.addSection === 'function' && 
                              typeof window.getComponentTemplate === 'function');
                              
        const templatesLoaded = typeof window.sectionTemplates !== 'undefined' ||
                               typeof window.showAddSectionModal === 'function';
        
        if (config.debug) {
            console.log(`${config.logPrefix} Builder loaded: ${builderLoaded}`);
            console.log(`${config.logPrefix} Templates loaded: ${templatesLoaded}`);
        }
        
        if (!builderLoaded || !templatesLoaded) {
            if (config.debug) console.log(`${config.logPrefix} Components not ready, waiting...`);
            setTimeout(initializeIntegration, 200);
            return;
        }
        
        // Setup integration
        setupTemplateButtons();
        setupIntegrationHooks();
        
        if (config.debug) console.log(`${config.logPrefix} Integration initialized successfully`);
    }
    
    /**
     * Setup template buttons in the layout tab
     */
    function setupTemplateButtons() {
        // Add "Add Section" button to layout tab if it doesn't exist
        const layoutTab = document.getElementById('layout-tab');
        if (!layoutTab) return;
        
        // Check if buttons already exist
        const existingButtons = layoutTab.querySelectorAll('#add-section-btn, #section-templates-btn');
        if (existingButtons.length > 0) {
            if (config.debug) console.log(`${config.logPrefix} Template buttons already exist`);
            
            // Make sure they have proper event handlers
            existingButtons.forEach(button => {
                if (button.id === 'add-section-btn' || button.id === 'section-templates-btn') {
                    // Remove existing listeners to prevent duplicates
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    // Add click handler
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (config.debug) console.log(`${config.logPrefix} Template button clicked`);
                        openTemplateModal();
                    });
                }
            });
            
            return;
        }
        
        // If buttons don't exist, add them
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.style.marginTop = '24px';
        sectionTitle.textContent = 'Section Management';
        
        const description = document.createElement('p');
        description.style.color = '#94a3b8';
        description.style.fontSize = '12px';
        description.style.marginBottom = '16px';
        description.textContent = 'Add and manage sections in your media kit';
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'section-controls';
        
        // Primary "Add Section" button
        const addSectionBtn = document.createElement('button');
        addSectionBtn.className = 'section-btn';
        addSectionBtn.id = 'add-section-btn';
        addSectionBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Section
        `;
        
        // Section Templates button
        const templatesBtn = document.createElement('button');
        templatesBtn.className = 'section-btn';
        templatesBtn.id = 'section-templates-btn';
        templatesBtn.style.marginTop = '8px';
        templatesBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M9 9h6v6H9z"></path>
            </svg>
            Browse Templates
        `;
        
        // Add click handlers
        addSectionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (config.debug) console.log(`${config.logPrefix} Add Section button clicked`);
            openTemplateModal();
        });
        
        templatesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (config.debug) console.log(`${config.logPrefix} Templates button clicked`);
            openTemplateModal();
        });
        
        // Append elements
        buttonsContainer.appendChild(addSectionBtn);
        buttonsContainer.appendChild(templatesBtn);
        
        // Find where to insert the buttons
        const insertTarget = layoutTab.querySelector('.layout-options');
        if (insertTarget) {
            // Insert after layout options
            insertTarget.parentNode.insertBefore(sectionTitle, insertTarget.nextSibling);
            sectionTitle.parentNode.insertBefore(description, sectionTitle.nextSibling);
            description.parentNode.insertBefore(buttonsContainer, description.nextSibling);
            
            if (config.debug) console.log(`${config.logPrefix} Template buttons added to layout tab`);
        } else {
            // Append to the end
            layoutTab.appendChild(sectionTitle);
            layoutTab.appendChild(description);
            layoutTab.appendChild(buttonsContainer);
            
            if (config.debug) console.log(`${config.logPrefix} Template buttons added to end of layout tab`);
        }
    }
    
    /**
     * Setup integration hooks between template system and builder
     */
    function setupIntegrationHooks() {
        // Define our integrated functions
        
        // Template insertion function
        window.integratedInsertTemplate = function(templateId) {
            if (config.debug) console.log(`${config.logPrefix} Inserting template: ${templateId}`);
            
            // Get template data
            const template = window.sectionTemplates[templateId];
            if (!template) {
                console.error(`${config.logPrefix} Template not found: ${templateId}`);
                return false;
            }
            
            // Check premium access
            if (template.premium) {
                const hasPremiumAccess = window.premiumAccess && 
                                       typeof window.premiumAccess.hasAccess === 'function' && 
                                       window.premiumAccess.hasAccess('premiumTemplates');
                
                if (!hasPremiumAccess) {
                    if (config.debug) console.log(`${config.logPrefix} Premium template access denied`);
                    
                    if (window.premiumAccess && typeof window.premiumAccess.showUpgradePrompt === 'function') {
                        window.premiumAccess.showUpgradePrompt('premium-template');
                    } else {
                        alert('This is a premium template. Please upgrade to access it.');
                    }
                    return false;
                }
            }
            
            // Create section
            const sectionId = window.addSection(template.type, template.layout);
            if (!sectionId) {
                console.error(`${config.logPrefix} Failed to create section`);
                return false;
            }
            
            // Get section element
            const section = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (!section) {
                console.error(`${config.logPrefix} Cannot find newly created section`);
                return false;
            }
            
            // Add components
            if (template.components) {
                if (config.debug) console.log(`${config.logPrefix} Adding components to template`);
                
                if (template.layout === 'full-width') {
                    // Single column
                    const dropZone = section.querySelector('.section-column .drop-zone');
                    if (dropZone) {
                        if (Array.isArray(template.components)) {
                            template.components.forEach(comp => {
                                addTemplateComponent(comp.type, dropZone, comp.content);
                            });
                        }
                    }
                } else {
                    // Multi-column
                    if (typeof template.components === 'object') {
                        Object.entries(template.components).forEach(([column, components]) => {
                            const dropZone = section.querySelector(`[data-column="${column}"] .drop-zone`);
                            if (dropZone && Array.isArray(components)) {
                                components.forEach(comp => {
                                    addTemplateComponent(comp.type, dropZone, comp.content);
                                });
                            }
                        });
                    }
                }
            }
            
            // Re-initialize controls
            setTimeout(() => {
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
                
                // Mark as dirty
                if (typeof window.markDirty === 'function') {
                    window.markDirty();
                }
                
                // Save current state
                if (typeof window.saveCurrentState === 'function') {
                    window.saveCurrentState();
                }
            }, config.controlsDelay);
            
            // Close modal
            if (typeof window.hideAddSectionModal === 'function') {
                window.hideAddSectionModal();
            }
            
            if (config.debug) console.log(`${config.logPrefix} Template inserted successfully: ${templateId}`);
            return sectionId;
        };
        
        // Helper function to add template component
        function addTemplateComponent(type, dropZone, content) {
            if (!type || !dropZone) return null;
            
            // Get component template
            const template = window.getComponentTemplate(type);
            if (!template) return null;
            
            // Create DOM element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template;
            
            const component = tempDiv.firstElementChild;
            if (!component) return null;
            
            // Add component ID
            const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
            component.setAttribute('data-component-id', componentId);
            
            // Populate with content
            if (content) {
                populateComponentWithContent(component, type, content);
            }
            
            // Add to drop zone
            dropZone.appendChild(component);
            dropZone.classList.remove('empty');
            
            // Add event listeners
            if (typeof window.setupElementEventListeners === 'function') {
                window.setupElementEventListeners(component);
            }
            
            return component;
        }
        
        // Populate component with content
        function populateComponentWithContent(component, type, content) {
            if (!content) return;
            
            switch(type) {
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
                    if (content.items && Array.isArray(content.items)) {
                        const topicItems = component.querySelectorAll('.topic-item');
                        content.items.forEach((topic, index) => {
                            if (index < topicItems.length) {
                                topicItems[index].textContent = topic;
                            }
                        });
                    }
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
                    // Generic approach for other components
                    const editableElements = component.querySelectorAll('[contenteditable="true"]');
                    if (editableElements.length > 0 && typeof content === 'object') {
                        Object.entries(content).forEach(([key, value]) => {
                            // Try to find elements with matching class or ID
                            const element = 
                                component.querySelector(`.${key}`) || 
                                component.querySelector(`#${key}`) ||
                                component.querySelector(`[data-field="${key}"]`);
                            
                            if (element && typeof value === 'string') {
                                element.textContent = value;
                            }
                        });
                    }
                    break;
            }
        }
        
        // Override or hook into existing functions
        if (typeof window.insertSectionTemplate !== 'function') {
            window.insertSectionTemplate = window.integratedInsertTemplate;
            if (config.debug) console.log(`${config.logPrefix} Provided insertSectionTemplate function`);
        } else {
            const originalInsert = window.insertSectionTemplate;
            window.insertSectionTemplate = function(templateId) {
                if (config.debug) console.log(`${config.logPrefix} Using original insertSectionTemplate with fallback`);
                
                try {
                    return originalInsert(templateId);
                } catch (error) {
                    console.error(`${config.logPrefix} Original insertion failed:`, error);
                    console.log(`${config.logPrefix} Trying fallback insertion`);
                    return window.integratedInsertTemplate(templateId);
                }
            };
            if (config.debug) console.log(`${config.logPrefix} Enhanced existing insertSectionTemplate function`);
        }
    }
    
    /**
     * Open template modal with enhanced error handling
     */
    function openTemplateModal() {
        if (config.debug) console.log(`${config.logPrefix} Opening template modal`);
        
        // Try multiple methods to show the modal
        const methods = [
            // Method 1: Direct function call
            function() {
                if (typeof window.showAddSectionModal === 'function') {
                    window.showAddSectionModal();
                    return true;
                }
                return false;
            },
            
            // Method 2: Try using window.sectionTemplates system directly
            function() {
                if (window.sectionTemplates && typeof window.createAddSectionModal === 'function') {
                    window.createAddSectionModal();
                    const modal = document.getElementById('add-section-modal');
                    if (modal) {
                        modal.style.display = 'flex';
                        if (typeof window.renderSectionTemplates === 'function') {
                            window.renderSectionTemplates();
                        }
                        return true;
                    }
                }
                return false;
            },
            
            // Method 3: Use fallback if modal HTML exists
            function() {
                const modal = document.getElementById('add-section-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    return true;
                }
                return false;
            },
            
            // Method 4: Create minimal modal if needed
            function() {
                if (config.debug) console.log(`${config.logPrefix} Creating fallback modal`);
                createFallbackModal();
                return true;
            }
        ];
        
        // Try each method in sequence
        for (const method of methods) {
            try {
                if (method()) {
                    if (config.debug) console.log(`${config.logPrefix} Modal opened successfully`);
                    return;
                }
            } catch (error) {
                console.error(`${config.logPrefix} Modal method failed:`, error);
            }
        }
    }
    
    /**
     * Create a fallback modal if the template modal doesn't exist
     */
    function createFallbackModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('add-section-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create basic templates if none exist
        if (!window.sectionTemplates) {
            window.sectionTemplates = {
                'content-section': {
                    name: 'Content Section',
                    type: 'content',
                    layout: 'full-width',
                    description: 'Basic content section with text',
                    premium: false,
                    components: [
                        {
                            type: 'bio',
                            content: {
                                title: 'Content Section',
                                text: 'Add your content here'
                            }
                        }
                    ]
                },
                'two-column-section': {
                    name: 'Two Column Section',
                    type: 'content',
                    layout: 'two-column',
                    description: 'Section with two columns',
                    premium: false,
                    components: {
                        left: [
                            {
                                type: 'bio',
                                content: {
                                    title: 'Left Column',
                                    text: 'Content for left column'
                                }
                            }
                        ],
                        right: [
                            {
                                type: 'bio',
                                content: {
                                    title: 'Right Column',
                                    text: 'Content for right column'
                                }
                            }
                        ]
                    }
                }
            };
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="add-section-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
                <div class="modal-content" style="background: white; border-radius: 10px; max-width: 800px; width: 100%; overflow: hidden; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);">
                    <div class="modal-header" style="background: #0ea5e9; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                        <div class="modal-title" style="font-size: 18px; font-weight: 600;">Add Section Template</div>
                        <button class="close-modal" id="close-section-modal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                        <div id="section-template-gallery" class="section-template-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
                            <!-- Templates will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup close button
        const closeBtn = document.getElementById('close-section-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                const modal = document.getElementById('add-section-modal');
                if (modal) modal.style.display = 'none';
            });
        }
        
        // Render templates
        renderFallbackTemplates();
    }
    
    /**
     * Render templates in the fallback modal
     */
    function renderFallbackTemplates() {
        const gallery = document.getElementById('section-template-gallery');
        if (!gallery) return;
        
        // Clear gallery
        gallery.innerHTML = '';
        
        // Add templates
        if (window.sectionTemplates) {
            Object.entries(window.sectionTemplates).forEach(([id, template]) => {
                const templateCard = `
                    <div class="template-card ${template.premium ? 'premium' : ''}" 
                         data-template-id="${id}"
                         style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div class="template-preview" style="height: 120px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #e2e8f0;">
                            <div style="font-size: 24px; color: #64748b;">
                                ${template.type === 'hero' ? '👤' : 
                                  template.type === 'content' ? '📝' : 
                                  template.type === 'features' ? '✨' : 
                                  template.type === 'media' ? '🖼️' : 
                                  template.type === 'contact' ? '📞' : '📄'}
                            </div>
                        </div>
                        <div class="template-info" style="padding: 12px;">
                            <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${template.name}</div>
                            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${template.description || ''}</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${template.layout}</span>
                                ${template.premium ? '<span style="background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">PRO</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                gallery.insertAdjacentHTML('beforeend', templateCard);
            });
            
            // Add click handlers
            gallery.querySelectorAll('.template-card').forEach(card => {
                card.addEventListener('click', function() {
                    const templateId = this.getAttribute('data-template-id');
                    if (templateId) {
                        if (config.debug) console.log(`${config.logPrefix} Template selected: ${templateId}`);
                        window.insertSectionTemplate(templateId);
                    }
                });
            });
        } else {
            gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No templates available</div>';
        }
    }
    
    // Export public functions for testing/debugging
    window.templateIntegration = {
        setup: initializeIntegration,
        openModal: openTemplateModal,
        addButtons: setupTemplateButtons,
        insertTemplate: function(templateId) {
            return window.insertSectionTemplate(templateId);
        }
    };
    
    if (config.debug) console.log(`${config.logPrefix} Module loaded successfully`);
})();
