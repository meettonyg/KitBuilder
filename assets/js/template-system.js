/**
 * Template System for Media Kit Builder
 * Manages template loading, switching, and customization
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function($) {
    'use strict';

    // Template System
    window.MKB_TemplateSystem = {
        
        currentTemplate: null,
        templates: {},

        /**
         * Initialize template system
         */
        init: function() {
            this.loadTemplates();
            this.bindEvents();
            console.log('📝 Template system loaded');
        },

        /**
         * Load available templates
         */
        loadTemplates: function() {
            this.templates = {
                'business': {
                    id: 'business',
                    name: 'Business Professional',
                    description: 'Clean and professional layout for business speakers',
                    category: 'business',
                    isPremium: false
                },
                'health': {
                    id: 'health',
                    name: 'Health & Wellness',
                    description: 'Calming design for health and wellness experts',
                    category: 'health',
                    isPremium: false
                },
                'tech': {
                    id: 'tech',
                    name: 'Technology Expert',
                    description: 'Modern tech-focused design',
                    category: 'technology',
                    isPremium: false
                },
                'creative': {
                    id: 'creative',
                    name: 'Creative Professional',
                    description: 'Artistic and vibrant design for creatives',
                    category: 'creative',
                    isPremium: true
                },
                'author': {
                    id: 'author',
                    name: 'Author & Writer',
                    description: 'Literary-focused design for authors',
                    category: 'writing',
                    isPremium: false
                }
            };
        },

        /**
         * Bind template-related events
         */
        bindEvents: function() {
            $(document).on('click', '.mkb-template-selector', this.handleTemplateSelection.bind(this));
            $(document).on('click', '.mkb-template-preview', this.showTemplatePreview.bind(this));
            $(document).on('mkb-template-change', this.handleTemplateChange.bind(this));
        },

        /**
         * Handle template selection
         */
        handleTemplateSelection: function(e) {
            e.preventDefault();
            const templateId = $(e.currentTarget).data('template-id');
            
            if (this.templates[templateId]) {
                this.switchTemplate(templateId);
            }
        },

        /**
         * Switch to a different template
         */
        switchTemplate: function(templateId) {
            const template = this.templates[templateId];
            
            if (!template) {
                console.error('Template not found:', templateId);
                return;
            }

            // Check if premium template and user has access
            if (template.isPremium && !this.userHasPremiumAccess()) {
                this.showUpgradePrompt(template);
                return;
            }

            this.currentTemplate = templateId;
            
            // Trigger template change event for React
            const event = new CustomEvent('mkb-template-change', {
                detail: {
                    templateId: templateId,
                    template: template
                }
            });
            
            document.dispatchEvent(event);
            console.log('🎨 Template switched to:', template.name);
        },

        /**
         * Show template preview
         */
        showTemplatePreview: function(e) {
            e.preventDefault();
            const templateId = $(e.currentTarget).data('template-id');
            const template = this.templates[templateId];
            
            if (template) {
                // Open preview modal
                this.openPreviewModal(template);
            }
        },

        /**
         * Handle template change event
         */
        handleTemplateChange: function(e) {
            const { templateId, template } = e.detail;
            
            // Update UI to reflect template change
            $('.mkb-current-template').text(template.name);
            $('.mkb-template-selector').removeClass('active');
            $(`.mkb-template-selector[data-template-id="${templateId}"]`).addClass('active');
        },

        /**
         * Check if user has premium access
         */
        userHasPremiumAccess: function() {
            return window.mkbConfig && window.mkbConfig.features && window.mkbConfig.features.premiumFeatures;
        },

        /**
         * Show upgrade prompt for premium templates
         */
        showUpgradePrompt: function(template) {
            const modal = `
                <div class="mkb-upgrade-modal">
                    <div class="mkb-modal-content">
                        <h3>Premium Template</h3>
                        <p>The "${template.name}" template is available with Guestify Pro.</p>
                        <div class="mkb-modal-actions">
                            <button class="mkb-btn mkb-btn-primary" onclick="window.open('https://guestify.com/upgrade', '_blank')">
                                Upgrade to Pro
                            </button>
                            <button class="mkb-btn mkb-btn-secondary" onclick="$(this).closest('.mkb-upgrade-modal').remove()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modal);
        },

        /**
         * Open template preview modal
         */
        openPreviewModal: function(template) {
            const modal = `
                <div class="mkb-preview-modal">
                    <div class="mkb-modal-content">
                        <div class="mkb-modal-header">
                            <h3>${template.name}</h3>
                            <button class="mkb-close-modal" onclick="$(this).closest('.mkb-preview-modal').remove()">&times;</button>
                        </div>
                        <div class="mkb-modal-body">
                            <p>${template.description}</p>
                            <div class="mkb-template-preview-area">
                                <!-- Template preview would be rendered here -->
                                <div class="mkb-preview-placeholder">
                                    Template preview for ${template.name}
                                </div>
                            </div>
                        </div>
                        <div class="mkb-modal-footer">
                            <button class="mkb-btn mkb-btn-primary" onclick="window.MKB_TemplateSystem.switchTemplate('${template.id}'); $(this).closest('.mkb-preview-modal').remove();">
                                Use This Template
                            </button>
                            <button class="mkb-btn mkb-btn-secondary" onclick="$(this).closest('.mkb-preview-modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modal);
        },

        /**
         * Get current template
         */
        getCurrentTemplate: function() {
            return this.currentTemplate ? this.templates[this.currentTemplate] : null;
        },

        /**
         * Get all templates
         */
        getAllTemplates: function() {
            return this.templates;
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        window.MKB_TemplateSystem.init();
    });

})(jQuery);
