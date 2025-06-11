/**
 * Complete Builder JavaScript for WordPress Integration
 * Includes all builder functionality with WordPress integration
 */

// Global variables
let isLoading = true;
let currentData = {};
let isDirty = false;
let selectedElement = null;
let selectedSection = null;
let undoStack = [];
let redoStack = [];
let draggedComponent = null;

// Section-based data structure
let mediaKitData = {
    version: '2.0',
    theme: {
        id: 'modern-blue',
        customizations: {}
    },
    sections: [],
    components: {}
};

// Configuration from WordPress
const config = window.MediaKitBuilder?.config || {
    entryKey: '',
    isNew: false,
    userId: 0,
    isLoggedIn: false,
    accessTier: 'guest',
    ajaxUrl: '/wp-admin/admin-ajax.php',
    nonce: '',
    pluginUrl: ''
};

// Field mappings for Formidable integration
const fieldMappings = window.MediaKitBuilder?.fieldMappings || {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeBuilder();
});

function initializeBuilder() {
    console.log('Initializing Media Kit Builder v2.0');
    console.log('Config:', config);
    
    setupTabs();
    setupPreviewToggle();
    setupDragAndDrop();
    setupElementSelection();
    setupLiveEditing();
    setupFormUpdates();
    setupLayoutOptions();
    setupToolbarActions();
    setupKeyboardShortcuts();
    setupSectionManagement();
    
    // Load data
    if (config.isNew) {
        loadDefaultData();
    } else {
        loadMediaKitData();
    }
}

// Tab switching functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.sidebar-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });
}

// Enhanced preview toggle (desktop/tablet/mobile)
function setupPreviewToggle() {
    const toggleButtons = document.querySelectorAll('.preview-toggle button');
    const container = document.getElementById('preview-container');

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const previewType = this.getAttribute('data-preview');
            container.classList.remove('mobile-preview', 'tablet-preview');
            
            if (previewType === 'mobile') {
                container.classList.add('mobile-preview');
            } else if (previewType === 'tablet') {
                container.classList.add('tablet-preview');
            }
        });
    });
}

// Enhanced drag and drop functionality
function setupDragAndDrop() {
    const componentItems = document.querySelectorAll('.component-item[draggable="true"]');
    const dropZones = document.querySelectorAll('.drop-zone');

    // Component drag start
    componentItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedComponent = this.getAttribute('data-component');
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedComponent = null;
        });
    });

    // Drop zone functionality
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedComponent) {
                // Check if premium component
                const componentElement = document.querySelector(`[data-component="${draggedComponent}"]`);
                if (componentElement && componentElement.classList.contains('premium')) {
                    showUpgradePrompt();
                    return;
                }
                
                addComponentToZone(draggedComponent, this);
                markDirty();
                saveCurrentState();
            }
        });

        // Click to add component
        zone.addEventListener('click', function() {
            if (this.classList.contains('empty')) {
                // Show component selection or add default component
                console.log('Show component library or add default component');
            }
        });
    });
}

// Element selection
function setupElementSelection() {
    const editableElements = document.querySelectorAll('.editable-element');

    editableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.stopPropagation();
            selectElement(this);
        });

        // Setup element controls
        const controls = element.querySelector('.element-controls');
        if (controls) {
            const deleteBtn = controls.querySelector('.control-btn[title="Delete"]');
            const duplicateBtn = controls.querySelector('.control-btn[title="Duplicate"]');
            const moveUpBtn = controls.querySelector('.control-btn[title="Move Up"]');
            const moveDownBtn = controls.querySelector('.control-btn[title="Move Down"]');

            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (element.getAttribute('data-component') !== 'hero') {
                        element.remove();
                        selectedElement = null;
                        markDirty();
                        saveCurrentState();
                    }
                });
            }

            if (duplicateBtn) {
                duplicateBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    duplicateElement(element);
                });
            }

            if (moveUpBtn) {
                moveUpBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    moveElement(element, 'up');
                });
            }

            if (moveDownBtn) {
                moveDownBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    moveElement(element, 'down');
                });
            }
        }
    });

    // Deselect when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.editable-element') && 
            !e.target.closest('.left-sidebar')) {
            deselectAllElements();
        }
    });
}

function selectElement(element) {
    // Remove selection from all elements
    document.querySelectorAll('.editable-element').forEach(el => {
        el.classList.remove('selected');
    });

    // Select clicked element
    element.classList.add('selected');
    selectedElement = element;

    // Update design panel
    updateDesignPanel(element);

    // Switch to design tab
    document.querySelector('.sidebar-tab[data-tab="design"]').click();
}

function deselectAllElements() {
    // Deselect components
    document.querySelectorAll('.editable-element').forEach(el => {
        el.classList.remove('selected');
    });
    selectedElement = null;
    
    // Also deselect sections when deselecting elements
    document.querySelectorAll('.media-kit-section').forEach(section => {
        section.classList.remove('selected');
    });
    selectedSection = null;
}

function updateDesignPanel(element) {
    const elementType = element.getAttribute('data-element');
    const editor = document.getElementById('element-editor');
    
    if (!editor) return;

    // Update editor title and icon based on element type
    const title = editor.querySelector('.editor-title');
    if (title) {
        const iconMap = {
            'hero': '👤',
            'topics': '💬',
            'social': '🔗',
            'bio': '📝',
            'contact': '📧',
            'questions': '❓',
            'stats': '📊',
            'cta': '🎯',
            'logo-grid': '🏢',
            'testimonials': '💬'
        };
        
        const elementNames = {
            'hero': 'Hero Section',
            'topics': 'Topics Section',
            'social': 'Social Links',
            'bio': 'Biography',
            'contact': 'Contact Information',
            'questions': 'Interview Questions',
            'stats': 'Statistics',
            'cta': 'Call to Action',
            'logo-grid': 'Logo Grid',
            'testimonials': 'Testimonials'
        };

        title.innerHTML = `
            <span style="font-size: 16px;">${iconMap[elementType] || '⚙️'}</span>
            ${elementNames[elementType] || 'Element Settings'}
        `;
    }

    // Sync form values with element data
    syncFormWithElement(element);
}

function syncFormWithElement(element) {
    const elementType = element.getAttribute('data-element');
    
    if (elementType === 'hero') {
        const nameInput = document.getElementById('hero-name');
        const titleInput = document.getElementById('hero-title');
        const bioInput = document.getElementById('hero-bio');

        const nameElement = element.querySelector('.hero-name');
        const titleElement = element.querySelector('.hero-title');
        const bioElement = element.querySelector('.hero-bio');

        if (nameInput && nameElement) {
            nameInput.value = nameElement.textContent;
        }
        if (titleInput && titleElement) {
            titleInput.value = titleElement.textContent;
        }
        if (bioInput && bioElement) {
            bioInput.value = bioElement.textContent;
        }
    }
}

