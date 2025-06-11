/**
 * Load media kit data
 * @param {string} entryKey - The entry key to load
 * @returns {Promise} Promise that resolves when load is complete
 */
function loadMediaKitData(entryKey) {
    console.log('Loading media kit data for:', entryKey || config.entryKey || 'NEW KIT');
    
    // Use provided entry key or fallback to config
    const kitEntryKey = entryKey || config.entryKey;
    
    if (!kitEntryKey) {
        console.error('No entry key provided');
        return Promise.reject(new Error('No entry key provided'));
    }
    
    // Show loading message
    showLoading('Loading media kit...');
    
    // Prepare load data
    const loadData = new FormData();
    loadData.append('action', 'mkb_load_kit');
    
    // Try to get nonce from multiple sources for reliability
    let nonce = '';
    
    // 1. Try from MediaKitBuilder config
    if (window.MediaKitBuilder && window.MediaKitBuilder.config && window.MediaKitBuilder.config.nonce) {
        nonce = window.MediaKitBuilder.config.nonce;
        console.log('Using nonce from MediaKitBuilder config');
    } 
    // 2. Try from config object
    else if (config && config.nonce) {
        nonce = config.nonce;
        console.log('Using nonce from config object');
    } 
    // 3. Try from hidden nonce field
    else if (document.getElementById('media_kit_builder_nonce')) {
        nonce = document.getElementById('media_kit_builder_nonce').value;
        console.log('Using nonce from hidden field');
    } 
    // 4. Try from any available nonce field as fallback
    else {
        const nonceField = document.querySelector('[name="_wpnonce"]') || 
                           document.querySelector('[name="nonce"]');
        if (nonceField) {
            nonce = nonceField.value;
            console.log('Using nonce from fallback field');
        } else {
            console.warn('No nonce found, request will likely fail');
        }
    }
    
    loadData.append('nonce', nonce);
    loadData.append('entry_key', kitEntryKey);
    
    // Use correct ajax URL
    const ajaxUrl = config.ajaxUrl || window.ajaxurl || '/wp-admin/admin-ajax.php';
    console.log('Using AJAX URL:', ajaxUrl);
    
    // Send the load request
    return fetch(ajaxUrl, {
        method: 'POST',
        credentials: 'same-origin',
        body: loadData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success && result.data) {
            console.log('Load successful:', result);
            
            // Store configuration data
            config.entryKey = result.data.entry_key;
            config.userId = result.data.user_id;
            config.accessTier = result.data.access_tier;
            config.createdAt = result.data.created_at;
            config.updatedAt = result.data.updated_at;
            
            // Also update window.MediaKitBuilder.config if it exists
            if (window.MediaKitBuilder && window.MediaKitBuilder.config) {
                window.MediaKitBuilder.config.entryKey = result.data.entry_key;
                window.MediaKitBuilder.config.userId = result.data.user_id;
                window.MediaKitBuilder.config.accessTier = result.data.access_tier;
            }
            
            // Update builder with kit data
            populateBuilder(result.data.kit_data);
            
            // Hide loading message
            hideLoading();
            
            // Reset dirty state
            isDirty = false;
            updateSaveStatus('Loaded');
            
            return result.data;
        } else {
            const errorMsg = result.data && result.data.message 
                ? result.data.message 
                : 'Failed to load media kit data';
            throw new Error(errorMsg);
        }
    })
    .catch(error => {
        console.error('Load error:', error);
        hideLoading();
        showErrorMessage('Failed to load media kit: ' + error.message);
        
        // Set as new if we can't load existing
        config.isNew = true;
        loadDefaultData();
        
        throw error;
    });
}

/**
 * Save the media kit
 * @returns {Promise} Promise that resolves when save is complete
 */
