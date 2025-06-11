/**
 * Gallery JavaScript for Template Selection
 * Handles template filtering, selection, and media kit creation
 */

document.addEventListener('DOMContentLoaded', function() {
    const gallery = window.MediaKitGallery || {};
    const templatesGrid = document.getElementById('templates-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const startBlankBtn = document.getElementById('start-blank');

    // Initialize gallery
    initializeGallery();

    function initializeGallery() {
        console.log('Initializing Media Kit Gallery');
        console.log('Gallery data:', gallery);

        // Render templates
        renderTemplates();
        
        // Setup event listeners
        setupFilterButtons();
        setupStartBlankButton();
    }

    function renderTemplates(filter = 'all') {
        if (!templatesGrid) return;

        templatesGrid.innerHTML = '';
        
        const templates = gallery.templates || getDefaultTemplates();
        
        Object.entries(templates).forEach(([id, template]) => {
            if (filter !== 'all' && template.category !== filter) return;

            const card = createTemplateCard(id, template);
            templatesGrid.appendChild(card);
        });

        // Add click handlers to use template buttons
        setupTemplateCardHandlers();
    }

    function createTemplateCard(id, template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.setAttribute('data-template', id);
        
        const imageUrl = getTemplateImageUrl(id);
        const isPro = template.tier === 'pro' || template.tier === 'agency';
        
        card.innerHTML = `
            <div class="template-preview">
                <img src="${imageUrl}" 
                     alt="${template.name}" 
                     onerror="this.style.display='none'">
                ${isPro ? '<div class="template-badge pro">PRO</div>' : ''}
                <div class="template-overlay">
                    <button class="use-template-btn" data-template="${id}">
                        Use This Template
                    </button>
                </div>
            </div>
            <div class="template-info">
                <h3 class="template-name">${template.name}</h3>
                <p class="template-description">${template.description || 'Professional media kit template'}</p>
                <div class="template-features">
                    ${(template.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
            </div>
        `;
        
        return card;
    }

    function getTemplateImageUrl(templateId) {
        const baseUrl = gallery.pluginUrl || '/wp-content/plugins/media-kit-builder';
        return `${baseUrl}/assets/images/templates/${templateId}-preview.jpg`;
    }

    function setupFilterButtons() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Filter templates
                const filter = this.getAttribute('data-filter');
                renderTemplates(filter);
            });
        });
    }

    function setupStartBlankButton() {
        if (startBlankBtn) {
            startBlankBtn.addEventListener('click', function() {
                createMediaKit('blank');
            });
        }
    }

    function setupTemplateCardHandlers() {
        document.querySelectorAll('.use-template-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const templateId = this.getAttribute('data-template');
                createMediaKit(templateId);
            });
        });
    }

    function createMediaKit(templateId) {
        console.log('Creating media kit with template:', templateId);

        // Check if user has access to this template
        if (!hasTemplateAccess(templateId)) {
            showUpgradePrompt(templateId);
            return;
        }

        const sessionId = gallery.sessionId || generateSessionId();
        
        // Show loading state
        setLoadingState(true);
        
        // Make AJAX request to create media kit
        fetch(gallery.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'create_media_kit',
                nonce: gallery.nonce,
                template: templateId,
                session_id: sessionId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Create media kit response:', data);
            
            if (data.success) {
                // Redirect to builder
                window.location.href = data.data.redirect_url;
            } else {
                showError('Error creating media kit: ' + (data.data?.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Create media kit error:', error);
            showError('Network error. Please try again.');
        })
        .finally(() => {
            setLoadingState(false);
        });
    }

    function hasTemplateAccess(templateId) {
        const templates = gallery.templates || getDefaultTemplates();
        const template = templates[templateId];
        
        if (!template) return true; // Allow unknown templates
        
        const userTier = gallery.userTier || 'guest';
        const templateTier = template.tier || 'free';
        
        const tierLevels = {
            'guest': 0,
            'free': 1,
            'pro': 2,
            'agency': 3
        };
        
        const userLevel = tierLevels[userTier] || 0;
        const requiredLevel = tierLevels[templateTier] || 0;
        
        return userLevel >= requiredLevel;
    }

    function showUpgradePrompt(templateId) {
        const templates = gallery.templates || getDefaultTemplates();
        const template = templates[templateId];
        const requiredTier = template?.tier || 'pro';
        
        const message = `This is a ${requiredTier.toUpperCase()} template. Upgrade your account to unlock premium templates and features.`;
        
        if (confirm(message + '\n\nWould you like to upgrade now?')) {
            // Redirect to upgrade page or show upgrade modal
            window.location.href = '/pricing/';
        }
    }

    function generateSessionId() {
        return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    function setLoadingState(loading) {
        document.body.style.cursor = loading ? 'wait' : 'default';
        
        // Disable all buttons during loading
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(btn => {
            btn.disabled = loading;
            if (loading) {
                btn.style.opacity = '0.6';
                btn.style.pointerEvents = 'none';
            } else {
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
            }
        });
    }

    function showError(message) {
        // Simple error display - could be enhanced with a modal
        alert(message);
        console.error('Gallery error:', message);
    }

    function getDefaultTemplates() {
        // Fallback templates if none provided by server
        return {
            'business': {
                name: 'Business Professional',
                description: 'Clean and professional design perfect for executives and consultants',
                features: ['Hero Section', 'About', 'Services', 'Contact'],
                tier: 'free',
                category: 'business'
            },
            'health': {
                name: 'Health & Wellness',
                description: 'Warm and inviting design for health professionals and coaches',
                features: ['Bio', 'Expertise', 'Testimonials', 'Booking'],
                tier: 'free',
                category: 'health'
            },
            'tech': {
                name: 'Technology Expert',
                description: 'Modern and sleek design for tech professionals and developers',
                features: ['Portfolio', 'Skills', 'Projects', 'GitHub'],
                tier: 'free',
                category: 'tech'
            },
            'author': {
                name: 'Author & Writer',
                description: 'Elegant design perfect for authors and content creators',
                features: ['Biography', 'Books', 'Reviews', 'Events'],
                tier: 'free',
                category: 'creative'
            },
            'creative': {
                name: 'Creative Professional',
                description: 'Artistic and vibrant design for creators and designers',
                features: ['Gallery', 'Process', 'Clients', 'Instagram'],
                tier: 'pro',
                category: 'creative'
            },
            'consultant': {
                name: 'Business Consultant',
                description: 'Executive-level design for high-end consultants',
                features: ['Expertise', 'Case Studies', 'Testimonials', 'Results'],
                tier: 'pro',
                category: 'business'
            }
        };
    }

    // Expose some functions globally for debugging
    window.MediaKitGalleryAPI = {
        renderTemplates,
        createMediaKit,
        hasTemplateAccess
    };
});
