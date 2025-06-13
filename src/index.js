/**
 * Main entry point for Media Kit Builder
 */
import { Builder } from './core/builder';
import { configureAdapter } from './adapters/adapter-factory';
import { ThemeProvider } from './ui/theming/theme-provider';
import { UIManager } from './ui/manager';

// Import CSS
import './styles/variables.css';
import './styles/base/reset.css';
import './styles/base/typography.css';

// Export the Builder class as the default export
export default Builder;

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Media Kit Builder initializing...');
  
  try {
    // Get configuration from global variable
    const config = window.mediaKitBuilderConfig || {};
    
    // Set up theme provider
    const themeProvider = new ThemeProvider();
    themeProvider.applyTheme(config.theme || 'default');
    
    // Create adapter based on environment
    const adapter = configureAdapter(config);
    
    // Create and initialize builder
    const builder = new Builder(config, adapter);
    
    // Set up UI manager
    const uiManager = new UIManager(builder.events, {
      state: builder.state,
      registry: builder.components,
      themeProvider
    });
    
    // Initialize builder first
    builder.initialize()
      .then(() => {
        console.log('Builder core initialized successfully');
        
        // Then initialize UI
        return uiManager.initialize({
          container: config.container || '#media-kit-builder',
          theme: config.theme || 'default'
        });
      })
      .then(() => {
        console.log('Media Kit Builder initialized successfully');
        
        // Store instance for debugging
        window.mediaKitBuilderInstance = builder;
        window.mediaKitBuilderUI = uiManager;
        
        // Show initialization success notification
        if (uiManager.showNotification) {
          uiManager.showNotification('Media Kit Builder loaded successfully', 'success');
        }
      })
      .catch(error => {
        console.error('Failed to initialize Media Kit Builder:', error);
        
        // Show error UI
        const errorContainer = document.createElement('div');
        errorContainer.className = 'mkb-error-container';
        errorContainer.innerHTML = `
          <div class="mkb-error-title">Initialization Failed</div>
          <div class="mkb-error-message">${error.message}</div>
          <button class="mkb-retry-button">Retry</button>
        `;
        
        document.querySelector(config.container || '#media-kit-builder')?.appendChild(errorContainer);
        
        document.querySelector('.mkb-retry-button')?.addEventListener('click', () => {
          window.location.reload();
        });
      });
  } catch (error) {
    console.error('Error during Media Kit Builder initialization:', error);
  }
});
