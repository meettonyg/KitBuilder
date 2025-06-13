/**
 * Component registry for Media Kit Builder
 * Manages component definitions, validation, and instantiation with dynamic component discovery
 */
import { componentSchema, componentSchemas } from './schemas/component-schema.js';
import { validateAgainstSchema } from '../utils/schema-validator.js';

export class ComponentRegistry {
  /**
   * Initialize the component registry
   * @param {Object} events - EventEmitter instance
   */
  constructor(events) {
    this.events = events;
    this.components = new Map();
    this.componentClasses = new Map();
    this.validators = new Map();
  }
  
  /**
   * Initialize the component registry with dynamic component discovery
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    this.events.emit('component-registry-initializing');
    
    try {
      // Discover and register components
      await this.discoverComponents();
      
      // Register component definitions from schemas
      this.registerComponentDefinitions();
      
      this.events.emit('component-registry-initialized');
      return true;
    } catch (error) {
      this.events.emit('error', {
        message: 'Failed to initialize component registry',
        error,
        context: 'component-registry'
      });
      throw error;
    }
  }
  
  /**
   * Discover and register component classes dynamically
   * @returns {Promise} Resolves when discovery is complete
   */
  async discoverComponents() {
    try {
      // This is a pattern that works with Webpack's dynamic imports
      // The actual import statements will be resolved by Webpack at build time
      const componentContext = this.requireComponentContext();
      
      const componentPromises = componentContext.keys().map(async (key) => {
        try {
          // Dynamic import of the component module
          const module = await componentContext(key);
          
          // Get the component class (default export or named export)
          const ComponentClass = module.default || module[Object.keys(module).find(k => k !== '__esModule')];
          
          if (!ComponentClass || !ComponentClass.type) {
            console.warn(`Component file ${key} does not export a valid component class with a type property`);
            return;
          }
          
          // Register the component class
          this.registerComponentClass(ComponentClass.type, ComponentClass);
          
          this.events.emit('component-discovered', { 
            type: ComponentClass.type,
            file: key
          });
        } catch (error) {
          console.error(`Failed to load component from ${key}:`, error);
        }
      });
      
      await Promise.all(componentPromises);
      
      return true;
    } catch (error) {
      console.error('Error discovering components:', error);
      throw error;
    }
  }
  
  /**
   * Create a require context for component files
   * This is a pattern that works with Webpack's dynamic imports
   * @returns {Function} A function that simulates Webpack's require.context
   */
  requireComponentContext() {
    // This is a simplified implementation for demo purposes
    // In a real Webpack project, you would use require.context
    
    // Define the component modules to load dynamically
    // In a real project, Webpack would scan the directory for these
    const componentModules = {
      './biography.js': () => import('./types/biography.js'),
      // Add other component imports dynamically as they are created
      // './topics.js': () => import('./types/topics.js'),
      // './social.js': () => import('./types/social.js'),
      // './logo.js': () => import('./types/logo.js'),
      // './questions.js': () => import('./types/questions.js'),
    };
    
    // Create a function that simulates Webpack's require.context
    const context = (key) => componentModules[key]();
    
    // Add a keys method to mimic Webpack's require.context.keys()
    context.keys = () => Object.keys(componentModules);
    
    return context;
  }
  
  /**
   * Register component definitions from schemas
   */
  registerComponentDefinitions() {
    Object.entries(componentSchemas).forEach(([type, schema]) => {
      // Skip if we already have a definition for this type
      if (this.components.has(type)) {
        return;
      }
      
      // Create a definition object from the schema
      const definition = {
        type,
        title: this.formatTitle(type),
        description: `${this.formatTitle(type)} component`,
        contentSchema: schema.content.properties,
        styleSchema: schema.styles?.properties,
        icon: `icon-${type}`,
        category: this.getCategoryForType(type),
        defaultContent: this.getDefaultContentForType(type)
      };
      
      this.components.set(type, definition);
    });
  }
  
