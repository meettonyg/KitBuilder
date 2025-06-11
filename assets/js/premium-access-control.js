/**
 * Premium Access Manager
 * 
 * A comprehensive class-based system for managing premium feature access control
 * based on user tier levels. Handles permission checking, upgrade prompts,
 * and UI restrictions for premium features.
 * 
 * @since 1.0.0
 */
class PremiumAccessManager {
    /**
     * Initialize the Premium Access Manager
     * 
     * @param {Object} config Configuration options
     * @param {string} config.accessTier User's access tier (guest, free, pro, agency)
     * @param {boolean} config.isAdmin Whether the user is an admin
     * @param {string} config.upgradeUrl URL for the upgrade page
     * @param {string} config.learnMoreUrl URL for feature comparison
     */
    constructor(config = {}) {
        // Initialize configuration with defaults
        this.config = {
            userTier: config.accessTier || 'guest',
            isAdmin: config.isAdmin || false,
            upgradeUrl: config.upgradeUrl || '/pricing/',
            learnMoreUrl: config.learnMoreUrl || '/features/',
            ...config
        };
        
        // Internal state
        this.initialized = false;
        this.observer = null;
        this.observerActive = false;
        
        // Define access tiers and features
        this.features = this.defineAccessTiers();
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize premium access control system
     */
    init() {
        console.log('🔐 Initializing Premium Access Manager...');
        
        // Setup UI restrictions
        this.setupUIRestrictions();
        
        // Setup premium template marking
        this.setupPremiumTemplateMarking();
        
        // Setup upgrade prompts
        this.setupUpgradePrompts();
        
        // Setup observer for dynamically added elements
        this.setupObserver();
        
        // Setup premium component handlers
        this.setupPremiumComponentHandlers();
        
        this.initialized = true;
        console.log('✅ Premium access control initialized with user tier:', this.config.userTier);
    }
    
    /**
     * Define access tiers and their capabilities
     */
    defineAccessTiers() {
        return {
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
    }
    
    /**
     * Check if user has access to a specific feature
     * @param {string} featureName - Feature name to check
     * @returns {boolean} - Whether user has access
     */
    hasAccess(featureName) {
        // Admin always has access
        if (this.config.isAdmin) {
            return true;
        }
        
        const userTier = this.config.userTier;
        const features = this.features[userTier];
        
        if (!features) {
            console.warn(`⚠️ Unknown user tier: ${userTier}`);
            return false;
        }
        
        return features[featureName] === true || features[featureName] === -1;
    }
    
    /**
     * Check if user can add more of a specific item
     * @param {string} itemType - Item type (sections, components, etc.)
     * @returns {boolean} - Whether user can add more
     */
    canAddMore(itemType) {
        // Admin always can add more
        if (this.config.isAdmin) {
            return true;
        }
        
        const userTier = this.config.userTier;
        const features = this.features[userTier];
        
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
    setupUIRestrictions() {
        const userTier = this.config.userTier;
        console.log(`🎨 Setting up UI restrictions for ${userTier} tier`);
        
        // Add tier class to body for CSS targeting
        document.body.classList.add(`tier-${userTier}`);
        
        // Add premium indicators
        this.addPremiumIndicators();
        
        // Setup component restrictions
        this.restrictPremiumComponents();
        
        // Setup export restrictions
        this.restrictExportOptions();
        
        console.log('✅ UI restrictions applied');
    }
    
    /**
     * Add premium indicators to UI elements
     */
    addPremiumIndicators() {
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
        if (!this.hasAccess('premiumTemplates')) {
            this.addUpgradePromptsToSections();
        }
    }
    
    /**
     * Add upgrade prompts to sections
     */
    addUpgradePromptsToSections() {
        const componentsTab = document.getElementById('components-tab');
        if (componentsTab && !componentsTab.querySelector('.upgrade-notification')) {
            const upgradePrompt = document.createElement('div');
            upgradePrompt.className = 'upgrade-notification';
            upgradePrompt.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">🚀 Unlock Premium Features</div>
                <div style="margin-bottom: 8px;">Get access to advanced components, templates, and unlimited exports</div>
                <button class="upgrade-button">Upgrade Now</button>
            `;
            
            // Add click handler
            const upgradeButton = upgradePrompt.querySelector('.upgrade-button');
            if (upgradeButton) {
                upgradeButton.addEventListener('click', () => this.handleUpgradeClick());
            }
            
            // Insert before premium components section
            const premiumSection = componentsTab.querySelector('.components-section:last-child');
            if (premiumSection) {
                premiumSection.parentNode.insertBefore(upgradePrompt, premiumSection);
            }
        }
    }
    
    /**
     * Restrict premium components based on user tier
     */
    restrictPremiumComponents() {
        if (!this.hasAccess('premiumComponents')) {
            const premiumComponents = document.querySelectorAll('.component-item.premium');
            premiumComponents.forEach(component => {
                // Apply visual restrictions
                component.setAttribute('draggable', 'false');
                component.classList.add('restricted');
            });
            
            console.log('🚫 Applied visual restrictions to premium components');
        }
    }
    
    /**
     * Setup premium component handlers
     */
    setupPremiumComponentHandlers() {
        console.log('🔐 Setting up premium component handlers...');
        
        // Get ALL premium components
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
            const clickHandler = (e) => {
                // Always stop propagation to prevent double-handling
                e.stopPropagation();
                
                // Immediate access check
                if (!this.hasAccess('premiumComponents')) {
                    // Prevent default only after we know access is denied
                    e.preventDefault();
                    console.log('🔒 Premium component clicked, access denied');
                    
                    // Get component name for better UX
                    const componentElement = e.currentTarget || e.target.closest('.component-item');
                    const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                    
                    console.log(`🚫 Access denied for: ${componentName}`);
                    this.showUpgradePrompt(`${componentName} is a premium feature`, componentName);
                    return false;
                }
                
                console.log('✅ Premium component access granted');
                // Allow click to continue normally by NOT preventing default
                return true;
            };
            
            // Create new drag handler with proper context
            const dragHandler = (e) => {
                if (!this.hasAccess('premiumComponents')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚫 Drag prevented for premium component');
                    
                    const componentElement = e.currentTarget || e.target.closest('.component-item');
                    const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                    
                    this.showUpgradePrompt(`${componentName} is a premium feature`);
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
            if (!this.hasAccess('premiumComponents')) {
                component.setAttribute('draggable', 'false');
                component.classList.add('restricted');
            } else {
                component.setAttribute('draggable', 'true');
                component.classList.remove('restricted');
            }
        });
        
        console.log('✅ Premium component handlers setup completed');
    }
    
    /**
     * Setup premium template marking
     */
    setupPremiumTemplateMarking() {
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
     * Handle custom access check events
     * @param {CustomEvent} event - Custom event with feature detail
     */
    handleAccessCheck(event) {
        if (event.detail && event.detail.feature) {
            const hasAccess = this.hasAccess(event.detail.feature);
            event.detail.callback?.(hasAccess);
            
            // If denied access and showPrompt is true, show upgrade prompt
            if (!hasAccess && event.detail.showPrompt) {
                this.showUpgradePrompt(event.detail.feature);
            }
        }
    }
    
    /**
     * Handle export button clicks
     * @param {Event} event - Click event
     */
    handleExportClick(event) {
        const exportButton = event.target.closest('.export-button, [data-export]');
        if (!exportButton) return;
        
        const exportType = exportButton.getAttribute('data-export') || 'pdf';
        const userTier = this.config.userTier;
        const features = this.features[userTier];
        
        if (!features) return;
        
        const allowedFormats = features.exportFormats || [];
        
        if (!allowedFormats.includes(exportType)) {
            event.preventDefault();
            event.stopPropagation();
            
            this.showUpgradePrompt(`${exportType.toUpperCase()} export`);
            return false;
        }
    }
    
    /**
     * Restrict export options based on user tier
     */
    restrictExportOptions() {
        const features = this.features[this.config.userTier];
        if (!features) return;
        
        const allowedFormats = features.exportFormats || [];
        
        // This would restrict export options in the export modal
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(option => {
            const format = option.getAttribute('data-export');
            if (format && !allowedFormats.includes(format)) {
                option.classList.add('restricted');
                
                // Add click handler
                const boundHandler = this.handleRestrictedExport.bind(this, format);
                option.addEventListener('click', boundHandler);
                option._restrictedHandler = boundHandler; // Store reference for potential cleanup
            }
        });
    }
    
    /**
     * Handle click on restricted export option
     * @param {string} format - Export format
     * @param {Event} e - Click event
     */
    handleRestrictedExport(format, e) {
        e.preventDefault();
        e.stopPropagation();
        this.showUpgradePrompt(`${format.toUpperCase()} export is a premium feature`);
    }
    
    /**
     * Setup upgrade prompts
     */
    setupUpgradePrompts() {
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
     * Show upgrade prompt
     * @param {string} featureName - Feature name
     * @param {string} templateName - Template name (optional)
     */
    showUpgradePrompt(featureName = 'this feature', templateName = null) {
        console.log(`🔒 Showing upgrade prompt for: ${featureName}`);
        
        // Remove existing prompt if present
        const existingPrompt = document.getElementById('upgrade-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        const currentTier = this.config.userTier;
        const targetTier = this.getRecommendedTier(featureName);
        
        const promptHtml = `
            <div class="upgrade-modal-overlay" id="upgrade-prompt" style="animation: fadeIn 0.3s ease;">
                <div class="upgrade-modal" style="animation: slideUp 0.3s ease;">
                    <div class="upgrade-header">
                        <div class="upgrade-header-content">
                            <h3>🚀 Upgrade Required</h3>
                            <div class="current-tier">Current: ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</div>
                        </div>
                        <button class="close-upgrade" id="close-upgrade-btn">&times;</button>
                    </div>
                    <div class="upgrade-body">
                        <div class="upgrade-icon">🔓</div>
                        <h4>Unlock ${templateName || featureName}</h4>
                        <p class="upgrade-description">
                            ${this.getUpgradeMessage(featureName, currentTier, targetTier)}
                        </p>
                        
                        <div class="upgrade-benefits">
                            <div class="benefits-title">✨ What you'll get with ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}:</div>
                            ${this.getUpgradeBenefits(targetTier)}
                        </div>
                        
                        <div class="upgrade-actions">
                            <button class="upgrade-button primary" id="upgrade-btn">
                                Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}
                            </button>
                            <button class="upgrade-button secondary" id="learn-more-btn">
                                Learn More
                            </button>
                            <button class="cancel-button" id="cancel-upgrade-btn">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', promptHtml);
        
        // Add event listeners
        document.getElementById('close-upgrade-btn').addEventListener('click', () => this.closeUpgradePrompt());
        document.getElementById('upgrade-btn').addEventListener('click', () => this.handleUpgradeClick(targetTier));
        document.getElementById('learn-more-btn').addEventListener('click', () => this.handleLearnMore());
        document.getElementById('cancel-upgrade-btn').addEventListener('click', () => this.closeUpgradePrompt());
        
        // Track upgrade prompt shown
        this.trackUpgradePrompt(featureName, currentTier, targetTier);
    }
    
    /**
     * Get recommended tier for a feature
     * @param {string} featureName - Feature name
     * @returns {string} - Recommended tier
     */
    getRecommendedTier(featureName) {
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
     * @param {string} featureName - Feature name
     * @param {string} currentTier - Current user tier
     * @param {string} targetTier - Target tier for upgrade
     * @returns {string} - Upgrade message
     */
    getUpgradeMessage(featureName, currentTier, targetTier) {
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
     * @param {string} tier - Target tier
     * @returns {string} - HTML for benefits list
     */
    getUpgradeBenefits(tier) {
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
            `<div class="benefit-item">${benefit}</div>`
        ).join('') || '';
    }
    
    /**
     * Handle upgrade button click
     * @param {string} targetTier - Target tier for upgrade
     */
    handleUpgradeClick(targetTier = 'pro') {
        console.log(`🚀 Upgrade clicked for tier: ${targetTier}`);
        
        // Track conversion intent
        this.trackConversionIntent(targetTier);
        
        // Close modal
        this.closeUpgradePrompt();
        
        // Redirect to upgrade page or open checkout
        const upgradeUrl = this.getUpgradeUrl(targetTier);
        
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
    handleLearnMore() {
        console.log('📖 Learn more clicked');
        
        this.closeUpgradePrompt();
        
        // Open pricing page or feature comparison
        const learnMoreUrl = this.config.learnMoreUrl || '/pricing';
        window.open(learnMoreUrl, '_blank');
    }
    
    /**
     * Get upgrade URL based on tier
     * @param {string} tier - Target tier
     * @returns {string} - Upgrade URL
     */
    getUpgradeUrl(tier) {
        const baseUrl = this.config.upgradeUrl || '/upgrade';
        const urls = {
            pro: `${baseUrl}?plan=pro`,
            agency: `${baseUrl}?plan=agency`
        };
        
        return urls[tier] || baseUrl;
    }
    
    /**
     * Close upgrade prompt
     */
    closeUpgradePrompt() {
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
     * @param {string} featureName - Feature name
     * @param {string} currentTier - Current user tier
     * @param {string} targetTier - Target tier for upgrade
     */
    trackUpgradePrompt(featureName, currentTier, targetTier) {
        // Analytics tracking would go here
        console.log('📊 Tracking upgrade prompt:', {
            feature: featureName,
            currentTier,
            targetTier,
            timestamp: new Date().toISOString()
        });
        
        // If analytics API exists, use it
        if (window.mediaKitBuilder?.analytics?.trackEvent) {
            window.mediaKitBuilder.analytics.trackEvent('upgrade_prompt_shown', {
                feature: featureName,
                current_tier: currentTier,
                target_tier: targetTier
            });
        }
    }
    
    /**
     * Track conversion intent
     * @param {string} targetTier - Target tier for upgrade
     */
    trackConversionIntent(targetTier) {
        // Analytics tracking for conversion intent
        console.log('💰 Tracking conversion intent:', {
            targetTier,
            currentTier: this.config.userTier,
            timestamp: new Date().toISOString()
        });
        
        // If analytics API exists, use it
        if (window.mediaKitBuilder?.analytics?.trackEvent) {
            window.mediaKitBuilder.analytics.trackEvent('upgrade_click', {
                current_tier: this.config.userTier,
                target_tier: targetTier
            });
        }
    }
    
    /**
     * Setup the mutation observer
     */
    setupObserver() {
        // Create observer
        this.observer = new MutationObserver((mutations) => {
            let foundNewPremiumComponents = false;
            
            mutations.forEach((mutation) => {
                // Process added nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
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
                    }
                });
            });

            if (foundNewPremiumComponents) {
                console.log('🔍 New premium components detected, setting up handlers...');
                setTimeout(() => {
                    this.setupPremiumComponentHandlers();
                }, 100);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false // Don't watch attribute changes to prevent loops
        });
        this.observerActive = true;
        console.log('🔍 Premium component observer started');
    }
    
    /**
     * Stop observer
     */
    stopObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observerActive = false;
            console.log('🛑 Premium component observer stopped');
        }
    }
    
    /**
     * Get user feature summary
     * @returns {Object} - Feature summary
     */
    getUserFeatureSummary() {
        const tier = this.config.userTier;
        const features = this.features[tier];
        
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for MediaKitBuilder config to be loaded
    setTimeout(() => {
        // Create global instance
        window.premiumAccessManager = new PremiumAccessManager({
            accessTier: window.MediaKitBuilder?.config?.accessTier || 'guest',
            isAdmin: window.MediaKitBuilder?.config?.isAdmin || false,
            upgradeUrl: window.MediaKitBuilder?.config?.upgradeUrl || '/pricing/',
            learnMoreUrl: window.MediaKitBuilder?.config?.learnMoreUrl || '/features/'
        });
        
        // Make important methods available globally for backward compatibility
        window.hasAccess = (feature) => window.premiumAccessManager.hasAccess(feature);
        window.canAddMore = (itemType) => window.premiumAccessManager.canAddMore(itemType);
        window.showUpgradePrompt = (feature, template) => window.premiumAccessManager.showUpgradePrompt(feature, template);
        window.closeUpgradePrompt = () => window.premiumAccessManager.closeUpgradePrompt();
        
        // Notify the builder that premium access is ready
        document.dispatchEvent(new CustomEvent('premium-access-ready'));
        
        console.log('🔐 Premium Access Manager initialized successfully');
    }, 100);
});
