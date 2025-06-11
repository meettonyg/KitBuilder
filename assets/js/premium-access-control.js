/**
 * Premium Access Control System
 * Manages feature access based on user tier and subscription status
 */

// Create global premium access namespace
window.premiumAccess = {
    version: '2.0',
    initialized: false,
    userTier: 'guest',
    features: {},
    config: {},
    handlerSetupInProgress: false, // Prevent infinite loops
    pauseObserver: false, // Pause observer during setup
    observerActive: false,
    observer: null,
    setupTimeout: null
};

/**
 * Initialize premium access control system
 */
function initializePremiumAccess() {
    console.log('🔐 Initializing Premium Access Control System...');
    
    // Get user tier from configuration
    const config = window.MediaKitBuilder?.config || {};
    window.premiumAccess.userTier = config.accessTier || 'guest';
    window.premiumAccess.config = config;
    
    console.log(`👤 User tier detected: ${window.premiumAccess.userTier}`);
    
    // Define tier capabilities
    defineAccessTiers();
    
    // Setup UI restrictions
    setupUIRestrictions();
    
    // Setup premium template marking
    setupPremiumTemplateMarking();
    
    // Setup upgrade prompts
    setupUpgradePrompts();
    
    window.premiumAccess.initialized = true;
    console.log('✅ Premium access control initialized successfully');
}

/**
 * Define access tiers and their capabilities
 */
function defineAccessTiers() {
    window.premiumAccess.features = {
        guest: {
            maxSections: 3,
            maxComponents: 10,
            premiumTemplates: false,
            premiumComponents: false,
            whiteLabel: false,
            analytics: false,
            customBranding: false,
            prioritySupport: false,
            exportFormats: ['image'],
            maxSaves: 1,
            maxTemplates: 0,
            maxCollaborators: 0
        },
        free: {
            maxSections: 5,
            maxComponents: 20,
            premiumTemplates: false,
            premiumComponents: false,
            whiteLabel: false,
            analytics: false,
            customBranding: false,
            prioritySupport: false,
            exportFormats: ['image', 'pdf'],
            maxSaves: 5,
            maxTemplates: 2,
            maxCollaborators: 0
        },
        pro: {
            maxSections: 15,
            maxComponents: 50,
            premiumTemplates: true,
            premiumComponents: true,
            whiteLabel: false,
            analytics: true,
            customBranding: true,
            prioritySupport: false,
            exportFormats: ['image', 'pdf', 'html'],
            maxSaves: 50,
            maxTemplates: 10,
            maxCollaborators: 3
        },
        agency: {
            maxSections: -1, // unlimited
            maxComponents: -1, // unlimited
            premiumTemplates: true,
            premiumComponents: true,
            whiteLabel: true,
            analytics: true,
            customBranding: true,
            prioritySupport: true,
            exportFormats: ['image', 'pdf', 'html', 'wordpress'],
            maxSaves: -1, // unlimited
            maxTemplates: -1, // unlimited
            maxCollaborators: -1 // unlimited
        },
        admin: {
            maxSections: -1,
            maxComponents: -1,
            premiumTemplates: true,
            premiumComponents: true,
            whiteLabel: true,
            analytics: true,
            customBranding: true,
            prioritySupport: true,
            exportFormats: ['image', 'pdf', 'html', 'wordpress'],
            maxSaves: -1,
            maxTemplates: -1,
            maxCollaborators: -1
        }
    };
    
    console.log('📋 Access tiers defined:', Object.keys(window.premiumAccess.features));
}

/**
 * Check if user has access to a specific feature
 */
function hasAccess(featureName) {
    const userTier = window.premiumAccess.userTier;
    const features = window.premiumAccess.features[userTier];
    
    if (!features) {
        console.warn(`⚠️ Unknown user tier: ${userTier}`);
        return false;
    }
    
    return features[featureName] === true || features[featureName] === -1;
}

/**
 * Check if user can add more of a specific item
 */
