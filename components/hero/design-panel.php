<?php
/**
 * Hero Component Design Panel
 * File: components/hero/design-panel.php
 */

// Ensure this file is not accessed directly
if ( ! defined( 'WPINC' ) ) {
    die( 'Direct access not allowed.' );
}
?>

<div class="hero-design-panel">
    <!-- Full Name Setting -->
    <div class="form-group">
        <label class="form-label" for="hero-full-name-input">Full Name</label>
        <input type="text" 
               class="form-input design-panel-input" 
               id="hero-full-name-input" 
               data-setting="full_name"
               placeholder="Your Full Name">
        <small class="form-help">The main name displayed in the hero section</small>
    </div>

    <!-- Professional Title Setting -->
    <div class="form-group">
        <label class="form-label" for="hero-professional-title-input">Professional Title</label>
        <input type="text" 
               class="form-input design-panel-input" 
               id="hero-professional-title-input" 
               data-setting="professional_title"
               placeholder="Your Professional Title">
        <small class="form-help">Your job title, role, or professional designation</small>
    </div>

    <!-- Tagline Setting -->
    <div class="form-group">
        <label class="form-label" for="hero-tagline-textarea">Tagline/Brief Description</label>
        <textarea class="form-input form-textarea design-panel-input" 
                  id="hero-tagline-textarea" 
                  data-setting="tagline" 
                  rows="3"
                  placeholder="A compelling tagline that describes what makes you unique..."></textarea>
        <small class="form-help">Brief description or compelling statement about your expertise</small>
    </div>

    <!-- Profile Image Settings -->
    <div class="form-group">
        <label class="form-label checkbox-label">
            <input type="checkbox" 
                   class="design-panel-input" 
                   id="hero-show-profile-image-checkbox" 
                   data-setting="show_profile_image"
                   checked> 
            <span class="checkbox-text">Show Profile Image</span>
        </label>
        <small class="form-help">Display profile photo in the hero section</small>
    </div>

    <div class="form-group" id="hero-profile-image-style-group">
        <label class="form-label" for="hero-profile-image-style-select">Profile Image Style</label>
        <select class="form-input design-panel-input" 
                id="hero-profile-image-style-select" 
                data-setting="profile_image_style">
            <option value="circle">Circle</option>
            <option value="rounded">Rounded Square</option>
            <option value="square">Square</option>
        </select>
        <small class="form-help">Shape of the profile image</small>
    </div>

    <!-- Layout Settings -->
    <div class="form-group">
        <label class="form-label" for="hero-text-alignment-select">Text Alignment</label>
        <select class="form-input design-panel-input" 
                id="hero-text-alignment-select" 
                data-setting="text_alignment">
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
        </select>
        <small class="form-help">Alignment of text content in the hero section</small>
    </div>

    <!-- Background Style Settings -->
    <div class="form-group">
        <label class="form-label" for="hero-background-style-select">Background Style</label>
        <select class="form-input design-panel-input" 
                id="hero-background-style-select" 
                data-setting="background_style">
            <option value="gradient">Gradient Background</option>
            <option value="solid">Solid Color</option>
            <option value="image">Background Image</option>
        </select>
        <small class="form-help">Visual style for the hero section background</small>
    </div>

    <!-- Advanced Settings (Collapsible) -->
    <div class="form-group advanced-settings">
        <button type="button" class="settings-toggle" onclick="this.parentElement.classList.toggle('expanded')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
            Advanced Settings
        </button>
        
        <div class="advanced-content">
            <!-- Custom CSS Classes -->
            <div class="form-group">
                <label class="form-label" for="hero-custom-classes-input">Custom CSS Classes</label>
                <input type="text" 
                       class="form-input design-panel-input" 
                       id="hero-custom-classes-input" 
                       data-setting="custom_classes"
                       placeholder="custom-class another-class">
                <small class="form-help">Additional CSS classes for custom styling</small>
            </div>

            <!-- Animation Settings -->
            <div class="form-group">
                <label class="form-label checkbox-label">
                    <input type="checkbox" 
                           class="design-panel-input" 
                           id="hero-enable-animations-checkbox" 
                           data-setting="enable_animations"> 
                    <span class="checkbox-text">Enable entrance animations</span>
                </label>
                <small class="form-help">Add subtle animations when the hero section comes into view</small>
            </div>
        </div>
    </div>

    <!-- Component Actions -->
    <div class="form-group component-actions">
        <h4 class="actions-title">Component Actions</h4>
        <div class="actions-buttons">
            <button type="button" 
                    class="action-btn duplicate-btn" 
                    data-action="duplicate" 
                    data-component-type="hero">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Duplicate
            </button>
            <button type="button" 
                    class="action-btn delete-btn" 
                    data-action="delete" 
                    data-component-type="hero">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
                </svg>
                Delete
            </button>
        </div>
    </div>
</div>

<style>
/* Hero Design Panel Specific Styles */
.hero-design-panel .form-help {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}

.hero-design-panel .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
}

.hero-design-panel .checkbox-text {
    flex: 1;
}

