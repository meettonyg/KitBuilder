<?php
/**
 * Bio Component Design Panel (Enhanced for Dynamic Loading)
 * File: components/bio/design-panel.php
 *
 * This file is loaded dynamically via AJAX when a Bio component is selected.
 * It provides the HTML structure for the settings panel in the editor.
 */

// Ensure this file is not accessed directly
if ( ! defined( 'WPINC' ) ) {
    die( 'Direct access not allowed.' );
}

// Note: $component_type is available from the AJAX handler if needed
?>

<div class="bio-design-panel">
    <!-- Section Title Setting -->
    <div class="form-group">
        <label class="form-label" for="bio-section-title-input">Section Title</label>
        <input type="text" 
               class="form-input design-panel-input" 
               id="bio-section-title-input" 
               data-setting="section_title"
               placeholder="About Me">
        <small class="form-help">The heading that appears above your biography section</small>
    </div>

    <!-- Content Source Setting -->
    <div class="form-group">
        <label class="form-label" for="bio-content-source-select">Content Source</label>
        <select class="form-input design-panel-input" 
                id="bio-content-source-select" 
                data-setting="content_source">
            <option value="pods_biography">Guest "Biography" Field (Pods)</option>
            <option value="post_content">Guest Main Content Area</option>
            <option value="custom_text">Custom Text (Editable in Preview)</option>
        </select>
        <small class="form-help">Choose where the biography text should come from</small>
    </div>

    <!-- Custom Text Content (shown/hidden based on source) -->
    <div class="form-group" id="bio-custom-text-group" style="display: none;">
        <label class="form-label" for="bio-custom-text-content-textarea">Custom Biography Text</label>
        <textarea class="form-input form-textarea design-panel-input" 
                  id="bio-custom-text-content-textarea" 
                  data-setting="custom_text_content" 
                  rows="6"
                  placeholder="Enter your biography text here..."></textarea>
        <small class="form-help">
            Enter your bio here if "Custom Text" is selected. This text can also be edited directly in the preview area. 
            Supports basic HTML formatting.
        </small>
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
            <!-- Text Alignment -->
            <div class="form-group">
                <label class="form-label" for="bio-text-alignment-select">Text Alignment</label>
                <select class="form-input design-panel-input" 
                        id="bio-text-alignment-select" 
                        data-setting="text_alignment">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justified</option>
                </select>
            </div>

            <!-- Read More Toggle -->
            <div class="form-group">
                <label class="form-label checkbox-label">
                    <input type="checkbox" 
                           class="design-panel-input" 
                           id="bio-show-read-more-checkbox" 
                           data-setting="show_read_more"> 
                    <span class="checkbox-text">Show "Read More" toggle for long text</span>
                </label>
                <small class="form-help">Automatically truncate long biographies with expand/collapse functionality</small>
            </div>

            <!-- Character Limit for Read More -->
            <div class="form-group" id="bio-read-more-limit-group" style="display: none;">
                <label class="form-label" for="bio-read-more-limit-input">Character Limit</label>
                <input type="number" 
                       class="form-input design-panel-input" 
                       id="bio-read-more-limit-input" 
                       data-setting="read_more_limit"
                       min="100" 
                       max="1000" 
                       value="300"
                       placeholder="300">
                <small class="form-help">Number of characters to show before "Read More" link</small>
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
                    data-component-type="bio">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Duplicate
            </button>
            <button type="button" 
                    class="action-btn delete-btn" 
                    data-action="delete" 
                    data-component-type="bio">
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
/* Bio Design Panel Specific Styles */
.bio-design-panel .form-help {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}

.bio-design-panel .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
}

.bio-design-panel .checkbox-text {
    flex: 1;
}