function canAddMore(itemType) {
    const userTier = window.premiumAccess.userTier;
    const features = window.premiumAccess.features[userTier];
    
    if (!features) return false;
    
    const maxAllowed = features[`max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`];
    
    // -1 means unlimited
    if (maxAllowed === -1) return true;
    
    // Count current items
    let currentCount = 0;
    switch(itemType) {
        case 'sections':
            currentCount = document.querySelectorAll('.media-kit-section').length;
            break;
        case 'components':
            currentCount = document.querySelectorAll('.editable-element').length;
            break;
        case 'saves':
            // This would be tracked on the server
            currentCount = 0;
            break;
        case 'templates':
            // This would be tracked on the server
            currentCount = 0;
            break;
    }
    
    return currentCount < maxAllowed;
}

/**
 * Setup UI restrictions based on user tier
 */
function setupUIRestrictions() {
    const userTier = window.premiumAccess.userTier;
    console.log(`🎨 Setting up UI restrictions for ${userTier} tier`);
    
    // Add tier class to body for CSS targeting
    document.body.classList.add(`tier-${userTier}`);
    
    // Add premium indicators
    addPremiumIndicators();
    
    // Setup component restrictions (legacy method)
    restrictPremiumComponents();
    
    // Setup enhanced premium component handlers (NEW)
    setupPremiumComponentHandlers();
    
    // Setup export restrictions
    restrictExportOptions();
    
    console.log('✅ UI restrictions applied');
}

/**
 * Add premium indicators to UI elements
 */
function addPremiumIndicators() {
    // Add premium badges to components
    const premiumComponents = document.querySelectorAll('.component-item.premium');
    premiumComponents.forEach(component => {
        if (!component.querySelector('.premium-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'premium-indicator';
            indicator.textContent = 'PRO';
            indicator.title = 'Premium feature - upgrade to access';
            component.appendChild(indicator);
        }
    });
    
    // Add upgrade prompts to restricted sections
    if (!hasAccess('premiumTemplates')) {
        addUpgradePromptsToSections();
    }
}

/**
 * Restrict premium components based on user tier - SIMPLIFIED VERSION
 * This function only adds visual restrictions, not event handlers
 */
function restrictPremiumComponents() {
    if (!hasAccess('premiumComponents')) {
        const premiumComponents = document.querySelectorAll('.component-item.premium');
        premiumComponents.forEach(component => {
            // Only add visual restrictions, handlers will be added by setupPremiumComponentHandlers
            component.setAttribute('draggable', 'false');
            component.classList.add('restricted');
        });
        
        console.log('🚫 Applied visual restrictions to premium components');
    }
}

/**
 * Setup premium component handlers - CONSOLIDATED VERSION
 * This method ensures proper event handling for ALL premium components
 */
function setupPremiumComponentHandlers() {
    // Prevent recursive calls
    if (window.premiumAccess.handlerSetupInProgress) {
        console.log('🔄 Handler setup already in progress, skipping...');
        return;
    }

    window.premiumAccess.handlerSetupInProgress = true;
    console.log('🔐 Setting up premium component handlers...');
    
    // Temporarily disconnect observer to prevent triggering during setup
    if (window.premiumAccess.observer && window.premiumAccess.observerActive) {
        window.premiumAccess.observer.disconnect();
        window.premiumAccess.observerActive = false;
    }

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
        
        // Create new click handler with proper context
        const clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔒 Premium component clicked, checking access...');
            
            if (!hasAccess('premiumComponents')) {
                // Use e.currentTarget (the element the event listener is attached to)
                // or fallback to e.target.closest() for nested clicks
                const componentElement = e.currentTarget || e.target.closest('.component-item');
                const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                
                console.log(`🚫 Access denied for: ${componentName}`);
                showUpgradePrompt(`${componentName} is a premium feature`, componentName);
                return false;
            }
            
            console.log('✅ Premium component access granted');
            // User has access, allow normal component addition
            return true;
        };
        
        // Create new drag handler with proper context
        const dragHandler = function(e) {
            if (!hasAccess('premiumComponents')) {
                e.preventDefault();
                console.log('🚫 Drag prevented for premium component');
                
                const componentElement = e.currentTarget || e.target.closest('.component-item');
                const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                
                showUpgradePrompt(`${componentName} is a premium feature`);
                return false;
            }
        };

        // Store handler references and attach events
        component.premiumClickHandler = clickHandler;
        component.premiumDragHandler = dragHandler;
        
        component.addEventListener('click', clickHandler);
        component.addEventListener('dragstart', dragHandler);
        
        // Apply or remove restrictions based on access
        if (!hasAccess('premiumComponents')) {
            component.setAttribute('draggable', 'false');
            component.classList.add('restricted');
        } else {
            component.setAttribute('draggable', 'true');
            component.classList.remove('restricted');
        }
    });

    console.log('✅ Premium component handlers setup completed');
    
    // Re-enable observer after a delay to prevent immediate re-triggering
    setTimeout(() => {
        window.premiumAccess.handlerSetupInProgress = false;
        reconnectObserver();
    }, 100);
}

