/**
 * Section Template Manager
 * Handles template gallery, selection, and insertion
 */

class SectionTemplateManager {
    constructor(config = {}, premiumManager = null) {
        // Default configuration
        this.config = {
            modalId: 'add-section-modal',
            galleryId: 'section-template-gallery',
            wpData: {},
            ...config
        };
        
        // Reference to premium access manager
        this.premiumManager = premiumManager;
        
        // Templates data
        this.templates = {};
        
        // State
        this.activeCategory = 'all';
        
        // DOM elements (will be populated in init)
        this.modal = null;
        this.gallery = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize template manager
     */
    init() {
        console.log('🏗️ Initializing Section Template Manager...');
        
        // Fetch templates data
        this.fetchTemplates();
        
        // Create modal if needed
        this.createModal();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Section Template Manager initialized');
    }
    
    /**
     * Fetch templates from server or fallback to defaults
     */
    fetchTemplates() {
        // Check if we have a REST API URL
        if (this.config.wpData && this.config.wpData.restUrl) {
            const url = this.config.wpData.restUrl + 'templates';
            
            fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.config.wpData.restNonce || ''
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network error: ${response.status}`);
                }
                return response.json();
            })
            .then(templates => {
                console.log('📚 Templates loaded from API:', Object.keys(templates).length);
                this.templates = templates;
                this.renderTemplates();
            })
            .catch(error => {
                console.error('Failed to load templates from API:', error);
                // Fall back to default templates
                this.templates = this.getDefaultTemplates();
                this.renderTemplates();
            });
        } else {
            // No REST API available, use defaults
            console.log('📚 Using default templates (no API URL)');
            this.templates = this.getDefaultTemplates();
            this.renderTemplates();
        }
    }
    
    /**
     * Get default templates
     * @returns {Object} - Default templates
     */
    getDefaultTemplates() {
        return {
            'hero-basic': {
                name: 'Basic Hero',
                type: 'hero',
                layout: 'full-width',
                description: 'Clean, centered hero with name and title',
                premium: false,
                category: 'hero',
                components: [
                    { type: 'hero', content: { title: 'Welcome', subtitle: 'Your media kit' } }
                ]
            },
            'content-bio': {
                name: 'Biography',
                type: 'content',
                layout: 'full-width',
                description: 'Bio section with text and image',
                premium: false,
                category: 'content',
                components: [
                    { type: 'biography', content: { text: 'Your biography here' } }
                ]
            },
            'two-column-bio': {
                name: 'Bio with Image',
                type: 'content',
                layout: 'two-column',
                description: 'Two-column layout with bio and image',
                premium: false,
                category: 'content',
                components: {
                    left: [{ type: 'biography', content: { text: 'Your biography here' } }],
                    right: [{ type: 'image', content: { url: '' } }]
                }
            },
            'three-column-topics': {
                name: 'Topics Grid',
                type: 'features',
                layout: 'three-column',
                description: 'Showcase your topics in a three-column grid',
                premium: false,
                category: 'features',
                components: {
                    left: [{ type: 'topics', content: { topics: ['Topic 1', 'Topic 4'] } }],
                    center: [{ type: 'topics', content: { topics: ['Topic 2', 'Topic 5'] } }],
                    right: [{ type: 'topics', content: { topics: ['Topic 3', 'Topic 6'] } }]
                }
            },
            'gallery-premium': {
                name: 'Image Gallery',
                type: 'media',
                layout: 'three-column',
                description: 'Premium gallery for your media',
                premium: true,
                category: 'media',
                components: {
                    left: [{ type: 'image', content: { url: '' } }],
                    center: [{ type: 'image', content: { url: '' } }],
                    right: [{ type: 'image', content: { url: '' } }]
                }
            },
            'contact-section': {
                name: 'Contact Info',
                type: 'contact',
                layout: 'full-width',
                description: 'Contact information with social links',
                premium: false,
                category: 'contact',
                components: [
                    { type: 'social', content: { platforms: [
                        { platform: 'Email', link: 'your@email.com' },
                        { platform: 'Twitter', link: 'https://twitter.com/yourusername' },
                        { platform: 'LinkedIn', link: 'https://linkedin.com/in/yourusername' }
                    ] } }
                ]
            }
        };
    }
    
    /**
     * Create modal if it doesn't exist
     */
    createModal() {
        // Check if modal already exists
        if (document.getElementById(this.config.modalId)) {
            this.modal = document.getElementById(this.config.modalId);
            this.gallery = document.getElementById(this.config.galleryId);
            return;
        }
        
        // Create modal element
        const modal = document.createElement('div');
        modal.id = this.config.modalId;
        modal.className = 'section-template-modal';
        modal.innerHTML = `
            <div class="template-modal-content">
                <div class="template-modal-header">
                    <h3>Add Section</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="template-categories">
                    <button class="category-button active" data-category="all">All</button>
                    <button class="category-button" data-category="hero">Hero</button>
                    <button class="category-button" data-category="content">Content</button>
                    <button class="category-button" data-category="features">Features</button>
                    <button class="category-button" data-category="media">Media</button>
                    <button class="category-button" data-category="contact">Contact</button>
                </div>
                <div class="template-search">
                    <input type="text" placeholder="Search templates..." id="template-search">
                </div>
                <div id="${this.config.galleryId}" class="template-gallery"></div>
            </div>
        `;
        
        // Add to document body
        document.body.appendChild(modal);
        
        // Store references to DOM elements
        this.modal = modal;
        this.gallery = document.getElementById(this.config.galleryId);
        
        // Add modal styles if not present
        this.addModalStyles();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.modal.querySelector('.close-modal').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Category filter buttons
        this.modal.querySelectorAll('.category-button').forEach(button => {
            button.addEventListener('click', () => {
                // Update active category
                this.modal.querySelectorAll('.category-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Filter templates
                this.activeCategory = button.getAttribute('data-category');
                this.renderTemplates();
            });
        });
        
        // Search functionality
        const searchInput = this.modal.querySelector('#template-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.renderTemplates(searchTerm);
            });
        }
        
        // Template selection
        this.gallery.addEventListener('click', (e) => {
            const card = e.target.closest('.template-card');
            if (card) {
                const templateId = card.getAttribute('data-template-id');
                this.handleTemplateSelection(templateId);
            }
        });
    }
    
    /**
     * Add modal styles
     */
    addModalStyles() {
        if (!document.getElementById('section-template-styles')) {
            const style = document.createElement('style');
            style.id = 'section-template-styles';
            style.textContent = `
                .section-template-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    padding: 40px;
                    overflow: auto;
                    backdrop-filter: blur(4px);
                }
                
                .template-modal-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 900px;
                    margin: 0 auto;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    max-height: calc(100vh - 80px);
                    display: flex;
                    flex-direction: column;
                }
                
                .template-modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .template-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                }
                
