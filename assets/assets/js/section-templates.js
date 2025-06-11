/**
 * Section Templates System
 * Complete template modal and insertion workflow for Media Kit Builder
 * Integrates with premium-access-control.js for feature gating
 */

// Global namespace for section templates
window.sectionTemplates = {};
window.templateSystem = {
    version: '2.0',
    initialized: false,
    currentFilter: 'all',
    modalVisible: false
};

/**
 * Section Template Definitions
 * Each template defines structure, components, and premium status
 */
const sectionTemplates = {
    // =================== FREE TEMPLATES ===================
    'hero-minimal': {
        name: 'Minimal Hero',
        type: 'hero',
        layout: 'full-width',
        category: 'hero',
        description: 'Clean, centered hero with name and title',
        premium: false,
        preview: 'hero-minimal',
        components: [
            {
                type: 'hero',
                content: {
                    name: 'Your Name',
                    title: 'Your Professional Title',
                    bio: 'A brief introduction highlighting your expertise and what makes you unique as a speaker or expert in your field.',
                    avatar: null
                }
            }
        ]
    },

    'hero-with-cta': {
        name: 'Hero with Call-to-Action',
        type: 'hero',
        layout: 'full-width',
        category: 'hero',
        description: 'Hero section with prominent call-to-action button',
        premium: false,
        preview: 'hero-cta',
        components: [
            {
                type: 'hero',
                content: {
                    name: 'Your Name',
                    title: 'Your Professional Title',
                    bio: 'Ready to book your next speaking engagement or consultation?'
                }
            },
            {
                type: 'cta',
                content: {
                    title: 'Ready to Connect?',
                    description: 'Let\'s discuss how we can work together',
                    buttonText: 'Book a Meeting',
                    buttonUrl: '#contact'
                }
            }
        ]
    },

    'bio-standard': {
        name: 'Standard Biography',
        type: 'content',
        layout: 'full-width',
        category: 'biography',
        description: 'Full-width text biography section',
        premium: false,
        preview: 'bio-standard',
        components: [
            {
                type: 'bio',
                content: {
                    title: 'About Me',
                    content: 'Write your detailed professional biography here. Include your background, expertise, achievements, and what makes you unique in your field. This is your opportunity to tell your story and establish credibility with your audience.'
                }
            }
        ]
    },

    'bio-with-image': {
        name: 'Biography with Image',
        type: 'content',
        layout: 'two-column',
        category: 'biography',
        description: 'Two-column layout with bio text and professional photo',
        premium: false,
        preview: 'bio-image',
        components: {
            left: [
                {
                    type: 'bio',
                    content: {
                        title: 'About Me',
                        content: 'Your professional biography goes here. Share your story, background, and what makes you an expert in your field.'
                    }
                }
            ],
            right: [
                {
                    type: 'image',
                    content: {
                        src: null,
                        alt: 'Professional headshot',
                        caption: 'Professional photo'
                    }
                }
            ]
        }
    },

    'topics-grid': {
        name: 'Speaking Topics',
        type: 'content',
        layout: 'full-width',
        category: 'topics',
        description: 'Grid layout for speaking topics and expertise areas',
        premium: false,
        preview: 'topics-grid',
        components: [
            {
                type: 'topics',
                content: {
                    title: 'Speaking Topics',
                    topics: [
                        'Topic Area 1',
                        'Topic Area 2', 
                        'Topic Area 3',
                        'Topic Area 4'
                    ]
                }
            }
        ]
    },

    'social-links': {
        name: 'Social Media Links',
        type: 'contact',
        layout: 'full-width',
        category: 'social',
        description: 'Horizontal row of social media icons',
        premium: false,
        preview: 'social-links',
        components: [
            {
                type: 'social',
                content: {
                    platforms: {
                        twitter: '',
                        linkedin: '',
                        instagram: '',
                        facebook: '',
                        youtube: '',
                        website: ''
                    }
                }
            }
        ]
    },

    'stats-basic': {
        name: 'Key Statistics',
        type: 'features',
        layout: 'full-width',
        category: 'stats',
        description: 'Display important numbers and achievements',
        premium: false,
        preview: 'stats-basic',
        components: [
            {
                type: 'stats',
                content: {
                    title: 'By the Numbers',
                    stats: [
                        { number: '150+', label: 'Speaking Events' },
                        { number: '50K+', label: 'Audience Members' },
                        { number: '25+', label: 'Countries' },
                        { number: '10+', label: 'Years Experience' }
                    ]
                }
            }
        ]
    },

    'contact-info': {
        name: 'Contact Information',
        type: 'contact',
        layout: 'full-width',
        category: 'contact',
        description: 'Professional contact details and booking info',
        premium: false,
        preview: 'contact-info',
        components: [
            {
                type: 'contact',
                content: {
                    title: 'Get in Touch',
                    email: 'your.email@example.com',
                    phone: '+1 (555) 123-4567',
                    website: 'www.yourwebsite.com',
                    location: 'Your City, State'
                }
            }
        ]
    },

    // =================== PREMIUM TEMPLATES ===================
    'hero-video': {
        name: 'Video Introduction Hero',
        type: 'hero',
        layout: 'full-width',
        category: 'hero',
        description: 'Hero section with embedded video introduction',
        premium: true,
        preview: 'hero-video',
        components: [
            {
                type: 'hero',
                content: {
                    name: 'Your Name',
                    title: 'Your Professional Title',
                    bio: 'Watch my introduction video to learn more about my expertise.'
                }
            },
            {
                type: 'video',
                content: {
                    videoUrl: '',
                    thumbnail: null,
                    title: 'Introduction Video'
                }
            }
        ]
    },

    'media-gallery': {
        name: 'Photo Gallery',
        type: 'media',
        layout: 'full-width',
        category: 'media',
        description: 'Professional photo gallery with lightbox',
        premium: true,
        preview: 'media-gallery',
        components: [
            {
                type: 'gallery',
                content: {
                    title: 'Photo Gallery',
                    images: [],
                    columns: 3,
                    showCaptions: true
                }
            }
        ]
    },

    'testimonials-carousel': {
        name: 'Testimonial Carousel',
        type: 'content',
        layout: 'full-width',
        category: 'testimonials',
        description: 'Rotating testimonials with photos',
        premium: true,
        preview: 'testimonials-carousel',
        components: [
            {
                type: 'testimonials',
                content: {
                    title: 'What People Say',
                    testimonials: [
                        {
                            quote: 'An incredible speaker with deep insights. Highly recommended!',
                            author: 'Jane Smith',
                            role: 'Event Organizer',
                            company: 'TechConf 2024',
                            photo: null
                        },
                        {
                            quote: 'Engaging, informative, and inspiring. Our audience loved it!',
                            author: 'Mike Johnson',
                            role: 'Program Director',
                            company: 'Innovation Summit',
                            photo: null
                        }
                    ],
                    autoRotate: true,
                    showPhotos: true
                }
            }
        ]
    },

    'speaker-toolkit': {
        name: 'Complete Speaker Toolkit',
        type: 'content',
        layout: 'two-column',
        category: 'professional',
        description: 'Comprehensive speaker resources and materials',
        premium: true,
        preview: 'speaker-toolkit',
        components: {
            left: [
                {
                    type: 'bio',
                    content: {
                        title: 'Speaker Bio',
                        content: 'Professional biography for event organizers.'
                    }
                },
                {
                    type: 'topics',
                    content: {
                        title: 'Speaking Topics',
                        topics: ['Topic 1', 'Topic 2', 'Topic 3']
                    }
                }
            ],
            right: [
                {
                    type: 'resources',
                    content: {
                        title: 'Speaker Resources',
                        items: [
                            { name: 'High-res Photos', type: 'download' },
                            { name: 'Speaker One-Sheet', type: 'download' },
                            { name: 'AV Requirements', type: 'download' },
                            { name: 'Introduction Script', type: 'download' }
                        ]
                    }
                }
            ]
        }
    },

    'podcast-guest': {
        name: 'Podcast Guest Kit',
        type: 'content',
        layout: 'three-column',
        category: 'media',
        description: 'Complete podcast guest information and resources',
        premium: true,
        preview: 'podcast-guest',
        components: {
            left: [
                {
                    type: 'bio',
                    content: {
                        title: 'Podcast Bio',
                        content: 'Bio optimized for podcast introductions and show notes.'
                    }
                }
            ],
            center: [
                {
                    type: 'questions',
                    content: {
                        title: 'Interview Questions',
                        questions: [
                            'What got you started in your field?',
                            'What\'s the biggest myth in your industry?',
                            'What advice would you give to beginners?'
                        ]
                    }
                }
            ],
            right: [
                {
                    type: 'podcast-resources',
                    content: {
                        title: 'Podcast Resources',
                        items: [
                            { name: 'Audio Sample', type: 'audio' },
                            { name: 'Show Graphics', type: 'download' },
                            { name: 'Social Clips', type: 'download' }
                        ]
                    }
                }
            ]
        }
    },

    'brand-partnership': {
        name: 'Brand Partnership Kit',
        type: 'content',
        layout: 'main-sidebar',
        category: 'professional',
        description: 'Professional brand collaboration materials',
        premium: true,
        preview: 'brand-partnership',
        components: {
            main: [
                {
                    type: 'bio',
                    content: {
                        title: 'Brand Collaborator',
                        content: 'Professional biography focused on brand partnerships and collaborations.'
                    }
                },
                {
                    type: 'stats',
                    content: {
                        title: 'Audience Metrics',
                        stats: [
                            { number: '100K+', label: 'Social Followers' },
                            { number: '50K+', label: 'Monthly Reach' },
                            { number: '5%', label: 'Engagement Rate' },
                            { number: '25-45', label: 'Audience Age' }
                        ]
                    }
                }
            ],
            sidebar: [
                {
                    type: 'rates',
                    content: {
                        title: 'Partnership Rates',
                        items: [
                            { service: 'Social Media Post', rate: '$500' },
                            { service: 'Video Content', rate: '$1,200' },
                            { service: 'Speaking Event', rate: '$2,500' },
                            { service: 'Consultation', rate: '$150/hr' }
                        ]
                    }
                }
            ]
        }
    }
};

