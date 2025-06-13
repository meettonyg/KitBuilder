/**
 * Premium Access Manager
 * 
 * Controls access to premium features based on user tier levels.
 * 
 * @since 1.0.1
 */

// Use IIFE to prevent global scope pollution
(function(global) {
    'use strict';
    
    // Only define once - prevent duplicate declaration
    if (global.PremiumAccessManager) {
        console.log('Premium Access Manager already exists - skipping initialization');
        return;
    }
    
    /**
     * Premium Access Manager Class
     */
    global.PremiumAccessManager = class {
        constructor(config = {}) {
            this.config = {
                userTier: config.accessTier || 'guest',
                isAdmin: config.isAdmin || false,
                upgradeUrl: config.upgradeUrl || '/pricing/',
                learnMoreUrl: config.learnMoreUrl || '/features/',
                ...config
            };
            
            this.initialized = false;
            this.observer = null;
            this.features = this.defineAccessTiers();
            
            this.init();
        }
        
        init() {
            console.log('🔐 Initializing Premium Access Manager...');
            
            this.setupUIRestrictions();
            this.setupPremiumTemplateMarking();
            this.setupUpgradePrompts();
            this.setupObserver();
            this.setupPremiumComponentHandlers();
            
            this.initialized = true;
            console.log('✅ Premium access control initialized with user tier:', this.config.userTier);
        }
        
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
        
        hasAccess(featureName) {
            if (this.config.isAdmin) return true;
            
            const userTier = this.config.userTier;
            const features = this.features[userTier];
            
            if (!features) {
                console.warn(`⚠️ Unknown user tier: ${userTier}`);
                return false;
            }
            
            return features[featureName] === true || features[featureName] === -1;
        }
        
        canAddMore(itemType) {
            if (this.config.isAdmin) return true;
            
            const userTier = this.config.userTier;
            const features = this.features[userTier];
            
            if (!features) return false;
            
            const maxAllowed = features[`max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`];
            
            if (maxAllowed === -1) return true;
            
            let currentCount = 0;
            switch(itemType) {
                case 'sections':
                    currentCount = document.querySelectorAll('.media-kit-section').length;
                    break;
                case 'components':
                    currentCount = document.querySelectorAll('.editable-element').length;
                    break;
                case 'saves':
                case 'templates':
                    currentCount = 0; // Server-side tracking
                    break;
            }
            
            return currentCount < maxAllowed;
        }
        
        setupUIRestrictions() {
            const userTier = this.config.userTier;
            
            document.body.classList.add(`tier-${userTier}`);
            this.addPremiumIndicators();
            this.restrictPremiumComponents();
            this.restrictExportOptions();
        }
        
        addPremiumIndicators() {
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
            
            if (!this.hasAccess('premiumTemplates')) {
                this.addUpgradePromptsToSections();
            }
        }
        
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
                
                const upgradeButton = upgradePrompt.querySelector('.upgrade-button');
                if (upgradeButton) {
                    upgradeButton.addEventListener('click', () => this.handleUpgradeClick());
                }
                
                const premiumSection = componentsTab.querySelector('.components-section:last-child');
                if (premiumSection) {
                    premiumSection.parentNode.insertBefore(upgradePrompt, premiumSection);
                }
            }
        }
        
        restrictPremiumComponents() {
            if (!this.hasAccess('premiumComponents')) {
                const premiumComponents = document.querySelectorAll('.component-item.premium');
                premiumComponents.forEach(component => {
                    component.setAttribute('draggable', 'false');
                    component.classList.add('restricted');
                });
            }
        }
        
        setupPremiumComponentHandlers() {
            const premiumComponents = document.querySelectorAll('.component-item.premium');

            premiumComponents.forEach(component => {
                // Remove existing handlers to prevent duplicates
                if (component.premiumClickHandler) {
                    component.removeEventListener('click', component.premiumClickHandler);
                    component.premiumClickHandler = null;
                }
                if (component.premiumDragHandler) {
                    component.removeEventListener('dragstart', component.premiumDragHandler);
                    component.premiumDragHandler = null;
                }
                
                component.setAttribute('data-handler-attached', 'true');
                
                const clickHandler = (e) => {
                    e.stopPropagation();
                    
                    if (!this.hasAccess('premiumComponents')) {
                        e.preventDefault();
                        
                        const componentElement = e.currentTarget || e.target.closest('.component-item');
                        const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                        
                        this.showUpgradePrompt(`${componentName} is a premium feature`, componentName);
                        return false;
                    }
                    
                    return true;
                };
                
                const dragHandler = (e) => {
                    if (!this.hasAccess('premiumComponents')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const componentElement = e.currentTarget || e.target.closest('.component-item');
                        const componentName = componentElement?.querySelector('.component-name')?.textContent || 'Premium Component';
                        
                        this.showUpgradePrompt(`${componentName} is a premium feature`);
                        return false;
                    }
                };

                component.premiumClickHandler = clickHandler;
                component.premiumDragHandler = dragHandler;
                
                component.addEventListener('click', clickHandler, true);
                component.addEventListener('dragstart', dragHandler, true);
                
                if (!this.hasAccess('premiumComponents')) {
                    component.setAttribute('draggable', 'false');
                    component.classList.add('restricted');
                } else {
                    component.setAttribute('draggable', 'true');
                    component.classList.remove('restricted');
                }
            });
        }
        
        setupPremiumTemplateMarking() {
            if (window.sectionTemplates) {
                Object.entries(window.sectionTemplates).forEach(([key, template]) => {
                    if (template.premium) {
                        console.log(`💎 Premium template identified: ${template.name}`);
                    }
                });
            }
        }
        
        handleAccessCheck(event) {
            if (event.detail && event.detail.feature) {
                const hasAccess = this.hasAccess(event.detail.feature);
                event.detail.callback?.(hasAccess);
                
                if (!hasAccess && event.detail.showPrompt) {
                    this.showUpgradePrompt(event.detail.feature);
                }
            }
        }
        
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
        
        restrictExportOptions() {
            const features = this.features[this.config.userTier];
            if (!features) return;
            
            const allowedFormats = features.exportFormats || [];
            
            const exportOptions = document.querySelectorAll('.export-option');
            exportOptions.forEach(option => {
                const format = option.getAttribute('data-export');
                if (format && !allowedFormats.includes(format)) {
                    option.classList.add('restricted');
                    
                    const boundHandler = this.handleRestrictedExport.bind(this, format);
                    option.addEventListener('click', boundHandler);
                    option._restrictedHandler = boundHandler;
                }
            });
        }
        
        handleRestrictedExport(format, e) {
            e.preventDefault();
            e.stopPropagation();
            this.showUpgradePrompt(`${format.toUpperCase()} export is a premium feature`);
        }
        
        setupUpgradePrompts() {
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
        
        showUpgradePrompt(featureName = 'this feature', templateName = null) {
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
            
            document.getElementById('close-upgrade-btn').addEventListener('click', () => this.closeUpgradePrompt());
            document.getElementById('upgrade-btn').addEventListener('click', () => this.handleUpgradeClick(targetTier));
            document.getElementById('learn-more-btn').addEventListener('click', () => this.handleLearnMore());
            document.getElementById('cancel-upgrade-btn').addEventListener('click', () => this.closeUpgradePrompt());
            
            this.trackUpgradePrompt(featureName, currentTier, targetTier);
        }
        
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
            return 'pro';
        }
        
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
        
        handleUpgradeClick(targetTier = 'pro') {
            this.trackConversionIntent(targetTier);
            this.closeUpgradePrompt();
            
            const upgradeUrl = this.getUpgradeUrl(targetTier);
            if (upgradeUrl) {
                window.open(upgradeUrl, '_blank');
            } else {
                alert(`Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} to unlock premium features!`);
            }
        }
        
        handleLearnMore() {
            this.closeUpgradePrompt();
            const learnMoreUrl = this.config.learnMoreUrl || '/pricing';
            window.open(learnMoreUrl, '_blank');
        }
        
        getUpgradeUrl(tier) {
            const baseUrl = this.config.upgradeUrl || '/upgrade';
            const urls = {
                pro: `${baseUrl}?plan=pro`,
                agency: `${baseUrl}?plan=agency`
            };
            
            return urls[tier] || baseUrl;
        }
        
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
        
        trackUpgradePrompt(featureName, currentTier, targetTier) {
            if (window.mediaKitBuilder?.analytics?.trackEvent) {
                window.mediaKitBuilder.analytics.trackEvent('upgrade_prompt_shown', {
                    feature: featureName,
                    current_tier: currentTier,
                    target_tier: targetTier
                });
            }
        }
        
        trackConversionIntent(targetTier) {
            if (window.mediaKitBuilder?.analytics?.trackEvent) {
                window.mediaKitBuilder.analytics.trackEvent('upgrade_click', {
                    current_tier: this.config.userTier,
                    target_tier: targetTier
                });
            }
        }
        
        setupObserver() {
            this.observer = new MutationObserver((mutations) => {
                let foundNewPremiumComponents = false;
                
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList && node.classList.contains('component-item') && 
                                node.classList.contains('premium') && 
                                !node.hasAttribute('data-handler-attached')) {
                                foundNewPremiumComponents = true;
                            }
                            
                            const premiumComponents = node.querySelectorAll && 
                                node.querySelectorAll('.component-item.premium:not([data-handler-attached])');
                            if (premiumComponents && premiumComponents.length > 0) {
                                foundNewPremiumComponents = true;
                            }
                        }
                    });
                });

                if (foundNewPremiumComponents) {
                    setTimeout(() => {
                        this.setupPremiumComponentHandlers();
                    }, 100);
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
            this.observerActive = true;
        }
        
        stopObserver() {
            if (this.observer) {
                this.observer.disconnect();
                this.observerActive = false;
            }
        }
        
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
    };

    // Initialize once when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (!global.premiumAccessManager) {
                global.premiumAccessManager = new global.PremiumAccessManager({
                    accessTier: global.MediaKitBuilder?.config?.accessTier || 'guest',
                    isAdmin: global.MediaKitBuilder?.config?.isAdmin || false,
                    upgradeUrl: global.MediaKitBuilder?.config?.upgradeUrl || '/pricing/',
                    learnMoreUrl: global.MediaKitBuilder?.config?.learnMoreUrl || '/features/'
                });
                
                // Global method references for backward compatibility
                global.hasAccess = (feature) => global.premiumAccessManager.hasAccess(feature);
                global.canAddMore = (itemType) => global.premiumAccessManager.canAddMore(itemType);
                global.showUpgradePrompt = (feature, template) => global.premiumAccessManager.showUpgradePrompt(feature, template);
                global.closeUpgradePrompt = () => global.premiumAccessManager.closeUpgradePrompt();
                
                document.dispatchEvent(new CustomEvent('premium-access-ready'));
            }
        }, 100);
    });
})(window);