                .close-modal {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .close-modal:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
                
                .template-categories {
                    display: flex;
                    padding: 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    overflow-x: auto;
                    gap: 8px;
                }
                
                .category-button {
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 6px 12px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                
                .category-button:hover {
                    background: #edf2f7;
                }
                
                .category-button.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                .template-search {
                    padding: 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .template-search input {
                    width: 100%;
                    padding: 10px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                }
                
                .template-gallery {
                    padding: 24px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 24px;
                    overflow-y: auto;
                    max-height: 60vh;
                }
                
                .template-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .template-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                    border-color: #cbd5e0;
                }
                
                .template-preview {
                    height: 160px;
                    background: #f7fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .template-info {
                    padding: 16px;
                }
                
                .template-name {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 4px;
                    color: #2d3748;
                }
                
                .template-description {
                    font-size: 14px;
                    color: #718096;
                    margin-bottom: 8px;
                }
                
                .template-layout-badge {
                    display: inline-block;
                    background: #e2e8f0;
                    color: #4a5568;
                    font-size: 12px;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                
                .template-card.premium .template-name::after {
                    content: 'PRO';
                    background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                
                .template-card.premium.locked {
                    position: relative;
                }
                
                .template-card.premium.locked::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1;
                }
                
                .template-card.premium.locked::after {
                    content: '🔒';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 32px;
                    z-index: 2;
                }
                
                @media (max-width: 768px) {
                    .section-template-modal {
                        padding: 20px;
                    }
                    
                    .template-gallery {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 16px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Render templates in gallery
     * @param {string} searchTerm - Optional search term
     */
    renderTemplates(searchTerm = '') {
        if (!this.gallery) return;
        
        // Clear gallery
        this.gallery.innerHTML = '';
        
        // Filter and render templates
        Object.entries(this.templates).forEach(([key, template]) => {
            // Filter by category
            if (this.activeCategory !== 'all' && template.category !== this.activeCategory && template.type !== this.activeCategory) {
                return;
            }
            
            // Filter by search term
            if (searchTerm && !template.name.toLowerCase().includes(searchTerm) && 
                !template.description.toLowerCase().includes(searchTerm)) {
                return;
            }
            
            // Check premium access
            const isPremiumLocked = template.premium && this.premiumManager && !this.premiumManager.hasAccess('premiumTemplates');
            
            // Create template card
            const templateCard = document.createElement('div');
            templateCard.className = `template-card ${template.premium ? 'premium' : ''} ${isPremiumLocked ? 'locked' : ''}`;
            templateCard.setAttribute('data-template-id', key);
            templateCard.setAttribute('data-type', template.type);
            
            // Set card content
            templateCard.innerHTML = `
                <div class="template-preview">
                    ${this.getTemplatePreviewIcon(template.type)}
                </div>
                <div class="template-info">
                    <div class="template-name">${template.name}</div>
                    <div class="template-description">${template.description}</div>
                    <span class="template-layout-badge">${template.layout}</span>
                </div>
            `;
            
            this.gallery.appendChild(templateCard);
        });
    }
    
    /**
     * Get template preview icon
     * @param {string} type - Template type
     * @returns {string} - SVG icon HTML
     */
    getTemplatePreviewIcon(type) {
        const icons = {
            'hero': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 8h10M7 12h10M7 16h10"></path></svg>',
            'content': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M8 6h8M8 10h8M8 14h4"></path></svg>',
            'features': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h.01M11 16h.01M15 16h.01"></path></svg>',
            'media': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>',
            'contact': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 9l5 3 5-3"></path><path d="M4 5h16v14H4z"></path></svg>'
        };
        
        return icons[type] || icons['content'];
    }
    
    /**
     * Handle template selection
     * @param {string} templateId - Selected template ID
     */
    handleTemplateSelection(templateId) {
        const template = this.templates[templateId];
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }
        
        // Check premium access if needed
        if (template.premium && this.premiumManager && !this.premiumManager.hasAccess('premiumTemplates')) {
            if (typeof this.premiumManager.showUpgradePrompt === 'function') {
                this.premiumManager.showUpgradePrompt(`The "${template.name}" template`, template.name);
            } else if (typeof window.showUpgradePrompt === 'function') {
                window.showUpgradePrompt(`The "${template.name}" template`, template.name);
            } else {
                alert(`The "${template.name}" template is a premium feature. Please upgrade to access it.`);
            }
            return;
        }
        
        // Insert template
        this.insertTemplate(templateId);
        
        // Hide modal
        this.hideModal();
    }
    
    /**
     * Insert template
     * @param {string} templateId - Template ID to insert
     */
    insertTemplate(templateId) {
        console.log('Inserting template:', templateId);
        
        const template = this.templates[templateId];
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }
        
        // Emit custom event for template selection
        const event = new CustomEvent('template-selected', {
            detail: {
                templateId: templateId,
                template: template
            }
        });
        
        document.dispatchEvent(event);
        
        console.log('Template selection event dispatched');
    }
    
    /**
     * Show modal
     */
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }
    
    /**
     * Hide modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

// Export for global access
window.SectionTemplateManager = SectionTemplateManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Make showAddSectionModal globally available for compatibility
    window.showAddSectionModal = function() {
        if (window.templateManager) {
            window.templateManager.showModal();
        }
    };
    
    // Make hideAddSectionModal globally available for compatibility
    window.hideAddSectionModal = function() {
        if (window.templateManager) {
            window.templateManager.hideModal();
        }
    };
    
    console.log('🏗️ Section Template Manager module loaded');
});
