<?php
/**
 * Topics Component Design Panel
 * File: components/topics/design-panel.php
 */

// Ensure this file is not accessed directly
if ( ! defined( 'WPINC' ) ) {
    die( 'Direct access not allowed.' );
}
?>

<div class="topics-design-panel">
    <!-- Section Title Setting -->
    <div class="form-group">
        <label class="form-label" for="topics-section-title-input">Section Title</label>
        <input type="text" 
               class="form-input design-panel-input" 
               id="topics-section-title-input" 
               data-setting="section_title"
               placeholder="Speaking Topics">
        <small class="form-help">The heading that appears above your topics section</small>
    </div>

    <!-- Content Source Setting -->
    <div class="form-group">
        <label class="form-label" for="topics-content-source-select">Content Source</label>
        <select class="form-input design-panel-input" 
                id="topics-content-source-select" 
                data-setting="content_source">
            <option value="pods_topics">Guest Topics Fields (Pods)</option>
            <option value="custom_topics">Custom Topics (Editable in Preview)</option>
        </select>
        <small class="form-help">Choose where the topics data should come from</small>
    </div>

    <!-- Custom Topics Content (shown/hidden based on source) -->
    <div class="form-group" id="topics-custom-topics-group" style="display: none;">
        <label class="form-label" for="topics-custom-topics-textarea">Custom Topics</label>
        <textarea class="form-input form-textarea design-panel-input" 
                  id="topics-custom-topics-textarea" 
                  data-setting="custom_topics" 
                  rows="6"
                  placeholder="Enter one topic per line&#10;Technology Innovation&#10;Digital Transformation&#10;Leadership Development"></textarea>
        <small class="form-help">Enter one topic per line. You can also edit topics directly in the preview area.</small>
    </div>

    <!-- Display Settings -->
    <div class="form-group">
        <label class="form-label" for="topics-grid-columns-select">Grid Columns</label>
        <select class="form-input design-panel-input" 
                id="topics-grid-columns-select" 
                data-setting="grid_columns">
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
            <option value="4">4 Columns</option>
        </select>
        <small class="form-help">Number of columns in the topics grid</small>
    </div>

    <div class="form-group">
        <label class="form-label" for="topics-max-topics-input">Maximum Topics to Display</label>
        <input type="number" 
               class="form-input design-panel-input" 
               id="topics-max-topics-input" 
               data-setting="max_topics"
               min="1" 
               max="12" 
               value="6"
               placeholder="6">
        <small class="form-help">Limit the number of topics shown (1-12)</small>
    </div>

    <div class="form-group">
        <label class="form-label" for="topics-topic-style-select">Topic Style</label>
        <select class="form-input design-panel-input" 
                id="topics-topic-style-select" 
                data-setting="topic_style">
            <option value="cards">Card Style</option>
            <option value="badges">Badge Style</option>
            <option value="minimal">Minimal List</option>
        </select>
        <small class="form-help">Visual style for displaying topics</small>
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
            <!-- Color Customization -->
            <div class="form-group">
                <label class="form-label" for="topics-accent-color-input">Accent Color</label>
                <div class="color-picker">
                    <input type="color" 
                           class="color-input design-panel-input" 
                           id="topics-accent-color-input" 
                           data-setting="accent_color"
                           value="#0ea5e9">
                    <input type="text" 
                           class="form-input" 
                           id="topics-accent-color-text" 
                           value="#0ea5e9"
                           placeholder="#0ea5e9">
                </div>
                <small class="form-help">Color used for topic borders and accents</small>
            </div>

            <!-- Animation Settings -->
            <div class="form-group">
                <label class="form-label checkbox-label">
                    <input type="checkbox" 
                           class="design-panel-input" 
                           id="topics-enable-hover-effects-checkbox" 
                           data-setting="enable_hover_effects"
                           checked> 
                    <span class="checkbox-text">Enable hover effects</span>
                </label>
                <small class="form-help">Add interactive hover animations to topics</small>
            </div>

            <!-- Custom CSS -->
            <div class="form-group">
                <label class="form-label" for="topics-custom-classes-input">Custom CSS Classes</label>
                <input type="text" 
                       class="form-input design-panel-input" 
                       id="topics-custom-classes-input" 
                       data-setting="custom_classes"
                       placeholder="custom-class another-class">
                <small class="form-help">Additional CSS classes for custom styling</small>
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
                    data-component-type="topics">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Duplicate
            </button>
            <button type="button" 
                    class="action-btn delete-btn" 
                    data-action="delete" 
                    data-component-type="topics">
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
/* Topics Design Panel Specific Styles */
.topics-design-panel .form-help {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}