// Enhanced live editing functionality
function setupLiveEditing() {
    // Sync form inputs with preview elements
    const nameInput = document.getElementById('hero-name');
    const titleInput = document.getElementById('hero-title');
    const bioInput = document.getElementById('hero-bio');
    const bgColorInput = document.getElementById('hero-bg-color');
    const textColorInput = document.getElementById('hero-text-color');

    if (nameInput) {
        nameInput.addEventListener('input', function() {
            const preview = document.getElementById('preview-name');
            if (preview) preview.textContent = this.value;
            updateAvatarInitials(this.value);
            markDirty();
        });
    }

    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const preview = document.getElementById('preview-title');
            if (preview) preview.textContent = this.value;
            markDirty();
        });
    }

    if (bioInput) {
        bioInput.addEventListener('input', function() {
            const preview = document.getElementById('preview-bio');
            if (preview) preview.textContent = this.value;
            markDirty();
        });
    }

    if (bgColorInput) {
        bgColorInput.addEventListener('input', function() {
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.background = `linear-gradient(135deg, ${this.value} 0%, ${adjustBrightness(this.value, -10)} 100%)`;
            }
            document.getElementById('hero-bg-text').value = this.value;
            markDirty();
        });
    }

    if (textColorInput) {
        textColorInput.addEventListener('input', function() {
            const heroName = document.querySelector('.hero-name');
            if (heroName) heroName.style.color = this.value;
            document.getElementById('hero-text-text').value = this.value;
            markDirty();
        });
    }

    // Setup contenteditable live updates
    setupContentEditableUpdates();
}

function setupContentEditableUpdates() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    editableElements.forEach(element => {
        element.addEventListener('blur', function() {
            markDirty();
            saveCurrentState();
        });

        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.blur();
            }
        });

        element.addEventListener('input', function() {
            markDirty();
        });
    });
}

function updateAvatarInitials(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const avatarInitials = document.getElementById('avatar-initials');
    if (avatarInitials) {
        avatarInitials.textContent = initials || '?';
    }
}

// Form updates and design panel
function setupFormUpdates() {
    const colorInputs = document.querySelectorAll('.color-input');
    colorInputs.forEach(input => {
        const textInput = input.nextElementSibling;
        
        input.addEventListener('input', function() {
            if (textInput) textInput.value = this.value;
        });

        if (textInput) {
            textInput.addEventListener('input', function() {
                if (isValidColor(this.value)) {
                    input.value = this.value;
                }
            });
        }
    });

    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', function() {
            applyTheme(this.value);
            markDirty();
        });
    }
}

function applyTheme(theme) {
    const preview = document.getElementById('media-kit-preview');
    if (!preview) return;

    // Remove existing theme classes
    preview.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // Add new theme class
    preview.classList.add(`theme-${theme}`);
    
    console.log('Applied theme:', theme);
}

// Layout options
function setupLayoutOptions() {
    const layoutOptions = document.querySelectorAll('.layout-option');
    
    layoutOptions.forEach(option => {
        option.addEventListener('click', function() {
            layoutOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const layout = this.getAttribute('data-layout');
            applyLayout(layout);
            markDirty();
        });
    });
}

function applyLayout(layoutType) {
    console.log('Applying layout:', layoutType);
    // Implementation would depend on your specific layout system
}

// Toolbar actions
function setupToolbarActions() {
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', save);
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportMediaKit);
    }

    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareMediaKit);
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
}

// Data loading functions
function loadDefaultData() {
    console.log('Loading default data for new media kit');
    
    // Set default values
    currentData = {
        hero_full_name: 'Your Name',
        hero_title: 'Your Professional Title',
        bio_text: 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.',
        topic_1: 'Leadership',
        topic_2: 'Innovation', 
        topic_3: 'Strategy',
        topic_4: 'Growth'
    };
    
    populateBuilder(currentData);
    hideLoading();
    updateStatus('Ready');
}

function loadMediaKitData() {
    console.log('Loading media kit data for:', config.entryKey);
    
    showLoading('Loading your media kit...');
    
    // Make AJAX request to load data
    const formData = new FormData();
    formData.append('action', 'mkb_load_data');
    formData.append('nonce', config.nonce);
    formData.append('entry_key', config.entryKey);
    
    fetch(config.ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data loaded:', data);
        
        if (data.success) {
            currentData = data.data.data || {};
            populateBuilder(currentData);
            updateStatus('Loaded');
        } else {
            console.error('Failed to load data:', data.data);
            updateStatus('Error loading data');
            // Load default data as fallback
            loadDefaultData();
        }
        
        hideLoading();
    })
    .catch(error => {
        console.error('Error loading data:', error);
        updateStatus('Error');
        hideLoading();
        // Load default data as fallback
        loadDefaultData();
    });
}

function populateBuilder(data) {
    console.log('Populating builder with data:', data);
    
    // Check if data has section structure
    if (data.sections && data.components) {
        // New section-based format
        populateFromSections(data);
    } else {
        // Legacy flat format
        populateFromLegacyData(data);
    }
}

function populateFromLegacyData(data) {
    // Update form inputs
    if (data.hero_full_name) {
        const nameInput = document.getElementById('hero-name');
        const namePreview = document.getElementById('preview-name');
        if (nameInput) nameInput.value = data.hero_full_name;
        if (namePreview) namePreview.textContent = data.hero_full_name;
        updateAvatarInitials(data.hero_full_name);
    }
    
    if (data.hero_title) {
        const titleInput = document.getElementById('hero-title');
        const titlePreview = document.getElementById('preview-title');
        if (titleInput) titleInput.value = data.hero_title;
        if (titlePreview) titlePreview.textContent = data.hero_title;
    }
    
    if (data.bio_text) {
        const bioInput = document.getElementById('hero-bio');
        const bioPreview = document.getElementById('preview-bio');
        if (bioInput) bioInput.value = data.bio_text;
        if (bioPreview) bioPreview.textContent = data.bio_text;
    }
    
    // Update topic items
    const topicElements = document.querySelectorAll('.topic-item');
    for (let i = 0; i < topicElements.length && i < 5; i++) {
        const topicKey = `topic_${i + 1}`;
        if (data[topicKey]) {
            topicElements[i].textContent = data[topicKey];
        }
    }
}

function populateFromSections(data) {
    // Store the loaded data
    mediaKitData = data;
    
    // Clear existing content
    const preview = document.getElementById('media-kit-preview');
    if (!preview) return;
    
    // Rebuild sections
    preview.innerHTML = '';
    
    data.sections.forEach((section, index) => {
        const sectionEl = createSectionElement(section);
        
        // Add components to section
        section.components.forEach(componentId => {
            const componentData = data.components[componentId];
            if (componentData) {
                const componentEl = createComponentFromData(componentData, componentId);
                const dropZone = sectionEl.querySelector('.drop-zone') || sectionEl;
                dropZone.appendChild(componentEl);
            }
        });
        
        preview.appendChild(sectionEl);
        
        // Add drop zone after section (except last)
        if (index < data.sections.length - 1) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone empty';
            dropZone.setAttribute('data-zone', `between-${index}`);
            preview.appendChild(dropZone);
        }
    });
    
    // Re-initialize event listeners
    setupElementSelection();
    setupContentEditableUpdates();
}

