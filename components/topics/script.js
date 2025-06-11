/**
 * Topics Component JavaScript
 * components/topics/script.js
 * 
 * Component-specific JavaScript functionality for the Topics component.
 */

(function() {
    'use strict';

    const TopicsComponent = {
        
        /**
         * Initialize Topics component functionality
         */
        init: function() {
            console.log('[Topics Component] Initializing...');
            
            this.setupLiveEditing();
            this.setupTopicManagement();
            this.setupAnimations();
            
            console.log('[Topics Component] Initialization complete');
        },

        /**
         * Setup live editing functionality in builder mode
         */
        setupLiveEditing: function() {
            if (!document.body.classList.contains('mkb-builder-mode')) {
                return;
            }

            const editableTopics = document.querySelectorAll('.mkb-topic-item[contenteditable="true"]');
            
            editableTopics.forEach(topic => {
                // Save changes on blur
                topic.addEventListener('blur', function() {
                    const componentId = this.closest('[data-component-type="topics"]')?.dataset.componentId;
                    const topicIndex = this.dataset.topicIndex;
                    
                    const event = new CustomEvent('mkb-component-updated', {
                        detail: {
                            componentType: 'topics',
                            componentId: componentId,
                            setting: `topic_${topicIndex}`,
                            value: this.textContent.trim()
                        }
                    });
                    document.dispatchEvent(event);
                    
                    // Update the custom_topics setting with all topics
                    this.updateCustomTopicsData(componentId);
                });

                // Handle Enter key to create new topic
                topic.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.blur();
                        
                        // Add new topic after this one
                        const componentId = this.closest('[data-component-type="topics"]')?.dataset.componentId;
                        if (componentId) {
                            TopicsComponent.addTopic(componentId, this);
                        }
                    }
                });

                // Handle Delete key on empty topics
                topic.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && this.textContent.trim() === '') {
                        e.preventDefault();
                        this.removeTopic();
                    }
                });

                // Clean paste content
                topic.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text');
                    
                    // If pasting multiple lines, create multiple topics
                    const lines = text.split('\n').filter(line => line.trim());
                    if (lines.length > 1) {
                        this.textContent = lines[0].trim();
                        this.blur();
                        
                        // Add remaining lines as new topics
                        const componentId = this.closest('[data-component-type="topics"]')?.dataset.componentId;
                        if (componentId) {
                            lines.slice(1).forEach(line => {
                                TopicsComponent.addTopic(componentId, null, line.trim());
                            });
                        }
                    } else {
                        document.execCommand('insertText', false, text.trim());
                    }
                });
            });
        },

        /**
         * Setup topic management (add/remove topics)
         */
        setupTopicManagement: function() {
            // Add topic button click handlers are set up in the template
            // This method sets up additional topic management functionality
            
            document.addEventListener('click', function(e) {
                // Handle topic deletion in editor mode
                if (e.target.closest('.mkb-topic-delete-btn')) {
                    e.preventDefault();
                    const topicItem = e.target.closest('.mkb-topic-item');
                    if (topicItem) {
                        TopicsComponent.removeTopic(topicItem);
                    }
                }
            });
        },

        /**
         * Add a new topic to the component
         */
        addTopic: function(componentId, afterElement = null, text = '') {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component || component.dataset.componentType !== 'topics') return;

            const topicsGrid = component.querySelector('.mkb-topics-grid');
            if (!topicsGrid) return;

            // Get current topics count
            const currentTopics = topicsGrid.querySelectorAll('.mkb-topic-item:not(.mkb-add-topic-btn)');
            const newIndex = currentTopics.length;

            // Create new topic element
            const newTopic = document.createElement('div');
            newTopic.className = 'mkb-topic-item topic-item';
            newTopic.dataset.topicIndex = newIndex;
            newTopic.contentEditable = 'true';
            newTopic.dataset.setting = `topic_${newIndex}`;
            newTopic.textContent = text || `New Topic ${newIndex + 1}`;

            // Insert the new topic
            const addButton = topicsGrid.querySelector('.mkb-add-topic-btn');
            if (afterElement && afterElement.nextSibling) {
                topicsGrid.insertBefore(newTopic, afterElement.nextSibling);
            } else if (addButton) {
                topicsGrid.insertBefore(newTopic, addButton);
            } else {
                topicsGrid.appendChild(newTopic);
            }

            // Focus the new topic for editing
            newTopic.focus();
            
            // Select all text for easy editing
            if (window.getSelection) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(newTopic);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            // Set up event listeners for the new topic
            this.setupTopicEventListeners(newTopic);
            
            // Update the component data
            this.updateCustomTopicsData(componentId);
            
            console.log('[Topics Component] Added new topic:', newTopic.textContent);
        },

        /**
         * Remove a topic from the component
         */
        removeTopic: function(topicElement) {
            if (!topicElement || !topicElement.classList.contains('mkb-topic-item')) return;

            const component = topicElement.closest('[data-component-type="topics"]');
            if (!component) return;

            const componentId = component.dataset.componentId;
            
            // Don't remove if it's the last topic
            const allTopics = component.querySelectorAll('.mkb-topic-item:not(.mkb-add-topic-btn):not(.mkb-placeholder)');
            if (allTopics.length <= 1) {
                console.warn('[Topics Component] Cannot remove the last topic');
                return;
            }

            // Remove the element
            topicElement.remove();
            
            // Update indices of remaining topics
            this.reindexTopics(componentId);
            
            // Update the component data
            this.updateCustomTopicsData(componentId);
            
            console.log('[Topics Component] Removed topic');
        },

        /**
         * Reindex topics after addition/removal
         */
        reindexTopics: function(componentId) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component) return;

            const topics = component.querySelectorAll('.mkb-topic-item:not(.mkb-add-topic-btn):not(.mkb-placeholder)');
            topics.forEach((topic, index) => {
                topic.dataset.topicIndex = index;
                topic.dataset.setting = `topic_${index}`;
            });
        },

        /**
         * Update the custom_topics data from current DOM state
         */
        updateCustomTopicsData: function(componentId) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component) return;

            const topics = component.querySelectorAll('.mkb-topic-item:not(.mkb-add-topic-btn):not(.mkb-placeholder)');
            const topicsArray = Array.from(topics).map(topic => topic.textContent.trim()).filter(text => text);
            
            const customTopicsText = topicsArray.join('\n');
            
            // Trigger component update event
            const event = new CustomEvent('mkb-component-updated', {
                detail: {
                    componentType: 'topics',
                    componentId: componentId,
                    setting: 'custom_topics',
                    value: customTopicsText
                }
            });
            document.dispatchEvent(event);
        },

        /**
         * Setup event listeners for a topic element
         */
        setupTopicEventListeners: function(topicElement) {
            // Copy the event listeners from setupLiveEditing for this specific element
            topicElement.addEventListener('blur', function() {
                const componentId = this.closest('[data-component-type="topics"]')?.dataset.componentId;
                const topicIndex = this.dataset.topicIndex;
                
                const event = new CustomEvent('mkb-component-updated', {
                    detail: {
                        componentType: 'topics',
                        componentId: componentId,
                        setting: `topic_${topicIndex}`,
                        value: this.textContent.trim()
                    }
                });
                document.dispatchEvent(event);
                
                TopicsComponent.updateCustomTopicsData(componentId);
            });

            topicElement.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                    
                    const componentId = this.closest('[data-component-type="topics"]')?.dataset.componentId;
                    if (componentId) {
                        TopicsComponent.addTopic(componentId, this);
                    }
                }
                
                if (e.key === 'Backspace' && this.textContent.trim() === '') {
                    e.preventDefault();
                    TopicsComponent.removeTopic(this);
                }
            });
        },

        /**
         * Setup animation functionality
         */
        setupAnimations: function() {
            const topicsComponents = document.querySelectorAll('.mkb-topics-component-wrapper');
            
            topicsComponents.forEach(component => {
                // Check if animations are enabled
                if (!component.classList.contains('enable-animations')) {
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

                    observer.observe(component);
                }
            });
        },

        /**
         * Handle component settings update
         */
        updateSettings: function(componentId, settings) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component || component.dataset.componentType !== 'topics') return;

            console.log('[Topics Component] Updating settings for:', componentId, settings);

            // Update grid columns
            if (settings.grid_columns) {
                const topicsGrid = component.querySelector('.mkb-topics-grid');
                if (topicsGrid) {
                    topicsGrid.classList.remove('topics-columns-2', 'topics-columns-3', 'topics-columns-4');
                    topicsGrid.classList.add(`topics-columns-${settings.grid_columns}`);
                    topicsGrid.dataset.columns = settings.grid_columns;
                }
            }

            // Update topic style
            if (settings.topic_style) {
                component.classList.remove('topics-style-cards', 'topics-style-badges', 'topics-style-minimal');
                component.classList.add(`topics-style-${settings.topic_style}`);
            }

            // Update accent color
            if (settings.accent_color) {
                component.style.setProperty('--topics-accent-color', settings.accent_color);
            }

            // Update section title
            if (settings.section_title !== undefined) {
                const titleElement = component.querySelector('.mkb-component-title');
                if (titleElement) {
                    titleElement.textContent = settings.section_title;
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

            // Update hover effects
            if (typeof settings.enable_hover_effects !== 'undefined') {
                if (settings.enable_hover_effects) {
                    component.classList.add('enable-hover-effects');
                } else {
                    component.classList.remove('enable-hover-effects');
                }
            }
        },

        /**
         * Get component data for saving
         */
        getComponentData: function(componentId) {
            const component = document.querySelector(`[data-component-id="${componentId}"]`);
            if (!component || component.dataset.componentType !== 'topics') return null;

            const data = {
                type: 'topics',
                settings: {}
            };

            // Extract section title
            const titleEl = component.querySelector('.mkb-component-title');
            if (titleEl) data.settings.section_title = titleEl.textContent;

            // Extract topics
            const topics = component.querySelectorAll('.mkb-topic-item:not(.mkb-add-topic-btn):not(.mkb-placeholder)');
            const topicsArray = Array.from(topics).map(topic => topic.textContent.trim()).filter(text => text);
            data.settings.custom_topics = topicsArray.join('\n');

            // Extract styling settings
            const topicsGrid = component.querySelector('.mkb-topics-grid');
            if (topicsGrid && topicsGrid.dataset.columns) {
                data.settings.grid_columns = topicsGrid.dataset.columns;
            }

            if (component.classList.contains('topics-style-badges')) {
                data.settings.topic_style = 'badges';
            } else if (component.classList.contains('topics-style-minimal')) {
                data.settings.topic_style = 'minimal';
            } else {
                data.settings.topic_style = 'cards';
            }

            // Extract other settings
            const accentColor = component.style.getPropertyValue('--topics-accent-color');
            if (accentColor) data.settings.accent_color = accentColor;

            data.settings.enable_animations = component.classList.contains('enable-animations');
            data.settings.enable_hover_effects = component.classList.contains('enable-hover-effects');
            data.settings.max_topics = topics.length;

            return data;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TopicsComponent.init();
        });
    } else {
        TopicsComponent.init();
    }

    // Make TopicsComponent available globally for the builder
    window.GuestifyMKB = window.GuestifyMKB || {};
    window.GuestifyMKB.Components = window.GuestifyMKB.Components || {};
    window.GuestifyMKB.Components.Topics = TopicsComponent;

})();