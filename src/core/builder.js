/**
 * Main builder class for Media Kit Builder
 * Coordinates all aspects of the builder
 */
import { EventEmitter } from './events.js';
import { StateManager } from './state.js';
import { ComponentRegistry } from '../components/registry.js';
import { ErrorManager } from '../utils/error-manager.js';

export class Builder {
  /**
   * Initialize the builder
   * @param {Object} config - Configuration options
   * @param {Object} adapter - Platform adapter
   */
  constructor(config = {}, adapter = null) {
    this.config = config;
    this.adapter = adapter;
    this.events = new EventEmitter();
    this.state = new StateManager();
    this.errorManager = new ErrorManager(this.events);
    this.components = new ComponentRegistry(this.events);
    this.initialized = false;
    
    // Set up event logging for debugging
    if (this.config.debug) {
      this.events.on('*', (eventData) => {
        console.log(`[Event] ${eventData.eventName}`, eventData);
      });
    }
  }
  
  /**
   * Initialize the builder
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }
    
    try {
      this.events.emit('initializing', { timestamp: new Date() });
      
      // 1. Load configuration
      await this.loadConfig();
      
      // 2. Initialize state management
      this.state.initialize && await this.state.initialize();
      
      // 3. Initialize component registry
      await this.components.initialize();
      
      // 4. Set up UI (will be implemented in later phases)
      
      // 5. Set up event handlers
      this.setupEventHandlers();
      
      // 6. Mark as initialized
      this.initialized = true;
      this.events.emit('initialized', { timestamp: new Date() });
      
      return true;
    } catch (error) {
      this.events.emit('initialization-failed', { error });
      this.errorManager.logError('initialization', error);
      throw error;
    }
  }
  
  /**
   * Load configuration
   * @returns {Promise} Resolves when configuration is loaded
   */
  async loadConfig() {
    try {
      // If adapter provides configuration, use it
      if (this.adapter && typeof this.adapter.getConfig === 'function') {
        const adapterConfig = await this.adapter.getConfig();
        this.config = { ...this.config, ...adapterConfig };
      }
      
      // Emit configuration loaded event
      this.events.emit('config-loaded', { config: this.config });
      
      return this.config;
    } catch (error) {
      this.errorManager.logError('load-config', error);
      throw error;
    }
  }
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Set up state change event
    this.state.subscribe((oldState, newState) => {
      this.events.emit('state-changed', { oldState, newState });
    });
    
