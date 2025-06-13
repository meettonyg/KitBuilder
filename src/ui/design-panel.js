/**
 * Design Panel
 * Panel for editing component properties
 */

import UIComponent from './components/base-component';
import styles from '@styles/components/design-panel.module.css';

export class DesignPanel extends UIComponent {
  /**
   * Create a design panel
   * @param {EventEmitter} events - Event system
   * @param {Object} options - Configuration options
   * @param {StateManager} options.state - State manager
   * @param {ComponentRegistry} options.registry - Component registry
   */
  constructor(events, options = {}) {
    super(events);
    this.state = options.state;
    this.registry = options.registry;
    this.selectedComponent = null;
  }

  /**
   * Create the design panel element
   * @returns {HTMLElement} The created element
   */
  createElement() {
    const element = document.createElement('div');
    element.className = styles.designPanel;
    element.innerHTML = `
      <div class="${styles.header}">
        <h3 class="${styles.title}">Design</h3>
      </div>
      <div class="${styles.body}">
        <div class="${styles.emptyState}">
          <p>Select a component to edit its properties</p>
        </div>
      </div>
    `;

    return element;
  }

  /**
   * Set up event listeners for the design panel
   */
  setupEventListeners() {
    // Listen for component selection
    this.events.on('component-selected', this.handleComponentSelected.bind(this));
  }

  /**
   * Handle component selection
   * @param {Object} data - Event data
   */
  handleComponentSelected(data) {
    if (data && data.component) {
      this.selectedComponent = data.component;
      this.renderComponentEditor();
    }
  }

  /**
   * Render the editor for the selected component
   */
  renderComponentEditor() {
    if (!this.element || !this.selectedComponent) return;
    
    const body = this.element.querySelector(`.${styles.body}`);
    if (!body) return;
    
    // Update title with component type
    const title = this.element.querySelector(`.${styles.title}`);
    if (title) {
      const componentDef = this.registry?.getComponent(this.selectedComponent.type);
      const componentTitle = componentDef?.title || this.selectedComponent.type;
      title.textContent = `Design: ${componentTitle}`;
    }
    
    // Clear the body
    body.innerHTML = '';
    
    // Create tabs for different property groups
    body.innerHTML = `
      <div class="${styles.tabs}">
        <button class="${styles.tabButton} ${styles.active}" data-tab="content">Content</button>
        <button class="${styles.tabButton}" data-tab="style">Style</button>
        <button class="${styles.tabButton}" data-tab="advanced">Advanced</button>
      </div>
      <div class="${styles.tabContent} ${styles.active}" data-tab-content="content">
        ${this.renderContentEditors()}
      </div>
      <div class="${styles.tabContent}" data-tab-content="style">
        ${this.renderStyleEditors()}
      </div>
      <div class="${styles.tabContent}" data-tab-content="advanced">
        ${this.renderAdvancedEditors()}
      </div>
    `;
    
    // Set up tab switching
    const tabButtons = body.querySelectorAll(`.${styles.tabButton}`);
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => {
          btn.classList.toggle(styles.active, btn === button);
        });
        
