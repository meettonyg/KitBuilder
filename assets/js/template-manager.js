/**
 * Template Manager for Media Kit Builder
 * 
 * Responsible for fetching, caching, and managing templates.
 */

// Check if SectionTemplateManager already exists to prevent redeclaration
if (typeof SectionTemplateManager === 'undefined') {

class SectionTemplateManager {
    /**
     * Constructor.
     * 
     * @param {Object} config Configuration options.
     */
    constructor(config = {}) {
        // Default configuration
        this.config = {
            restUrl: '/wp-json/media-kit/v1/',
            restNonce: '',
            cacheTime: 30 * 60 * 1000, // 30 minutes in milliseconds
            ...config
        };

        // Initialize template cache
        this.templateCache = {
            templates: {},
            lastFetched: 0
        };

        // Initialize event listeners
        this.eventHandlers = {};
    }

    /**
     * Add event listener.
     * 
     * @param {string} event Event name.
     * @param {Function} callback Event callback.
     */
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
        return this;
    }

    /**
     * Remove event listener.
     * 
     * @param {string} event Event name.
     * @param {Function} callback Event callback.
     */
    off(event, callback) {
        if (!this.eventHandlers[event]) {
            return this;
        }
        
        if (callback) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        } else {
            delete this.eventHandlers[event];
        }
        
        return this;
    }

    /**
     * Trigger event.
     * 
     * @param {string} event Event name.
     * @param {*} data Event data.
     */
    trigger(event, data) {
        if (!this.eventHandlers[event]) {
            return this;
        }
        
        this.eventHandlers[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in event handler:', error);
            }
        });
        
        return this;
    }

    /**
     * Get all templates.
     * 
     * @param {Object} options Optional parameters.
     * @param {string} options.category Filter by category.
     * @param {string} options.search Search term.
     * @param {boolean} options.forceRefresh Force refresh from server.
     * @returns {Promise<Object>} Templates object.
     */
    async getTemplates(options = {}) {
        try {
            // Check if we need to refresh the cache
            const now = Date.now();
            const cacheExpired = (now - this.templateCache.lastFetched) > this.config.cacheTime;
            
            if (options.forceRefresh || cacheExpired || Object.keys(this.templateCache.templates).length === 0) {
                await this.fetchTemplates(options);
            }
            
            // Apply filters to cached templates
            let templates = { ...this.templateCache.templates };
            
            // Filter by category if provided
            if (options.category && options.category !== 'all') {
                templates = Object.fromEntries(
                    Object.entries(templates).filter(([id, template]) => 
                        template.category === options.category
                    )
                );
            }
            
            // Filter by search term if provided
            if (options.search) {
                const search = options.search.toLowerCase();
                templates = Object.fromEntries(
                    Object.entries(templates).filter(([id, template]) => {
                        const name = template.name.toLowerCase();
                        const description = (template.description || '').toLowerCase();
                        return name.includes(search) || description.includes(search);
                    })
                );
            }
            
            return templates;
        } catch (error) {
            console.error('Error getting templates:', error);
            this.trigger('error', { message: 'Failed to get templates', error });
            return {};
        }
    }

    /**
     * Fetch templates from the server.
     * 
     * @param {Object} options Optional parameters.
     * @param {string} options.category Filter by category.
     * @param {string} options.search Search term.
     * @returns {Promise<void>}
     */
    async fetchTemplates(options = {}) {
        try {
            this.trigger('loading', true);
            
            // Build URL with query parameters
            let url = `${this.config.restUrl}templates`;
            const params = new URLSearchParams();
            
            if (options.category && options.category !== 'all') {
                params.append('category', options.category);
            }
            
            if (options.search) {
                params.append('search', options.search);
            }
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            // Fetch templates from API
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.config.restNonce
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch templates');
            }
            
            const templates = await response.json();
            
            // Update cache
            this.templateCache.templates = templates;
            this.templateCache.lastFetched = Date.now();
            
            this.trigger('templatesLoaded', templates);
            return templates;
        } catch (error) {
            console.error('Error fetching templates:', error);
            this.trigger('error', { message: 'Failed to fetch templates', error });
            throw error;
        } finally {
            this.trigger('loading', false);
        }
    }

    /**
     * Get a specific template by ID.
     * 
     * @param {string} templateId Template ID.
     * @param {boolean} forceRefresh Force refresh from server.
     * @returns {Promise<Object>} Template object.
     */
    async getTemplate(templateId, forceRefresh = false) {
        try {
            // Check if template is in cache and not forcing refresh
            if (!forceRefresh && 
                this.templateCache.templates && 
                this.templateCache.templates[templateId]) {
                return this.templateCache.templates[templateId];
            }
            
            // Template not in cache or forcing refresh, fetch from server
            this.trigger('loading', true);
            
            const url = `${this.config.restUrl}templates/${templateId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.config.restNonce
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to fetch template: ${templateId}`);
            }
            
            const template = await response.json();
            
            // Update cache with this template
            this.templateCache.templates[templateId] = template;
            
            return template;
        } catch (error) {
            console.error(`Error fetching template ${templateId}:`, error);
            this.trigger('error', { message: `Failed to fetch template: ${templateId}`, error });
            throw error;
        } finally {
            this.trigger('loading', false);
        }
    }

    /**
     * Apply a template to the builder.
     * 
     * @param {string} templateId Template ID.
     * @returns {Promise<boolean>} Success status.
     */
    async applyTemplate(templateId) {
        try {
            this.trigger('applying', templateId);
            
            // Get the template
            const template = await this.getTemplate(templateId);
            
            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }
            
            // Check if template is locked (premium)
            if (template.locked) {
                this.trigger('premiumRequired', template);
                return false;
            }
            
            // Trigger template application event
            this.trigger('templateSelected', {
                templateId,
                template
            });
            
            return true;
        } catch (error) {
            console.error(`Error applying template ${templateId}:`, error);
            this.trigger('error', { message: `Failed to apply template: ${templateId}`, error });
            return false;
        }
    }

    /**
     * Check if a template is premium.
     * 
     * @param {string} templateId Template ID.
     * @returns {Promise<boolean>} True if premium, false otherwise.
     */
    async isPremiumTemplate(templateId) {
        try {
            const template = await this.getTemplate(templateId);
            return !!(template && template.premium);
        } catch (error) {
            console.error(`Error checking if template is premium: ${templateId}`, error);
            return false;
        }
    }

    /**
     * Clear the template cache.
     */
    clearCache() {
        this.templateCache = {
            templates: {},
            lastFetched: 0
        };
        
        console.log('Template cache cleared');
    }

    /**
     * Get template categories.
     * 
     * @returns {Promise<Array>} Array of category objects.
     */
    async getCategories() {
        try {
            const templates = await this.getTemplates();
            
            // Extract unique categories
            const categories = new Set();
            
            Object.values(templates).forEach(template => {
                if (template.category) {
                    categories.add(template.category);
                }
            });
            
            // Convert to array of objects
            return Array.from(categories).map(category => ({
                id: category,
                name: this.formatCategoryName(category)
            }));
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    /**
     * Format category name for display.
     * 
     * @param {string} category Category ID.
     * @returns {string} Formatted category name.
     */
    formatCategoryName(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Initialize the Template Manager with WordPress data.
     * 
     * @param {Object} wpData WordPress data object.
     * @returns {SectionTemplateManager} Template Manager instance.
     */
    static init(wpData) {
        return new SectionTemplateManager({
            restUrl: wpData.restUrl,
            restNonce: wpData.restNonce
        });
    }
}

// Make the SectionTemplateManager globally available
window.SectionTemplateManager = SectionTemplateManager;

// Initialize if wpData is available
document.addEventListener('DOMContentLoaded', () => {
    if (window.mkbData) {
        window.templateManager = SectionTemplateManager.init(window.mkbData);
    }
});

// Export for global access for architectural validation
window.SectionTemplateManager = SectionTemplateManager;

} // Close the conditional declaration check