/**
 * Initialize section templates system
 */
function initializeSectionTemplates() {
    console.log('🎨 Initializing Section Templates System...');
    
    // Store templates globally
    window.sectionTemplates = sectionTemplates;
    
    // Create template modal if it doesn't exist
    ensureTemplateModalExists();
    
    // Setup event listeners
    setupTemplateEventListeners();
    
    window.templateSystem.initialized = true;
    console.log(`✅ Section Templates initialized with ${Object.keys(sectionTemplates).length} templates`);
}

/**
 * Show the Add Section Modal
 */
function showAddSectionModal() {
    console.log('🎯 Opening section templates modal...');
    
    // Ensure premium access system is available
    if (!window.premiumAccess?.initialized) {
        console.warn('⚠️ Premium access system not initialized');
    }
    
    const modal = document.getElementById('add-section-modal');
    if (!modal) {
        console.log('Creating section modal...');
        createAddSectionModal();
    }
    
    const modalElement = document.getElementById('add-section-modal');
    if (modalElement) {
        modalElement.style.display = 'flex';
        window.templateSystem.modalVisible = true;
        
        // Render templates
        renderSectionTemplates();
        
        // Setup initial filter
        setTemplateFilter('all');
        
        console.log('✅ Section templates modal opened');
    } else {
        console.error('❌ Failed to create or find section modal');
    }
}

