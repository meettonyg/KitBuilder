/**
 * Bio Component JavaScript
 * components/bio/script.js
 * 
 * Component-specific JavaScript functionality for the Bio component.
 * This file is automatically loaded when the Bio component is present.
 */

(function() {
    'use strict';

    // Bio component specific functionality
    const BioComponent = {
        
        /**
         * Initialize Bio component functionality
         */
        init: function() {
            console.log('[Bio Component] Initializing...');
            
            // Add any Bio-specific functionality here
            this.setupReadMoreFunctionality();
            this.setupLiveEditing();
            
            console.log('[Bio Component] Initialization complete');
        },

        /**
         * Setup Read More/Less functionality for long biography text
         */
        setupReadMoreFunctionality: function() {
            const bioTexts = document.querySelectorAll('.mkb-bio-text');
            
            bioTexts.forEach(bioText => {
                const component = bioText.closest('[data-component-type="bio"]');
                if (!component) return;
                
                // Check if read more is enabled for this component
                const componentId = component.dataset.componentId;
                // This would check the component settings to see if read more is enabled
                // For now, we'll skip implementation as it requires the settings system
            });
        },

        /**
         * Setup live editing functionality in builder mode
         */
        setupLiveEditing: function() {
            // Only run in builder/editor mode
            if (!document.body.classList.contains('mkb-builder-mode')) {
                return;
            }

            const bioTexts = document.querySelectorAll('.mkb-bio-text[contenteditable="true"]');
            
            bioTexts.forEach(bioText => {
                // Add event listeners for live editing
                bioText.addEventListener('blur', function() {
                    // Trigger save/update when user finishes editing
                    const event = new CustomEvent('mkb-component-updated', {
                        detail: {
                            componentType: 'bio',
                            componentId: this.closest('[data-component-type="bio"]')?.dataset.componentId,
                            setting: this.dataset.setting,
                            value: this.innerHTML
                        }
                    });
                    document.dispatchEvent(event);
                });

                // Prevent Enter key from creating new divs (use <p> instead)
                bioText.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        document.execCommand('insertHTML', false, '<br><br>');
                    }
                });
            });
        },

        /**
         * Handle component settings update
         */
        updateSettings: function(componentId, settings) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component) return;

            // Update component based on new settings
            // This is called when settings are changed in the design panel
            console.log('[Bio Component] Updating settings for:', componentId, settings);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            BioComponent.init();
        });
    } else {
        BioComponent.init();
    }

    // Make BioComponent available globally for the builder
    window.GuestifyMKB = window.GuestifyMKB || {};
    window.GuestifyMKB.Components = window.GuestifyMKB.Components || {};
    window.GuestifyMKB.Components.Bio = BioComponent;

})();