function createSectionElement(sectionData) {
    const section = document.createElement('div');
    section.className = 'media-kit-section';
    section.setAttribute('data-section-id', sectionData.id);
    section.setAttribute('data-section-type', sectionData.type);
    section.setAttribute('data-section-layout', sectionData.layout || 'full-width');
    
    // Add drop zone inside section
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.setAttribute('data-zone', sectionData.id);
    section.appendChild(dropZone);
    
    return section;
}

function createComponentFromData(componentData, componentId) {
    const template = getComponentTemplate(componentData.type);
    const temp = document.createElement('div');
    temp.innerHTML = template;
    
    const component = temp.firstElementChild;
    component.setAttribute('data-component-id', componentId);
    
    // Populate component with saved content
    populateComponentContent(component, componentData.content);
    
    return component;
}

function populateComponentContent(component, content) {
    const type = component.getAttribute('data-component');
    
    switch(type) {
        case 'hero':
            const heroName = component.querySelector('.hero-name');
            const heroTitle = component.querySelector('.hero-title');
            const heroBio = component.querySelector('.hero-bio');
            
            if (heroName && content.name) heroName.textContent = content.name;
            if (heroTitle && content.title) heroTitle.textContent = content.title;
            if (heroBio && content.bio) heroBio.textContent = content.bio;
            break;
            
        case 'topics':
            if (content.items) {
                const topicItems = component.querySelectorAll('.topic-item');
                content.items.forEach((item, index) => {
                    if (topicItems[index]) {
                        topicItems[index].textContent = item;
                    }
                });
            }
            break;
            
        case 'social':
            // Handle social links
            break;
            
        default:
            // Generic content population
            Object.keys(content).forEach(key => {
                const field = component.querySelector(`[data-field="${key}"]`);
                if (field) {
                    field.textContent = content[key];
                }
            });
    }
}

function collectCurrentData() {
    // Legacy format for backward compatibility
    const data = {};
    
    // Collect hero data
    const nameInput = document.getElementById('hero-name');
    const titleInput = document.getElementById('hero-title');
    const bioInput = document.getElementById('hero-bio');
    
    if (nameInput) data.hero_full_name = nameInput.value;
    if (titleInput) data.hero_title = titleInput.value;
    if (bioInput) data.bio_text = bioInput.value;
    
    // Collect topics
    const topicElements = document.querySelectorAll('.topic-item');
    topicElements.forEach((element, index) => {
        if (index < 5) {
            data[`topic_${index + 1}`] = element.textContent;
        }
    });
    
    // Also collect section-based data
    collectSectionsData();
    
    return data;
}

// New function to collect section-based data
function collectSectionsData() {
    const sections = [];
    const components = {};
    
    // Find all sections
    const sectionElements = document.querySelectorAll('.media-kit-section');
    
    sectionElements.forEach((section, sectionIndex) => {
        const sectionId = section.getAttribute('data-section-id') || `section-${sectionIndex}`;
        const sectionType = section.getAttribute('data-section-type') || 'content';
        const sectionLayout = section.getAttribute('data-section-layout') || 'full-width';
        
        const sectionData = {
            id: sectionId,
            type: sectionType,
            layout: sectionLayout,
            settings: {},
            components: []
        };
        
        // Find all components in this section
        const componentElements = section.querySelectorAll('.editable-element');
        componentElements.forEach((component) => {
            const componentId = component.getAttribute('data-component-id') || generateComponentId();
            const componentType = component.getAttribute('data-component');
            
            // Store component reference in section
            sectionData.components.push(componentId);
            
            // Store component data
            components[componentId] = {
                type: componentType,
                content: extractComponentContent(component),
                styles: {}
            };
        });
        
        sections.push(sectionData);
    });
    
    // Update global mediaKitData
    mediaKitData.sections = sections;
    mediaKitData.components = components;
    
    return mediaKitData;
}

// Helper function to extract component content
function extractComponentContent(component) {
    const content = {};
    const type = component.getAttribute('data-component');
    
    switch(type) {
        case 'hero':
            const heroName = component.querySelector('.hero-name');
            const heroTitle = component.querySelector('.hero-title');
            const heroBio = component.querySelector('.hero-bio');
            
            if (heroName) content.name = heroName.textContent;
            if (heroTitle) content.title = heroTitle.textContent;
            if (heroBio) content.bio = heroBio.textContent;
            break;
            
        case 'topics':
            content.items = [];
            const topicItems = component.querySelectorAll('.topic-item');
            topicItems.forEach(item => {
                content.items.push(item.textContent);
            });
            break;
            
        case 'social':
            content.links = [];
            const socialLinks = component.querySelectorAll('.social-link');
            socialLinks.forEach(link => {
                content.links.push({
                    platform: link.getAttribute('title'),
                    url: link.getAttribute('href')
                });
            });
            break;
            
        default:
            // Generic content extraction
            const editableFields = component.querySelectorAll('[contenteditable="true"]');
            editableFields.forEach((field, index) => {
                content[`field_${index}`] = field.textContent;
            });
    }
    
    return content;
}

