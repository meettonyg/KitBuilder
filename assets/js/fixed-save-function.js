/**
 * Save media kit data to server
 * @returns {Promise} Promise that resolves when save is complete
 */
function save() {
    console.log('💾 Saving media kit...');
    updateSaveStatus('Saving');
    
    // Get current configuration - use cached reference to avoid using wrong variable in closure
    const mediaKitConfig = window.MediaKitBuilder?.config || {};
    
    // Determine if this is a new kit or existing kit
    const isNew = mediaKitConfig.isNew || !mediaKitConfig.entryKey;
    
    console.log('📊 Save operation:', {
        isNew: isNew, 
        entryKey: mediaKitConfig.entryKey, 
        userId: mediaKitConfig.userId,
        accessTier: mediaKitConfig.accessTier
    });
    
    // Choose appropriate action based on whether this is a new kit or existing one
    const action = isNew ? 'create_media_kit' : 'update_media_kit';
    
    // Collect current data from the builder
    const legacyData = collectCurrentData(); // For backward compatibility
    const sectionData = collectSectionsData(); // Get modern section-based data
    
    // Session ID for guest users - GENERATE IF MISSING
    let sessionId = localStorage.getItem('guestify_session_id');
    if (!sessionId) {
        sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestify_session_id', sessionId);
        console.log('🆕 Generated new session ID:', sessionId);
    } else {
        console.log('🔑 Using existing session ID:', sessionId);
    }
    
    // Prepare save data in a format the server understands
    const saveData = {
        action: action,
        nonce: mediaKitConfig.nonce,
        kit_data: JSON.stringify({
            theme: sectionData.theme || {},
            content: legacyData,
            components: sectionData.components || {},
            sections: sectionData.sections || [],
            metadata: {
                version: '2.0',
                legacyData: legacyData
            }
        }),
        session_id: sessionId
    };
    
    // For existing kits, include the entry key
    if (!isNew) {
        saveData.entry_key = mediaKitConfig.entryKey;
        console.log('📝 Updating existing media kit:', mediaKitConfig.entryKey);
    }
    
    // For new kits, include user ID and access tier
    if (isNew) {
        saveData.user_id = mediaKitConfig.userId || 0;
        saveData.access_tier = mediaKitConfig.accessTier || 'guest';
        console.log('🆕 Creating new media kit');
    }
    
    // Log the parameters being sent
    console.log('📤 Save data prepared:', action, Object.keys(saveData));
    
    // Get the correct AJAX URL
    const ajaxUrl = mediaKitConfig.ajaxUrl || window.ajaxurl || '/wp-admin/admin-ajax.php';
    console.log('📮 Using AJAX URL:', ajaxUrl);
    
    // Send data to server using fetch API
    return fetch(ajaxUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(saveData)
    })
    .then(response => {
        console.log('📥 Save response received:', response.status);
        
        // Check if response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(result => {
        console.log('📊 Save result:', result.success ? '✅ Success' : '❌ Failed', result);
        
        if (result.success) {
            // If this was a new kit, update config with new ID
            if (isNew && result.data) {
                // Get the new entry key - handle different response formats
                const newEntryKey = result.data.entry_key || result.data.kit_id;
                
                if (newEntryKey) {
                    // Update our config
                    mediaKitConfig.entryKey = newEntryKey;
                    mediaKitConfig.isNew = false;
                    window.MediaKitBuilder.config.entryKey = newEntryKey;
                    window.MediaKitBuilder.config.isNew = false;
                    
                    console.log('🆕 New media kit created with ID:', newEntryKey);
                    
                    // Update URL to include the new entry key
                    if (history && history.replaceState) {
                        // Handle different URL formats
                        if (window.location.pathname.includes('/media-kit-builder/')) {
                            // New URL format
                            const newUrl = window.location.origin + '/media-kit-builder/' + newEntryKey;
                            history.replaceState(null, '', newUrl);
                        } else {
                            // Legacy URL format with query params
                            const url = new URL(window.location.href);
                            url.searchParams.set('entry_key', newEntryKey);
                            history.replaceState(null, '', url.toString());
                        }
                    }
                    
                    // Show success message for new kits
                    showSuccessMessage('Media kit created successfully!');
                }
            } else {
                // Show success message for updates
                showSuccessMessage('Media kit saved successfully!');
            }
            
            // Update save status
            updateSaveStatus('Saved');
            markClean();
            
            return result;
        } else {
            const errorMsg = result.data || 'Save failed';
            console.error('❌ Save failed:', errorMsg);
            showErrorMessage('ERROR: ' + errorMsg);
            updateSaveStatus('Failed');
            throw new Error(errorMsg);
        }
    })
    .catch(error => {
        console.error('💥 Save error:', error.message);
        showErrorMessage('ERROR: Save failed - ' + error.message);
        updateSaveStatus('Failed');
        throw error;
    });
}