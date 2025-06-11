/**
 * Session Manager
 * Handles guest sessions, user authentication, and data persistence
 */

class SessionManager {
    constructor(builder) {
        this.builder = builder;
        this.sessionId = null;
        this.sessionData = {};
        this.autosaveTimer = null;
        
        this.init();
    }

    init() {
        this.loadSession();
        this.setupSessionHandlers();
        this.startSessionTracking();
    }

    loadSession() {
        // Check for existing session in localStorage
        const storedSession = localStorage.getItem('mkb_session');
        
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                
                // Check if session is still valid (7 days)
                if (this.isSessionValid(session)) {
                    this.sessionId = session.id;
                    this.sessionData = session.data;
                    this.builder.state.isGuest = session.isGuest !== false;
                    
                    // Load session data into builder
                    this.restoreSessionData();
                } else {
                    // Session expired, create new one
                    this.createNewSession();
                }
            } catch (error) {
                console.error('Failed to load session:', error);
                this.createNewSession();
            }
        } else {
            // No session found, create new one
            this.createNewSession();
        }
    }

    createNewSession() {
        this.sessionId = this.generateSessionId();
        this.sessionData = {
            created: Date.now(),
            lastModified: Date.now(),
            mediaKitData: null,
            preferences: {}
        };
        
        this.builder.state.isGuest = true;
        this.saveSessionToLocal();
        
        // Notify server about new session
        this.syncSessionWithServer();
    }

    generateSessionId() {
        return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isSessionValid(session) {
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const sessionAge = Date.now() - session.data.created;
        return sessionAge < sevenDaysInMs;
    }

    setupSessionHandlers() {
        // Listen for storage events (session updates from other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'mkb_session') {
                this.handleSessionUpdate(e.newValue);
            }
        });

        // Save session before page unload
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });

        // Handle visibility change (save when tab becomes hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveCurrentState();
            }
        });
    }

    startSessionTracking() {
        // Track session activity
        this.updateLastActivity();
        
        // Update activity on user interaction
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
        });
        
        // Auto-save session every 30 seconds if dirty
        this.autosaveTimer = setInterval(() => {
            if (this.builder.state.isDirty) {
                this.saveCurrentState();
            }
        }, 30000);
    }

    updateLastActivity() {
        this.sessionData.lastActivity = Date.now();
    }

    saveCurrentState() {
        // Collect current media kit data
        const mediaKitData = this.builder.collectMediaKitData();
        
        this.sessionData.mediaKitData = mediaKitData;
        this.sessionData.lastModified = Date.now();
        
        // Save to localStorage
        this.saveSessionToLocal();
        
        // Sync with server if online
        if (navigator.onLine) {
            this.syncSessionWithServer();
        }
    }

    saveSessionToLocal() {
        const sessionObject = {
            id: this.sessionId,
            isGuest: this.builder.state.isGuest,
            data: this.sessionData
        };
        
        try {
            localStorage.setItem('mkb_session', JSON.stringify(sessionObject));
        } catch (error) {
            console.error('Failed to save session to localStorage:', error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.clearOldSessions();
            }
        }
    }

    clearOldSessions() {
        // Clear old session data to make room
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mkb_') && key !== 'mkb_session') {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    async syncSessionWithServer() {
        try {
            const response = await this.builder.api('sync_session', {
                session_id: this.sessionId,
                session_data: this.sessionData,
                is_guest: this.builder.state.isGuest
            });
            
            if (response.success) {
                // Update session ID if server assigned a new one
                if (response.data.session_id) {
                    this.sessionId = response.data.session_id;
                }
                
                // Update user data if available
                if (response.data.user_data) {
                    this.builder.state.userData = response.data.user_data;
                    this.builder.state.isGuest = false;
                }
            }
        } catch (error) {
            console.error('Failed to sync session with server:', error);
        }
    }

    restoreSessionData() {
        if (!this.sessionData.mediaKitData) return;
        
        try {
            // Restore media kit content
            const preview = document.getElementById('mkb-media-kit-preview');
            if (preview && this.sessionData.mediaKitData.content) {
                preview.innerHTML = this.sessionData.mediaKitData.content;
                
                // Re-setup interactions
                this.builder.setupEditableElements();
                this.builder.dragDropManager.setupDropZones();
                this.builder.dragDropManager.setupElementReordering();
            }
            
            // Restore theme
            if (this.sessionData.mediaKitData.theme) {
                this.builder.templateManager.applyThemePalette(this.sessionData.mediaKitData.theme);
            }
            
            // Restore other preferences
            if (this.sessionData.preferences) {
                this.restorePreferences(this.sessionData.preferences);
            }
            
            console.log('Session restored successfully');
            
        } catch (error) {
            console.error('Failed to restore session:', error);
        }
    }

    restorePreferences(preferences) {
        // Restore preview mode
        if (preferences.previewMode) {
            this.builder.switchPreviewMode(preferences.previewMode);
        }
        
        // Restore sidebar tab
        if (preferences.activeTab) {
            this.builder.switchTab(preferences.activeTab);
        }
    }

    handleSessionUpdate(newValue) {
        if (!newValue) return;
        
        try {
            const newSession = JSON.parse(newValue);
            
            // Check if it's the same session
            if (newSession.id === this.sessionId) {
                // Update local session data
                this.sessionData = newSession.data;
                
                // Optionally reload if significant changes detected
                if (this.hasSignificantChanges(newSession.data)) {
                    this.showReloadPrompt();
                }
            }
        } catch (error) {
            console.error('Failed to handle session update:', error);
        }
    }

    hasSignificantChanges(newData) {
        // Check if the new data has significant changes that warrant a reload
        const currentModified = this.sessionData.lastModified || 0;
        const newModified = newData.lastModified || 0;
        
        return newModified > currentModified + 60000; // More than 1 minute difference
    }

    showReloadPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'mkb-reload-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: var(--mkb-warning);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        prompt.innerHTML = `
            <span>This media kit was updated in another tab.</span>
            <button class="mkb-toolbar-btn" style="background: white; color: var(--mkb-warning);">
                Reload
            </button>
            <button class="mkb-close-prompt" style="background: none; border: none; color: white; cursor: pointer;">
                ×
            </button>
        `;
        
        document.body.appendChild(prompt);
        
        // Reload button
        prompt.querySelector('.mkb-toolbar-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        // Close button
        prompt.querySelector('.mkb-close-prompt').addEventListener('click', () => {
            prompt.remove();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            prompt.remove();
        }, 10000);
    }

    async migrateGuestSession(userId) {
        // Called when a guest user registers/logs in
        if (!this.builder.state.isGuest) return;
        
        try {
            const response = await this.builder.api('migrate_guest_session', {
                session_id: this.sessionId,
                user_id: userId,
                media_kit_data: this.sessionData.mediaKitData
            });
            
            if (response.success) {
                // Update session
                this.builder.state.isGuest = false;
                this.builder.state.userData = response.data.user_data;
                this.builder.state.mediaKitId = response.data.media_kit_id;
                
                // Update UI
                this.updateUserInterface();
                
                // Save updated session
                this.saveSessionToLocal();
                
                console.log('Guest session migrated successfully');
            }
        } catch (error) {
            console.error('Failed to migrate guest session:', error);
        }
    }

    updateUserInterface() {
        // Update user name in toolbar
        const guestName = document.querySelector('.mkb-guest-name');
        if (guestName && this.builder.state.userData.name) {
            guestName.textContent = `${this.builder.state.userData.name}'s Media Kit`;
        }
        
        // Show/hide premium features based on user tier
        this.updatePremiumFeatures();
    }

    updatePremiumFeatures() {
        const isPro = this.builder.state.userData.isPro || false;
        
        // Update premium component badges
        document.querySelectorAll('.mkb-component-item.premium').forEach(item => {
            if (isPro) {
                item.classList.remove('premium');
                item.querySelector('::after')?.remove();
            }
        });
        
        // Update export options
        if (isPro) {
            // Remove watermark notice, etc.
            document.querySelectorAll('.mkb-watermark-notice').forEach(el => el.remove());
        }
    }

    showLoginPrompt(action = 'save') {
        const modal = document.createElement('div');
        modal.className = 'mkb-modal-overlay';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="mkb-modal-content" style="max-width: 400px;">
                <div class="mkb-modal-header">
                    <div class="mkb-modal-title">Save Your Media Kit</div>
                    <button class="mkb-close-modal">&times;</button>
                </div>
                <div class="mkb-modal-body" style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💾</div>
                    <h3 style="margin-bottom: 12px;">Create an Account to ${action}</h3>
                    <p style="color: var(--mkb-text-secondary); margin-bottom: 24px;">
                        Sign up to save your media kit, access it from anywhere, 
                        and unlock premium features.
                    </p>
                    <button class="mkb-toolbar-btn primary" style="width: 100%; margin-bottom: 12px;" id="mkb-signup-btn">
                        Create Free Account
                    </button>
                    <button class="mkb-toolbar-btn" style="width: 100%;" id="mkb-login-btn">
                        I Already Have an Account
                    </button>
                    <p style="font-size: 12px; color: var(--mkb-text-muted); margin-top: 16px;">
                        Your work is saved locally and won't be lost.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup handlers
        modal.querySelector('.mkb-close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Registration/login handlers
        modal.querySelector('#mkb-signup-btn').addEventListener('click', () => {
            this.redirectToRegistration();
        });
        
        modal.querySelector('#mkb-login-btn').addEventListener('click', () => {
            this.redirectToLogin();
        });
    }

    redirectToRegistration() {
        // Save current state
        this.saveCurrentState();
        
        // Redirect to registration with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/register?return_url=${returnUrl}&session_id=${this.sessionId}`;
    }

    redirectToLogin() {
        // Save current state
        this.saveCurrentState();
        
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?return_url=${returnUrl}&session_id=${this.sessionId}`;
    }

    destroy() {
        // Clean up timers and event listeners
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
        }
        
        // Save final state
        this.saveCurrentState();
    }
}

// Export for use in main builder
window.SessionManager = SessionManager;