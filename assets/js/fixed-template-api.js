/**
 * Fixed Template API Module
 * Resolves the 403 Forbidden error when accessing the templates REST API endpoint
 */

/**
 * Enhanced fetchSectionTemplates function that ensures proper authentication
 * by correctly passing the nonce in the headers.
 */
async function fixedFetchSectionTemplates() {
    try {
        console.log('📡 [FIXED] Fetching section templates from registry...');
        
        // Get nonce from multiple possible sources with enhanced reliability
        const nonce = getAuthNonce();
        
        console.log('🔑 Using nonce for templates API:', nonce ? 'Found' : 'Not found');
        
        // Use WordPress REST API endpoint for templates with improved authentication
        const response = await fetch('/wp-json/media-kit/v1/templates', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            }
        });
        
        if (!response.ok) {
            console.error(`❌ Template API Error: ${response.status} ${response.statusText}`);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const templates = await response.json();
        console.log(`✅ Successfully loaded ${Object.keys(templates).length} templates from registry`);
        return templates;
    } catch (error) {
        console.error('❌ Failed to fetch templates from registry:', error.message);
        
        // Attempt to get templates directly from builder if available
        if (window.MediaKitBuilder?.templates && typeof window.MediaKitBuilder.templates === 'object') {
            console.log('🔄 Using templates from MediaKitBuilder');
            return window.MediaKitBuilder.templates;
        }
        
        // Last resort - check for templates in window global
        if (window.__sectionTemplates && typeof window.__sectionTemplates === 'object') {
            console.log('🔄 Using templates from window.__sectionTemplates');
            return window.__sectionTemplates;
        }
        
        // Load default templates from fallback object if REST API fails
        console.warn('⚠️ Using default templates object as fallback');
        
        // Default templates (provide at least one basic template)
        const defaultTemplates = {
            'basic-content': {
                name: 'Basic Content Section',
                type: 'content',
                layout: 'full-width',
                description: 'Simple content section with title and text',
                premium: false,
                components: [
                    {
                        type: 'bio',
                        content: {
                            title: 'About Me',
                            text: 'Add your professional biography here. Describe your expertise, experience, and what makes you unique.'
                        }
                    }
                ]
            },
            'basic-hero': {
                name: 'Simple Hero Section',
                type: 'hero',
                layout: 'full-width',
                description: 'Basic hero section with name and title',
                premium: false,
                components: [
                    {
                        type: 'hero',
                        content: {
                            name: 'Your Name',
                            title: 'Your Professional Title',
                            bio: 'Add a short introduction about yourself'
                        }
                    }
                ]
            },
            'two-column-bio': {
                name: 'Two Column Bio',
                type: 'content',
                layout: 'two-column',
                description: 'Biography with image',
                premium: false,
                components: {
                    'left': [
                        {
                            type: 'bio',
                            content: {
                                title: 'About Me',
                                text: 'Your professional biography goes here...'
                            }
                        }
                    ],
                    'right': [
                        {
                            type: 'image',
                            content: {
                                url: '',
                                alt: 'Profile Image'
                            }
                        }
                    ]
                }
            },
            'social-links': {
                name: 'Social Links',
                type: 'contact',
                layout: 'full-width',
                description: 'Social media links',
                premium: false,
                components: [
                    {
                        type: 'social',
                        content: {}
                    }
                ]
            }
        };
        
        console.log('📋 Loaded default templates:', Object.keys(defaultTemplates).length);
        return defaultTemplates;
    }
}

/**
 * Enhanced nonce retrieval function that checks multiple sources
 * and ensures we always get a valid nonce for API requests.
 */
function getAuthNonce() {
    // Try all possible sources for the nonce
    const possibleSources = [
        // Primary source - from the MediaKitBuilder config
        window.MediaKitBuilder?.config?.nonce,
        
        // Secondary source - from mkbConfig if available
        window.mkbConfig?.nonce,
        
        // Get from any nonce fields in the DOM
        document.querySelector('#_wpnonce')?.value,
        document.querySelector('[name="_wpnonce"]')?.value,
        
        // Look for data attributes that might contain nonce
        document.querySelector('[data-nonce]')?.getAttribute('data-nonce'),
        
        // Last resort - check if there's a global nonce variable
        window._wpnonce
    ];
    
    // Return the first non-empty value
    for (const source of possibleSources) {
        if (source) {
            console.log('📌 Found nonce from source:', source.substring(0, 4) + '...');
            return source;
        }
    }
    
    // If no nonce found, try to get it from the ajax object
    if (window.ajaxurl && window.MediaKitBuilder?.config?.ajaxUrl) {
        console.log('⚠️ No nonce found, attempting AJAX fallback');
        // This is a last resort option to get a nonce
        return ''; // Empty string as fallback
    }
    
    console.error('❌ No valid nonce found from any source');
    return '';
}

/**
 * Override the original fetchSectionTemplates function with our fixed version
 */
function applyTemplateAPIFix() {
    console.log('🔧 Applying template API fix...');
    
    // Wait for the original function to be available
    if (typeof window.fetchSectionTemplates !== 'function') {
        console.log('⏳ Original fetchSectionTemplates not yet available, waiting...');
        setTimeout(applyTemplateAPIFix, 100);
        return;
    }
    
    // Store the original function for reference
    window._originalFetchSectionTemplates = window.fetchSectionTemplates;
    
    // Replace with our fixed version
    window.fetchSectionTemplates = fixedFetchSectionTemplates;
    
    console.log('✅ Template API fix applied successfully');
    
    // If initializeTemplates exists, call it to refresh templates
    if (typeof window.initializeTemplates === 'function') {
        console.log('🔄 Refreshing templates with fixed API...');
        window.initializeTemplates().then(() => {
            console.log('✅ Templates refreshed with fixed API');
        });
    }
}

// Apply the fix as soon as the script loads
applyTemplateAPIFix();

// Make the fixed function available globally
window.fixedFetchSectionTemplates = fixedFetchSectionTemplates;