/**
 * Restrict export options based on user tier
 */
function restrictExportOptions() {
    const features = window.premiumAccess.features[window.premiumAccess.userTier];
    if (!features) return;
    
    const allowedFormats = features.exportFormats || [];
    
    // This would restrict export options in the export modal
    const exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        const format = option.getAttribute('data-export');
        if (format && !allowedFormats.includes(format)) {
            option.classList.add('restricted');
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradePrompt(`${format.toUpperCase()} export is a premium feature`);
            });
        }
    });
}

/**
 * Setup premium template marking
 */
function setupPremiumTemplateMarking() {
    console.log('🏷️ Setting up premium template marking...');
    
    // This function will be called when templates are rendered
    // to mark premium templates appropriately
    if (window.sectionTemplates) {
        Object.entries(window.sectionTemplates).forEach(([key, template]) => {
            if (template.premium) {
                console.log(`💎 Premium template identified: ${template.name}`);
            }
        });
    }
}

/**
 * Setup upgrade prompts
 */
function setupUpgradePrompts() {
    // Create upgrade prompt styles if not present
    if (!document.getElementById('premium-access-styles')) {
        const style = document.createElement('style');
        style.id = 'premium-access-styles';
        style.textContent = `
            .restricted {
                opacity: 0.6;
                cursor: not-allowed !important;
                position: relative;
            }
            
            .restricted::after {
                content: '🔒';
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }
            
            .premium-indicator {
                position: absolute;
                top: 4px;
                right: 4px;
                background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
                z-index: 10;
                pointer-events: none;
            }
            
            .tier-guest .premium-only,
            .tier-free .premium-only {
                display: none !important;
            }
            
            .upgrade-notification {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                margin: 10px 0;
                text-align: center;
                font-size: 13px;
                position: relative;
                overflow: hidden;
            }
            
            .upgrade-notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            .upgrade-button {
                background: white;
                color: #667eea;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 8px;
                transition: all 0.2s ease;
            }
            
            .upgrade-button:hover {
                background: #f8fafc;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Add upgrade prompts to sections
 */
function addUpgradePromptsToSections() {
    const componentsTab = document.getElementById('components-tab');
    if (componentsTab && !componentsTab.querySelector('.upgrade-notification')) {
        const upgradePrompt = document.createElement('div');
        upgradePrompt.className = 'upgrade-notification';
        upgradePrompt.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">🚀 Unlock Premium Features</div>
            <div style="margin-bottom: 8px;">Get access to advanced components, templates, and unlimited exports</div>
            <button class="upgrade-button" onclick="handleUpgradeClick()">Upgrade Now</button>
        `;
        
        // Insert before premium components section
        const premiumSection = componentsTab.querySelector('.components-section:last-child');
        if (premiumSection) {
            premiumSection.parentNode.insertBefore(upgradePrompt, premiumSection);
        }
    }
}

/**
 * Enhanced upgrade prompt with better UX
 */
