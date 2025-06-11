/**
 * Media Kit Builder - Components Module
 * Component definitions and utilities
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function(window) {
    'use strict';
    
    console.log('📦 Components module loaded');
    
    /**
     * Component definitions
     */
    const ComponentDefinitions = {
        hero: {
            id: 'hero',
            name: 'Hero Section',
            icon: '👤',
            category: 'essential',
            description: 'Professional introduction with photo and bio',
            fields: ['name', 'title', 'bio', 'avatar'],
            premium: false
        },
        
        biography: {
            id: 'biography',
            name: 'Biography',
            icon: '📝',
            category: 'content',
            description: 'Detailed professional background',
            fields: ['content', 'highlights'],
            premium: false
        },
        
        topics: {
            id: 'topics',
            name: 'Speaking Topics',
            icon: '💬',
            category: 'content',
            description: 'Areas of expertise and speaking topics',
            fields: ['topics'],
            premium: false
        },
        
        social: {
            id: 'social',
            name: 'Social Links',
            icon: '🔗',
            category: 'contact',
            description: 'Social media and professional links',
            fields: ['platforms'],
            premium: false
        },
        
        stats: {
            id: 'stats',
            name: 'Statistics',
            icon: '📊',
            category: 'content',
            description: 'Key metrics and achievements',
            fields: ['metrics'],
            premium: false
        },
        
        cta: {
            id: 'cta',
            name: 'Call to Action',
            icon: '🎯',
            category: 'engagement',
            description: 'Contact button or booking link',
            fields: ['text', 'url', 'style'],
            premium: false
        },
        
        'logo-grid': {
            id: 'logo-grid',
            name: 'Logo Grid',
            icon: '🏢',
            category: 'media',
            description: 'Client and partner logos',
            fields: ['logos'],
            premium: false
        },
        
        testimonials: {
            id: 'testimonials',
            name: 'Testimonials',
            icon: '💬',
            category: 'content',
            description: 'Client testimonials and reviews',
            fields: ['testimonials'],
            premium: false
        },
        
        contact: {
            id: 'contact',
            name: 'Contact Information',
            icon: '📧',
            category: 'contact',
            description: 'Contact details and information',
            fields: ['email', 'phone', 'website'],
            premium: false
        },
        
        questions: {
            id: 'questions',
            name: 'Interview Questions',
            icon: '❓',
            category: 'content',
            description: 'Suggested interview questions',
            fields: ['questions'],
            premium: false
        },
        
        // Premium components
        video: {
            id: 'video',
            name: 'Video Introduction',
            icon: '📹',
            category: 'media',
            description: 'Embedded video player',
            fields: ['video_url', 'poster'],
            premium: true
        },
        
        gallery: {
            id: 'gallery',
            name: 'Photo Gallery',
            icon: '🖼️',
            category: 'media',
            description: 'Image gallery with lightbox',
            fields: ['images'],
            premium: true
        },
        
        calendar: {
            id: 'calendar',
            name: 'Booking Calendar',
            icon: '📅',
            category: 'engagement',
            description: 'Embedded booking calendar',
            fields: ['calendar_url', 'availability'],
            premium: true
        },
        
        podcast: {
            id: 'podcast',
            name: 'Podcast Player',
            icon: '🎙️',
            category: 'media',
            description: 'Audio player for podcast episodes',
            fields: ['episodes', 'platforms'],
            premium: true
        }
    };
    
    /**
     * Component manager
     */
    const ComponentManager = {
        /**
         * Get all components
         */
        getAll() {
            return ComponentDefinitions;
        },
        
        /**
         * Get component by ID
         */
        getById(id) {
            return ComponentDefinitions[id] || null;
        },
        
        /**
         * Get components by category
         */
        getByCategory(category) {
            return Object.values(ComponentDefinitions).filter(
                comp => comp.category === category
            );
        },
        
        /**
         * Get free components
         */
        getFree() {
            return Object.values(ComponentDefinitions).filter(
                comp => !comp.premium
            );
        },
        
        /**
         * Get premium components
         */
        getPremium() {
            return Object.values(ComponentDefinitions).filter(
                comp => comp.premium
            );
        },
        
        /**
         * Check if component is premium
         */
        isPremium(id) {
            const comp = this.getById(id);
            return comp ? comp.premium : false;
        },
        
        /**
         * Get available categories
         */
        getCategories() {
            const categories = new Set();
            Object.values(ComponentDefinitions).forEach(comp => {
                categories.add(comp.category);
            });
            return Array.from(categories);
        },
        
        /**
         * Create component instance
         */
        createInstance(id, data = {}) {
            const definition = this.getById(id);
            if (!definition) {
                throw new Error(`Component ${id} not found`);
            }
            
            return {
                id: `${id}_${Date.now()}`,
                type: id,
                enabled: true,
                data: data,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
        },
        
        /**
         * Validate component data
         */
        validate(component) {
            const definition = this.getById(component.type);
            if (!definition) {
                return { valid: false, errors: ['Unknown component type'] };
            }
            
            const errors = [];
            
            // Check required fields
            definition.fields.forEach(field => {
                if (!component.data.hasOwnProperty(field)) {
                    errors.push(`Missing required field: ${field}`);
                }
            });
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
        }
    };
    
    /**
     * Template manager
     */
    const TemplateManager = {
        templates: {
            'professional-business': {
                id: 'professional-business',
                name: 'Professional Business',
                category: 'business',
                description: 'Clean, corporate design for business professionals',
                preview: '💼',
                components: ['hero', 'biography', 'stats', 'social', 'contact'],
                colors: {
                    primary: '#1e40af',
                    secondary: '#64748b'
                }
            },
            
            'creative-portfolio': {
                id: 'creative-portfolio',
                name: 'Creative Portfolio',
                category: 'creative',
                description: 'Vibrant design for creative professionals',
                preview: '🎨',
                components: ['hero', 'gallery', 'testimonials', 'social'],
                colors: {
                    primary: '#7c3aed',
                    secondary: '#ec4899'
                }
            },
            
            'health-wellness': {
                id: 'health-wellness',
                name: 'Health & Wellness',
                category: 'health',
                description: 'Calming design for health professionals',
                preview: '🌿',
                components: ['hero', 'biography', 'topics', 'testimonials', 'contact'],
                colors: {
                    primary: '#059669',
                    secondary: '#64748b'
                }
            }
        },
        
        /**
         * Get all templates
         */
        getAll() {
            return this.templates;
        },
        
        /**
         * Get template by ID
         */
        getById(id) {
            return this.templates[id] || null;
        },
        
        /**
         * Apply template to media kit
         */
        apply(templateId, currentData = {}) {
            const template = this.getById(templateId);
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }
            
            const components = template.components.map(compId => {
                return ComponentManager.createInstance(compId);
            });
            
            return {\n                template: templateId,\n                components: components,\n                settings: {\n                    ...currentData.settings,\n                    colors: template.colors,\n                    template: templateId\n                }\n            };\n        }\n    };\n    \n    // Make globally available\n    window.mkbComponents = ComponentManager;\n    window.mkbTemplates = TemplateManager;\n    \n})(window);
