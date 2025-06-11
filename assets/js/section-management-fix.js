/**
 * Section Management Fix
 * This file contains improved section management functions to fix control count mismatch issues
 */

// Core section management setup function with improved robustness
function setupSectionManagement() {
    console.log('🚀 Setting up section management');
    
    // Initialize existing components with sections if needed
    ensureSectionsExist();
    
    // Setup section event listeners
    setupSectionEventListeners();
    
    // First check if sections exist in the DOM
    const sections = document.querySelectorAll('.media-kit-section');
    console.log(`Found ${sections.length} sections in the DOM`);
    
    // If no sections found, try again later
    if (sections.length === 0) {
        console.log('No sections found, will retry in 300ms');
        setTimeout(setupSectionManagement, 300);
        return;
    }
    
    // Add section controls to existing sections with enhanced retry logic
    const controlsAdded = addSectionControls();
    
    // If controls weren't added correctly, retry after a longer delay
    if (!controlsAdded) {
        console.warn('⚠️ Control count mismatch - retrying with longer delay (300ms)');
        setTimeout(function() {
            addSectionControls(true); // Force add with override parameter
        }, 300);
    }
    
    // Setup add section button with delay to ensure layout tab is ready
    setTimeout(() => {
        setupAddSectionButton();
        console.log('✅ Add section buttons configured');
    }, 200);
    
    console.log('✅ Section management setup completed successfully');
}