function showUpgradePrompt(featureName = 'this feature', templateName = null) {
    console.log(`🔒 Showing upgrade prompt for: ${featureName}`);
    
    // Remove existing prompt if present
    const existingPrompt = document.getElementById('upgrade-prompt');
    if (existingPrompt) {
        existingPrompt.remove();
    }
    
    const currentTier = window.premiumAccess.userTier;
    const targetTier = getRecommendedTier(featureName);
    
    const promptHtml = `
        <div class="upgrade-modal-overlay" id="upgrade-prompt" style="animation: fadeIn 0.3s ease;">
            <div class="upgrade-modal" style="animation: slideUp 0.3s ease;">
                <div class="upgrade-header">
                    <div class="upgrade-header-content">
                        <h3>🚀 Upgrade Required</h3>
                        <div class="current-tier">Current: ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</div>
                    </div>
                    <button class="close-upgrade" onclick="closeUpgradePrompt()">&times;</button>
                </div>
                <div class="upgrade-body">
                    <div class="upgrade-icon">🔓</div>
                    <h4>Unlock ${templateName || featureName}</h4>
                    <p class="upgrade-description">
                        ${getUpgradeMessage(featureName, currentTier, targetTier)}
                    </p>
                    
                    <div class="upgrade-benefits">
                        <div class="benefits-title">✨ What you'll get with ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}:</div>
                        ${getUpgradeBenefits(targetTier)}
                    </div>
                    
                    <div class="upgrade-actions">
                        <button class="upgrade-button primary" onclick="handleUpgradeClick('${targetTier}')">
                            Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}
                        </button>
                        <button class="upgrade-button secondary" onclick="handleLearnMore()">
                            Learn More
                        </button>
                        <button class="cancel-button" onclick="closeUpgradePrompt()">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', promptHtml);
    
    // Add enhanced styles
    addUpgradeModalStyles();
    
    // Track upgrade prompt shown
    trackUpgradePrompt(featureName, currentTier, targetTier);
}

/**
 * Get recommended tier for a feature
 */
function getRecommendedTier(featureName) {
    if (featureName.includes('premium template') || featureName.includes('Premium template')) {
        return 'pro';
    }
    if (featureName.includes('white label') || featureName.includes('analytics')) {
        return 'agency';
    }
    if (featureName.includes('premium') || featureName.includes('advanced')) {
        return 'pro';
    }
    return 'pro'; // Default recommendation
}

/**
 * Get upgrade message based on context
 */
function getUpgradeMessage(featureName, currentTier, targetTier) {
    const messages = {
        guest: {
            pro: `You're currently using the guest version. Upgrade to Pro to unlock ${featureName} and many other powerful features.`,
            agency: `You're currently using the guest version. Upgrade to Agency to unlock ${featureName} and get white-label capabilities.`
        },
        free: {
            pro: `Your free account doesn't include ${featureName}. Upgrade to Pro for access to premium templates and components.`,
            agency: `Upgrade to Agency to unlock ${featureName} plus white-label features and unlimited usage.`
        },
        pro: {
            agency: `${featureName} is available with our Agency plan, which includes white-label features and unlimited usage.`
        }
    };
    
    return messages[currentTier]?.[targetTier] || `Upgrade to ${targetTier} to access ${featureName}.`;
}

/**
 * Get upgrade benefits for a tier
 */
function getUpgradeBenefits(tier) {
    const benefits = {
        pro: [
            'Premium section templates',
            'Advanced components',
            'Custom branding options',
            'Analytics dashboard',
            'Priority support',
            'Multiple export formats'
        ],
        agency: [
            'Everything in Pro',
            'White-label branding',
            'Unlimited sections & components',
            'Client collaboration tools',
            'Custom domain support',
            'Priority phone support'
        ]
    };
    
    return benefits[tier]?.map(benefit => 
        `<div class="benefit-item">✓ ${benefit}</div>`
    ).join('') || '';
}

/**
 * Add enhanced upgrade modal styles
 */