/**
 * Hide the Add Section Modal
 */
function hideAddSectionModal() {
    console.log('🚪 Closing section templates modal...');
    
    const modal = document.getElementById('add-section-modal');
    if (modal) {
        modal.style.display = 'none';
        window.templateSystem.modalVisible = false;
        console.log('✅ Section templates modal closed');
    }
}

/**
 * Create the Add Section Modal HTML
 */
function createAddSectionModal() {
    console.log('🏗️ Creating add section modal...');
    
    const modalHtml = `
        <div class="section-templates-overlay" id="add-section-modal">
            <div class="section-templates-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M9 9h6v6H9z"></path>
                        </svg>
                        Choose a Section Template
                    </div>
                    <div class="modal-controls">
                        <div class="template-filter">
                            <select id="template-category-filter">
                                <option value="all">All Categories</option>
                                <option value="hero">Hero Sections</option>
                                <option value="biography">Biography</option>
                                <option value="topics">Topics & Skills</option>
                                <option value="social">Social Links</option>
                                <option value="stats">Statistics</option>
                                <option value="media">Media & Gallery</option>
                                <option value="contact">Contact Info</option>
                                <option value="testimonials">Testimonials</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>
                        <div class="template-search">
                            <input type="text" id="template-search-input" placeholder="Search templates...">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </div>
                        <button class="close-modal" id="close-section-modal">&times;</button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div class="modal-sidebar">
                        <div class="sidebar-title">Categories</div>
                        <ul class="category-list">
                            <li class="category-item active" data-category="all">All Templates</li>
                            <li class="category-item" data-category="hero">Hero Sections</li>
                            <li class="category-item" data-category="biography">Biography</li>
                            <li class="category-item" data-category="topics">Topics & Skills</li>
                            <li class="category-item" data-category="social">Social Links</li>
                            <li class="category-item" data-category="stats">Statistics</li>
                            <li class="category-item" data-category="media">Media & Gallery</li>
                            <li class="category-item" data-category="contact">Contact Info</li>
                            <li class="category-item" data-category="testimonials">Testimonials</li>
                            <li class="category-item" data-category="professional">Professional Kits</li>
                        </ul>
                    </div>
                    
                    <div class="modal-main">
                        <div class="templates-section">
                            <div class="section-header">
                                <h3>Free Templates</h3>
                                <p>Essential templates included with your account</p>
                            </div>
                            <div class="templates-grid" id="free-templates-grid">
                                <!-- Free templates will be populated here -->
                            </div>
                        </div>
                        
                        <div class="templates-section" id="premium-templates-section">
                            <div class="section-header">
                                <h3>Premium Templates</h3>
                                <p>Advanced templates for Pro and Agency users</p>
                            </div>
                            <div class="templates-grid" id="premium-templates-grid">
                                <!-- Premium templates will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add modal styles
    addTemplateModalStyles();
    
    console.log('✅ Add section modal created');
}

/**
 * Render section templates in the modal
 */
function renderSectionTemplates() {
    console.log('🎨 Rendering section templates...');
    
    const freeGrid = document.getElementById('free-templates-grid');
    const premiumGrid = document.getElementById('premium-templates-grid');
    
    if (!freeGrid || !premiumGrid) {
        console.error('❌ Template grids not found');
        return;
    }
    
    // Clear existing content
    freeGrid.innerHTML = '';
    premiumGrid.innerHTML = '';
    
    // Get current filter
    const currentFilter = window.templateSystem.currentFilter || 'all';
    
    // Sort templates into free and premium
    Object.entries(sectionTemplates).forEach(([key, template]) => {
        // Apply category filter
        if (currentFilter !== 'all' && template.category !== currentFilter) {
            return;
        }
        
        const templateCard = createTemplateCard(key, template);
        
        if (template.premium) {
            premiumGrid.appendChild(templateCard);
        } else {
            freeGrid.appendChild(templateCard);
        }
    });
    
    // Update premium section visibility
    updatePremiumSectionVisibility();
    
    console.log('✅ Templates rendered successfully');
}

/**
 * Create a template card element
 */
function createTemplateCard(templateId, template) {
    const card = document.createElement('div');
    card.className = `template-card ${template.premium ? 'premium' : ''}`;
    card.setAttribute('data-template-id', templateId);
    card.setAttribute('data-category', template.category);
    
    card.innerHTML = `
        <div class="template-preview">
            ${getTemplatePreviewHTML(template)}
        </div>
        <div class="template-info">
            <div class="template-name">${template.name}</div>
            <div class="template-description">${template.description}</div>
            <div class="template-meta">
                <span class="template-layout">${template.layout}</span>
                ${template.premium ? '<span class="premium-badge">PRO</span>' : ''}
            </div>
        </div>
        ${template.premium ? '<div class="premium-overlay"><div class="premium-lock">🔒</div></div>' : ''}
    `;
    
    return card;
}

/**
 * Generate preview HTML for template
 */
function getTemplatePreviewHTML(template) {
    const previewMap = {
        'hero-minimal': `
            <div class="preview-hero">
                <div class="preview-avatar"></div>
                <div class="preview-name">Your Name</div>
                <div class="preview-title">Professional Title</div>
            </div>
        `,
        'hero-cta': `
            <div class="preview-hero">
                <div class="preview-avatar"></div>
                <div class="preview-name">Your Name</div>
                <div class="preview-button">Book Meeting</div>
            </div>
        `,
        'bio-standard': `
            <div class="preview-content">
                <div class="preview-title">About Me</div>
                <div class="preview-lines">
                    <div class="preview-line" style="width: 100%"></div>
                    <div class="preview-line" style="width: 85%"></div>
                    <div class="preview-line" style="width: 92%"></div>
                </div>
            </div>
        `,
        'bio-image': `
            <div class="preview-two-column">
                <div class="preview-column">
                    <div class="preview-lines">
                        <div class="preview-line" style="width: 100%"></div>
                        <div class="preview-line" style="width: 80%"></div>
                    </div>
                </div>
                <div class="preview-column">
                    <div class="preview-image"></div>
                </div>
            </div>
        `,
        'topics-grid': `
            <div class="preview-topics">
                <div class="preview-topic">Topic 1</div>
                <div class="preview-topic">Topic 2</div>
                <div class="preview-topic">Topic 3</div>
                <div class="preview-topic">Topic 4</div>
            </div>
        `,
        'social-links': `
            <div class="preview-social">
                <div class="preview-social-icon">f</div>
                <div class="preview-social-icon">t</div>
                <div class="preview-social-icon">in</div>
            </div>
        `,
        'stats-basic': `
            <div class="preview-stats">
                <div class="preview-stat">
                    <div class="preview-stat-number">150+</div>
                    <div class="preview-stat-label">Events</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-number">50K+</div>
                    <div class="preview-stat-label">Audience</div>
                </div>
            </div>
        `,
        'contact-info': `
            <div class="preview-contact">
                <div class="preview-contact-item">📧 email@example.com</div>
                <div class="preview-contact-item">📱 +1 (555) 123-4567</div>
            </div>
        `,
        'hero-video': `
            <div class="preview-hero premium">
                <div class="preview-video">▶</div>
                <div class="preview-name">Video Introduction</div>
            </div>
        `,
        'media-gallery': `
            <div class="preview-gallery">
                <div class="preview-gallery-item"></div>
                <div class="preview-gallery-item"></div>
                <div class="preview-gallery-item"></div>
                <div class="preview-gallery-item"></div>
            </div>
        `,
        'testimonials-carousel': `
            <div class="preview-testimonial">
                <div class="preview-quote">"Amazing speaker!"</div>
                <div class="preview-author">- Client Name</div>
            </div>
        `
    };
    
    return previewMap[template.preview] || `
        <div class="preview-default">
            <div class="preview-icon">${template.premium ? '💎' : '📄'}</div>
            <div class="preview-label">${template.type}</div>
        </div>
    `;
}

/**
 * Setup template event listeners
 */
function setupTemplateEventListeners() {
    console.log('🔧 Setting up template event listeners...');
    
    // Template card clicks
    document.addEventListener('click', function(e) {
        const templateCard = e.target.closest('.template-card');
        if (templateCard) {
            const templateId = templateCard.getAttribute('data-template-id');
            handleTemplateSelection(templateId);
        }
    });
    
    // Modal close button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'close-section-modal') {
            hideAddSectionModal();
        }
    });
    
    // Modal overlay click
    document.addEventListener('click', function(e) {
        if (e.target.id === 'add-section-modal') {
            hideAddSectionModal();
        }
    });
    
    // Category filter
    document.addEventListener('change', function(e) {
        if (e.target.id === 'template-category-filter') {
            setTemplateFilter(e.target.value);
        }
    });
    
    // Category sidebar clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-item')) {
            const category = e.target.getAttribute('data-category');
            setTemplateFilter(category);
            
            // Update active state
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Update dropdown
            const dropdown = document.getElementById('template-category-filter');
            if (dropdown) dropdown.value = category;
        }
    });
    
    // Search functionality
    document.addEventListener('input', function(e) {
        if (e.target.id === 'template-search-input') {
            searchTemplates(e.target.value);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (window.templateSystem.modalVisible) {
            if (e.key === 'Escape') {
                hideAddSectionModal();
            }
        }
    });
    
    console.log('✅ Template event listeners setup complete');
}

/**
 * Handle template selection
 */
function handleTemplateSelection(templateId) {
    console.log(`🎯 Template selected: ${templateId}`);
    
    const template = sectionTemplates[templateId];
    if (!template) {
        console.error(`❌ Template not found: ${templateId}`);
        return;
    }
    
    // Check premium access
    if (template.premium) {
        console.log('💎 Premium template selected, checking access...');
        
        if (window.premiumAccess?.hasAccess && !window.premiumAccess.hasAccess('premiumTemplates')) {
            console.log('🔒 Premium access required');
            window.premiumAccess.showUpgradePrompt(`${template.name} is a premium template`, template.name);
            return;
        }
        
        console.log('✅ Premium access confirmed');
    }
    
    // Insert template
    insertSectionTemplate(templateId);
}

/**
 * Insert section template into the builder
 */
function insertSectionTemplate(templateId) {
    console.log(`🚀 Inserting template: ${templateId}`);
    
    const template = sectionTemplates[templateId];
    if (!template) {
        console.error(`❌ Template not found: ${templateId}`);
        return;
    }
    
    try {
        // Add section with template configuration
        const sectionId = addSection(template.type, template.layout);
        if (!sectionId) {
            console.error('❌ Failed to add section');
            return;
        }
        
        const section = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!section) {
            console.error('❌ Section not found after creation:', sectionId);
            return;
        }
        
        console.log('✅ Section created, adding components...');
        
        // Add components based on template layout
        if (template.layout === 'full-width') {
            const dropZone = section.querySelector('.drop-zone');
            if (dropZone && template.components) {
                template.components.forEach((comp, index) => {
                    console.log(`Adding component ${index + 1}:`, comp.type);
                    addTemplateComponent(comp.type, dropZone, comp.content);
                });
            }
        } else {
            // Handle multi-column layouts
            if (template.components && typeof template.components === 'object') {
                Object.entries(template.components).forEach(([column, components]) => {
                    console.log(`Adding components to column ${column}:`, components);
                    const dropZone = section.querySelector(`[data-column="${column}"] .drop-zone`);
                    if (dropZone) {
                        components.forEach((comp, index) => {
                            console.log(`Adding component ${index + 1} to ${column}:`, comp.type);
                            addTemplateComponent(comp.type, dropZone, comp.content);
                        });
                    }
                });
            }
        }
        
        // Re-initialize functionality
        if (window.addSectionControls) window.addSectionControls();
        if (window.setupSectionEventListeners) window.setupSectionEventListeners();
        if (window.setupElementSelection) window.setupElementSelection();
        if (window.setupContentEditableUpdates) window.setupContentEditableUpdates();
        
        console.log('✅ Template insertion completed successfully');
        hideAddSectionModal();
        
        // Select the new section
        setTimeout(() => {
            if (window.selectSection && section) {
                window.selectSection(section);
            }
        }, 100);
        
    } catch (error) {
        console.error('💥 Error inserting template:', error);
        alert('Failed to insert template. Please try again.');
    }
}

/**
 * Add template component to drop zone
 */
function addTemplateComponent(type, dropZone, content) {
    console.log('🧩 Adding template component:', type, content);
    
    // Get component template from existing system
    if (typeof getComponentTemplate === 'function') {
        const template = getComponentTemplate(type);
        if (!template) {
            console.error('❌ Component template not found:', type);
            return;
        }
        
        // Create component element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = template;
        const component = tempDiv.firstElementChild;
        
        if (!component) {
            console.error('❌ Failed to create component element');
            return;
        }
        
        // Generate unique component ID
        const componentId = 'component-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        component.setAttribute('data-component-id', componentId);
        
        // Populate with template content
        populateComponentWithContent(component, type, content);
        
        // Add to drop zone
        dropZone.appendChild(component);
        dropZone.classList.remove('empty');
        
        // Re-initialize event listeners for this component
        if (window.setupElementEventListeners) {
            window.setupElementEventListeners(component);
        }
        
        console.log('✅ Component added successfully:', componentId);
        
    } else {
        console.error('❌ getComponentTemplate function not available');
    }
}

/**
 * Populate component with template content
 */
function populateComponentWithContent(component, type, content) {
    if (!content) return;
    
    console.log(`📝 Populating ${type} component with content:`, content);
    
    try {
        switch (type) {
            case 'hero':
                if (content.name) {
                    const nameEl = component.querySelector('.hero-name, [contenteditable="true"]');
                    if (nameEl) nameEl.textContent = content.name;
                }
                if (content.title) {
                    const titleEl = component.querySelector('.hero-title');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.bio) {
                    const bioEl = component.querySelector('.hero-bio, .hero-description');
                    if (bioEl) bioEl.textContent = content.bio;
                }
                break;
                
            case 'bio':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk, h2');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.content) {
                    const contentEl = component.querySelector('p[contenteditable="true"], .bio-content');
                    if (contentEl) contentEl.textContent = content.content;
                }
                break;
                
            case 'topics':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk, h2');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.topics && Array.isArray(content.topics)) {
                    const topicElements = component.querySelectorAll('.topic-item');
                    content.topics.forEach((topic, index) => {
                        if (topicElements[index]) {
                            topicElements[index].textContent = topic;
                        }
                    });
                }
                break;
                
            case 'cta':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk, h2');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.description) {
                    const descEl = component.querySelector('p[contenteditable="true"]');
                    if (descEl) descEl.textContent = content.description;
                }
                if (content.buttonText) {
                    const btnEl = component.querySelector('.cta-button');
                    if (btnEl) btnEl.textContent = content.buttonText;
                }
                break;
                
            case 'stats':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk, h2');
                    if (titleEl) titleEl.textContent = content.title;
                }
                if (content.stats && Array.isArray(content.stats)) {
                    const statElements = component.querySelectorAll('.stat-item');
                    content.stats.forEach((stat, index) => {
                        if (statElements[index]) {
                            const numberEl = statElements[index].querySelector('.stat-number');
                            const labelEl = statElements[index].querySelector('.stat-label');
                            if (numberEl) numberEl.textContent = stat.number;
                            if (labelEl) labelEl.textContent = stat.label;
                        }
                    });
                }
                break;
                
            case 'contact':
                if (content.title) {
                    const titleEl = component.querySelector('.section-title-mk, h2');
                    if (titleEl) titleEl.textContent = content.title;
                }
                // Add contact-specific content population here
                break;
                
            default:
                console.log(`ℹ️ No specific content population for type: ${type}`);
        }
        
    } catch (error) {
        console.error('💥 Error populating component content:', error);
    }
}

/**
 * Set template filter
 */
function setTemplateFilter(category) {
    console.log(`🔍 Filtering templates by category: ${category}`);
    
    window.templateSystem.currentFilter = category;
    renderSectionTemplates();
}

/**
 * Search templates
 */
function searchTemplates(query) {
    console.log(`🔍 Searching templates: "${query}"`);
    
    const cards = document.querySelectorAll('.template-card');
    const searchTerm = query.toLowerCase();
    
    cards.forEach(card => {
        const name = card.querySelector('.template-name')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.template-description')?.textContent.toLowerCase() || '';
        
        if (name.includes(searchTerm) || description.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Update premium section visibility
 */
function updatePremiumSectionVisibility() {
    const premiumSection = document.getElementById('premium-templates-section');
    const premiumGrid = document.getElementById('premium-templates-grid');
    
    if (premiumSection && premiumGrid) {
        const hasVisiblePremiumTemplates = premiumGrid.children.length > 0;
        premiumSection.style.display = hasVisiblePremiumTemplates ? 'block' : 'none';
    }
}

/**
 * Ensure template modal exists
 */
function ensureTemplateModalExists() {
    if (!document.getElementById('add-section-modal')) {
        createAddSectionModal();
    }
}

/**
 * Add template modal styles
 */
function addTemplateModalStyles() {
    if (!document.getElementById('section-templates-styles')) {
        const style = document.createElement('style');
        style.id = 'section-templates-styles';
        style.textContent = `
            /* Section Templates Modal Styles */
            .section-templates-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 5000;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }
            
            .section-templates-modal {
                background: #f8f9fa;
                border-radius: 12px;
                width: 100%;
                max-width: 1200px;
                height: 90vh;
                max-height: 800px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .modal-header {
                background: white;
                border-bottom: 1px solid #e2e8f0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            
            .modal-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .modal-title svg {
                stroke: #64748b;
            }
            
            .modal-controls {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .template-filter select {
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 14px;
                color: #1e293b;
                cursor: pointer;
                min-width: 140px;
            }
            
            .template-search {
                position: relative;
            }
            
            .template-search input {
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px 12px 8px 36px;
                font-size: 14px;
                width: 200px;
                color: #1e293b;
            }
            
            .template-search input:focus {
                outline: none;
                border-color: #0ea5e9;
                box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
            }
            
            .template-search svg {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                stroke: #64748b;
            }
            
            .close-modal {
                background: none;
                border: none;
                color: #64748b;
                font-size: 24px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s ease;
                line-height: 1;
            }
            
            .close-modal:hover {
                background: #f1f5f9;
                color: #1e293b;
            }
            
            .modal-body {
                flex: 1;
                overflow: hidden;
                display: flex;
            }
            
            .modal-sidebar {
                width: 200px;
                background: white;
                border-right: 1px solid #e2e8f0;
                padding: 20px;
                overflow-y: auto;
                flex-shrink: 0;
            }
            
            .sidebar-title {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 12px;
            }
            
            .category-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .category-item {
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                color: #64748b;
                transition: all 0.2s ease;
                margin-bottom: 2px;
            }
            
            .category-item:hover {
                background: #f1f5f9;
                color: #1e293b;
            }
            
            .category-item.active {
                background: #dbeafe;
                color: #1e40af;
                font-weight: 500;
            }
            
            .modal-main {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .templates-section {
                margin-bottom: 32px;
            }
            
            .section-header h3 {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 4px 0;
            }
            
            .section-header p {
                font-size: 14px;
                color: #64748b;
                margin: 0 0 16px 0;
            }
            
            .templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
            }
            
            .template-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .template-card:hover {
                border-color: #0ea5e9;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
                transform: translateY(-2px);
            }
            
            .template-card.premium {
                border-color: #f093fb;
            }
            
            .template-card.premium:hover {
                box-shadow: 0 4px 12px rgba(240, 147, 251, 0.2);
            }
            
            .premium-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            }
            
            .premium-lock {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 24px;
            }
            
            .template-preview {
                height: 120px;
                background: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            
            .template-info {
                padding: 16px;
            }
            
            .template-name {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 4px;
            }
            
            .template-description {
                font-size: 12px;
                color: #64748b;
                line-height: 1.4;
                margin-bottom: 8px;
            }
            
            .template-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .template-layout {
                font-size: 11px;
                background: #f1f5f9;
                color: #64748b;
                padding: 2px 6px;
                border-radius: 4px;
            }
            
            .premium-badge {
                background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
            }
            
            /* Template Previews */
            .preview-hero {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 16px;
                text-align: center;
            }
            
            .preview-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #cbd5e1;
                margin-bottom: 8px;
            }
            
            .preview-name {
                font-size: 12px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 4px;
            }
            
            .preview-title {
                font-size: 10px;
                color: #64748b;
                margin-bottom: 8px;
            }
            
            .preview-button {
                background: #0ea5e9;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .preview-video {
                width: 48px;
                height: 32px;
                background: #1e293b;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #0ea5e9;
                font-size: 16px;
                margin-bottom: 8px;
            }
            
            .preview-content {
                padding: 16px;
                width: 100%;
            }
            
            .preview-title {
                font-size: 10px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
            }
            
            .preview-lines {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .preview-line {
                height: 3px;
                background: #cbd5e1;
                border-radius: 2px;
            }
            
            .preview-two-column {
                display: flex;
                gap: 12px;
                padding: 16px;
                width: 100%;
            }
            
            .preview-column {
                flex: 1;
            }
            
            .preview-image {
                width: 100%;
                height: 48px;
                background: #cbd5e1;
                border-radius: 4px;
            }
            
            .preview-topics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                padding: 16px;
                width: 100%;
            }
            
            .preview-topic {
                background: #dbeafe;
                border-left: 2px solid #0ea5e9;
                padding: 6px 8px;
                font-size: 9px;
                color: #1e40af;
                border-radius: 3px;
            }
            
            .preview-social {
                display: flex;
                justify-content: center;
                gap: 8px;
                padding: 16px;
            }
            
            .preview-social-icon {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #0ea5e9;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 8px;
                font-weight: bold;
            }
            
            .preview-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                padding: 16px;
            }
            
            .preview-stat {
                text-align: center;
                background: white;
                border-radius: 4px;
                padding: 8px;
                border: 1px solid #e2e8f0;
            }
            
            .preview-stat-number {
                font-size: 10px;
                font-weight: 600;
                color: #0ea5e9;
            }
            
            .preview-stat-label {
                font-size: 8px;
                color: #64748b;
                margin-top: 2px;
            }
            
            .preview-contact {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .preview-contact-item {
                font-size: 9px;
                color: #64748b;
            }
            
            .preview-gallery {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                padding: 16px;
            }
            
            .preview-gallery-item {
                aspect-ratio: 1;
                background: #cbd5e1;
                border-radius: 3px;
            }
            
            .preview-testimonial {
                padding: 16px;
                text-align: center;
            }
            
            .preview-quote {
                font-size: 10px;
                color: #64748b;
                font-style: italic;
                margin-bottom: 8px;
            }
            
            .preview-author {
                font-size: 9px;
                color: #1e293b;
                font-weight: 500;
            }
            
            .preview-default {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 16px;
            }
            
            .preview-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .preview-label {
                font-size: 10px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 500;
            }
            
            /* Responsive Design */
            @media (max-width: 1024px) {
                .section-templates-modal {
                    max-width: 95vw;
                    height: 95vh;
                }
                
                .templates-grid {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
            }
            
            @media (max-width: 768px) {
                .modal-body {
                    flex-direction: column;
                }
                
                .modal-sidebar {
                    width: 100%;
                    height: auto;
                    border-right: none;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 16px;
                }
                
                .category-list {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    white-space: nowrap;
                }
                
                .category-item {
                    flex-shrink: 0;
                }
                
                .templates-grid {
                    grid-template-columns: 1fr;
                }
                
                .modal-controls {
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .template-search input {
                    width: 150px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Get template by ID
 */
function getTemplate(templateId) {
    return sectionTemplates[templateId] || null;
}

/**
 * Get templates by category
 */
function getTemplatesByCategory(category) {
    return Object.entries(sectionTemplates)
        .filter(([key, template]) => template.category === category)
        .map(([key, template]) => ({ id: key, ...template }));
}

/**
 * Get all template categories
 */
function getTemplateCategories() {
    const categories = new Set();
    Object.values(sectionTemplates).forEach(template => {
        categories.add(template.category);
    });
    return Array.from(categories);
}

// Make functions globally available
window.showAddSectionModal = showAddSectionModal;
window.hideAddSectionModal = hideAddSectionModal;
window.handleTemplateSelection = handleTemplateSelection;
window.insertSectionTemplate = insertSectionTemplate;
window.getTemplate = getTemplate;
window.getTemplatesByCategory = getTemplatesByCategory;
window.getTemplateCategories = getTemplateCategories;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other systems are loaded
    setTimeout(() => {
        initializeSectionTemplates();
    }, 200);
});

console.log('🎨 Section Templates System v2.0 loaded');