function save() {
    console.log('Saving media kit...');
    updateSaveStatus('Saving...');
    showLoading('Saving your media kit...');
    
    // Collect current data
    const currentData = collectCurrentData();
    const sectionData = collectSectionsData();
    
    // Try to get nonce from multiple sources for reliability
    let nonce = '';
    
    // 1. Try from MediaKitBuilder config
    if (window.MediaKitBuilder && window.MediaKitBuilder.config && window.MediaKitBuilder.config.nonce) {
        nonce = window.MediaKitBuilder.config.nonce;
        console.log('Using nonce from MediaKitBuilder config');
    } 
    // 2. Try from config object
    else if (config && config.nonce) {
        nonce = config.nonce;
        console.log('Using nonce from config object');
    } 
    // 3. Try from hidden nonce field
    else if (document.getElementById('media_kit_builder_nonce')) {
        nonce = document.getElementById('media_kit_builder_nonce').value;
        console.log('Using nonce from hidden field');
    } 
    // 4. Try from any available nonce field as fallback
    else {
        const nonceField = document.querySelector('[name="_wpnonce"]') || 
                           document.querySelector('[name="nonce"]');
        if (nonceField) {
            nonce = nonceField.value;
            console.log('Using nonce from fallback field');
        } else {
            console.warn('No nonce found, request will likely fail');
        }
    }
    
    // Prepare save data
    const saveData = new FormData();
    saveData.append('action', 'mkb_save_kit');
    saveData.append('nonce', nonce);
    saveData.append('kit_data', JSON.stringify({
        theme: sectionData.theme || {},
        content: currentData,
        components: sectionData.components || {},
        sections: sectionData.sections || [],
        metadata: {
            version: '2.0',
            legacyData: currentData
        }
    }));
    
    // If we have an entry key, include it (update existing kit)
    if (config.entryKey) {
        saveData.append('entry_key', config.entryKey);
    } else {
        // Otherwise, include user data for new kit
        saveData.append('user_id', config.userId || (window.MediaKitBuilder && window.MediaKitBuilder.config ? window.MediaKitBuilder.config.userId : 0));
        saveData.append('access_tier', config.accessTier || (window.MediaKitBuilder && window.MediaKitBuilder.config ? window.MediaKitBuilder.config.accessTier : 'guest'));
    }
    
    // Use correct ajax URL
    const ajaxUrl = config.ajaxUrl || window.ajaxurl || '/wp-admin/admin-ajax.php';
    console.log('Using AJAX URL for save:', ajaxUrl);
    
    // Send the save request
    return fetch(ajaxUrl, {
        method: 'POST',
        credentials: 'same-origin',
        body: saveData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        hideLoading();
        
        if (result.success) {
            console.log('Save successful:', result);
            
            // Update entry key if this was a new kit
            if (!config.entryKey && result.data && result.data.entry_key) {
                config.entryKey = result.data.entry_key;
                config.isNew = false;
                
                // Also update window.MediaKitBuilder.config if it exists
                if (window.MediaKitBuilder && window.MediaKitBuilder.config) {
                    window.MediaKitBuilder.config.entryKey = result.data.entry_key;
                    window.MediaKitBuilder.config.isNew = false;
                }
                
                // Update URL with new entry key
                if (window.history && window.history.replaceState) {
                    // Handle different URL formats
                    if (window.location.pathname.includes('/media-kit-builder/')) {
                        // New URL format
                        const newUrl = window.location.origin + '/media-kit-builder/' + result.data.entry_key;
                        window.history.replaceState({}, '', newUrl);
                    } else if (window.location.pathname.includes('/new')) {
                        // Handle '/new' path format
                        const newUrl = window.location.pathname.replace('/new', '/' + result.data.entry_key);
                        window.history.replaceState({}, '', newUrl);
                    } else {
                        // Legacy URL format with query params
                        const url = new URL(window.location.href);
                        url.searchParams.set('entry_key', result.data.entry_key);
                        window.history.replaceState({}, '', url.toString());
                    }
                }
                
                showSuccessMessage('Media kit created successfully!');
            } else {
                showSuccessMessage('Media kit saved successfully!');
            }
            
            updateSaveStatus('Saved');
            markClean();
            return result;
        } else {
            throw new Error(result.data && result.data.message ? result.data.message : 'Save failed');
        }
    })
    .catch(error => {
        console.error('Save error:', error);
        hideLoading();
        showErrorMessage('ERROR: ' + error.message);
        updateSaveStatus('Failed');
        throw error;
    });
}