/**
 * Template Manager
 * Handles template selection, switching, and data persistence
 */

class TemplateManager {
    constructor(builder) {
        this.builder = builder;
        this.currentTemplate = 'modern';
        this.templates = this.loadTemplates();
        
        this.init();
    }

    init() {
        this.setupTemplateListeners();
        this.setupThemeListeners();
    }

    loadTemplates() {
        return {
            modern: {
                name: 'Modern Professional',
                category: 'business',
                description: 'Clean, minimalist design perfect for professionals',
                thumbnail: '/assets/images/templates/modern.jpg',
                premium: false,
                structure: [
                    { type: 'hero', data: { style: 'centered' } },
                    { type: 'bio', data: { columns: 1 } },
                    { type: 'topics', data: { grid: true } },
                    { type: 'stats', data: { style: 'cards' } },
                    { type: 'social', data: { style: 'rounded' } }
                ]
            },
            creative: {
                name: 'Creative Artist',
                category: 'creative',
                description: 'Bold and expressive design for creatives',
                thumbnail: '/assets/images/templates/creative.jpg',
                premium: false,
                structure: [
                    { type: 'hero', data: { style: 'split' } },
                    { type: 'gallery', data: { layout: 'masonry' } },
                    { type: 'bio', data: { columns: 2 } },
                    { type: 'testimonials', data: { style: 'cards' } },
                    { type: 'contact', data: { style: 'form' } }
                ]
            },
            podcast: {
                name: 'Podcast Host',
                category: 'media',
                description: 'Designed for podcast hosts and media personalities',
                thumbnail: '/assets/images/templates/podcast.jpg',
                premium: true,
                structure: [
                    { type: 'hero', data: { style: 'video-bg' } },
                    { type: 'podcast-player', data: {} },
                    { type: 'topics', data: { style: 'episodes' } },
                    { type: 'testimonials', data: { style: 'quotes' } },
                    { type: 'cta', data: { style: 'subscribe' } }
                ]
            },
            speaker: {
                name: 'Professional Speaker',
                category: 'speaking',
                description: 'Showcase your speaking topics and expertise',
                thumbnail: '/assets/images/templates/speaker.jpg',
                premium: false,
                structure: [
                    { type: 'hero', data: { style: 'gradient' } },
                    { type: 'topics', data: { style: 'detailed' } },
                    { type: 'stats', data: { style: 'counters' } },
                    { type: 'logo-grid', data: { title: 'Speaking At' } },
                    { type: 'testimonials', data: { style: 'slider' } },
                    { type: 'cta', data: { style: 'booking' } }
                ]
            },
            author: {
                name: 'Author & Writer',
                category: 'writing',
                description: 'Perfect for authors and content creators',
                thumbnail: '/assets/images/templates/author.jpg',
                premium: true,
                structure: [
                    { type: 'hero', data: { style: 'book-cover' } },
                    { type: 'bio', data: { style: 'storytelling' } },
                    { type: 'books', data: { layout: 'showcase' } },
                    { type: 'testimonials', data: { style: 'reviews' } },
                    { type: 'contact', data: { style: 'minimal' } }
                ]
            }
        };
    }

