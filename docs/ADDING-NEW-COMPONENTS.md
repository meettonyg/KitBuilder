# Guide: Adding New Components to Media Kit Builder

This guide explains how to add new component types to the Media Kit Builder. The architecture is designed to be extensible, allowing for easy addition of new components without modifying the core code.

## Component Architecture

The Media Kit Builder uses a dynamic component system where components are automatically discovered and registered at runtime. Each component consists of:

1. **Component Class**: JavaScript class that defines the component's behavior and rendering
2. **Component Schema**: JSON schema that defines the component's data structure
3. **Component Styles**: CSS Module for component-specific styling

## Step-by-Step Guide to Adding a New Component

### 1. Create a Component Schema

First, define your component's data structure by adding a schema to `src/components/schemas/component-schema.js`:

```javascript
/**
 * YourComponent schema
 */
export const yourComponentSchema = {
  ...componentSchema, // Extend the base schema
  content: {
    type: 'object',
    required: true,
    properties: {
      title: { type: 'string', required: false },
      text: { type: 'string', required: true },
      // Add other properties specific to your component
    }
  }
};

// Don't forget to add your schema to the componentSchemas map
export const componentSchemas = {
  // Existing schemas
  biography: biographySchema,
  topics: topicsSchema,
  // Add your new schema
  yourComponent: yourComponentSchema
};
```

### 2. Create a CSS Module

Create a CSS file for your component in `src/styles/components/your-component.module.css`:

```css
/* YourComponent styles */

.container {
  background-color: var(--color-background);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: var(--border-width-thin) solid var(--color-border);
}

.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.controls {
  display: flex;
  gap: var(--spacing-xs);
}

.controlBtn {
  /* Control button styles */
}

.content {
  /* Content styles */
}

/* Add other component-specific styles */
```

### 3. Create the Component Class

Copy the template component (`src/components/types/_template.js`) to a new file in the same directory, e.g., `src/components/types/your-component.js`:

```javascript
/**
 * YourComponent implementation
 */
import { yourComponentSchema } from '../schemas/component-schema.js';
import styles from '../../styles/components/your-component.module.css';

export class YourComponent {
  // Static properties for component discovery
  static type = 'yourComponent'; // Must be unique
  static schema = yourComponentSchema;
  static title = 'Your Component';
  static description = 'Description of your component';
  static icon = 'icon-your-component';
  static category = 'content'; // Options: content, media, social, layout
  static defaultContent = {
    title: 'Your Component',
    text: 'Default content for your component'
  };
  
  /**
   * Initialize the component
   */
  constructor(data, events) {
    this.data = data;
    this.events = events;
    this.element = null;
  }
  
  /**
   * Render the component
   */
  render() {
    const { title, text } = this.data.content;
    
    const element = document.createElement('div');
    element.className = styles.container;
    element.dataset.componentId = this.data.id;
    element.dataset.componentType = YourComponent.type;
    
    element.innerHTML = `
      <div class="${styles.header}">
        <div class="${styles.title}">${title || 'Your Component'}</div>
        <div class="${styles.controls}">
          <button class="${styles.controlBtn} ${styles.moveUpBtn}" title="Move Up">↑</button>
          <button class="${styles.controlBtn} ${styles.moveDownBtn}" title="Move Down">↓</button>
          <button class="${styles.controlBtn} ${styles.duplicateBtn}" title="Duplicate">⧉</button>
          <button class="${styles.controlBtn} ${styles.deleteBtn}" title="Delete">✕</button>
        </div>
      </div>
      <div class="${styles.content}" contenteditable="true">${text || 'Enter content here...'}</div>
    `;
    
    this.setupEventListeners(element);
    this.element = element;
    
    return element;
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners(element) {
    // Event listeners for content editing and control buttons
    // See the template for examples
  }
  
  /**
   * Get component data
   */
  getData() {
    return { ...this.data };
  }
  
  /**
   * Update the component
   */
  update(newData) {
    // Update logic
  }
}

export default YourComponent;
```

### 4. Update the Component Discovery

The component will be automatically discovered by the `ComponentRegistry` class. If you need to manually add it to the discovery process, update the `requireComponentContext` method in `src/components/registry.js`:

```javascript
requireComponentContext() {
  const componentModules = {
    // Existing components
    './biography.js': () => import('./types/biography.js'),
    // Add your new component
    './your-component.js': () => import('./types/your-component.js'),
  };
  
  // Rest of the method...
}
```

### 5. Testing Your Component

To test your component, make sure it appears in the component palette and can be added to the media kit. Check that:

1. The component appears in the palette with the correct title and category
2. The component can be added to the preview area
3. The component's content can be edited
4. The component's properties can be modified in the design panel
5. The component can be moved, duplicated, and deleted

## Best Practices for Component Development

1. **Keep components focused**: Each component should have a single, clear purpose
2. **Use CSS variables**: Style components using the CSS variables defined in `variables.css`
3. **Validate component data**: Ensure your component validates against its schema
4. **Handle edge cases**: Implement proper error handling and edge case management
5. **Document your component**: Add clear comments and documentation
6. **Follow the naming conventions**: Use consistent naming for files, classes, and variables

## Advanced Component Features

For more advanced components, you can:

1. **Add custom validators**: Register custom validation logic for your component
2. **Create complex UI elements**: Implement more sophisticated interactions
3. **Connect to external APIs**: Fetch data from external sources
4. **Create compound components**: Build components that can contain other components

By following this guide, you can extend the Media Kit Builder with your own custom components that seamlessly integrate with the existing architecture.
