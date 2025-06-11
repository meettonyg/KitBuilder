/**
 * Hero Component JavaScript
 * components/hero/script.js
 * 
 * Component-specific JavaScript functionality for the Hero component.
 */

(function() {
    'use strict';

    const HeroComponent = {
        
        /**
         * Initialize Hero component functionality
         */
        init: function() {
            console.log('[Hero Component] Initializing...');
            
            this.setupLiveEditing();
            this.setupImageUpload();
            this.setupAnimations();
            
            console.log('[Hero Component] Initialization complete');
        },

        /**
         * Setup live editing functionality in builder mode
         */
        setupLiveEditing: function() {
            if (!document.body.classList.contains('mkb-builder-mode')) {
                return;
            }

            const editableElements = document.querySelectorAll('.mkb-hero-component-wrapper [contenteditable="true"]');
            
            editableElements.forEach(element => {
                // Save changes on blur
                element.addEventListener('blur', function() {
                    const event = new CustomEvent('mkb-component-updated', {
                        detail: {
                            componentType: 'hero',
                            componentId: this.closest('[data-component-type="hero"]')?.dataset.componentId,
                            setting: this.dataset.setting,
                            value: this.textContent || this.innerHTML
                        }
                    });
                    document.dispatchEvent(event);
                });

                // Handle Enter key for single-line fields
                if (element.classList.contains('mkb-hero-name') || element.classList.contains('mkb-hero-title')) {
                    element.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.blur();
                        }
                    });
                }

                // Handle paste events to clean up formatting
                element.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text');
                    document.execCommand('insertText', false, text);
                });
            });
        },

        /**
         * Setup profile image upload functionality
         */
        setupImageUpload: function() {
            if (!document.body.classList.contains('mkb-builder-mode')) {
                return;
            }

            const heroAvatars = document.querySelectorAll('.mkb-hero-avatar');
            
            heroAvatars.forEach(avatar => {
                // Add click handler for image upload
                avatar.addEventListener('click', function() {
                    const componentId = this.closest('[data-component-type="hero"]')?.dataset.componentId;
                    if (!componentId) return;

                    // This would trigger the WordPress media library
                    console.log('[Hero Component] Image upload clicked for component:', componentId);
                    
                    // For now, just show a placeholder message
                    if (this.querySelector('.mkb-profile-placeholder')) {
                        alert('Image upload functionality will be implemented with WordPress media library integration.');
                    }
                });

                // Add hover effect for better UX
                avatar.style.cursor = 'pointer';
                
                avatar.addEventListener('mouseenter', function() {
                    if (this.querySelector('.mkb-profile-placeholder')) {
                        this.style.opacity = '0.8';
                    }
                });

                avatar.addEventListener('mouseleave', function() {
                    this.style.opacity = '1';
                });
            });
        },

        /**
         * Setup animation functionality
         */
        setupAnimations: function() {
            const heroSections = document.querySelectorAll('.mkb-hero-component-wrapper');
            
            heroSections.forEach(heroSection => {
                // Check if animations are enabled
                if (!heroSection.classList.contains('enable-animations')) {
                    return;
                }

                // Setup intersection observer for entrance animations
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('animate-in');
                                observer.unobserve(entry.target);
                            }
                        });
                    }, {
                        threshold: 0.2
                    });

                    observer.observe(heroSection);
                }
            });
        },

        /**
         * Handle component settings update
         */
        updateSettings: function(componentId, settings) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component || component.dataset.componentType !== 'hero') return;

            console.log('[Hero Component] Updating settings for:', componentId, settings);

            // Update text alignment
            if (settings.text_alignment) {
                component.classList.remove('text-left', 'text-center', 'text-right');
                component.classList.add(`text-${settings.text_alignment}`);
            }

            // Update background style
            if (settings.background_style) {
                component.classList.remove('bg-gradient', 'bg-solid', 'bg-image');
                component.classList.add(`bg-${settings.background_style}`);
            }

            // Update profile image visibility
            if (typeof settings.show_profile_image !== 'undefined') {
                const avatar = component.querySelector('.mkb-hero-avatar');
                if (avatar) {
                    avatar.style.display = settings.show_profile_image ? 'flex' : 'none';
                }
            }

            // Update profile image style
            if (settings.profile_image_style) {
                const avatar = component.querySelector('.mkb-hero-avatar');
                if (avatar) {
                    avatar.classList.remove('mkb-profile-image-circle', 'mkb-profile-image-rounded', 'mkb-profile-image-square');
                    avatar.classList.add(`mkb-profile-image-${settings.profile_image_style}`);
                }
            }

            // Update animations
            if (typeof settings.enable_animations !== 'undefined') {
                if (settings.enable_animations) {
                    component.classList.add('enable-animations');
                } else {
                    component.classList.remove('enable-animations');
                }
            }

            // Update text content
            ['full_name', 'professional_title', 'tagline'].forEach(setting => {
                if (settings[setting] !== undefined) {
                    const element = component.querySelector(`.mkb-hero-${setting.replace('_', '-')}`);
                    if (element) {
                        if (setting === 'tagline') {
                            element.innerHTML = settings[setting];
                        } else {
                            element.textContent = settings[setting];
                        }
                    }
                }
            });
        },

        /**
         * Get component data for saving
         */
        getComponentData: function(componentId) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component || component.dataset.componentType !== 'hero') return null;

            const data = {
                type: 'hero',
                settings: {}
            };

            // Extract text content
            const nameEl = component.querySelector('.mkb-hero-name');
            if (nameEl) data.settings.full_name = nameEl.textContent;

            const titleEl = component.querySelector('.mkb-hero-title');
            if (titleEl) data.settings.professional_title = titleEl.textContent;

            const taglineEl = component.querySelector('.mkb-hero-tagline');
            if (taglineEl) data.settings.tagline = taglineEl.innerHTML;

            // Extract styling settings
            if (component.classList.contains('text-left')) data.settings.text_alignment = 'left';
            else if (component.classList.contains('text-right')) data.settings.text_alignment = 'right';
            else data.settings.text_alignment = 'center';

            if (component.classList.contains('bg-solid')) data.settings.background_style = 'solid';
            else if (component.classList.contains('bg-image')) data.settings.background_style = 'image';
            else data.settings.background_style = 'gradient';

            // Extract profile image settings
            const avatar = component.querySelector('.mkb-hero-avatar');
            if (avatar) {
                data.settings.show_profile_image = avatar.style.display !== 'none';
                
                if (avatar.classList.contains('mkb-profile-image-rounded')) {
                    data.settings.profile_image_style = 'rounded';
                } else if (avatar.classList.contains('mkb-profile-image-square')) {
                    data.settings.profile_image_style = 'square';
                } else {
                    data.settings.profile_image_style = 'circle';
                }
            }

            data.settings.enable_animations = component.classList.contains('enable-animations');

            return data;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            HeroComponent.init();
        });
    } else {
        HeroComponent.init();
    }

    // Make HeroComponent available globally for the builder
    window.GuestifyMKB = window.GuestifyMKB || {};
    window.GuestifyMKB.Components = window.GuestifyMKB.Components || {};
    window.GuestifyMKB.Components.Hero = HeroComponent;

})();