function addUpgradeModalStyles() {
    if (!document.getElementById('upgrade-modal-enhanced-styles')) {
        const style = document.createElement('style');
        style.id = 'upgrade-modal-enhanced-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .upgrade-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                padding: 20px;
            }
            
            .upgrade-modal {
                background: white;
                border-radius: 16px;
                max-width: 480px;
                width: 100%;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                position: relative;
            }
            
            .upgrade-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 24px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                position: relative;
                overflow: hidden;
            }
            
            .upgrade-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
                opacity: 0.3;
            }
            
            .upgrade-header-content {
                position: relative;
                z-index: 2;
            }
            
            .upgrade-header h3 {
                margin: 0 0 4px 0;
                font-size: 20px;
                font-weight: 700;
            }
            
            .current-tier {
                font-size: 12px;
                opacity: 0.9;
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 12px;
                display: inline-block;
            }
            
            .close-upgrade {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                position: relative;
                z-index: 2;
            }
            
            .close-upgrade:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .upgrade-body {
                padding: 32px 24px 24px;
                text-align: center;
                color: #333;
            }
            
            .upgrade-icon {
                font-size: 48px;
                margin-bottom: 16px;
                animation: bounce 2s infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            .upgrade-body h4 {
                font-size: 22px;
                font-weight: 700;
                margin: 0 0 12px 0;
                color: #1a202c;
            }
            
            .upgrade-description {
                font-size: 15px;
                line-height: 1.5;
                color: #4a5568;
                margin-bottom: 24px;
            }
            
            .upgrade-benefits {
                background: #f7fafc;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                text-align: left;
            }
            
            .benefits-title {
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 12px;
                font-size: 14px;
            }
            
            .benefit-item {
                padding: 6px 0;
                font-size: 14px;
                color: #4a5568;
                display: flex;
                align-items: center;
            }
            
            .benefit-item::before {
                content: '✓';
                color: #48bb78;
                font-weight: bold;
                margin-right: 8px;
            }
            
            .upgrade-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .upgrade-button {
                padding: 14px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 15px;
                border: none;
                position: relative;
                overflow: hidden;
            }
            
            .upgrade-button.primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .upgrade-button.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            
            .upgrade-button.secondary {
                background: #e2e8f0;
                color: #4a5568;
            }
            
            .upgrade-button.secondary:hover {
                background: #cbd5e0;
            }
            
            .cancel-button {
                background: none;
                border: none;
                color: #a0aec0;
                padding: 12px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .cancel-button:hover {
                color: #718096;
            }
            
            @media (max-width: 480px) {
                .upgrade-modal {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                }
                
                .upgrade-header {
                    padding: 20px;
                }
                
                .upgrade-body {
                    padding: 24px 20px 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Handle upgrade button click
 */
function handleUpgradeClick(targetTier = 'pro') {
    console.log(`🚀 Upgrade clicked for tier: ${targetTier}`);
    
    // Track conversion intent
    trackConversionIntent(targetTier);
    
    // Close modal
    closeUpgradePrompt();
    
    // Redirect to upgrade page or open checkout
    const upgradeUrl = getUpgradeUrl(targetTier);
    
    if (upgradeUrl) {
        window.open(upgradeUrl, '_blank');
    } else {
        // Fallback - show alert
        alert(`Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} to unlock premium features!`);
    }
}

/**
 * Handle learn more click
 */
function handleLearnMore() {
    console.log('📖 Learn more clicked');
    
    closeUpgradePrompt();
    
    // Open pricing page or feature comparison
    const learnMoreUrl = window.MediaKitBuilder?.config?.learnMoreUrl || '/pricing';
    window.open(learnMoreUrl, '_blank');
}

/**
 * Get upgrade URL based on tier
 */
function getUpgradeUrl(tier) {
    const baseUrl = window.MediaKitBuilder?.config?.upgradeUrl || '/upgrade';
    const urls = {
        pro: `${baseUrl}?plan=pro`,
        agency: `${baseUrl}?plan=agency`
    };
    
    return urls[tier] || baseUrl;
}

/**
 * Close upgrade prompt
 */
function closeUpgradePrompt() {
    const prompt = document.getElementById('upgrade-prompt');
    if (prompt) {
        prompt.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.parentNode.removeChild(prompt);
            }
        }, 200);
    }
}

/**
 * Track upgrade prompt display
 */
function trackUpgradePrompt(featureName, currentTier, targetTier) {
    // Analytics tracking would go here
    console.log('📊 Tracking upgrade prompt:', {
        feature: featureName,
        currentTier,
        targetTier,
        timestamp: new Date().toISOString()
    });
}

/**
 * Track conversion intent
 */
function trackConversionIntent(targetTier) {
    // Analytics tracking for conversion intent
    console.log('💰 Tracking conversion intent:', {
        targetTier,
        currentTier: window.premiumAccess.userTier,
        timestamp: new Date().toISOString()
    });
}

/**
 * Test premium access system
 */
function testPremiumAccess() {
    console.log('🧪 Testing Premium Access System');
    console.log('================================');
    
    const currentTier = window.premiumAccess.userTier;
    console.log(`Current user tier: ${currentTier}`);
    
    // Test all tiers to ensure the system works correctly
    const tiers = ['guest', 'free', 'pro', 'agency', 'admin'];
    let allTestsPassed = true;
    
    tiers.forEach(tier => {
        console.log(`\n🔬 Testing tier: ${tier}`);
        
        // Temporarily set tier for testing
        const originalTier = window.premiumAccess.userTier;
        window.premiumAccess.userTier = tier;
        
        const features = window.premiumAccess.features[tier];
        if (!features) {
            console.log(`  ❌ No features defined for tier: ${tier}`);
            allTestsPassed = false;
            return;
        }
        
        const expectedResults = {
            'guest': { premiumTemplates: false, premiumComponents: false, maxSections: 3 },
            'free': { premiumTemplates: false, premiumComponents: false, maxSections: 5 },
            'pro': { premiumTemplates: true, premiumComponents: true, maxSections: 15 },
            'agency': { premiumTemplates: true, premiumComponents: true, maxSections: -1 },
            'admin': { premiumTemplates: true, premiumComponents: true, maxSections: -1 }
        };
        
        const expected = expectedResults[tier];
        
        // Test premium template access
        const premiumTemplates = hasAccess('premiumTemplates');
        if (premiumTemplates === expected.premiumTemplates) {
            console.log(`  ✅ Premium templates: ${premiumTemplates}`);
        } else {
            console.log(`  ❌ Premium templates: expected ${expected.premiumTemplates}, got ${premiumTemplates}`);
            allTestsPassed = false;
        }
        
        // Test premium component access
        const premiumComponents = hasAccess('premiumComponents');
        if (premiumComponents === expected.premiumComponents) {
            console.log(`  ✅ Premium components: ${premiumComponents}`);
        } else {
            console.log(`  ❌ Premium components: expected ${expected.premiumComponents}, got ${premiumComponents}`);
            allTestsPassed = false;
        }
        
        // Test section limits
        const maxSections = features.maxSections;
        if (maxSections === expected.maxSections) {
            console.log(`  ✅ Max sections: ${maxSections}`);
        } else {
            console.log(`  ❌ Max sections: expected ${expected.maxSections}, got ${maxSections}`);
            allTestsPassed = false;
        }
        
        // Restore original tier
        window.premiumAccess.userTier = originalTier;
    });
    
    console.log(`\n📊 Premium Access Test Result: ${allTestsPassed ? 'PASS' : 'FAIL'}`);
    
    // Show current user capabilities
    console.log('\n🎯 Current user capabilities:');
    const userFeatures = window.premiumAccess.features[currentTier];
    if (userFeatures) {
        Object.entries(userFeatures).forEach(([feature, value]) => {
            console.log(`  ${feature}: ${value}`);
        });
    }
    
    return allTestsPassed;
}

/**
 * Simulate upgrade prompt for testing
 */
function simulateUpgradePrompt() {
    console.log('🎭 Simulating upgrade prompt...');
    showUpgradePrompt('Premium Template Feature', 'Professional Speaker Template');
}

/**
 * Get user feature summary
 */
function getUserFeatureSummary() {
    const tier = window.premiumAccess.userTier;
    const features = window.premiumAccess.features[tier];
    
    if (!features) return null;
    
    return {
        tier,
        canUsePremiumTemplates: features.premiumTemplates,
        canUsePremiumComponents: features.premiumComponents,
        maxSections: features.maxSections,
        maxComponents: features.maxComponents,
        availableExports: features.exportFormats,
        hasAnalytics: features.analytics,
        hasWhiteLabel: features.whiteLabel
    };
}

// Make functions globally available
window.hasAccess = hasAccess;
window.canAddMore = canAddMore;
window.showUpgradePrompt = showUpgradePrompt;
window.closeUpgradePrompt = closeUpgradePrompt;
window.handleUpgradeClick = handleUpgradeClick;
window.handleLearnMore = handleLearnMore;
window.testPremiumAccess = testPremiumAccess;
window.simulateUpgradePrompt = simulateUpgradePrompt;
window.getUserFeatureSummary = getUserFeatureSummary;
window.setupPremiumComponentHandlers = setupPremiumComponentHandlers; // NEW - Make setupPremiumComponentHandlers globally available

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure MediaKitBuilder config is loaded
    setTimeout(() => {
        initializePremiumAccess();
    }, 100);
});