.bio-design-panel .advanced-settings {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.bio-design-panel .settings-toggle {
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

.bio-design-panel .settings-toggle:hover {
    color: #0ea5e9;
}

.bio-design-panel .settings-toggle svg {
    transition: transform 0.2s;
}

.bio-design-panel .advanced-settings.expanded .settings-toggle svg {
    transform: rotate(180deg);
}

.bio-design-panel .advanced-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.bio-design-panel .advanced-settings.expanded .advanced-content {
    max-height: 500px;
    margin-top: 12px;
}

.bio-design-panel .component-actions {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.bio-design-panel .actions-title {
    color: #e2e8f0;
    font-size: 13px;
    margin-bottom: 12px;
    font-weight: 500;
}

.bio-design-panel .actions-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.bio-design-panel .action-btn {
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

.bio-design-panel .action-btn:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.bio-design-panel .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
}
</style>

<script>
(function() {
    console.log('[Bio Design Panel] Initializing...');
    
    // Wrap everything in a try-catch to prevent panel errors
    try {
        // Content Source Change Handler
        function initContentSourceHandler() {
            const contentSourceSelect = document.getElementById('bio-content-source-select');
            const customTextGroup = document.getElementById('bio-custom-text-group');
            
            if (!contentSourceSelect || !customTextGroup) {
                console.warn('[Bio Design Panel] Content source elements not found');
                return;
            }
            
            function updateCustomTextVisibility() {
                try {
                    const isCustomText = contentSourceSelect.value === 'custom_text';
                    customTextGroup.style.display = isCustomText ? 'block' : 'none';
                    
                    console.log(`[Bio Design Panel] Custom text group ${isCustomText ? 'shown' : 'hidden'}`);
                    
                    // Update contenteditable status in preview
                    if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'bio') {
                        const bioTextEl = window.GuestifyMKB.selectedElement.querySelector('.mkb-bio-text');
                        if (bioTextEl) {
                            if (isCustomText) {
                                bioTextEl.setAttribute('contenteditable', 'true');
                                bioTextEl.setAttribute('data-setting', 'custom_text_content');
                            } else {
                                bioTextEl.removeAttribute('contenteditable');
                                bioTextEl.removeAttribute('data-setting');
                            }
                            console.log(`[Bio Design Panel] Updated contenteditable: ${isCustomText}`);
                        }
                    }
                } catch (error) {
                    console.error('[Bio Design Panel] Error in updateCustomTextVisibility:', error);
                }
            }
            
            contentSourceSelect.addEventListener('change', updateCustomTextVisibility);
            updateCustomTextVisibility(); // Initial check
        }
        
        // Read More Limit Handler
        function initReadMoreHandler() {
            try {
                const readMoreCheckbox = document.getElementById('bio-show-read-more-checkbox');
                const limitGroup = document.getElementById('bio-read-more-limit-group');
                
                if (!readMoreCheckbox || !limitGroup) return;
                
                function updateLimitVisibility() {
                    try {
                        limitGroup.style.display = readMoreCheckbox.checked ? 'block' : 'none';
                    } catch (error) {
                        console.error('[Bio Design Panel] Error in updateLimitVisibility:', error);
                    }
                }
                
                readMoreCheckbox.addEventListener('change', updateLimitVisibility);
                updateLimitVisibility(); // Initial check
            } catch (error) {
                console.error('[Bio Design Panel] Error in initReadMoreHandler:', error);
            }
        }
        
        // Component Action Handler
        function initComponentActions() {
            try {
                document.addEventListener('click', function(e) {
                    try {
                        const actionBtn = e.target.closest('.action-btn');
                        if (!actionBtn || actionBtn.dataset.componentType !== 'bio') return;
                        
                        const action = actionBtn.dataset.action;
                        const selectedElement = window.GuestifyMKB?.selectedElement;
                        
                        if (!selectedElement || selectedElement.dataset.componentType !== 'bio') {
                            console.warn('[Bio Design Panel] No Bio component selected for action:', action);
                            return;
                        }
                        
                        const componentId = selectedElement.dataset.componentId;
                        console.log(`[Bio Design Panel] Executing ${action} for Bio component ${componentId}`);
                        
                        if (action === 'delete') {
                            if (confirm('Are you sure you want to delete this Biography component?')) {
                                // Queue deletion
                                if (window.GuestifyMKB.OperationQueue) {
                                    window.GuestifyMKB.OperationQueue.addOperation(async () => {
                                        try {
                                            if (window.GuestifyMKB.Ajax?.deleteComponent) {
                                                await window.GuestifyMKB.Ajax.deleteComponent(componentId);
                                            }
                                            selectedElement.remove();
                                            if (window.GuestifyMKB.ElementSelection?.deselectAllElements) {
                                                window.GuestifyMKB.ElementSelection.deselectAllElements();
                                            }
                                            console.log('[Bio Design Panel] Bio component deleted');
                                        } catch (error) {
                                            console.error('[Bio Design Panel] Delete failed:', error);
                                            alert('Failed to delete component. Please try again.');
                                        }
                                    }, 5);
                                } else {
                                    // Direct delete if no operation queue
                                    selectedElement.remove();
                                    if (window.GuestifyMKB.ElementSelection?.deselectAllElements) {
                                        window.GuestifyMKB.ElementSelection.deselectAllElements();
                                    }
                                    console.log('[Bio Design Panel] Bio component deleted (direct)');
                                }
                            }
                        } else if (action === 'duplicate') {
                            alert('Component duplication is coming in a future update!');
                        }
                    } catch (actionError) {
                        console.error('[Bio Design Panel] Action handler error:', actionError);
                    }
                });
            } catch (error) {
                console.error('[Bio Design Panel] Error in initComponentActions:', error);
            }
        }
        
        // Initialize all handlers
        initContentSourceHandler();
        initReadMoreHandler();
        initComponentActions();
        
        console.log('[Bio Design Panel] Initialization complete');
        
    } catch (error) {
        console.error('[Bio Design Panel] Critical initialization error:', error);
        // Don't let panel errors break the entire system
    }
})();
</script>