        // Update active tab content
        const tabContents = body.querySelectorAll(`.${styles.tabContent}`);
        tabContents.forEach(content => {
          content.classList.toggle(
            styles.active, 
            content.dataset.tabContent === tab
          );
        });
      });
    });
    
    // Set up property editors
    this.setupPropertyEditors();
  }

  /**
   * Render content property editors
   * @returns {string} HTML for content editors
   */
  renderContentEditors() {
    if (!this.selectedComponent || !this.selectedComponent.content) {
      return '<p>No content properties available</p>';
    }
    
    const contentProps = this.selectedComponent.content;
    let html = '';
    
    // Get component schema if available
    const componentDef = this.registry?.getComponent(this.selectedComponent.type);
    const contentSchema = componentDef?.contentSchema || {};
    
    // Render editors for each content property
    for (const [key, value] of Object.entries(contentProps)) {
      const propSchema = contentSchema[key] || { type: typeof value };
      html += this.renderPropertyEditor('content', key, value, propSchema);
    }
    
    return html || '<p>No content properties available</p>';
  }

  /**
   * Render style property editors
   * @returns {string} HTML for style editors
   */
  renderStyleEditors() {
    if (!this.selectedComponent || !this.selectedComponent.styles) {
      return '<p>No style properties available</p>';
    }
    
    const styleProps = this.selectedComponent.styles;
    let html = '';
    
    // Get component schema if available
    const componentDef = this.registry?.getComponent(this.selectedComponent.type);
    const styleSchema = componentDef?.styleSchema || {};
    
    // Common style properties if no specific schema
    const commonStyles = {
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' },
      padding: { type: 'select', label: 'Padding', options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ]},
      borderRadius: { type: 'select', label: 'Border Radius', options: [
        { value: 'none', label: 'None' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ]}
    };
    
    // Merge with common styles
    const mergedSchema = { ...commonStyles, ...styleSchema };
    
    // Render editors for each style property
    for (const [key, schema] of Object.entries(mergedSchema)) {
      const value = styleProps[key] !== undefined ? styleProps[key] : '';
      html += this.renderPropertyEditor('styles', key, value, schema);
    }
    
    return html || '<p>No style properties available</p>';
  }

  /**
   * Render advanced property editors
   * @returns {string} HTML for advanced editors
   */
  renderAdvancedEditors() {
    return `
      <div class="${styles.propertyGroup}">
        <h4 class="${styles.groupTitle}">Component Settings</h4>
        <div class="${styles.property}">
          <label class="${styles.propertyLabel}">Component ID</label>
          <input type="text" class="${styles.propertyInput}" value="${this.selectedComponent?.id || ''}" readonly>
        </div>
        <div class="${styles.property}">
          <label class="${styles.propertyLabel}">Component Type</label>
          <input type="text" class="${styles.propertyInput}" value="${this.selectedComponent?.type || ''}" readonly>
        </div>
        <button class="${styles.button} ${styles.danger}" data-action="delete">Delete Component</button>
      </div>
    `;
  }

  /**
   * Render a property editor
   * @param {string} group - Property group (content, styles)
   * @param {string} key - Property key
   * @param {*} value - Property value
   * @param {Object} schema - Property schema
   * @returns {string} HTML for property editor
   */
  renderPropertyEditor(group, key, value, schema) {
    const type = schema.type || typeof value;
    const label = schema.label || this.formatLabel(key);
    
    let editorHtml = '';
    
    switch (type) {
      case 'string':
      case 'text':
        if (value && value.length > 80) {
          editorHtml = `
            <textarea 
              class="${styles.propertyInput} ${styles.textarea}" 
              data-property="${key}"
              data-group="${group}"
            >${value}</textarea>
          `;
        } else {
          editorHtml = `
            <input 
              type="text" 
              class="${styles.propertyInput}" 
              value="${value || ''}" 
              data-property="${key}"
              data-group="${group}"
            >
          `;
        }
        break;
        
      case 'number':
        editorHtml = `
          <input 
            type="number" 
            class="${styles.propertyInput}" 
            value="${value || 0}" 
            data-property="${key}"
            data-group="${group}"
          >
        `;
        break;
        
      case 'boolean':
        editorHtml = `
          <label class="${styles.switch}">
            <input 
              type="checkbox" 
              ${value ? 'checked' : ''} 
              data-property="${key}"
              data-group="${group}"
            >
            <span class="${styles.slider}"></span>
          </label>
        `;
        break;
        
      case 'color':
        editorHtml = `
          <div class="${styles.colorPicker}">
            <input 
              type="color" 
              class="${styles.colorInput}" 
              value="${value || '#ffffff'}" 
              data-property="${key}"
              data-group="${group}"
            >
            <input 
              type="text" 
              class="${styles.colorText}" 
              value="${value || ''}" 
              data-property="${key}"
              data-group="${group}"
            >
          </div>
        `;
        break;
        
      case 'select':
        const options = schema.options || [];
        editorHtml = `
          <select 
            class="${styles.propertyInput}" 
            data-property="${key}"
            data-group="${group}"
          >
            ${options.map(option => `
              <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                ${option.label}
              </option>
            `).join('')}
          </select>
        `;
        break;
        
      default:
        editorHtml = `
          <input 
            type="text" 
            class="${styles.propertyInput}" 
            value="${value || ''}" 
            data-property="${key}"
            data-group="${group}"
          >
        `;
    }
    
    return `
      <div class="${styles.property}">
        <label class="${styles.propertyLabel}">${label}</label>
        ${editorHtml}
      </div>
    `;
  }

  /**
   * Format a property key as a label
   * @param {string} key - Property key
   * @returns {string} Formatted label
   */
  formatLabel(key) {
    return key
      // Split by capital letters
      .replace(/([A-Z])/g, ' $1')
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Capitalize first letter
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Set up property editor event listeners
   */
  setupPropertyEditors() {
    if (!this.element || !this.selectedComponent) return;
    
    // Handle input changes
    const inputs = this.element.querySelectorAll('[data-property]');
    inputs.forEach(input => {
      const property = input.dataset.property;
      const group = input.dataset.group;
      
      // Different event based on input type
      const eventType = input.type === 'checkbox' ? 'change' : 'input';
      
      input.addEventListener(eventType, e => {
        let value;
        
        if (input.type === 'checkbox') {
          value = input.checked;
        } else {
          value = input.value;
        }
        
        this.updateComponentProperty(group, property, value);
      });
    });
    
    // Handle delete button
    const deleteBtn = this.element.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this component?')) {
          this.events.emit('component-delete-requested', {
            id: this.selectedComponent.id
          });
        }
      });
    }
  }

  /**
   * Update a component property
   * @param {string} group - Property group (content, styles)
   * @param {string} property - Property name
   * @param {*} value - New property value
   */
  updateComponentProperty(group, property, value) {
    if (!this.selectedComponent) return;
    
    // Update local component
    if (!this.selectedComponent[group]) {
      this.selectedComponent[group] = {};
    }
    
    this.selectedComponent[group][property] = value;
    
    // Update state if available
    if (this.state) {
      this.state.updateComponent(this.selectedComponent.id, {
        [group]: {
          ...this.selectedComponent[group]
        }
      });
    }
    
    // Emit event
    this.events.emit('component-updated', {
      id: this.selectedComponent.id,
      changes: {
        [group]: {
          [property]: value
        }
      }
    });
  }

  /**
   * Update the design panel with a new component
   * @param {Object} component - Component data
   */
  update(component) {
    if (component) {
      this.selectedComponent = component;
      this.renderComponentEditor();
    } else {
      this.selectedComponent = null;
      
      // Show empty state
      const body = this.element?.querySelector(`.${styles.body}`);
      if (body) {
        body.innerHTML = `
          <div class="${styles.emptyState}">
            <p>Select a component to edit its properties</p>
          </div>
        `;
      }
      
      // Reset title
      const title = this.element?.querySelector(`.${styles.title}`);
      if (title) {
        title.textContent = 'Design';
      }
    }
  }
}

export default DesignPanel;