    setupTemplateListeners() {
        // Template selection from modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mkb-template-card')) {
                const templateId = e.target.closest('.mkb-template-card').dataset.template;
                this.selectTemplate(templateId);
            }
        });
    }

    setupThemeListeners() {
        // Theme palette selection
        document.querySelectorAll('.mkb-palette-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const palette = e.target.dataset.palette;
                this.applyThemePalette(palette);
            });
        });

        // Global settings listeners
        const primaryFontSelect = document.getElementById('mkb-primary-font');
        if (primaryFontSelect) {
            primaryFontSelect.addEventListener('change', (e) => {
                this.applyPrimaryFont(e.target.value);
            });
        }

        const borderRadiusSlider = document.getElementById('mkb-border-radius');
        if (borderRadiusSlider) {
            borderRadiusSlider.addEventListener('input', (e) => {
                this.applyBorderRadius(e.target.value);
            });
        }
    }

    async selectTemplate(templateId) {
        const template = this.templates[templateId];
        if (!template) return;

        // Check if premium template
        if (template.premium && !this.builder.state.userData.isPro) {
            this.showUpgradePrompt();
            return;
        }

        // Confirm template switch if content exists
        if (this.builder.state.isDirty) {
            const confirmed = confirm('Switching templates will replace your current content. Continue?');
            if (!confirmed) return;
        }

        // Apply template
        await this.applyTemplate(template);
        this.currentTemplate = templateId;
        
        // Close modal
        const modal = document.getElementById('mkb-template-modal');
        if (modal) modal.style.display = 'none';
    }

    async applyTemplate(template) {
        const preview = document.getElementById('mkb-media-kit-preview');
        if (!preview) return;

        // Show loading state
        preview.classList.add('mkb-loading');

        try {
            // Clear current content
            preview.innerHTML = '';

            // Build template structure
            let html = '';
            let zoneIndex = 0;

            template.structure.forEach((component, index) => {
                // Add drop zone before component
                html += `<div class="mkb-drop-zone empty" data-zone="${zoneIndex++}"></div>`;
                
                // Add component
                html += this.getComponentHTML(component);
            });

            // Add final drop zone
            html += `<div class="mkb-drop-zone empty" data-zone="${zoneIndex}"></div>`;

            // Apply to preview
            preview.innerHTML = html;

            // Setup interactions
            this.builder.setupEditableElements();
            this.builder.dragDropManager.setupDropZones();
            this.builder.dragDropManager.setupElementReordering();

            // Apply template styles
            this.applyTemplateStyles(template);

            // Save state
            this.builder.saveCurrentState();
            this.builder.markDirty();

        } catch (error) {
            console.error('Failed to apply template:', error);
            alert('Failed to apply template. Please try again.');
        } finally {
            preview.classList.remove('mkb-loading');
        }
    }

    getComponentHTML(component) {
        // Get base template from drag-drop manager
        const baseTemplate = this.builder.dragDropManager.getComponentTemplate(component.type);
        
        // Apply component-specific data/styles
        // This is where we'd customize based on component.data
        
        return baseTemplate;
    }

    applyTemplateStyles(template) {
        // Apply template-specific styles
        const preview = document.getElementById('mkb-media-kit-preview');
        
        // Remove existing template classes
        preview.className = preview.className.replace(/template-\S+/g, '');
        
        // Add new template class
        preview.classList.add(`template-${this.currentTemplate}`);
    }

    applyThemePalette(palette) {
        const preview = document.getElementById('mkb-media-kit-preview');
        
        // Remove existing theme classes
        preview.className = preview.className.replace(/theme-\S+/g, '');
        
        // Add new theme class
        preview.classList.add(`theme-${palette}`);
        
        // Update palette selection
        document.querySelectorAll('.mkb-palette-option').forEach(option => {
            option.classList.toggle('active', option.dataset.palette === palette);
        });
        
        // Update CSS variables
        const paletteColors = {
            blue: { primary: '#3b82f6', secondary: '#dbeafe', accent: '#1e40af' },
            green: { primary: '#10b981', secondary: '#dcfce7', accent: '#047857' },
            purple: { primary: '#8b5cf6', secondary: '#f3e8ff', accent: '#7c3aed' },
            orange: { primary: '#f97316', secondary: '#fed7aa', accent: '#ea580c' },
            pink: { primary: '#ec4899', secondary: '#fce7f3', accent: '#db2777' },
            gray: { primary: '#64748b', secondary: '#f1f5f9', accent: '#475569' }
        };

        const colors = paletteColors[palette];
        if (colors) {
            document.documentElement.style.setProperty('--theme-primary', colors.primary);
            document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
            document.documentElement.style.setProperty('--theme-accent', colors.accent);
        }

        this.builder.state.currentTheme = palette;
        this.builder.markDirty();
    }

    applyPrimaryFont(fontFamily) {
        document.documentElement.style.setProperty('--primary-font', fontFamily);
        
        // Load Google Font if needed
        if (!['Arial', 'Georgia', 'Times New Roman'].includes(fontFamily)) {
            this.loadGoogleFont(fontFamily);
        }
        
        this.builder.markDirty();
    }

    applyBorderRadius(value) {
        document.documentElement.style.setProperty('--border-radius', `${value}px`);
        
        // Update all components with border radius
        document.querySelectorAll('.mkb-content-section, .mkb-hero-section').forEach(section => {
            section.style.borderRadius = `${value}px`;
        });
        
        this.builder.markDirty();
    }

    loadGoogleFont(fontFamily) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;600;700&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    showUpgradePrompt() {
        const modal = document.createElement('div');
        modal.className = 'mkb-modal-overlay';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="mkb-modal-content" style="max-width: 400px;">
                <div class="mkb-modal-header">
                    <div class="mkb-modal-title">Upgrade to Pro</div>
                    <button class="mkb-close-modal">&times;</button>
                </div>
                <div class="mkb-modal-body" style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                    <h3 style="margin-bottom: 12px;">Unlock Premium Templates</h3>
                    <p style="color: var(--mkb-text-secondary); margin-bottom: 24px;">
                        Get access to all premium templates, advanced components, 
                        and remove watermarks with Guestify Pro.
                    </p>
                    <button class="mkb-toolbar-btn primary" style="width: 100%; margin-bottom: 12px;">
                        Upgrade Now - $19/month
                    </button>
                    <button class="mkb-toolbar-btn" style="width: 100%;">
                        View All Features
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.mkb-close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getTemplateGalleryHTML() {
        const categories = ['all', 'business', 'creative', 'media', 'speaking', 'writing'];
        
        return `
            <div class="mkb-template-gallery">
                <div class="mkb-template-filters">
                    ${categories.map(cat => `
                        <button class="mkb-filter-btn ${cat === 'all' ? 'active' : ''}" 
                                data-category="${cat}">
                            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    `).join('')}
                </div>
                
                <div class="mkb-template-grid">
                    ${Object.entries(this.templates).map(([id, template]) => `
                        <div class="mkb-template-card ${template.premium ? 'premium' : ''}" 
                             data-template="${id}"
                             data-category="${template.category}">
                            <div class="mkb-template-preview">
                                <img src="${template.thumbnail}" alt="${template.name}">
                                ${template.premium ? '<span class="mkb-premium-badge">PRO</span>' : ''}
                            </div>
                            <div class="mkb-template-info">
                                <h4>${template.name}</h4>
                                <p>${template.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async saveAsTemplate() {
        const name = prompt('Enter a name for your template:');
        if (!name) return;
        
        const templateData = {
            name: name,
            structure: this.builder.collectComponentData(),
            theme: this.builder.state.currentTheme,
            customStyles: this.collectCustomStyles()
        };
        
        try {
            const response = await this.builder.api('save_user_template', templateData);
            if (response.success) {
                alert('Template saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template. Please try again.');
        }
    }

    collectCustomStyles() {
        // Collect any custom styles applied
        return {
            primaryFont: getComputedStyle(document.documentElement).getPropertyValue('--primary-font'),
            borderRadius: getComputedStyle(document.documentElement).getPropertyValue('--border-radius'),
            // Add more custom styles as needed
        };
    }
}

// Export for use in main builder
window.TemplateManager = TemplateManager;