.topics-design-panel .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
}

.topics-design-panel .checkbox-text {
    flex: 1;
}

.topics-design-panel .color-picker {
    display: flex;
    align-items: center;
    gap: 8px;
}

.topics-design-panel .color-input {
    width: 40px;
    height: 32px;
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
    background: none;
}

.topics-design-panel .advanced-settings {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.topics-design-panel .settings-toggle {
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

.topics-design-panel .settings-toggle:hover {
    color: #0ea5e9;
}

.topics-design-panel .settings-toggle svg {
    transition: transform 0.2s;
}

.topics-design-panel .advanced-settings.expanded .settings-toggle svg {
    transform: rotate(180deg);
}

.topics-design-panel .advanced-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.topics-design-panel .advanced-settings.expanded .advanced-content {
    max-height: 500px;
    margin-top: 12px;
}

.topics-design-panel .component-actions {
    border-top: 1px solid #404040;
    padding-top: 16px;
    margin-top: 16px;
}

.topics-design-panel .actions-title {
    color: #e2e8f0;
    font-size: 13px;
    margin-bottom: 12px;
    font-weight: 500;
}

.topics-design-panel .actions-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.topics-design-panel .action-btn {
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

.topics-design-panel .action-btn:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.topics-design-panel .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
}
</style>

<script>
(function() {
    console.log('[Topics Design Panel] Initializing...');
    
    try {
        // Content Source Change Handler
        function initContentSourceHandler() {
            const contentSourceSelect = document.getElementById('topics-content-source-select');
            const customTopicsGroup = document.getElementById('topics-custom-topics-group');
            
            if (!contentSourceSelect || !customTopicsGroup) {
                console.warn('[Topics Design Panel] Content source elements not found');
                return;
            }
            
            function updateCustomTopicsVisibility() {
                try {
                    const isCustomTopics = contentSourceSelect.value === 'custom_topics';
                    customTopicsGroup.style.display = isCustomTopics ? 'block' : 'none';
                    
                    console.log(`[Topics Design Panel] Custom topics group ${isCustomTopics ? 'shown' : 'hidden'}`);
                } catch (error) {
                    console.error('[Topics Design Panel] Error in updateCustomTopicsVisibility:', error);
                }
            }
            
            contentSourceSelect.addEventListener('change', updateCustomTopicsVisibility);
            updateCustomTopicsVisibility(); // Initial check
        }
        
        // Grid Columns Handler
        function initGridColumnsHandler() {
            try {
                const columnsSelect = document.getElementById('topics-grid-columns-select');
                
                if (!columnsSelect) return;
                
                columnsSelect.addEventListener('change', function() {
                    try {
                        const columns = this.value;
                        
                        // Update preview grid
                        if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'topics') {
                            const topicsGrid = window.GuestifyMKB.selectedElement.querySelector('.mkb-topics-grid');
                            if (topicsGrid) {
                                // Remove existing column classes
                                topicsGrid.classList.remove('topics-columns-2', 'topics-columns-3', 'topics-columns-4');
                                // Add new column class
                                topicsGrid.classList.add(`topics-columns-${columns}`);
                                topicsGrid.dataset.columns = columns;
                                
                                console.log(`[Topics Design Panel] Grid columns updated to: ${columns}`);
                            }
                        }
                    } catch (error) {
                        console.error('[Topics Design Panel] Error in grid columns handler:', error);
                    }
                });
            } catch (error) {
                console.error('[Topics Design Panel] Error in initGridColumnsHandler:', error);
            }
        }
        
        // Topic Style Handler
        function initTopicStyleHandler() {
            try {
                const styleSelect = document.getElementById('topics-topic-style-select');
                
                if (!styleSelect) return;
                
                styleSelect.addEventListener('change', function() {
                    try {
                        const style = this.value;
                        
                        // Update preview style
                        if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'topics') {
                            const component = window.GuestifyMKB.selectedElement;
                            
                            // Remove existing style classes
                            component.classList.remove('topics-style-cards', 'topics-style-badges', 'topics-style-minimal');
                            
                            // Add new style class
                            component.classList.add(`topics-style-${style}`);
                            
                            console.log(`[Topics Design Panel] Topic style updated to: ${style}`);
                        }
                    } catch (error) {
                        console.error('[Topics Design Panel] Error in topic style handler:', error);
                    }
                });
            } catch (error) {
                console.error('[Topics Design Panel] Error in initTopicStyleHandler:', error);
            }
        }
        
        // Color Picker Handler
        function initColorPickerHandler() {
            try {
                const colorInput = document.getElementById('topics-accent-color-input');
                const colorText = document.getElementById('topics-accent-color-text');
                
                if (!colorInput || !colorText) return;
                
                colorInput.addEventListener('input', function() {
                    colorText.value = this.value;
                    updateAccentColor(this.value);
                });
                
                colorText.addEventListener('input', function() {
                    if (isValidColor(this.value)) {
                        colorInput.value = this.value;
                        updateAccentColor(this.value);
                    }
                });
                
                function updateAccentColor(color) {
                    if (window.GuestifyMKB?.selectedElement?.dataset?.componentType === 'topics') {
                        const component = window.GuestifyMKB.selectedElement;
                        component.style.setProperty('--topics-accent-color', color);
                    }
                }
                
                function isValidColor(color) {
                    const s = new Option().style;
                    s.color = color;
                    return s.color !== '';
                }
            } catch (error) {
                console.error('[Topics Design Panel] Error in initColorPickerHandler:', error);
            }
        }
        
        // Component Action Handler
        function initComponentActions() {
            try {
                document.addEventListener('click', function(e) {
                    try {
                        const actionBtn = e.target.closest('.action-btn');
                        if (!actionBtn || actionBtn.dataset.componentType !== 'topics') return;
                        
                        const action = actionBtn.dataset.action;
                        const selectedElement = window.GuestifyMKB?.selectedElement;
                        
                        if (!selectedElement || selectedElement.dataset.componentType !== 'topics') {
                            console.warn('[Topics Design Panel] No Topics component selected for action:', action);
                            return;
                        }
                        
                        const componentId = selectedElement.dataset.componentId;
                        console.log(`[Topics Design Panel] Executing ${action} for Topics component ${componentId}`);
                        
                        if (action === 'delete') {
                            if (confirm('Are you sure you want to delete this Topics component?')) {
                                selectedElement.remove();
                                if (window.GuestifyMKB.ElementSelection?.deselectAllElements) {
                                    window.GuestifyMKB.ElementSelection.deselectAllElements();
                                }
                                console.log('[Topics Design Panel] Topics component deleted');
                            }
                        } else if (action === 'duplicate') {
                            alert('Component duplication is coming in a future update!');
                        }
                    } catch (actionError) {
                        console.error('[Topics Design Panel] Action handler error:', actionError);
                    }
                });
            } catch (error) {
                console.error('[Topics Design Panel] Error in initComponentActions:', error);
            }
        }
        
        // Initialize all handlers
        initContentSourceHandler();
        initGridColumnsHandler();
        initTopicStyleHandler();
        initColorPickerHandler();
        initComponentActions();
        
        console.log('[Topics Design Panel] Initialization complete');
        
    } catch (error) {
        console.error('[Topics Design Panel] Critical initialization error:', error);
    }
})();
</script>