    // Handle adapter events
    if (this.adapter && typeof this.adapter.on === 'function') {
      this.adapter.on('save-requested', () => {
        this.save();
      });
      
      this.adapter.on('load-requested', (data) => {
        this.load(data);
      });
    }
  }
  
  /**
   * Register a platform adapter
   * @param {Object} adapter - Platform adapter
   */
  registerAdapter(adapter) {
    this.adapter = adapter;
    this.events.emit('adapter-registered', { adapter });
  }
  
  /**
   * Register a theme provider
   * @param {Object} themeProvider - Theme provider
   */
  registerThemeProvider(themeProvider) {
    this.themeProvider = themeProvider;
    
    if (this.themeProvider && typeof this.themeProvider.events === 'undefined') {
      this.themeProvider.events = this.events;
    }
    
    this.events.emit('theme-provider-registered', { themeProvider });
  }
  
  /**
   * Save the current state
   * @returns {Promise} Resolves when save is complete
   */
  async save() {
    if (!this.adapter) {
      throw new Error('No adapter registered. Cannot save.');
    }
    
    try {
      this.events.emit('save-started');
      
      const data = {
        state: this.state.getState(),
        version: this.config.version || '1.0.0',
        timestamp: new Date().toISOString()
      };
      
      await this.adapter.save(data);
      
      this.state.markClean();
      this.events.emit('save-completed', { timestamp: new Date() });
      
      return true;
    } catch (error) {
      this.events.emit('save-failed', { error });
      this.errorManager.logError('save', error);
      throw error;
    }
  }
  
  /**
   * Load data into the builder
   * @param {Object} data - Data to load
   * @returns {Promise} Resolves when load is complete
   */
  async load(data) {
    try {
      this.events.emit('load-started');
      
      // Validate data
      if (!data || !data.state) {
        throw new Error('Invalid data format');
      }
      
      // Apply state
      this.state.setState(data.state);
      
      this.state.markClean();
      this.events.emit('load-completed', { timestamp: new Date() });
      
      return true;
    } catch (error) {
      this.events.emit('load-failed', { error });
      this.errorManager.logError('load', error);
      throw error;
    }
  }
  
  /**
   * Add a component to the builder
   * @param {string} type - Component type
   * @param {Object} data - Component data
   * @returns {Object} Created component
   */
  addComponent(type, data = {}) {
    try {
      // Create a new component
      const component = this.components.createComponent(type, data);
      
      // Update state to include the new component
      const sections = [...this.state.getState().sections];
      const sectionId = data.sectionId || (sections.length > 0 ? sections[0].id : null);
      
      if (!sectionId) {
        throw new Error('No section available to add component to');
      }
      
      // Find the section and add component
      const sectionIndex = sections.findIndex(section => section.id === sectionId);
      if (sectionIndex === -1) {
        throw new Error(`Section with id ${sectionId} not found`);
      }
      
      sections[sectionIndex].components = [
        ...sections[sectionIndex].components,
        component
      ];
      
      // Save the previous state for undo
      this.state.addToUndoStack(this.state.getState());
      
      // Update state
      this.state.setState({ sections });
      
      // Emit event
      this.events.emit('component-added', { component, sectionId });
      
      return component;
    } catch (error) {
      this.errorManager.logError('add-component', error);
      throw error;
    }
  }
  
  /**
   * Update a component
   * @param {string} id - Component ID
   * @param {Object} data - Updated component data
   * @returns {Object} Updated component
   */
  updateComponent(id, data) {
    try {
      // Save the previous state for undo
      this.state.addToUndoStack(this.state.getState());
      
      const sections = [...this.state.getState().sections];
      let updatedComponent = null;
      
      // Find the component in sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const componentIndex = section.components.findIndex(comp => comp.id === id);
        
        if (componentIndex !== -1) {
          // Update the component
          const component = { ...section.components[componentIndex] };
          updatedComponent = { ...component, ...data };
          
          // Validate the updated component
          const validationResult = this.components.validateComponent(updatedComponent);
          if (!validationResult.valid) {
            throw new Error(`Invalid component data: ${validationResult.errors.join(', ')}`);
          }
          
          // Update the component in the section
          section.components = [
            ...section.components.slice(0, componentIndex),
            updatedComponent,
            ...section.components.slice(componentIndex + 1)
          ];
          
          break;
        }
      }
      
      if (!updatedComponent) {
        throw new Error(`Component with id ${id} not found`);
      }
      
      // Update state
      this.state.setState({ sections });
      
      // Emit event
      this.events.emit('component-updated', { component: updatedComponent });
      
      return updatedComponent;
    } catch (error) {
      this.errorManager.logError('update-component', error);
      throw error;
    }
  }
  
  /**
   * Remove a component
   * @param {string} id - Component ID
   * @returns {boolean} Success status
   */
  removeComponent(id) {
    try {
      // Save the previous state for undo
      this.state.addToUndoStack(this.state.getState());
      
      const sections = [...this.state.getState().sections];
      let removedComponent = null;
      
      // Find the component in sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const componentIndex = section.components.findIndex(comp => comp.id === id);
        
        if (componentIndex !== -1) {
          // Store the removed component
          removedComponent = section.components[componentIndex];
          
          // Remove the component from the section
          section.components = [
            ...section.components.slice(0, componentIndex),
            ...section.components.slice(componentIndex + 1)
          ];
          
          break;
        }
      }
      
      if (!removedComponent) {
        throw new Error(`Component with id ${id} not found`);
      }
      
      // Update state
      this.state.setState({ sections });
      
      // Emit event
      this.events.emit('component-removed', { component: removedComponent });
      
      return true;
    } catch (error) {
      this.errorManager.logError('remove-component', error);
      throw error;
    }
  }
  
  /**
   * Get the current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state.getState();
  }
  
  /**
   * Undo the last action
   */
  undo() {
    this.state.undo();
    this.events.emit('undo-performed');
  }
  
  /**
   * Redo the last undone action
   */
  redo() {
    this.state.redo();
    this.events.emit('redo-performed');
  }
  
  /**
   * Check if there are unsaved changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasUnsavedChanges() {
    return this.state.getState().isDirty;
  }
  
  /**
   * Get builder version
   * @returns {string} Builder version
   */
  getVersion() {
    return this.config.version || '1.0.0';
  }
}
