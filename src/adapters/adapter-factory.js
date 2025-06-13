/**
 * Adapter factory for Media Kit Builder
 * Creates the appropriate adapter based on configuration
 */

/**
 * Configure and create the appropriate adapter
 * @param {Object} config - Configuration options
 * @returns {Object} Platform adapter
 */
export function configureAdapter(config) {
  // Default adapter with minimal functionality
  const defaultAdapter = {
    getConfig: async () => ({}),
    save: async () => true,
    load: async () => ({}),
    on: (event, handler) => {
      // No-op
      return () => {};
    }
  };
  
  // If no platform specified, return default adapter
  if (!config.platform) {
    console.warn('No platform specified, using default adapter');
    return defaultAdapter;
  }
  
  // Create adapter based on platform
  switch (config.platform) {
    case 'wordpress':
      // This will be implemented in Phase 4
      console.log('Using WordPress adapter');
      return {
        ...defaultAdapter,
        // WordPress-specific methods will be added later
        getConfig: async () => {
          // For now, just return any WordPress config from the global variable
          return window.mediaKitBuilderWPConfig || {};
        }
      };
      
    case 'standalone':
      // This will be implemented in Phase 4
      console.log('Using standalone adapter');
      return {
        ...defaultAdapter,
        // Standalone-specific methods will be added later
        getConfig: async () => {
          // For standalone, we might use localStorage
          const savedConfig = localStorage.getItem('mediaKitBuilderConfig');
          return savedConfig ? JSON.parse(savedConfig) : {};
        },
        save: async (data) => {
          // Simple localStorage save
          localStorage.setItem('mediaKitBuilderData', JSON.stringify(data));
          return true;
        },
        load: async () => {
          // Simple localStorage load
          const savedData = localStorage.getItem('mediaKitBuilderData');
          return savedData ? JSON.parse(savedData) : {};
        }
      };
      
    default:
      console.warn(`Unknown platform "${config.platform}", using default adapter`);
      return defaultAdapter;
  }
}
