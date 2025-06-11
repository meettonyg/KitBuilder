/**
 * Enhanced Template Button Handler
 * 
 * This script fixes issues with template modal buttons not working properly
 * by implementing direct event handlers and ensuring proper connection.
 */

(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔄 Template Button Handler initializing...');
        // Give time for other scripts to load
        setTimeout(setupTemplateButtonHandlers, 1500);
    });

    /**
     * Set up reliable event handlers for all template buttons
     */
    function setupTemplateButtonHandlers() {
        console.log('🔄 Setting up template button handlers...');
        
        // Find all add section buttons
        const addSectionButtons = document.querySelectorAll('#add-section-btn, #add-section-btn-primary');
        const templateButtons = document.querySelectorAll('#section-templates-btn');
        
        console.log(`Found ${addSectionButtons.length} add section buttons and ${templateButtons.length} template buttons`);
        
        // Setup handlers for all buttons
        addSectionButtons.forEach((button, index) => {
            // Remove any existing handlers to prevent duplication
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add reliable handler
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`Add Section button ${index + 1} clicked`);
                openTemplateModal();
            });
            
            console.log(`Handler attached to add section button ${index + 1}`);
        });
        
        // Setup handlers for template buttons
        templateButtons.forEach((button, index) => {
            // Remove any existing handlers to prevent duplication
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add reliable handler
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`Template button ${index + 1} clicked`);
                openTemplateModal();
            });
            
            console.log(`Handler attached to template button ${index + 1}`);
        });
        
        console.log('✅ Template button handlers setup complete');
    }
    
    /**
     * Reliable function to open the template modal
     */
    function openTemplateModal() {
        console.log('🔄 Opening template modal...');
        
        // Try multiple methods to open the modal
        if (typeof window.showAddSectionModal === 'function') {
            console.log('Using showAddSectionModal function');
            window.showAddSectionModal();
            return;
        }
        
        if (typeof window.MediaKitBuilder?.showTemplateModal === 'function') {
            console.log('Using MediaKitBuilder.showTemplateModal function');
            window.MediaKitBuilder.showTemplateModal();
            return;
        }
        
        // If functions not available, try to manually show the modal
        const modal = document.getElementById('add-section-modal');
        if (modal) {
            console.log('Manually showing template modal');
            modal.style.display = 'flex';
            
            // Try to call render function if available
            if (typeof window.renderSectionTemplates === 'function') {
                window.renderSectionTemplates();
            }
            return;
        }
        
        // Last resort - create modal if it doesn't exist
        console.log('Creating template modal');
        if (typeof window.createAddSectionModal === 'function') {
            window.createAddSectionModal();
            const newModal = document.getElementById('add-section-modal');
            if (newModal) {
                newModal.style.display = 'flex';
                if (typeof window.renderSectionTemplates === 'function') {
                    window.renderSectionTemplates();
                }
            }
        } else {
            console.error('Cannot open template modal - no methods available');
        }
    }
    
    // Expose the functions globally
    window.setupTemplateButtonHandlers = setupTemplateButtonHandlers;
    window.openTemplateModal = openTemplateModal;
})();
