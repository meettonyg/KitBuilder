/**
 * Load media kit data
 */
function loadMediaKit() {
    console.log('📎 Loading media kit data for:', config.entryKey || 'NEW KIT');
    
    showLoading('Loading your media kit...');
    
    // Generate session ID if needed
    let sessionId = localStorage.getItem('guestify_session_id');
    if (!sessionId) {
        sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestify_session_id', sessionId);
        console.log('🆕 Generated new session ID for load:', sessionId);
    }
    
    // Prepare load request data
    const loadData = {
        action: 'load_media_kit',
        nonce: config.nonce,
        session_id: sessionId
    };
    
    // Add is_new flag for new kits
    if (config.isNew) {
        loadData.is_new = 'true';
        console.log('🆕 Loading new media kit template');
    } else if (config.entryKey) {
        loadData.entry_key = config.entryKey;
        console.log('🔍 Loading existing media kit:', config.entryKey);
    } else {
        // Fallback for unknown state
        loadData.is_new = 'true';
        console.log('⚠️ Unknown state, defaulting to new kit');
    }
    
    // Use full URL from config if available
    const ajaxUrl = config.ajaxUrl || window.ajaxurl || '/wp-admin/admin-ajax.php';
    
    console.log('📣 Load request:', loadData);
    
    fetch(ajaxUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(loadData)
    })
    .then(response => {
        console.log('📥 Load response received:', response.status);
        
        if (!response.ok) {
            // For 400/500 errors, still try to get response text
            return response.text().then(text => {
                try {
                    // Try to parse as JSON first
                    return JSON.parse(text);
                } catch (e) {
                    // If not JSON, create error object with text
                    throw new Error(`Server error (${response.status}): ${text || 'No error details'}`); 
                }
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('📊 Data loaded:', data);
        
        if (data.success) {
            console.log('✅ Media kit loaded successfully');
            
            // Check if this is a new kit response
            if (data.data && data.data.is_new) {
                console.log('🆕 Initializing new media kit');
                config.isNew = true;
                loadDefaultData();
                updateStatus('Ready');
                hideLoading();
                return;
            }
            
            // Handle both legacy and new data formats
            const loadedData = data.data || {};
            
            // Check if we have new format (sections and components)
            if (loadedData.kit_data) {
                try {
                    // Parse kit_data if it's a string
                    const kitData = typeof loadedData.kit_data === 'string' ? 
                        JSON.parse(loadedData.kit_data) : loadedData.kit_data;
                        
                    console.log('📦 Parsed kit data:', kitData);
                    
                    if (kitData.sections && kitData.components) {
                        mediaKitData = {
                            version: '2.0',
                            theme: kitData.theme || { id: 'modern-blue' },
                            sections: kitData.sections,
                            components: kitData.components
                        };
                        populateFromSections(mediaKitData);
                    } else if (kitData.metadata && kitData.metadata.legacyData) {
                        // Use legacy data if available
                        currentData = kitData.metadata.legacyData;
                        populateBuilder(currentData);
                    } else {
                        console.log('🔄 Using default data format');
                        loadDefaultData();
                    }
                } catch (e) {
                    console.warn('⚠️ Error parsing loaded data, using fallback:', e);
                    loadDefaultData();
                }
            } else if (loadedData.metadata && loadedData.components) {
                try {
                    const metadata = typeof loadedData.metadata === 'string' ? 
                        JSON.parse(loadedData.metadata) : loadedData.metadata;
                    const components = typeof loadedData.components === 'string' ? 
                        JSON.parse(loadedData.components) : loadedData.components;
                    
                    // Reconstruct section-based data
                    if (metadata.sections) {
                        mediaKitData = {
                            version: '2.0',
                            theme: { id: loadedData.theme || 'modern-blue' },
                            sections: metadata.sections,
                            components: components
                        };
                        populateFromSections(mediaKitData);
                    } else if (metadata.legacyData) {
                        // Use legacy data if available
                        currentData = metadata.legacyData;
                        populateBuilder(currentData);
                    } else {
                        loadDefaultData();
                    }
                } catch (e) {
                    console.warn('⚠️ Error parsing loaded data, using fallback:', e);
                    loadDefaultData();
                }
            } else {
                // Legacy format
                currentData = loadedData;
                populateBuilder(currentData);
            }
            
            updateStatus('Loaded');
        } else {
            console.error('❌ Failed to load data:', data);
            
            if (data.data && data.data.message) {
                showErrorMessage(data.data.message);
            } else {
                showErrorMessage('Failed to load media kit');
            }
            
            // Set as new if we can't load existing
            config.isNew = true;
            loadDefaultData();
        }
        
        hideLoading();
    })
    .catch(error => {
        console.error('💥 Error loading data:', error);
        updateStatus('Error');
        showErrorMessage('Error loading media kit: ' + error.message);
        hideLoading();
        
        // Set as new if we can't load existing
        config.isNew = true;
        loadDefaultData();
    });
}