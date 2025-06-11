/**
 * Template System Testing Script
 * Run this in browser console to verify template integration
 */

// Verification functions
function verifyTemplateSystem() {
    console.group('🧪 TEMPLATE SYSTEM VERIFICATION');
    
    // Check template system initialization
    console.log('📋 System Initialization:');
    console.log(`Template system initialized: ${window.templateSystem?.initialized === true}`);
    console.log(`Templates available: ${Object.keys(window.sectionTemplates || {}).length > 0}`);
    
    // Check critical functions
    console.log('\n📋 Critical Functions:');
    const criticalFunctions = [
        'showAddSectionModal',
        'hideAddSectionModal', 
        'insertSectionTemplate',
        'addTemplateComponent'
    ];
    
    criticalFunctions.forEach(func => {
        console.log(`${func}: ${typeof window[func] === 'function' ? '✅ Available' : '❌ Missing'}`);
    });
    
    // Check builder integration
    console.log('\n📋 Builder Integration:');
    const builderFunctions = [
        'addSection',
        'getComponentTemplate',
        'setupElementEventListeners'
    ];
    
    builderFunctions.forEach(func => {
        console.log(`${func}: ${typeof window[func] === 'function' ? '✅ Available' : '❌ Missing'}`);
    });
    
    // Check UI elements
    console.log('\n📋 UI Elements:');
    console.log(`Add Section button: ${document.getElementById('add-section-btn') ? '✅ Found' : '❌ Missing'}`);
    console.log(`Templates button: ${document.getElementById('section-templates-btn') ? '✅ Found' : '❌ Missing'}`);
    
    console.groupEnd();
    
    // Return true if everything looks good
    const templateSystemOK = window.templateSystem?.initialized === true && 
                             typeof window.showAddSectionModal === 'function' &&
                             typeof window.insertSectionTemplate === 'function';
    
    const builderIntegrationOK = typeof window.addSection === 'function' &&
                                typeof window.getComponentTemplate === 'function';
    
    return {
        templateSystemOK,
        builderIntegrationOK,
        overall: templateSystemOK && builderIntegrationOK
    };
}

// Test a specific template insertion
function testTemplateInsertion(templateId = 'hero-minimal') {
    console.group(`🧪 TESTING TEMPLATE INSERTION: ${templateId}`);
    
    try {
        // Check if template exists
        const template = window.sectionTemplates?.[templateId];
        if (!template) {
            console.error(`❌ Template "${templateId}" not found`);
            console.groupEnd();
            return false;
        }
        
        console.log(`📋 Template found: ${template.name}`);
        console.log(`Type: ${template.type}, Layout: ${template.layout}`);
        
        // Check required functions
        if (typeof window.insertSectionTemplate !== 'function') {
            console.error('❌ insertSectionTemplate function not available');
            console.groupEnd();
            return false;
        }
        
        // Test template insertion
        console.log('🚀 Inserting template...');
        window.insertSectionTemplate(templateId);
        
        console.log('✅ Template insertion call completed');
        
        // Verify section was created (done asynchronously)
        setTimeout(() => {
            const sections = document.querySelectorAll('.media-kit-section');
            console.log(`Sections after insertion: ${sections.length}`);
            
            // Check if new section has components
            const lastSection = sections[sections.length - 1];
            const components = lastSection?.querySelectorAll('.editable-element');
            console.log(`Components in new section: ${components?.length || 0}`);
            
            console.log('📋 INSERTION TEST COMPLETE');
        }, 500);
        
        console.groupEnd();
        return true;
    } catch (error) {
        console.error('💥 Error during template insertion test:', error);
        console.groupEnd();
        return false;
    }
}

// Test modal display
function testModalDisplay() {
    console.group('🧪 TESTING MODAL DISPLAY');
    
    try {
        if (typeof window.showAddSectionModal !== 'function') {
            console.error('❌ showAddSectionModal function not available');
            console.groupEnd();
            return false;
        }
        
        console.log('🚀 Opening template modal...');
        window.showAddSectionModal();
        
        setTimeout(() => {
            const modal = document.getElementById('add-section-modal');
            console.log(`Modal visible: ${modal && getComputedStyle(modal).display !== 'none'}`);
            
            // Check modal content
            const templates = modal?.querySelectorAll('.template-card');
            console.log(`Templates in modal: ${templates?.length || 0}`);
            
            // Test template filtering
            if (typeof window.setTemplateFilter === 'function') {
                console.log('Testing category filter...');
                window.setTemplateFilter('hero');
                
                setTimeout(() => {
                    const heroTemplates = modal?.querySelectorAll('.template-card');
                    console.log(`Hero templates: ${heroTemplates?.length || 0}`);
                    
                    // Reset filter
                    window.setTemplateFilter('all');
                    
                    console.log('📋 MODAL TEST COMPLETE');
                    
                    // Auto-close modal after test
                    if (typeof window.hideAddSectionModal === 'function') {
                        window.hideAddSectionModal();
                    }
                }, 500);
            }
        }, 500);
        
        console.groupEnd();
        return true;
    } catch (error) {
        console.error('💥 Error during modal display test:', error);
        console.groupEnd();
        return false;
    }
}

// Run full verification suite
function runVerificationSuite() {
    console.log('🧪🧪🧪 RUNNING FULL TEMPLATE SYSTEM VERIFICATION 🧪🧪🧪');
    
    const verification = verifyTemplateSystem();
    
    if (verification.overall) {
        console.log('✅ Basic verification passed, running functional tests...');
        
        // Run modal test first
        testModalDisplay();
        
        // Wait and then run template insertion test
        setTimeout(() => {
            testTemplateInsertion();
        }, 2000);
    } else {
        console.error('❌ Basic verification failed, skipping functional tests');
        console.log('Issues detected:', verification);
    }
}

// Available test commands
window.verifyTemplateSystem = verifyTemplateSystem;
window.testTemplateInsertion = testTemplateInsertion;
window.testModalDisplay = testModalDisplay;
window.runVerificationSuite = runVerificationSuite;

console.log('🧪 Template System Testing Script loaded');
console.log('Run tests using:');
console.log('- verifyTemplateSystem() - Check system availability');
console.log('- testModalDisplay() - Test template modal');
console.log('- testTemplateInsertion() - Test template insertion');
console.log('- runVerificationSuite() - Run all tests');
