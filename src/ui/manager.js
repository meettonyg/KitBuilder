/**
 * UI Manager
 * Coordinates all UI components
 */

import { EventEmitter } from '@core/events';
import { Palette } from './palette';
import { Preview } from './preview';
import { Controls } from './controls';
import { DesignPanel } from './design-panel';
import ThemeProvider from './theming/theme-provider';

export class UIManager {
  /**
   * Create a UI manager
   * @param {EventEmitter} events - Event system
   * @param {Object} options - Configuration options
   * @param {StateManager} options.state - State manager
   * @param {ComponentRegistry} options.registry - Component registry
   */
  constructor(events, options = {}) {
    this.events = events || new EventEmitter();
    this.state = options.state;
    this.registry = options.registry;
    
    this.components = {
      palette: null,
      preview: null,
      controls: null,
      designPanel: null
    };
    
    this.themeProvider = options.themeProvider || new ThemeProvider(this.events);
    this.initialized = false;
  }

  /**
   * Initialize the UI manager
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize(config = {}) {
    try {
      // Check if container exists
      const container = document.querySelector(config.container);
      if (!container) {
        throw new Error(`Container ${config.container} not found`);
      }
      
      // Apply initial theme
      if (config.theme) {
        this.themeProvider.applyTheme(config.theme);
      }
      
      // Create layout
      this.createLayout(container);
      
      // Initialize UI components
      this.initializeComponents(config);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Mark as initialized
      this.initialized = true;
      this.events.emit('ui-initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize UI:', error);
      this.events.emit('error', {
        message: `Failed to initialize UI: ${error.message}`,
        error,
        context: 'ui-initialization'
      });
      
      return false;
    }
  }

  /**
   * Create the layout structure
   * @param {HTMLElement} container - Container element
   */
  createLayout(container) {
    container.innerHTML = `
      <div class="mkb-layout">
        <div class="mkb-header" id="mkb-controls-container"></div>
        <div class="mkb-main">
          <div class="mkb-sidebar" id="mkb-palette-container"></div>
          <div class="mkb-content" id="mkb-preview-container"></div>
          <div class="mkb-sidebar" id="mkb-design-panel-container"></div>
        </div>
      </div>
    `;
    
    // Add layout styles (these are global styles, not CSS modules)
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .mkb-layout {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
      }
      
      .mkb-header {
        flex: 0 0 auto;
      }
      
      .mkb-main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .mkb-sidebar {
        flex: 0 0 300px;
        overflow: auto;
        padding: var(--spacing-md);
      }
      
      .mkb-content {
        flex: 1;
        overflow: auto;
        padding: var(--spacing-md);
      }
      
      @media (max-width: 1200px) {
        .mkb-sidebar {
          flex: 0 0 250px;
        }
      }
      
      @media (max-width: 992px) {
        .mkb-main {
          flex-direction: column;
        }
        
        .mkb-sidebar {
          flex: 0 0 auto;
          width: 100%;
        }
      }
    `;
    
    document.head.appendChild(styleEl);
  }

  /**
   * Initialize UI components
   * @param {Object} config - Configuration options
   */
  initializeComponents(config) {
    // Create controls
    this.components.controls = new Controls(this.events, {
      state: this.state
    });
    this.components.controls.render('#mkb-controls-container');
    
    // Create component palette
    this.components.palette = new Palette(this.events, {
      registry: this.registry
    });
    this.components.palette.render('#mkb-palette-container');
    
    // Create preview area
    this.components.preview = new Preview(this.events, {
      state: this.state,
      registry: this.registry
    });
    this.components.preview.render('#mkb-preview-container');
    
    // Create design panel
    this.components.designPanel = new DesignPanel(this.events, {
      state: this.state,
      registry: this.registry
    });
    this.components.designPanel.render('#mkb-design-panel-container');
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Handle state changes
    if (this.state) {
      this.state.subscribe(this.handleStateChange.bind(this));
    }
    
    // Handle theme changes
    this.events.on('theme-changed', this.handleThemeChanged.bind(this));
    
    // Handle component actions
    this.events.on('component-added', this.handleComponentAdded.bind(this));
    this.events.on('component-updated', this.handleComponentUpdated.bind(this));
    this.events.on('component-moved', this.handleComponentMoved.bind(this));
    this.events.on('component-deleted', this.handleComponentDeleted.bind(this));
    this.events.on('component-selected', this.handleComponentSelected.bind(this));
    
    // Handle save actions
    this.events.on('save-requested', this.handleSaveRequested.bind(this));
    this.events.on('save-completed', this.handleSaveCompleted.bind(this));
    
    // Handle undo/redo
    this.events.on('undo-requested', this.handleUndoRequested.bind(this));
    this.events.on('redo-requested', this.handleRedoRequested.bind(this));
    
    // Handle preview/export
    this.events.on('preview-requested', this.handlePreviewRequested.bind(this));
    this.events.on('export-requested', this.handleExportRequested.bind(this));
  }

  /**
   * Handle state changes
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   */
  handleStateChange(oldState, newState) {
    // Update preview with new components if they changed
    if (newState.components !== oldState.components) {
      this.components.preview.update(newState.components);
    }
    
    // Update design panel if selected component changed
    if (newState.selectedComponentId !== oldState.selectedComponentId) {
      const selectedComponent = newState.components.find(
        c => c.id === newState.selectedComponentId
      );
      this.components.designPanel.update(selectedComponent);
    }
  }

  /**
   * Handle theme changes
   * @param {Object} data - Event data
   */
  handleThemeChanged(data) {
    // You can update theme-specific UI here if needed
    console.log(`Theme changed to: ${data.theme}`);
  }

  /**
   * Handle component added
   * @param {Object} data - Event data
   */
  handleComponentAdded(data) {
    if (this.state) {
      this.state.markDirty();
    }
  }

  /**
   * Handle component updated
   * @param {Object} data - Event data
   */
  handleComponentUpdated(data) {
    if (this.state) {
      this.state.markDirty();
    }
  }

  /**
   * Handle component moved
   * @param {Object} data - Event data
   */
  handleComponentMoved(data) {
    if (this.state) {
      this.state.markDirty();
    }
  }

  /**
   * Handle component deleted
   * @param {Object} data - Event data
   */
  handleComponentDeleted(data) {
    if (this.state) {
      this.state.markDirty();
    }
  }

  /**
   * Handle component selected
   * @param {Object} data - Event data
   */
  handleComponentSelected(data) {
    // This is handled by the state subscriber
  }

  /**
   * Handle save requested
   * @param {Object} data - Event data
   */
  handleSaveRequested(data) {
    // This would typically call an adapter to save the data
    console.log('Save requested:', data);
  }

  /**
   * Handle save completed
   * @param {Object} data - Event data
   */
  handleSaveCompleted(data) {
    if (data.success) {
      // Show success notification
      this.showNotification('Media kit saved successfully!', 'success');
    } else {
      // Show error notification
      this.showNotification('Failed to save media kit', 'error');
    }
  }

  /**
   * Handle undo requested
   */
  handleUndoRequested() {
    if (this.state) {
      this.state.undo();
    }
  }

  /**
   * Handle redo requested
   */
  handleRedoRequested() {
    if (this.state) {
      this.state.redo();
    }
  }

  /**
   * Handle preview requested
   */
  handlePreviewRequested() {
    // Open preview in new window or modal
    console.log('Preview requested');
  }

  /**
   * Handle export requested
   */
  handleExportRequested() {
    // Trigger export process
    console.log('Export requested');
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `mkb-notification mkb-notification-${type}`;
    notification.innerHTML = `
      <div class="mkb-notification-content">${message}</div>
      <button class="mkb-notification-close">&times;</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add notification styles if not already added
    if (!document.querySelector('#mkb-notification-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'mkb-notification-styles';
      styleEl.textContent = `
        .mkb-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 300px;
          z-index: 9999;
          animation: mkb-notification-in 0.3s ease forwards;
        }
        
        .mkb-notification-success {
          background-color: var(--color-success);
          color: white;
        }
        
        .mkb-notification-error {
          background-color: var(--color-error);
          color: white;
        }
        
        .mkb-notification-info {
          background-color: var(--color-info);
          color: white;
        }
        
        .mkb-notification-content {
          flex: 1;
          margin-right: 12px;
        }
        
        .mkb-notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          opacity: 0.8;
        }
        
        .mkb-notification-close:hover {
          opacity: 1;
        }
        
        @keyframes mkb-notification-in {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes mkb-notification-out {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100px);
            opacity: 0;
          }
        }
      `;
      
      document.head.appendChild(styleEl);
    }
    
    // Add close handler
    const closeBtn = notification.querySelector('.mkb-notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'mkb-notification-out 0.3s ease forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'mkb-notification-out 0.3s ease forwards';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
}

export default UIManager;
