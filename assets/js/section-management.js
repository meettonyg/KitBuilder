/**
 * Media Kit Builder - Section Management
 * 
 * This file provides all the functionality for managing sections:
 * - Section creation and deletion
 * - Section selection and editing
 * - Layout switching and component distribution
 * - Section controls and event handling
 */

(function($) {
    'use strict';
    
    // Check if MediaKitBuilder exists
    if (!window.MediaKitBuilder) {
        console.error('MediaKitBuilder not found. Section Management requires the main builder.');
        return;
    }
    
    // Create section management namespace
    window.MediaKitBuilder.sections = window.MediaKitBuilder.sections || {};
    
    /**
     * Initialize section management
     */
    window.MediaKitBuilder.sections.init = function() {
        console.log('🔄 Initializing Section Management...');
        
        // Setup section event listeners
        setupSectionEventListeners();
        
        // Setup add section button
        setupAddSectionButton();
        
        // Add section controls to existing sections
        addSectionControls();
        
        // Ensure template manager is initialized
        initializeTemplateManager();
        
        console.log('✅ Section Management initialized');
    };
    
    /**
     * Setup section event listeners
     */
    function setupSectionEventListeners() {
        console.log('Setting up section event listeners');
        
        // Use event delegation for section events
        $(document).on('click', '.media-kit-section', function(e) {
            // Don't select section if clicking on a component or controls
            if ($(e.target).closest('.editable-element, .section-controls, .element-controls').length) {
                return;
            }
            
            e.stopPropagation();
            selectSection(this);
        });
        
        // Handle section control buttons
        $(document).on('click', '.section-control-btn', function(e) {
            e.stopPropagation();
            
            const section = $(this).closest('.media-kit-section')[0];
            const action = $(this).data('action');
            
            if (action === 'move-up') {
                moveSection(section, 'up');
            } else if (action === 'move-down') {
                moveSection(section, 'down');
            } else if (action === 'duplicate') {
                duplicateSection(section);
            } else if (action === 'delete') {
                if (confirm('Are you sure you want to delete this section?')) {
                    deleteSection(section);
                }
            } else if (action === 'settings') {
                selectSection(section);
                // Switch to design tab
                $('.sidebar-tab[data-tab="design"]').click();
            }
        });
    }
    
    /**
     * Setup add section button
     */
    function setupAddSectionButton() {
        console.log('Setting up add section button');
        
        // Find add section button in layout tab
        const addBtn = document.getElementById('add-section-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                showAddSectionModal();
            });
        }
        
        // Also setup templates button
        const templatesBtn = document.getElementById('section-templates-btn');
        if (templatesBtn) {
            templatesBtn.addEventListener('click', function() {
                showAddSectionModal();
            });
        }
    }
    
    /**
     * Add section controls to existing sections
     */
    function addSectionControls() {
        console.log('Adding section controls to existing sections');
        
        $('.media-kit-section').each(function() {
            if ($(this).find('.section-controls').length === 0) {
                const controlsHTML = `
                    <div class="section-controls">
                        <button class="section-control-btn" data-action="move-up" title="Move Up">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                        </button>
                        <button class="section-control-btn" data-action="move-down" title="Move Down">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                        </button>
                        <button class="section-control-btn" data-action="duplicate" title="Duplicate">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="8" y="8" width="12" height="12" rx="2"/>
                                <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>
                            </svg>
                        </button>
                        <button class="section-control-btn" data-action="delete" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                        <button class="section-control-btn" data-action="settings" title="Settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                            </svg>
                        </button>
                    </div>
                `;
                $(this).append(controlsHTML);
            }
        });
    }
    
    /**
     * Initialize template manager if not already
     */
    function initializeTemplateManager() {
        // Check if we have window.templateManager
        if (!window.templateManager && typeof SectionTemplateManager === 'function') {
            console.log('Creating template manager');
            
            // Create template manager
            window.templateManager = new SectionTemplateManager({
                wpData: window.mkbData
            });
            
            // Listen for template selection
            document.addEventListener('template-selected', handleTemplateSelection);
        }
    }
    
    /**
     * Handle template selection
     * @param {CustomEvent} event - Template selection event
     */
    function handleTemplateSelection(event) {
        console.log('Template selected:', event.detail);
        
        const template = event.detail.template;
        
        // Create section from template
        addSection(template.type, template.layout, template.components);
    }
    
    /**
     * Select section
     * @param {HTMLElement} section - Section element
     */
    function selectSection(section) {
        console.log('Selecting section:', section);
        
        // Deselect all sections first
        $('.media-kit-section').removeClass('selected');
        
        // Deselect any components
        deselectAllElements();
        
        // Select this section
        $(section).addClass('selected');
        
        // Store selected section
        window.MediaKitBuilder.selectedSection = section;
        
        // Update design panel
        updateSectionDesignPanel(section);
    }
    
    /**
     * Deselect all elements
     */
    function deselectAllElements() {
        // Remove selected class from all elements
        $('.editable-element').removeClass('selected');
        
        // Clear element selection
        if (window.MediaKitBuilder.global && window.MediaKitBuilder.global.instance) {
            if (window.MediaKitBuilder.global.instance.selectedElement) {
                window.MediaKitBuilder.global.instance.selectedElement = null;
            }
        }
    }
    
    /**
     * Update section design panel
     * @param {HTMLElement} section - Selected section
     */
    function updateSectionDesignPanel(section) {
        console.log('Updating section design panel');
        
        // Get section info
        const sectionType = $(section).data('section-type') || 'content';
        const sectionLayout = $(section).data('section-layout') || 'full-width';
        const sectionId = $(section).data('section-id');
        
        // Get design panel element
        const designPanel = $('#design-tab');
        if (!designPanel.length) return;
        
        // Create design panel content
        const panelHTML = `
            <div class="design-panel-section">
                <h3>Section Settings</h3>
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
                            <div class="layout-preview main-sidebar"></div>
                            <div class="layout-name">Main + Sidebar</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Background Color</label>
                    <div class="color-picker">
                        <input type="color" id="section-bg-color" value="${$(section).css('backgroundColor') || '#ffffff'}">
                        <input type="text" id="section-bg-hex" value="${$(section).css('backgroundColor') || '#ffffff'}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Spacing</label>
                    <div class="spacing-controls">
                        <label>Top</label>
                        <input type="range" id="section-padding-top" min="0" max="100" value="${parseInt($(section).css('paddingTop')) || 20}">
                        <span>${parseInt($(section).css('paddingTop')) || 20}px</span>
                    </div>
                    <div class="spacing-controls">
                        <label>Bottom</label>
                        <input type="range" id="section-padding-bottom" min="0" max="100" value="${parseInt($(section).css('paddingBottom')) || 20}">
                        <span>${parseInt($(section).css('paddingBottom')) || 20}px</span>
                    </div>
                </div>
            </div>
        `;
        
        // Set panel content
        designPanel.html(panelHTML);
        
        // Setup layout option handlers
        designPanel.find('.layout-option').on('click', function() {
            const newLayout = $(this).data('layout');
            
            // Show loading state
            $(this).css('opacity', '0.5');
            
            // Change section layout
            changeSectionLayout(sectionId, newLayout);
            
            // Update active state
            designPanel.find('.layout-option').removeClass('active');
            $(this).addClass('active');
            
            // Remove loading state
            setTimeout(() => {
                $(this).css('opacity', '1');
            }, 200);
        });
        
        // Setup color picker
        designPanel.find('#section-bg-color').on('input', function() {
            const color = $(this).val();
            designPanel.find('#section-bg-hex').val(color);
            $(section).css('backgroundColor', color);
            
            // Mark as dirty
            markDirty();
        });
        
        // Setup spacing controls
        designPanel.find('#section-padding-top').on('input', function() {
            const padding = $(this).val() + 'px';
            $(this).next('span').text(padding);
            $(section).css('paddingTop', padding);
            
            // Mark as dirty
            markDirty();
        });
        
        designPanel.find('#section-padding-bottom').on('input', function() {
            const padding = $(this).val() + 'px';
            $(this).next('span').text(padding);
            $(section).css('paddingBottom', padding);
            
            // Mark as dirty
            markDirty();
        });
    }
    
    /**
     * Change section layout
     * @param {string} sectionId - Section ID
     * @param {string} newLayout - New layout type
     */
    function changeSectionLayout(sectionId, newLayout) {
        console.log(`Changing section ${sectionId} layout to ${newLayout}`);
        
        // Find section element
        const section = $(`.media-kit-section[data-section-id="${sectionId}"]`);
        if (!section.length) {
            console.error('Section not found:', sectionId);
            return;
        }
        
        // Get current layout
        const currentLayout = section.data('section-layout');
        
        // Do nothing if layout is the same
        if (currentLayout === newLayout) {
            console.log('Layout is already', newLayout);
            return;
        }
        
        // Store all components
        const components = section.find('.editable-element').detach();
        
        // Update section data attribute
        section.attr('data-section-layout', newLayout);
        
        // Update section content structure
        const sectionContent = section.find('.section-content');
        if (sectionContent.length) {
            sectionContent.attr('class', `section-content layout-${newLayout}`);
        } else {
            console.error('Section content not found');
            return;
        }
        
        // Generate new columns
        sectionContent.html(generateColumnsForLayout(newLayout));
        
        // Redistribute components
        redistributeComponents(section, components);
        
        // Save state
        saveCurrentState();
        
        // Mark as dirty
        markDirty();
    }
    
    /**
     * Generate columns HTML for layout
     * @param {string} layout - Layout type
     * @returns {string} - HTML for columns
     */
    function generateColumnsForLayout(layout) {
        switch(layout) {
            case 'two-column':
                return `
                    <div class="section-column" data-column="left">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                    <div class="section-column" data-column="right">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                `;
            case 'three-column':
                return `
                    <div class="section-column" data-column="left">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                    <div class="section-column" data-column="center">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                    <div class="section-column" data-column="right">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                `;
            case 'main-sidebar':
                return `
                    <div class="section-column" data-column="main">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                    <div class="section-column" data-column="sidebar">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                `;
            case 'full-width':
            default:
                return `
                    <div class="section-column" data-column="full">
                        <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                    </div>
                `;
        }
    }
    
    /**
     * Redistribute components between columns
     * @param {jQuery} section - Section element
     * @param {jQuery} components - Component elements
     */
    function redistributeComponents(section, components) {
        console.log('Redistributing components');
        
        const layout = section.data('section-layout');
        const columns = section.find('.section-column');
        
        if (!columns.length) {
            console.error('No columns found');
            return;
        }
        
        // Special case for single column
        if (columns.length === 1) {
            const dropZone = columns.find('.drop-zone');
            components.each(function() {
                dropZone.append(this);
                dropZone.removeClass('empty');
            });
            return;
        }
        
        // Distribute components evenly across columns
        const componentsPerColumn = Math.ceil(components.length / columns.length);
        let currentColumn = 0;
        let columnComponentCount = 0;
        
        components.each(function(index) {
            // Get current column's drop zone
            const dropZone = columns.eq(currentColumn).find('.drop-zone');
            
            // Append component to drop zone
            dropZone.append(this);
            dropZone.removeClass('empty');
            
            // Increment column component count
            columnComponentCount++;
            
            // Move to next column if needed
            if (columnComponentCount >= componentsPerColumn && currentColumn < columns.length - 1) {
                currentColumn++;
                columnComponentCount = 0;
            }
        });
    }
    
    /**
     * Add a new section
     * @param {string} type - Section type
     * @param {string} layout - Section layout
     * @param {Object|Array} components - Components to add
     * @returns {string} - New section ID
     */
    function addSection(type = 'content', layout = 'full-width', components = null) {
        console.log('Adding new section:', type, layout);
        
        // Generate section ID
        const sectionId = 'section-' + generateUUID();
        
        // Create section HTML
        const sectionHTML = `
            <div class="media-kit-section" data-section-id="${sectionId}" data-section-type="${type}" data-section-layout="${layout}">
                <div class="section-content layout-${layout}">
                    ${generateColumnsForLayout(layout)}
                </div>
                <div class="section-controls">
                    <button class="section-control-btn" data-action="move-up" title="Move Up">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                    </button>
                    <button class="section-control-btn" data-action="move-down" title="Move Down">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                    </button>
                    <button class="section-control-btn" data-action="duplicate" title="Duplicate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="8" y="8" width="12" height="12" rx="2"/>
                            <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>
                        </svg>
                    </button>
                    <button class="section-control-btn" data-action="delete" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                    <button class="section-control-btn" data-action="settings" title="Settings">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Append to preview
        const preview = $('#media-kit-preview');
        if (!preview.length) {
            console.error('Preview container not found');
            return null;
        }
        
        preview.append(sectionHTML);
        
        // Get the added section
        const section = preview.find(`.media-kit-section[data-section-id="${sectionId}"]`);
        
        // Add components if provided
        if (components) {
            addComponentsToSection(section, components);
        }
        
        // Select the new section
        selectSection(section[0]);
        
        // Save state
        saveCurrentState();
        
        // Mark as dirty
        markDirty();
        
        return sectionId;
    }
    
    /**
     * Add components to section
     * @param {jQuery} section - Section element
     * @param {Object|Array} components - Components to add
     */
    function addComponentsToSection(section, components) {
        console.log('Adding components to section:', components);
        
        // Get layout type
        const layout = section.data('section-layout');
        
        // Handle different component formats
        if (Array.isArray(components)) {
            // Single column components
            const dropZone = section.find('.drop-zone').first();
            
            components.forEach(comp => {
                addComponentToDropZone(comp.type, dropZone, comp.content);
            });
        } else if (typeof components === 'object') {
            // Multi-column components
            Object.entries(components).forEach(([column, columnComponents]) => {
                const dropZone = section.find(`.section-column[data-column="${column}"] .drop-zone`);
                
                if (dropZone.length && Array.isArray(columnComponents)) {
                    columnComponents.forEach(comp => {
                        addComponentToDropZone(comp.type, dropZone, comp.content);
                    });
                }
            });
        }
    }
    
    /**
     * Add component to drop zone
     * @param {string} type - Component type
     * @param {jQuery} dropZone - Drop zone element
     * @param {Object} content - Component content
     */
    function addComponentToDropZone(type, dropZone, content = {}) {
        console.log('Adding component to drop zone:', type);
        
        // Get component template
        if (window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            typeof window.MediaKitBuilder.global.instance.addComponent === 'function') {
            
            // Use builder's addComponent method
            window.MediaKitBuilder.global.instance.addComponent(type, dropZone[0], content);
        } else {
            console.error('Builder instance or addComponent method not found');
        }
    }
    
    /**
     * Delete section
     * @param {HTMLElement} section - Section element
     */
    function deleteSection(section) {
        console.log('Deleting section:', section);
        
        // Remove section from DOM
        $(section).remove();
        
        // Save state
        saveCurrentState();
        
        // Mark as dirty
        markDirty();
    }
    
    /**
     * Duplicate section
     * @param {HTMLElement} section - Section element
     */
    function duplicateSection(section) {
        console.log('Duplicating section:', section);
        
        // Get section data
        const type = $(section).data('section-type');
        const layout = $(section).data('section-layout');
        
        // Create new section
        const newSectionId = addSection(type, layout);
        
        // Find new section
        const newSection = $(`.media-kit-section[data-section-id="${newSectionId}"]`);
        
        // Clone components
        $(section).find('.editable-element').each(function() {
            const clone = $(this).clone(true);
            
            // Generate new ID for component
            const newId = 'component-' + generateUUID();
            clone.attr('data-component-id', newId);
            
            // Find appropriate drop zone in new section
            const columnType = $(this).closest('.section-column').data('column');
            const dropZone = newSection.find(`.section-column[data-column="${columnType}"] .drop-zone`);
            
            // Add to drop zone
            if (dropZone.length) {
                dropZone.append(clone);
                dropZone.removeClass('empty');
            }
        });
        
        // Copy styles
        newSection.css({
            backgroundColor: $(section).css('backgroundColor'),
            paddingTop: $(section).css('paddingTop'),
            paddingBottom: $(section).css('paddingBottom')
        });
        
        // Insert after original section
        $(section).after(newSection);
        
        // Select new section
        selectSection(newSection[0]);
        
        // Save state
        saveCurrentState();
        
        // Mark as dirty
        markDirty();
    }
    
    /**
     * Move section up or down
     * @param {HTMLElement} section - Section element
     * @param {string} direction - Direction to move ('up' or 'down')
     */
    function moveSection(section, direction) {
        console.log('Moving section:', direction);
        
        if (direction === 'up') {
            // Find previous section
            const prev = $(section).prev('.media-kit-section');
            if (prev.length) {
                $(section).insertBefore(prev);
            }
        } else if (direction === 'down') {
            // Find next section
            const next = $(section).next('.media-kit-section');
            if (next.length) {
                $(section).insertAfter(next);
            }
        }
        
        // Save state
        saveCurrentState();
        
        // Mark as dirty
        markDirty();
    }
    
    /**
     * Save current state
     */
    function saveCurrentState() {
        if (window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            typeof window.MediaKitBuilder.global.instance.saveStateToHistory === 'function') {
            
            window.MediaKitBuilder.global.instance.saveStateToHistory();
        }
    }
    
    /**
     * Mark as dirty
     */
    function markDirty() {
        if (window.MediaKitBuilder.global && 
            window.MediaKitBuilder.global.instance && 
            typeof window.MediaKitBuilder.global.instance.markDirty === 'function') {
            
            window.MediaKitBuilder.global.instance.markDirty();
        }
    }
    
    /**
     * Generate UUID
     * @returns {string} - UUID
     */
    function generateUUID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Show add section modal
     */
    function showAddSectionModal() {
        if (window.templateManager && typeof window.templateManager.showModal === 'function') {
            window.templateManager.showModal();
        } else if (typeof window.showAddSectionModal === 'function' && window.showAddSectionModal !== showAddSectionModal) {
            window.showAddSectionModal();
        } else {
            console.error('Template manager not found');
            
            // Fallback: add a default section
            addSection('content', 'full-width');
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        // Initialize section management
        setTimeout(function() {
            window.MediaKitBuilder.sections.init();
        }, 500);
    });
    
    // Add section-related CSS
    function addSectionStyles() {
        if (!document.getElementById('section-management-styles')) {
            const style = document.createElement('style');
            style.id = 'section-management-styles';
            style.textContent = `
                /* Section styles */
                .media-kit-section {
                    position: relative;
                    margin-bottom: 20px;
                    padding: 20px 0;
                    border: 1px dashed transparent;
                }
                
                .media-kit-section:hover {
                    border-color: #e2e8f0;
                }
                
                .media-kit-section.selected {
                    background-color: rgba(14, 165, 233, 0.03);
                    border: 1px solid #0ea5e9;
                }
                
                /* Section controls */
                .section-controls {
                    position: absolute;
                    top: -30px;
                    right: 10px;
                    background: #2a2a2a;
                    border-radius: 6px;
                    padding: 4px;
                    display: none;
                    gap: 4px;
                    z-index: 100;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                
                .media-kit-section:hover .section-controls,
                .media-kit-section.selected .section-controls {
                    display: flex;
                }
                
                .section-control-btn {
                    background: #333;
                    border: none;
                    color: #94a3b8;
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .section-control-btn:hover {
                    background: #3a3a3a;
                    color: #0ea5e9;
                }
                
                /* Section content layouts */
                .section-content {
                    display: flex;
                    gap: 20px;
                    width: 100%;
                }
                
                .section-column {
                    flex: 1;
                    min-height: 50px;
                }
                
                /* Layout styles */
                .layout-full-width .section-column {
                    width: 100%;
                }
                
                .layout-two-column .section-column {
                    flex: 1;
                }
                
                .layout-three-column .section-column {
                    flex: 1;
                }
                
                .layout-main-sidebar .section-column[data-column="main"] {
                    flex: 2;
                }
                
                .layout-main-sidebar .section-column[data-column="sidebar"] {
                    flex: 1;
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .section-content {
                        flex-direction: column;
                    }
                    
                    .section-column {
                        width: 100% !important;
                        flex: none !important;
                    }
                }
                
                /* Design panel - layout options */
                .layout-options {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .layout-option {
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                }
                
                .layout-option:hover {
                    border-color: #0ea5e9;
                }
                
                .layout-option.active {
                    border-color: #0ea5e9;
                    background-color: rgba(14, 165, 233, 0.1);
                }
                
                .layout-preview {
                    height: 40px;
                    background: #f8fafc;
                    border-radius: 4px;
                    margin-bottom: 6px;
                    position: relative;
                }
                
                .layout-name {
                    font-size: 12px;
                    color: #94a3b8;
                }
                
                /* Layout previews */
                .layout-preview.full-width::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10%;
                    right: 10%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.two-column::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10%;
                    width: 35%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.two-column::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    right: 10%;
                    width: 35%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.three-column::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 8%;
                    width: 25%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.three-column::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    right: 8%;
                    width: 25%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.three-column .center-col {
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 25%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.main-sidebar::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10%;
                    width: 55%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                .layout-preview.main-sidebar::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    right: 10%;
                    width: 20%;
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                
                /* Form styling */
                .color-picker {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .color-picker input[type="color"] {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 2px;
                }
                
                .color-picker input[type="text"] {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                }
                
                .spacing-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .spacing-controls label {
                    width: 60px;
                    color: #94a3b8;
                }
                
                .spacing-controls input[type="range"] {
                    flex: 1;
                }
                
                .spacing-controls span {
                    width: 40px;
                    text-align: right;
                    color: #94a3b8;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Add section styles
    addSectionStyles();
    
})(jQuery);