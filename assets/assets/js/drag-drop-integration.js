/**
 * Drag and Drop Integration for Media Kit Builder
 * Provides drag-drop functionality for components
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function($) {
    'use strict';

    // Drag and Drop Integration
    window.MKB_DragDrop = {
        
        /**
         * Initialize drag and drop functionality
         */
        init: function() {
            this.setupDragEvents();
            this.setupDropZones();
            console.log('🎯 Drag & Drop integration loaded');
        },

        /**
         * Setup drag events for components
         */
        setupDragEvents: function() {
            $(document).on('dragstart', '.mkb-component-item', function(e) {
                const componentType = $(this).data('component-type');
                e.originalEvent.dataTransfer.setData('text/plain', componentType);
                $(this).addClass('mkb-dragging');
            });

            $(document).on('dragend', '.mkb-component-item', function(e) {
                $(this).removeClass('mkb-dragging');
            });
        },

        /**
         * Setup drop zones
         */
        setupDropZones: function() {
            $(document).on('dragover', '.mkb-drop-zone', function(e) {
                e.preventDefault();
                $(this).addClass('mkb-drag-over');
            });

            $(document).on('dragleave', '.mkb-drop-zone', function(e) {
                $(this).removeClass('mkb-drag-over');
            });

            $(document).on('drop', '.mkb-drop-zone', function(e) {
                e.preventDefault();
                $(this).removeClass('mkb-drag-over');
                
                const componentType = e.originalEvent.dataTransfer.getData('text/plain');
                if (componentType) {
                    window.MKB_DragDrop.handleDrop(componentType, $(this));
                }
            });
        },

        /**
         * Handle component drop
         */
        handleDrop: function(componentType, $dropZone) {
            // Trigger custom event for React to handle
            const event = new CustomEvent('mkb-component-drop', {
                detail: {
                    componentType: componentType,
                    dropZone: $dropZone[0]
                }
            });
            
            document.dispatchEvent(event);
            console.log('📦 Component dropped:', componentType);
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        window.MKB_DragDrop.init();
    });

})(jQuery);