  /**
   * Format a component type as a title
   * @param {string} type - Component type
   * @returns {string} Formatted title
   */
  formatTitle(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  /**
   * Get the category for a component type
   * @param {string} type - Component type
   * @returns {string} Component category
   */
  getCategoryForType(type) {
    const categoryMap = {
      biography: 'content',
      topics: 'content',
      social: 'social',
      logo: 'media',
      questions: 'content'
    };
    
    return categoryMap[type] || 'general';
  }
  
  /**
   * Get default content for a component type
   * @param {string} type - Component type
   * @returns {Object} Default content
   */
  getDefaultContentForType(type) {
    switch (type) {
      case 'biography':
        return {
          text: 'Enter your biography here...',
          headline: 'Biography'
        };
      case 'topics':
        return {
          title: 'Topics',
          topics: [
            { id: 'topic1', title: 'Topic 1', description: 'Description for topic 1' }
          ]
        };
      case 'social':
        return {
          title: 'Follow Me',
          platforms: [
            { id: 'social1', platform: 'Twitter', url: 'https://twitter.com/', username: '@username', icon: 'icon-twitter' }
          ]
        };
      case 'logo':
        return {
          title: 'Logo',
          logo: { url: '', alt: 'Logo' },
          description: 'Logo usage guidelines'
        };
      case 'questions':
        return {
          title: 'Frequently Asked Questions',
          questions: [
            { id: 'q1', question: 'Sample question?', answer: 'Sample answer.' }
          ]
        };
      default:
        return {};
    }
  }
  
  /**
   * Register a component definition
   * @param {string} componentType - Type of component
   * @param {Object} definition - Component definition
   * @param {Function} validator - Optional custom validator function
   */
  register(componentType, definition, validator) {
    // Validate component definition against schema
    const validationResult = validateAgainstSchema(
      definition, 
      componentSchema
    );
    
    if (!validationResult.valid) {
      throw new Error(`Invalid component definition: ${validationResult.errors.join(', ')}`);
    }
    
    this.components.set(componentType, definition);
    
    if (validator) {
      this.validators.set(componentType, validator);
    }
    
    this.events.emit('component-registered', { type: componentType });
  }
  
  /**
   * Register a component class
   * @param {string} componentType - Type of component
   * @param {Class} ComponentClass - Component class
   */
  registerComponentClass(componentType, ComponentClass) {
    this.componentClasses.set(componentType, ComponentClass);
    
    // Also register any definition from the component class if not already registered
    if (!this.components.has(componentType) && ComponentClass.schema) {
      this.register(componentType, {
        type: componentType,
        title: ComponentClass.title || this.formatTitle(componentType),
        description: ComponentClass.description || `${this.formatTitle(componentType)} component`,
        contentSchema: ComponentClass.schema.content?.properties,
        styleSchema: ComponentClass.schema.styles?.properties,
        icon: ComponentClass.icon || `icon-${componentType}`,
        category: ComponentClass.category || this.getCategoryForType(componentType),
        defaultContent: ComponentClass.defaultContent || this.getDefaultContentForType(componentType)
      });
    }
    
    this.events.emit('component-class-registered', { type: componentType });
  }
  
  /**
   * Get a component definition by type
   * @param {string} type - Component type
   * @returns {Object} Component definition
   */
  getComponent(type) {
    if (!this.components.has(type)) {
      throw new Error(`Component type '${type}' not registered`);
    }
    return this.components.get(type);
  }
  
  /**
   * Get a component class by type
   * @param {string} type - Component type
   * @returns {Class} Component class
   */
  getComponentClass(type) {
    if (!this.componentClasses.has(type)) {
      throw new Error(`Component class for type '${type}' not registered`);
    }
    return this.componentClasses.get(type);
  }
  
  /**
   * Validate component data against its schema
   * @param {Object} componentData - Component data to validate
   * @returns {Object} Validation result
   */
  validateComponent(componentData) {
    const { type } = componentData;
    
    if (!this.components.has(type)) {
      return { 
        valid: false, 
        errors: [`Unknown component type: ${type}`] 
      };
    }
    
    if (this.validators.has(type)) {
      // Use component-specific validator
      return this.validators.get(type)(componentData);
    }
    
    // Use schema validation
    const schema = componentSchemas[type];
    return schema ? validateAgainstSchema(componentData, schema) : { valid: true };
  }
  
  /**
   * Get all registered component types
   * @returns {Array} Array of component types
   */
  getAllComponentTypes() {
    return Array.from(this.components.keys());
  }
  
  /**
   * Create a new component instance
   * @param {string} type - Component type
   * @param {Object} data - Component data
   * @returns {Object} New component instance
   */
  createComponent(type, data = {}) {
    if (!this.components.has(type)) {
      throw new Error(`Component type '${type}' not registered`);
    }
    
    const definition = this.components.get(type);
    const id = data.id || this.generateId();
    
    const component = {
      id,
      type,
      content: {
        ...(definition.defaultContent || {}),
        ...(data.content || {})
      },
      styles: {
        ...(definition.defaultStyles || {}),
        ...(data.styles || {})
      },
      metadata: {
        ...(data.metadata || {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // Validate the new component
    const validationResult = this.validateComponent(component);
    if (!validationResult.valid) {
      throw new Error(`Invalid component data: ${validationResult.errors.join(', ')}`);
    }
    
    this.events.emit('component-created', { component });
    
    return component;
  }
  
  /**
   * Generate a unique ID for a component
   * @returns {string} Unique ID
   */
  generateId() {
    return 'component_' + Math.random().toString(36).substr(2, 9);
  }
}

export default ComponentRegistry;