// Generate unique component ID
function generateComponentId() {
    return 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Generate unique section ID
function generateSectionId() {
    return 'section-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Save functions
function save() {
    console.log('Saving media kit...');
    
    const data = collectCurrentData();
    updateStatus('Saving...');
    
    const formData = new FormData();
    formData.append('action', 'mkb_save_data');
    formData.append('nonce', config.nonce);
    formData.append('entry_key', config.entryKey);
    formData.append('data', JSON.stringify(data));
    
    fetch(config.ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        console.log('Save result:', result);
        
        if (result.success) {
            updateStatus('Saved');
            isDirty = false;
            
            // If this was a new media kit, update the URL
            if (config.isNew && result.data.entry_key) {
                config.entryKey = result.data.entry_key;
                config.isNew = false;
                window.history.replaceState({}, '', `/media-kit-builder/${result.data.entry_key}`);
            }
        } else {
            updateStatus('Save failed');
            console.error('Save failed:', result.data);
        }
    })
    .catch(error => {
        console.error('Save error:', error);
        updateStatus('Save error');
    });
}

function autoSave() {
    if (isDirty && !config.isNew) {
        console.log('Auto-saving...');
        save();
    }
}

function exportMediaKit() {
    console.log('Exporting media kit...');
    updateStatus('Generating export...');
    
    // This would trigger the export functionality
    alert('Export functionality will be implemented with PDF generation.');
}

function shareMediaKit() {
    console.log('Sharing media kit...');
    
    const shareUrl = `${window.location.origin}/media-kit-builder/preview/${config.entryKey}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Media Kit',
            url: shareUrl
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share link copied to clipboard!');
        });
    }
}

// Component management
function addComponentToZone(componentType, zone) {
    const template = getComponentTemplate(componentType);
    zone.classList.remove('empty');
    zone.innerHTML = template;
    
    // Make the new element selectable
    const newElement = zone.querySelector('.editable-element');
    if (newElement) {
        newElement.addEventListener('click', function(e) {
            e.stopPropagation();
            selectElement(this);
        });
        
        // Select the newly added element
        selectElement(newElement);
    }
    
    console.log(`Added ${componentType} component`);
}

function getComponentTemplate(componentType) {
    const templates = {
        'hero': `
            <div class="hero-section editable-element" data-element="hero" data-component="hero">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <div class="hero-avatar">
                    <span>NH</span>
                </div>
                <h1 class="hero-name" contenteditable="true">New Hero Section</h1>
                <div class="hero-title" contenteditable="true">Your Professional Title</div>
                <p class="hero-bio" contenteditable="true">Briefly introduce yourself and your expertise.</p>
            </div>
        `,
        'bio': `
            <div class="content-section editable-element" data-element="bio" data-component="bio">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Move Down">↓</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <h2 class="section-title-mk" contenteditable="true">About Me</h2>
                <p contenteditable="true">Add your full biography and professional background here.</p>
            </div>
        `,
        'topics': `
            <div class="content-section editable-element" data-element="topics" data-component="topics">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Move Down">↓</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <h2 class="section-title-mk" contenteditable="true">Speaking Topics</h2>
                <div class="topics-grid">
                    <div class="topic-item" contenteditable="true">Topic 1</div>
                    <div class="topic-item" contenteditable="true">Topic 2</div>
                    <div class="topic-item" contenteditable="true">Topic 3</div>
                    <div class="topic-item" contenteditable="true">Topic 4</div>
                </div>
            </div>
        `,
        'social': `
            <div class="social-links editable-element" data-element="social" data-component="social">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Move Down">↓</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <a href="#" class="social-link" title="Twitter">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                    </svg>
                </a>
                <a href="#" class="social-link" title="LinkedIn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 616-6zM2 9h4v12H2z"/>
                        <circle cx="4" cy="4" r="2"/>
                    </svg>
                </a>
            </div>
        `,
        'stats': `
            <div class="content-section editable-element" data-element="stats" data-component="stats">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Move Down">↓</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <h2 class="section-title-mk" contenteditable="true">Key Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number" contenteditable="true">100+</span>
                        <div class="stat-label" contenteditable="true">Speaking Events</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" contenteditable="true">50K</span>
                        <div class="stat-label" contenteditable="true">Audience Reached</div>
                    </div>
                </div>
            </div>
        `,
        'questions': `
            <div class="content-section editable-element" data-element="questions" data-component="questions">
                <div class="element-controls">
                    <button class="control-btn" title="Move Up">↑</button>
                    <button class="control-btn" title="Move Down">↓</button>
                    <button class="control-btn" title="Duplicate">⧉</button>
                    <button class="control-btn" title="Delete">×</button>
                </div>
                <h2 class="section-title-mk" contenteditable="true">Interview Questions</h2>
                <div class="questions-list">
                    <div class="question-item" contenteditable="true">What inspired you to become an expert in your field?</div>
                    <div class="question-item" contenteditable="true">What advice would you give to someone starting out?</div>
                </div>
            </div>
        `
    };
    
    return templates[componentType] || '<div class="content-section"><p>Component template not found</p></div>';
}

function duplicateElement(element) {
    const clone = element.cloneNode(true);
    element.parentNode.insertBefore(clone, element.nextSibling);
    
    // Re-attach event listeners to the cloned element
    setupElementEventListeners(clone);
    
    markDirty();
    saveCurrentState();
}

function moveElement(element, direction) {
    const sibling = direction === 'up' ? element.previousElementSibling : element.nextElementSibling;
    
    if (sibling) {
        if (direction === 'up') {
            element.parentNode.insertBefore(element, sibling);
        } else {
            element.parentNode.insertBefore(sibling, element);
        }
        markDirty();
        saveCurrentState();
    }
}

function setupElementEventListeners(element) {
    element.addEventListener('click', function(e) {
        e.stopPropagation();
        selectElement(this);
    });
    
    const editableElements = element.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.addEventListener('blur', function() {
            markDirty();
            saveCurrentState();
        });
        
        el.addEventListener('input', function() {
            markDirty();
        });
    });
}

// Undo/Redo functionality
function saveCurrentState() {
    const state = document.getElementById('media-kit-preview').innerHTML;
    undoStack.push(state);
    redoStack = [];
    
    // Limit undo stack to 50 items
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Update button states
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = false;
    if (redoBtn) redoBtn.disabled = true;
}

function undo() {
    if (undoStack.length > 0) {
        const currentState = document.getElementById('media-kit-preview').innerHTML;
        redoStack.push(currentState);
        
        const previousState = undoStack.pop();
        document.getElementById('media-kit-preview').innerHTML = previousState;
        
        // Re-attach event listeners
        setupElementSelection(); 
        setupContentEditableUpdates();

        // Update button states
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        if (undoBtn) undoBtn.disabled = undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = false;
        
        markDirty();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const currentState = document.getElementById('media-kit-preview').innerHTML;
        undoStack.push(currentState);
        
        const nextState = redoStack.pop();
        document.getElementById('media-kit-preview').innerHTML = nextState;
        
        // Re-attach event listeners
        setupElementSelection(); 
        setupContentEditableUpdates();

        // Update button states
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        if (undoBtn) undoBtn.disabled = false;
        if (redoBtn) redoBtn.disabled = redoStack.length === 0;
        
        markDirty();
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    save();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    exportMediaKit();
                    break;
            }
        }
        
        if (e.key === 'Delete' && selectedElement) {
            if (selectedElement.getAttribute('data-component') !== 'hero') {
                selectedElement.remove();
                selectedElement = null;
                markDirty();
                saveCurrentState();
            }
        }
    });
}

// Utility functions
function markDirty() {
    isDirty = true;
    updateStatus('Unsaved changes');
}

function updateStatus(text) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    
    if (statusText) statusText.textContent = text;
    
    if (statusDot) {
        statusDot.classList.remove('saving');
        
        if (text.includes('Saving') || text.includes('Loading')) {
            statusDot.classList.add('saving');
        }
    }
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        const text = overlay.querySelector('div:not(.loading-spinner)');
        if (text) text.textContent = message;
    }
    isLoading = true;
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    isLoading = false;
}

function showUpgradePrompt() {
    alert('This is a premium component. Upgrade to Pro to unlock advanced features!');
}

function isValidColor(color) {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
}

function adjustBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Auto-save every 30 seconds if there are changes
setInterval(() => {
    if (isDirty && !config.isNew && !isLoading) {
        autoSave();
    }
}, 30000);

// Warn before leaving if there are unsaved changes
window.addEventListener('beforeunload', function(e) {
    if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize the first state for undo/redo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        saveCurrentState();
    }, 100);
});

// Section Management Functions
function setupSectionManagement() {
    console.log('🚀 Setting up section management (Phase 3A)');
    
    // Initialize existing components with sections if needed
    ensureSectionsExist();
    
    // Setup section event listeners FIRST
    setupSectionEventListeners();
    
    // Add section controls to existing sections - CRITICAL FIX
    // Use longer delay to ensure DOM is completely ready
    setTimeout(() => {
        addSectionControls();
        console.log('✅ Section controls added after DOM ready');
        
        // Verify controls were added successfully
        const controlsCount = document.querySelectorAll('.section-controls').length;
        const sectionsCount = document.querySelectorAll('.media-kit-section').length;
        console.log(`📊 Section controls verification: ${controlsCount} controls for ${sectionsCount} sections`);
        
        if (controlsCount !== sectionsCount) {
            console.warn('⚠️  Control count mismatch - retrying in 200ms');
            setTimeout(addSectionControls, 200);
        }
    }, 150);
    
    // Setup add section button with delay to ensure layout tab is ready
    setTimeout(() => {
        setupAddSectionButton();
        console.log('✅ Add section buttons configured');
    }, 200);
    
    console.log('✅ Section management setup completed successfully');
}

function ensureSectionsExist() {
    const preview = document.getElementById('media-kit-preview');
    if (!preview) return;
    
    // Check if sections already exist
    const existingSections = preview.querySelectorAll('.media-kit-section');
    if (existingSections.length > 0) return;
    
    // Wrap existing components in sections
    const components = preview.querySelectorAll('.editable-element');
    const dropZones = preview.querySelectorAll('.drop-zone');
    
    // Create temporary container
    const temp = document.createElement('div');
    
    // Group components by their natural sections
    let currentSection = createSection('hero', 'full-width');
    let hasHero = false;
    
    components.forEach((component, index) => {
        const componentType = component.getAttribute('data-component');
        
        // Determine section type based on component
        if (componentType === 'hero' && !hasHero) {
            hasHero = true;
            currentSection = createSection('hero', 'full-width');
        } else if (componentType === 'social' || componentType === 'contact') {
            const sectionColumn = currentSection.querySelector('.section-column');
            if ((sectionColumn && sectionColumn.children.length > 0) || currentSection.children.length > 1) {
                temp.appendChild(currentSection);
                // Add drop zone between sections
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone empty';
                dropZone.setAttribute('data-zone', `between-${temp.children.length}`);
                temp.appendChild(dropZone);
            }
            currentSection = createSection('contact', 'full-width');
        } else if (index > 0) {
            const currentColumn = currentSection.querySelector('.section-column');
            if (currentColumn && currentColumn.children.length > 2) {
                // Start new content section if current has many components
                temp.appendChild(currentSection);
                // Add drop zone between sections
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone empty';
                dropZone.setAttribute('data-zone', `between-${temp.children.length}`);
                temp.appendChild(dropZone);
                currentSection = createSection('content', 'full-width');
            }
        }
        
        // Clone the component to preserve it
        const componentClone = component.cloneNode(true);
        // Append to the column inside section content
        const column = currentSection.querySelector('.section-column');
        if (column) {
            column.appendChild(componentClone);
        } else {
            currentSection.appendChild(componentClone);
        }
    });
    
    // Add the last section
    const lastColumn = currentSection.querySelector('.section-column');
    if ((lastColumn && lastColumn.children.length > 0) || currentSection.children.length > 1) {
        temp.appendChild(currentSection);
    }
    
    // Add final drop zone
    const finalDropZone = document.createElement('div');
    finalDropZone.className = 'drop-zone empty';
    finalDropZone.setAttribute('data-zone', 'final');
    temp.appendChild(finalDropZone);
    
    // Replace preview content
    preview.innerHTML = temp.innerHTML;
    
    // Re-initialize event listeners
    setupElementSelection();
    setupContentEditableUpdates();
    setupSectionEventListeners();
}

function createSection(type, layout) {
    const section = document.createElement('div');
    section.className = 'media-kit-section';
    section.setAttribute('data-section-id', generateSectionId());
    section.setAttribute('data-section-type', type);
    section.setAttribute('data-section-layout', layout);
    
    // Add section content structure
    const sectionContent = document.createElement('div');
    sectionContent.className = 'section-content layout-' + layout;
    
    // Add column based on layout
    const column = document.createElement('div');
    column.className = 'section-column';
    column.setAttribute('data-column', 'full');
    
    sectionContent.appendChild(column);
    section.appendChild(sectionContent);
    
    return section;
}

function setupSectionEventListeners() {
    const sections = document.querySelectorAll('.media-kit-section');
    
    sections.forEach(section => {
        // Add hover effect
        section.addEventListener('mouseenter', function() {
            this.classList.add('section-hover');
        });
        
        section.addEventListener('mouseleave', function() {
            this.classList.remove('section-hover');
        });
        
        // Section selection - THIS IS THE CRITICAL FIX
        section.addEventListener('click', function(e) {
            // Don't select section if clicking on a component or controls
            if (e.target.closest('.editable-element') || 
                e.target.closest('.section-controls') ||
                e.target.closest('.element-controls')) {
                return;
            }
            
            e.stopPropagation();
            console.log('Section clicked:', this.getAttribute('data-section-id'));
            
            // Deselect any selected components first
            deselectAllElements();
            
            // Select this section
            selectSection(this);
            
            // Switch to design tab and show section settings
            const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
            if (designTab) {
                designTab.click();
            }
        });
    });
}

// ENHANCED: addSectionControls function with comprehensive verification
function addSectionControls() {
    console.log('🔧 Adding section controls to existing sections...');
    
    const sections = document.querySelectorAll('.media-kit-section');
    console.log(`📋 Found ${sections.length} sections to add controls to`);
    
    if (sections.length === 0) {
        console.warn('⚠️  No sections found - controls not added');
        return;
    }
    
    let controlsAdded = 0;
    let controlsSkipped = 0;
    
    sections.forEach((section, index) => {
        const sectionId = section.getAttribute('data-section-id') || `section-${Date.now()}-${index}`;
        
        // Check if controls already exist to avoid duplicates
        if (section.querySelector('.section-controls')) {
            console.log(`⏭️  Section ${sectionId} already has controls, skipping`);
            controlsSkipped++;
            return;
        }
        
        console.log(`➕ Adding controls to section ${sectionId}`);
        
        // Ensure section has proper attributes
        if (!section.getAttribute('data-section-id')) {
            section.setAttribute('data-section-id', sectionId);
        }
        if (!section.getAttribute('data-section-type')) {
            section.setAttribute('data-section-type', 'content');
        }
        if (!section.getAttribute('data-section-layout')) {
            section.setAttribute('data-section-layout', 'full-width');
        }
        
        // Create section controls HTML
        const controlsHTML = `
            <div class="section-controls">
                <button class="section-control-btn" data-action="move-up" title="Move Section Up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="move-down" title="Move Section Down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="duplicate" title="Duplicate Section">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="settings" title="Section Settings">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="delete" title="Delete Section">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Insert controls at the beginning of the section
        section.insertAdjacentHTML('afterbegin', controlsHTML);
        
        // Add event listeners to control buttons
        const controlButtons = section.querySelectorAll('.section-control-btn');
        controlButtons.forEach(button => {
            const action = button.getAttribute('data-action');
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                console.log(`Section control action: ${action} for section ${sectionId}`);
                
                switch(action) {
                    case 'move-up':
                        moveSectionUp(sectionId);
                        break;
                    case 'move-down':
                        moveSectionDown(sectionId);
                        break;
                    case 'duplicate':
                        duplicateSection(sectionId);
                        break;
                    case 'settings':
                        selectSection(section);
                        // Switch to design tab
                        const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
                        if (designTab) designTab.click();
                        break;
                    case 'delete':
                        if (confirm('Are you sure you want to delete this section and all its components?')) {
                            deleteSection(sectionId);
                        }
                        break;
                }
            });
        });
        
        console.log(`✅ Controls added successfully to section ${sectionId}`);
        controlsAdded++;
    });
    
    console.log(`📊 Section controls summary: ${controlsAdded} added, ${controlsSkipped} skipped, ${sections.length} total`);
    
    // Verify controls are visible by testing hover state
    setTimeout(() => {
        const firstSection = sections[0];
        if (firstSection) {
            firstSection.classList.add('section-hover');
            const controls = firstSection.querySelector('.section-controls');
            const isVisible = controls && getComputedStyle(controls).display !== 'none';
            console.log(`🔍 Control visibility test: ${isVisible ? '✅ PASSED' : '❌ FAILED'}`);
            firstSection.classList.remove('section-hover');
        }
    }, 100);
}