// Enhanced section controls function with success status return
function addSectionControls(forceAdd = false) {
    console.log('🔧 Adding section controls to existing sections...');
    
    const sections = document.querySelectorAll('.media-kit-section');
    console.log(`📋 Found ${sections.length} sections to add controls to`);
    
    if (sections.length === 0) {
        console.warn('⚠️ No sections found - controls not added');
        return false;
    }
    
    let controlsAdded = 0;
    let controlsSkipped = 0;
    
    sections.forEach((section, index) => {
        const sectionId = section.getAttribute('data-section-id') || `section-${Date.now()}-${index}`;
        
        // Check if controls already exist to avoid duplicates
        if (section.querySelector('.section-controls') && !forceAdd) {
            console.log(`⏭️ Section ${sectionId} already has controls, skipping`);
            controlsSkipped++;
            return;
        } else if (section.querySelector('.section-controls') && forceAdd) {
            // If force adding, remove existing controls first
            console.log(`🔄 Force adding controls - removing existing controls from section ${sectionId}`);
            section.querySelector('.section-controls').remove();
        }
        
        console.log(`➕ Adding controls to section ${sectionId}`);
        
        // Ensure section has proper attributes
        if (!section.getAttribute('data-section-id')) {
            section.setAttribute('data-section-id', sectionId);
        }
        if (!section.getAttribute('data-section-type')) {
            section.setAttribute('data-section-type', 'content');
        }
        if (!section.getAttribute('data-section-layout')) {
            section.setAttribute('data-section-layout', 'full-width');
        }
        
        // Ensure section has proper positioning for controls
        if (getComputedStyle(section).position === 'static') {
            section.style.position = 'relative';
        }
        
        // Create section controls HTML with enhanced visibility
        const controlsHTML = `
            <div class="section-controls" style="position: absolute; top: -35px; right: 10px; z-index: 1000; display: flex; gap: 4px; background: #2a2a2a; border-radius: 6px; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <button class="section-control-btn" data-action="move-up" title="Move Section Up" style="background: #404040; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="move-down" title="Move Section Down" style="background: #404040; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="duplicate" title="Duplicate Section" style="background: #404040; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="settings" title="Section Settings" style="background: #404040; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button class="section-control-btn" data-action="delete" title="Delete Section" style="background: #404040; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Insert controls at the beginning of the section
        section.insertAdjacentHTML('afterbegin', controlsHTML);
        
        // Add hover events to show/hide controls
        section.addEventListener('mouseenter', function() {
            const controls = this.querySelector('.section-controls');
            if (controls) {
                controls.style.display = 'flex';
            }
        });
        
        section.addEventListener('mouseleave', function() {
            const controls = this.querySelector('.section-controls');
            if (controls && !this.classList.contains('selected')) {
                controls.style.display = 'none';
            }
        });
        
        // Add event listeners to control buttons
        const controlButtons = section.querySelectorAll('.section-control-btn');
        controlButtons.forEach(button => {
            const action = button.getAttribute('data-action');
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                console.log(`Section control action: ${action} for section ${sectionId}`);
                
                switch(action) {
                    case 'move-up':
                        moveSectionUp(sectionId);
                        break;
                    case 'move-down':
                        moveSectionDown(sectionId);
                        break;
                    case 'duplicate':
                        duplicateSection(sectionId);
                        break;
                    case 'settings':
                        selectSection(section);
                        // Switch to design tab
                        const designTab = document.querySelector('.sidebar-tab[data-tab="design"]');
                        if (designTab) designTab.click();
                        break;
                    case 'delete':
                        if (confirm('Are you sure you want to delete this section and all its components?')) {
                            deleteSection(sectionId);
                        }
                        break;
                }
            });
        });
        
        console.log(`✅ Controls added successfully to section ${sectionId}`);
        controlsAdded++;
    });
    
    console.log(`📊 Section controls summary: ${controlsAdded} added, ${controlsSkipped} skipped, ${sections.length} total`);
    
    // Verify controls were added successfully
    const success = controlsAdded + controlsSkipped === sections.length;
    if (!success) {
        console.warn(`⚠️ Control count mismatch: ${controlsAdded} added + ${controlsSkipped} skipped != ${sections.length} sections`);
    } else {
        console.log('✅ All section controls added successfully');
    }
    
    // Enhanced visibility verification and fallback
    setTimeout(() => {
        const firstSection = sections[0];
        if (firstSection) {
            // Test hover state first
            firstSection.classList.add('section-hover');
            const controls = firstSection.querySelector('.section-controls');
            
            if (controls) {
                const computedStyle = getComputedStyle(controls);
                const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
                
                if (isVisible) {
                    console.log('🔍 Control visibility test: ✅ PASSED');
                } else {
                    console.log('🔍 Control visibility test: ❌ FAILED - applying fix');
                    
                    // Force display the controls for better UX
                    controls.style.display = 'flex';
                    controls.style.visibility = 'visible';
                    controls.style.opacity = '1';
                    
                    // Also add a fallback class for CSS targeting
                    firstSection.classList.add('controls-visible');
                    
                    console.log('🔧 Applied visibility fix to section controls');
                }
            } else {
                console.log('🔍 Control visibility test: ❌ FAILED - no controls found');
            }
            
            firstSection.classList.remove('section-hover');
        }
        
        // Apply enhanced CSS for better visibility
        addEnhancedControlsCSS();
        
    }, 100);
    
    return success;
}

// Function to add enhanced CSS for section controls
function addEnhancedControlsCSS() {
    // Check if style already exists
    if (document.getElementById('enhanced-section-controls-css')) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'enhanced-section-controls-css';
    style.textContent = `
        .media-kit-section {
            position: relative;
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid transparent;
            transition: all 0.2s ease;
        }
        
        .media-kit-section:hover {
            border-color: rgba(14, 165, 233, 0.3);
        }
        
        .media-kit-section.selected {
            border-color: rgba(14, 165, 233, 0.7);
            box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3);
        }
        
        .section-controls {
            position: absolute;
            top: -35px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 4px;
            background: #2a2a2a;
            border-radius: 6px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .media-kit-section:hover .section-controls,
        .media-kit-section.selected .section-controls,
        .media-kit-section.controls-visible .section-controls {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .section-control-btn:hover {
            background: #555 !important;
            color: #fff !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Enhanced section control CSS added to page');
}

// Generate a UUID helper function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Export functions to be used in the builder
if (typeof window !== 'undefined') {
    window.setupSectionManagement = setupSectionManagement;
    window.addSectionControls = addSectionControls;
    window.addEnhancedControlsCSS = addEnhancedControlsCSS;
    console.log('✅ Section management fix successfully loaded and ready!');
}