.hero-design-panel .advanced-settings {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.hero-design-panel .settings-toggle {
    background: none;
    border: none;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    transition: color 0.2s;
}

.hero-design-panel .settings-toggle:hover {
    color: #0ea5e9;
}

.hero-design-panel .settings-toggle svg {
    transition: transform 0.2s;
}

.hero-design-panel .advanced-settings.expanded .settings-toggle svg {
    transform: rotate(180deg);
}

.hero-design-panel .advanced-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.hero-design-panel .advanced-settings.expanded .advanced-content {
    max-height: 500px;
    margin-top: 12px;
}

.hero-design-panel .component-actions {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.hero-design-panel .actions-title {
    color: #e2e8f0;
    font-size: 13px;
    margin-bottom: 12px;
    font-weight: 500;
}

.hero-design-panel .actions-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.hero-design-panel .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #404040;
    background: transparent;
    color: #e2e8f0;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.hero-design-panel .action-btn:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.hero-design-panel .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
}
</style>

<script>
(function() {
    console.log('[Hero Design Panel] Initializing...');
    
    try {
        // Profile Image Visibility Handler
        function initProfileImageHandler() {
            const showImageCheckbox = document.getElementById('hero-show-profile-image-checkbox');
            const imageStyleGroup = document.getElementById('hero-profile-image-style-group');
            
            if (!showImageCheckbox || !imageStyleGroup) {
                console.warn('[Hero Design Panel] Profile image elements not found');
                return;
            }
            
            function updateImageStyleVisibility() {
                try {
                    const showImage = showImageCheckbox.checked;
                    imageStyleGroup.style.display = showImage ? 'block' : 'none';
                    
                    console.log(`[Hero Design Panel] Image style group ${showImage ? 'shown' : 'hidden'}`);
                    
                    // Update preview
                    if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'hero') {
                        const heroAvatar = window.GuestifyMKB.selectedElement.querySelector('.mkb-hero-avatar');
                        if (heroAvatar) {
                            heroAvatar.style.display = showImage ? 'block' : 'none';
                        }
                    }
                } catch (error) {
                    console.error('[Hero Design Panel] Error in updateImageStyleVisibility:', error);
                }
            }
            
            showImageCheckbox.addEventListener('change', updateImageStyleVisibility);
            updateImageStyleVisibility(); // Initial check
        }
        
        // Text Alignment Handler
        function initTextAlignmentHandler() {
            try {
                const alignmentSelect = document.getElementById('hero-text-alignment-select');
                
                if (!alignmentSelect) return;
                
                alignmentSelect.addEventListener('change', function() {
                    try {
                        const alignment = this.value;
                        
                        // Update preview alignment
                        if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'hero') {
                            const heroSection = window.GuestifyMKB.selectedElement;
                            
                            // Remove existing alignment classes
                            heroSection.classList.remove('text-left', 'text-center', 'text-right');
                            
                            // Add new alignment class
                            heroSection.classList.add(`text-${alignment}`);
                            
                            console.log(`[Hero Design Panel] Text alignment updated to: ${alignment}`);
                        }
                    } catch (error) {
                        console.error('[Hero Design Panel] Error in text alignment handler:', error);
                    }
                });
            } catch (error) {
                console.error('[Hero Design Panel] Error in initTextAlignmentHandler:', error);
            }
        }
        
        // Background Style Handler
        function initBackgroundStyleHandler() {
            try {
                const backgroundSelect = document.getElementById('hero-background-style-select');
                
                if (!backgroundSelect) return;
                
                backgroundSelect.addEventListener('change', function() {
                    try {
                        const backgroundStyle = this.value;
                        
                        // Update preview background
                        if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'hero') {
                            const heroSection = window.GuestifyMKB.selectedElement;
                            
                            // Remove existing background classes
                            heroSection.classList.remove('bg-gradient', 'bg-solid', 'bg-image');
                            
                            // Add new background class
                            heroSection.classList.add(`bg-${backgroundStyle}`);
                            
                            console.log(`[Hero Design Panel] Background style updated to: ${backgroundStyle}`);
                        }
                    } catch (error) {
                        console.error('[Hero Design Panel] Error in background style handler:', error);
                    }
                });
            } catch (error) {
                console.error('[Hero Design Panel] Error in initBackgroundStyleHandler:', error);
            }
        }
        
        // Component Action Handler
        function initComponentActions() {
            try {
                document.addEventListener('click', function(e) {
                    try {
                        const actionBtn = e.target.closest('.action-btn');
                        if (!actionBtn || actionBtn.dataset.componentType !== 'hero') return;
                        
                        const action = actionBtn.dataset.action;
                        const selectedElement = window.GuestifyMKB?.selectedElement;
                        
                        if (!selectedElement || selectedElement.dataset.componentType !== 'hero') {
                            console.warn('[Hero Design Panel] No Hero component selected for action:', action);
                            return;
                        }
                        
                        const componentId = selectedElement.dataset.componentId;
                        console.log(`[Hero Design Panel] Executing ${action} for Hero component ${componentId}`);
                        
                        if (action === 'delete') {
                            if (confirm('Are you sure you want to delete this Hero section?')) {
                                selectedElement.remove();
                                if (window.GuestifyMKB.ElementSelection?.deselectAllElements) {
                                    window.GuestifyMKB.ElementSelection.deselectAllElements();
                                }
                                console.log('[Hero Design Panel] Hero component deleted');
                            }
                        } else if (action === 'duplicate') {
                            alert('Component duplication is coming in a future update!');
                        }
                    } catch (actionError) {
                        console.error('[Hero Design Panel] Action handler error:', actionError);
                    }
                });
            } catch (error) {
                console.error('[Hero Design Panel] Error in initComponentActions:', error);
            }
        }
        
        // Initialize all handlers
        initProfileImageHandler();
        initTextAlignmentHandler();
        initBackgroundStyleHandler();
        initComponentActions();
        
        console.log('[Hero Design Panel] Initialization complete');
        
    } catch (error) {
        console.error('[Hero Design Panel] Critical initialization error:', error);
    }
})();
</script>