function setupAddSectionButton() {
    console.log('🔘 Setting up Add Section button handlers...');
    
    // Check if layout tab exists
    const layoutTab = document.getElementById('layout-tab');
    if (!layoutTab) {
        console.warn('⚠️  Layout tab not found');
        return;
    }
    
    // PRIMARY ADD SECTION BUTTON
    const primaryAddBtn = document.getElementById('add-section-btn-primary');
    if (primaryAddBtn) {
        console.log('🎯 Found primary add section button, attaching event');
        primaryAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚀 Primary add section button clicked');
            
            // Add visual feedback
            this.classList.add('loading');
            
            try {
                // Check if template modal function is available
                if (typeof showAddSectionModal === 'function') {
                    console.log('📱 Opening section template modal');
                    showAddSectionModal();
                } else if (window.showAddSectionModal) {
                    console.log('📱 Opening section template modal (window)');
                    window.showAddSectionModal();
                } else {
                    console.log('🔧 Template modal not available, adding default section');
                    // Fallback - add a default content section
                    const sectionId = addSection('content', 'full-width');
                    if (sectionId) {
                        console.log('✅ Added default section:', sectionId);
                        showSuccessMessage('Section added successfully!');
                    } else {
                        console.error('❌ Failed to add section');
                        showErrorMessage('Failed to add section');
                    }
                }
            } catch (error) {
                console.error('💥 Error adding section:', error);
                showErrorMessage('Error adding section');
            } finally {
                // Remove loading state
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 500);
            }
        });
    } else {
        console.warn('⚠️  Primary add section button not found in DOM');
    }
    
    // SECONDARY TEMPLATE BROWSER BUTTON
    const templatesBtn = document.getElementById('section-templates-btn');
    if (templatesBtn) {
        console.log('📋 Found section templates button, attaching event');
        templatesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📋 Section templates button clicked');
            
            this.classList.add('loading');
            
            try {
                if (typeof showAddSectionModal === 'function') {
                    console.log('📱 Opening template browser');
                    showAddSectionModal();
                } else if (window.showAddSectionModal) {
                    console.log('📱 Opening template browser (window)');
                    window.showAddSectionModal();
                } else {
                    console.error('❌ showAddSectionModal function not found');
                    showErrorMessage('Template system not available');
                }
            } catch (error) {
                console.error('💥 Error opening templates:', error);
                showErrorMessage('Error opening templates');
            } finally {
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 500);
            }
        });
    } else {
        console.log('ℹ️  Section templates button not found (optional)');
    }
    
    // QUICK SECTION BUTTONS
    const quickSectionBtns = document.querySelectorAll('.quick-section-btn');
    console.log(`⚡ Found ${quickSectionBtns.length} quick section buttons`);
    
    quickSectionBtns.forEach((btn, index) => {
        const sectionType = btn.getAttribute('data-section-type');
        const sectionLayout = btn.getAttribute('data-layout');
        
        console.log(`⚡ Setting up quick button ${index + 1}: ${sectionType} (${sectionLayout})`);
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🚀 Quick section button clicked: ${sectionType} with ${sectionLayout} layout`);
            
            // Add visual feedback
            this.classList.add('loading');
            
            try {
                // Add section with specified type and layout
                const sectionId = addSection(sectionType, sectionLayout);
                if (sectionId) {
                    console.log(`✅ Added ${sectionType} section with ID: ${sectionId}`);
                    showSuccessMessage(`${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} section added!`);
                    
                    // Scroll to new section with enhanced animation
                    setTimeout(() => {
                        const newSection = document.querySelector(`[data-section-id="${sectionId}"]`);
                        if (newSection) {
                            newSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Briefly highlight the new section
                            newSection.classList.add('selected');
                            setTimeout(() => {
                                newSection.classList.remove('selected');
                            }, 2000);
                        }
                    }, 100);
                } else {
                    console.error('❌ Failed to add section');
                    showErrorMessage('Failed to add section');
                }
            } catch (error) {
                console.error('💥 Error adding quick section:', error);
                showErrorMessage('Error adding section');
            } finally {
                // Remove loading state
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 500);
            }
        });
    });
    
    // FALLBACK: Original add section button (if it exists)
    const originalAddBtn = document.getElementById('add-section-btn');
    if (originalAddBtn && originalAddBtn !== primaryAddBtn) {
        console.log('Found original add section button, attaching event');
        originalAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Original add section button clicked');
            
            if (typeof showAddSectionModal === 'function') {
                showAddSectionModal();
            } else {
                const sectionId = addSection('content', 'full-width');
                console.log('Added fallback section:', sectionId);
            }
        });
    }
    
    console.log('✅ Add Section button setup completed successfully');
    
    // DEBUG: Verify all buttons are found
    const buttonSummary = {
        primary: !!document.getElementById('add-section-btn-primary'),
        templates: !!document.getElementById('section-templates-btn'),
        quick: document.querySelectorAll('.quick-section-btn').length,
        original: !!document.getElementById('add-section-btn')
    };
    console.log('🔍 Button availability summary:', buttonSummary);
}

function selectSection(section) {
    console.log('Selecting section:', section.getAttribute('data-section-id'));
    
    // Remove previous selection from all sections
    document.querySelectorAll('.media-kit-section').forEach(s => {
        s.classList.remove('selected');
    });
    
    // Also deselect any selected components
    deselectAllElements();
    
    // Select new section
    section.classList.add('selected');
    selectedSection = section;
    selectedElement = null; // Clear component selection
    
    // Update UI to show section options
    updateSectionDesignPanel(section);
    
    console.log('Section selected successfully');
}

function updateSectionControls(section) {
    const sectionType = section.getAttribute('data-section-type');
    const sectionLayout = section.getAttribute('data-section-layout');
    
    console.log('Selected section:', sectionType, 'Layout:', sectionLayout);
    // This will be expanded in Phase 3 to show section controls
}

// Add section with enhanced functionality
function addSection(type = 'content', layout = 'full-width', afterSectionId = null) {
    // Validate section type restrictions
    if (type === 'hero' && document.querySelector('[data-section-type="hero"]')) {
        showNotification('Only one hero section is allowed', 'error');
        return;
    }
    
    const sectionId = 'section-' + generateUUID();
    const sectionHTML = `
        <div class="media-kit-section" 
             data-section-id="${sectionId}" 
             data-section-type="${type}"
             data-section-layout="${layout}">
            <div class="section-content layout-${layout}">
                ${generateColumnsForLayout(layout)}
            </div>
        </div>
    `;
    
    const preview = document.getElementById('media-kit-preview');
    if (!preview) return;
    
    if (afterSectionId) {
        const afterSection = document.querySelector(`[data-section-id="${afterSectionId}"]`);
        if (afterSection) {
            // Find the drop zone after this section
            let nextElement = afterSection.nextElementSibling;
            while (nextElement && !nextElement.classList.contains('drop-zone')) {
                nextElement = nextElement.nextElementSibling;
            }
            
            if (nextElement) {
                nextElement.insertAdjacentHTML('afterend', sectionHTML);
            } else {
                afterSection.insertAdjacentHTML('afterend', sectionHTML);
            }
        }
    } else {
        // Add at the end, before the final drop zone
        const finalDropZone = preview.querySelector('.drop-zone[data-zone="final"]');
        if (finalDropZone) {
            finalDropZone.insertAdjacentHTML('beforebegin', sectionHTML);
        } else {
            preview.insertAdjacentHTML('beforeend', sectionHTML);
        }
    }
    
    // Add drop zone after new section
    const newSection = document.querySelector(`[data-section-id="${sectionId}"]`);
    const dropZoneHTML = '<div class="drop-zone empty" data-zone="between-' + Date.now() + '"></div>';
    newSection.insertAdjacentHTML('afterend', dropZoneHTML);
    
    // Add section controls
    addSectionControls();
    
    // Initialize drop zones in new section
    initializeDropZones(sectionId);
    
    // Setup event listeners
    setupSectionEventListeners();
    setupDragAndDrop();
    
    // Save state for undo
    saveCurrentState();
    markDirty();
    
    return sectionId;
}

// Move section up or down
function moveSection(sectionId, direction) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    const sections = Array.from(document.querySelectorAll('.media-kit-section'));
    const currentIndex = sections.indexOf(section);
    
    if (direction === 'up' && currentIndex > 0) {
        const targetSection = sections[currentIndex - 1];
        targetSection.parentNode.insertBefore(section, targetSection);
        
        // Move the drop zone too
        const dropZone = section.nextElementSibling;
        if (dropZone && dropZone.classList.contains('drop-zone')) {
            section.parentNode.insertBefore(dropZone, section.nextSibling);
        }
        
        saveCurrentState();
        markDirty();
    } else if (direction === 'down' && currentIndex < sections.length - 1) {
        const targetSection = sections[currentIndex + 1];
        const targetDropZone = targetSection.nextElementSibling;
        
        if (targetDropZone && targetDropZone.classList.contains('drop-zone')) {
            targetDropZone.parentNode.insertBefore(section, targetDropZone.nextSibling);
        } else {
            targetSection.parentNode.insertBefore(section, targetSection.nextSibling);
        }
        
        // Move the drop zone too
        const dropZone = targetSection.nextElementSibling;
        if (dropZone && dropZone.classList.contains('drop-zone')) {
            section.parentNode.insertBefore(dropZone, section.nextSibling);
        }
        
        saveCurrentState();
        markDirty();
    }
}

// Helper functions for section movement
function moveSectionUp(sectionId) {
    moveSection(sectionId, 'up');
}

function moveSectionDown(sectionId) {
    moveSection(sectionId, 'down');
}

// Delete section with enhanced validation
function deleteSection(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    // Don't delete if it's the only section
    const sections = document.querySelectorAll('.media-kit-section');
    if (sections.length <= 1) {
        showNotification('Cannot delete the last section', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Delete this section and all its components?')) return;
    
    // Save state before deletion
    saveCurrentState();
    
    // Remove component data
    const components = section.querySelectorAll('[data-component-id]');
    components.forEach(comp => {
        const compId = comp.getAttribute('data-component-id');
        delete window.componentData[compId];
    });
    
    // Remove the drop zone after this section
    const nextElement = section.nextElementSibling;
    if (nextElement && nextElement.classList.contains('drop-zone')) {
        nextElement.remove();
    }
    
    // Remove section
    section.remove();
    selectedSection = null;
    
    markDirty();
}

// Duplicate section
function duplicateSection(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    const sectionData = collectSectionData(sectionId);
    const newSectionId = 'section-' + generateUUID();
    
    // Clone section with new ID
    const clonedSection = section.cloneNode(true);
    clonedSection.setAttribute('data-section-id', newSectionId);
    
    // Update all component IDs within the section
    const components = clonedSection.querySelectorAll('[data-component-id]');
    components.forEach(comp => {
        const oldId = comp.getAttribute('data-component-id');
        const newId = 'component-' + generateUUID();
        comp.setAttribute('data-component-id', newId);
        
        // Update component data
        if (window.componentData && window.componentData[oldId]) {
            window.componentData[newId] = JSON.parse(JSON.stringify(window.componentData[oldId]));
        }
    });
    
    // Find the drop zone after the original section
    let insertPosition = section.nextElementSibling;
    if (insertPosition && insertPosition.classList.contains('drop-zone')) {
        insertPosition = insertPosition.nextElementSibling;
    }
    
    // Insert cloned section
    if (insertPosition) {
        section.parentNode.insertBefore(clonedSection, insertPosition);
    } else {
        section.parentNode.appendChild(clonedSection);
    }
    
    // Add drop zone after cloned section
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone empty';
    dropZone.setAttribute('data-zone', 'between-' + Date.now());
    clonedSection.parentNode.insertBefore(dropZone, clonedSection.nextSibling);
    
    // Re-initialize controls and event listeners
    addSectionControls();
    setupSectionEventListeners();
    setupElementSelection();
    setupContentEditableUpdates();
    setupDragAndDrop();
    
    saveCurrentState();
    markDirty();
}

// Collect section data for duplication
function collectSectionData(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return null;
    
    return {
        type: section.getAttribute('data-section-type'),
        layout: section.getAttribute('data-section-layout'),
        settings: {}
    };
}

// Change section layout
function changeSectionLayout(sectionId, newLayout) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    const content = section.querySelector('.section-content');
    if (!content) return;
    
    const oldLayout = section.getAttribute('data-section-layout');
    
    // Collect all components from all columns
    const allComponents = [];
    content.querySelectorAll('[data-component-id]').forEach(comp => {
        allComponents.push(comp.cloneNode(true));
    });
    
    // Update layout
    section.setAttribute('data-section-layout', newLayout);
    content.className = `section-content layout-${newLayout}`;
    
    // Regenerate columns
    content.innerHTML = generateColumnsForLayout(newLayout);
    
    // Redistribute components
    redistributeComponents(section, allComponents);
    
    // Re-initialize drop zones and event listeners
    initializeDropZones(sectionId);
    setupDragAndDrop();
    setupElementSelection();
    setupContentEditableUpdates();
    
    saveCurrentState();
    markDirty();
}

// Generate columns for layout
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
        default: // full-width
            return `
                <div class="section-column" data-column="full">
                    <div class="drop-zone empty" data-zone="${generateUUID()}"></div>
                </div>
            `;
    }
}

// Redistribute components when changing layout
function redistributeComponents(section, components) {
    const columns = section.querySelectorAll('.section-column');
    const numColumns = columns.length;
    
    if (numColumns === 0 || components.length === 0) return;
    
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
}

// Initialize drop zones in a section
function initializeDropZones(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    const dropZones = section.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        // Re-attach drop zone event listeners
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedComponent) {
                // Check if premium component
                const componentElement = document.querySelector(`[data-component="${draggedComponent}"]`);
                if (componentElement && componentElement.classList.contains('premium')) {
                    showUpgradePrompt();
                    return;
                }
                
                addComponentToZone(draggedComponent, this);
                markDirty();
                saveCurrentState();
            }
        });

        zone.addEventListener('click', function() {
            if (this.classList.contains('empty')) {
                // Show component selection
                console.log('Show component library');
            }
        });
    });
}

// Show section settings
function showSectionSettings(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    
    // Switch to design tab and show section settings
    const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
    if (designTab) designTab.click();
    
    // Update the design panel to show section settings
    updateSectionDesignPanel(section);
}

// Update design panel for section settings
function updateSectionDesignPanel(section) {
    const editor = document.getElementById('element-editor');
    if (!editor) return;
    
    const sectionType = section.getAttribute('data-section-type');
    const sectionLayout = section.getAttribute('data-section-layout');
    
    editor.innerHTML = `
        <div class="editor-title">
            <span style="font-size: 16px;">📑</span>
            Section Settings
        </div>
        <div class="editor-subtitle">Configure section layout and appearance</div>
        
        <div class="form-group">
            <label class="form-label">Section Type</label>
            <input type="text" class="form-input" value="${sectionType}" disabled>
        </div>
        
        <div class="form-group">
            <label class="form-label">Layout</label>
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
            <label class="form-label">Background Color</label>
            <div class="color-picker">
                <input type="color" class="color-input" value="#ffffff" id="section-bg-color">
                <input type="text" class="form-input" value="#ffffff" id="section-bg-text" style="flex: 1;">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Padding</label>
            <select class="form-input" id="section-padding">
                <option value="compact">Compact</option>
                <option value="standard" selected>Standard</option>
                <option value="spacious">Spacious</option>
            </select>
        </div>
    `;
    
    // Setup layout option clicks
    const layoutOptions = editor.querySelectorAll('.layout-option');
    layoutOptions.forEach(option => {
        option.addEventListener('click', function() {
            const newLayout = this.getAttribute('data-layout');
            changeSectionLayout(section.getAttribute('data-section-id'), newLayout);
            
            // Update active state
            layoutOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Generate UUID
function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now, can be replaced with a better notification system
    alert(message);
}

// Show add section modal
function showAddSectionModal() {
    // Check if section templates are loaded
    if (window.showAddSectionModal && window.showAddSectionModal !== showAddSectionModal) {
        window.showAddSectionModal();
    } else {
        // Fallback - add a default content section
        addSection('content', 'full-width');
    }
}

// Make addSection available globally for section templates
window.addSection = addSection;

// Update getComponentTemplate to be globally available
window.getComponentTemplate = getComponentTemplate;

// Update setupElementEventListeners to be globally available
window.setupElementEventListeners = setupElementEventListeners;

// UTILITY FUNCTIONS for user feedback

function showSuccessMessage(message) {
    console.log('SUCCESS:', message);
    
    // Create temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 13px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showErrorMessage(message) {
    console.error('ERROR:', message);
    
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 13px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 4 seconds (longer for errors)
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// ENHANCED: Script loading verification
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - verifying section template system...');
    
    // Check if section-templates.js is loaded
    if (typeof showAddSectionModal === 'function') {
        console.log('✅ Section templates loaded successfully');
    } else {
        console.warn('⚠️  Section templates not loaded - check if section-templates.js is included');
        
        // Try to load it dynamically if not present
        const script = document.createElement('script');
        script.src = config.pluginUrl + 'assets/js/section-templates.js';
        script.onload = function() {
            console.log('✅ Section templates loaded dynamically');
        };
        script.onerror = function() {
            console.error('❌ Failed to load section templates');
        };
        document.head.appendChild(script);
    }
});

// DEBUGGING COMMANDS - Call these in browser console to test
window.debugSectionButtons = debugSectionButtons;
window.addSectionControls = addSectionControls;
window.setupAddSectionButton = setupAddSectionButton;

// DEBUGGING UTILITY
function debugSectionButtons() {
    console.log('=== SECTION BUTTONS DEBUG ===');
    
    const buttons = {
        primary: document.getElementById('add-section-btn-primary'),
        templates: document.getElementById('section-templates-btn'),
        original: document.getElementById('add-section-btn'),
        quick: document.querySelectorAll('.quick-section-btn')
    };
    
    console.log('Button availability:', {
        primary: !!buttons.primary,
        templates: !!buttons.templates,
        original: !!buttons.original,
        quickCount: buttons.quick.length
    });
    
    console.log('Function availability:', {
        showAddSectionModal: typeof showAddSectionModal,
        addSection: typeof addSection
    });
    
    if (buttons.primary) {
        console.log('Primary button style:', getComputedStyle(buttons.primary).display);
    }
}

// Enhanced initialization to ensure proper timing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing sections');
    
    // Wait a bit more to ensure everything is ready
    setTimeout(() => {
        setupSectionManagement();
    }, 200);
    
    // Also ensure buttons are set up after DOM is ready
    setTimeout(() => {
        setupAddSectionButton();
    }, 300);
});

console.log('Media Kit Builder v2.0 initialized successfully');