/**
 * Reconnect the mutation observer
 */
function reconnectObserver() {
    if (!window.premiumAccess.observer) {
        setupObserver();
    } else if (!window.premiumAccess.observerActive) {
        window.premiumAccess.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false // Don't watch attribute changes to prevent loops
        });
        window.premiumAccess.observerActive = true;
        console.log('🔍 Premium component observer reconnected');
    }
}

/**
 * Setup the mutation observer with better loop prevention - FIXED VERSION
 */
function setupObserver() {
    // Create observer with enhanced loop prevention
    window.premiumAccess.observer = new MutationObserver((mutations) => {
        // Prevent recursive calls
        if (window.premiumAccess.handlerSetupInProgress || window.premiumAccess.pauseObserver) {
            return;
        }

        let foundNewPremiumComponents = false;
        
        mutations.forEach((mutation) => {
            // Only process added nodes that are NOT modifications from our own handlers
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && !node.hasAttribute('data-premium-processed')) {
                    // Check if the node itself is a premium component
                    if (node.classList && node.classList.contains('component-item') && 
                        node.classList.contains('premium') && 
                        !node.hasAttribute('data-handler-attached')) {
                        foundNewPremiumComponents = true;
                    }
                    
                    // Check for premium components within the node
                    const premiumComponents = node.querySelectorAll && 
                        node.querySelectorAll('.component-item.premium:not([data-handler-attached])');
                    if (premiumComponents && premiumComponents.length > 0) {
                        foundNewPremiumComponents = true;
                    }
                    
                    // Mark as processed to prevent re-processing
                    node.setAttribute('data-premium-processed', 'true');
                }
            });
        });

        if (foundNewPremiumComponents) {
            // Pause observer during setup
            window.premiumAccess.pauseObserver = true;
            
            console.log('🔍 New premium components detected, setting up handlers...');
            clearTimeout(window.premiumAccess.setupTimeout);
            window.premiumAccess.setupTimeout = setTimeout(() => {
                setupPremiumComponentHandlers();
                // Resume observer after setup
                setTimeout(() => {
                    window.premiumAccess.pauseObserver = false;
                }, 200);
            }, 100);
        }
    });

    window.premiumAccess.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false // Don't watch attribute changes to prevent loops
    });
    window.premiumAccess.observerActive = true;
    console.log('🔍 Premium component observer started (enhanced)');
}

/**
 * Stop observer completely
 */
function stopObserver() {
    if (window.premiumAccess.observer) {
        window.premiumAccess.observer.disconnect();
        window.premiumAccess.observerActive = false;
        console.log('🛑 Premium component observer stopped');
    }
}

// Re-initialize premium handlers when new components are added dynamically
function reinitializePremiumHandlers() {
    console.log('🔄 Re-initializing premium component handlers...');
    setupPremiumComponentHandlers();
}

// Make reinitialize function available globally
window.reinitializePremiumHandlers = reinitializePremiumHandlers;

// Initialize observer when premium access is ready
setTimeout(() => {
    if (window.premiumAccess && window.premiumAccess.initialized) {
        setupObserver();
    }
}, 200);

// Emergency stop function - run this in console if loop continues
window.stopPremiumObserver = function() {
    stopObserver();
    console.log('🚨 Premium observer emergency stopped');
};

// Make additional functions globally available
window.stopObserver = stopObserver;
window.reconnectObserver = reconnectObserver;
window.setupObserver = setupObserver;

console.log('🔐 Premium Access Control System v2.0 loaded');
