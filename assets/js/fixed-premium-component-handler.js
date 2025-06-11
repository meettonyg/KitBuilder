/**
 * Enhanced Premium Component Handler
 * 
 * This fixes the issue with premium component access control by:
 * 1. Getting component name upfront before creating event handlers
 * 2. Properly passing template name to upgrade prompt
 * 3. Ensuring consistent handling of premium access
 */

/**
 * Setup premium component handlers - ENHANCED VERSION
 * This method ensures proper event handling for ALL premium components
 */
function setupPremiumComponentHandlers() {
    // Prevent recursive calls
    if (window.premiumAccess.handlerSetupInProgress) {
        console.log('🔄 Handler setup already in progress, skipping...');
        return false;
    }

    window.premiumAccess.handlerSetupInProgress = true;
    console.log('🔐 Setting up premium component handlers...');
    
    // Temporarily disconnect observer to prevent triggering during setup
    if (window.premiumAccess.observer && window.premiumAccess.observerActive) {
        window.premiumAccess.observer.disconnect();
        window.premiumAccess.observerActive = false;
    }

    try {
        // Get ALL premium components (not just ones without handlers)
        const premiumComponents = document.querySelectorAll('.component-item.premium');
        console.log(`Found ${premiumComponents.length} premium components to set up`);

        premiumComponents.forEach((component, index) => {
            console.log(`Setting up handler for premium component ${index + 1}`);
            
            // Remove any existing premium handlers to prevent duplicates
            if (component.premiumClickHandler) {
                component.removeEventListener('click', component.premiumClickHandler);
                component.premiumClickHandler = null;
            }
            if (component.premiumDragHandler) {
                component.removeEventListener('dragstart', component.premiumDragHandler);
                component.premiumDragHandler = null;
            }
            
            // Mark this component as having a handler
            component.setAttribute('data-handler-attached', 'true');
            
            // Get component name for better UX - move this outside the event handler
            const componentName = component.querySelector('.component-name')?.textContent || 'Premium Component';
            
            // Create new click handler with proper context
            const clickHandler = function(e) {
                // Always stop propagation to prevent double-handling
                e.stopPropagation();
                
                // Immediate access check
                if (!hasAccess('premiumComponents')) {
                    // Prevent default only after we know access is denied
                    e.preventDefault();
                    console.log('🔒 Premium component clicked, access denied');
                    
                    console.log(`🛑 Access denied for: ${componentName}`);
                    showUpgradePrompt(`${componentName} is a premium feature`, componentName);
                    return false;
                }
                
                console.log('✅ Premium component access granted');
                // Allow click to continue normally by NOT preventing default
                return true;
            };
            
            // Create new drag handler with proper context
            const dragHandler = function(e) {
                if (!hasAccess('premiumComponents')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🛑 Drag prevented for premium component');
                    
                    showUpgradePrompt(`${componentName} is a premium feature`, componentName);
                    return false;
                }
            };

            // Store handler references and attach events
            component.premiumClickHandler = clickHandler;
            component.premiumDragHandler = dragHandler;
            
            // Use capture phase to ensure our handler runs first
            component.addEventListener('click', clickHandler, true);
            component.addEventListener('dragstart', dragHandler, true);
            
            // Apply or remove restrictions based on access
            if (!hasAccess('premiumComponents')) {
                component.setAttribute('draggable', 'false');
                component.classList.add('restricted');
            } else {
                component.setAttribute('draggable', 'true');
                component.classList.remove('restricted');
            }
        });
        
        // Also monitor DOM for new component additions
        setupComponentAddedListener();
        
        console.log('✅ Premium component handlers setup completed');
        
        // Return true to indicate successful setup
        return true;
    } catch (error) {
        console.error('Error in setupPremiumComponentHandlers:', error);
        return false;
    } finally {
        // Re-enable observer after a delay to prevent immediate re-triggering
        setTimeout(() => {
            window.premiumAccess.handlerSetupInProgress = false;
            reconnectObserver();
        }, 100);
    }
}

/**
 * Add the fixed premium component handlers function to window
 * for direct use in builder-wordpress.js
 */
window.fixedSetupPremiumComponentHandlers = setupPremiumComponentHandlers;