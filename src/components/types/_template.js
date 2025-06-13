/**
 * Template for creating new component implementations
 * 
 * Instructions:
 * 1. Copy this file to a new file in the components/types directory
 * 2. Replace "Template" with your component name throughout the file
 * 3. Update the static properties to match your component
 * 4. Implement the render method with your component's HTML structure
 * 5. Update the setupEventListeners method for your component's needs
 * 6. Create a corresponding CSS module in styles/components/your-component.module.css
 * 7. Create a schema for your component in components/schemas/component-schema.js
 */

import { componentSchema } from '../schemas/component-schema.js';
import styles from '../../styles/components/template.module.css';

export class TemplateComponent {
  // Static properties for component discovery
  static type = 'template'; // Must be unique
  static schema = componentSchema; // Should be a schema specific to this component
  static title = 'Template Component';
  static description = 'A template for creating new components';
  static icon = 'icon-template';
  static category = 'general'; // Options: content, media, social, layout
  static defaultContent = {
    // Default content for this component
    title: 'New Component',
    text: 'Enter content here...'
  };
  
  /**
   * Initialize the component
   * @param {Object} data - Component data
   * @param {Object} events - Event emitter
   */
  constructor(data, events) {
    this.data = data;
    this.events = events;
    this.element = null;
  }
  
  /**
   * Render the component
   * @returns {HTMLElement} Rendered element
   */
  render() {
    // Destructure content properties
    const { title, text } = this.data.content;
    
    // Create the main element
    const element = document.createElement('div');
    element.className = styles.container;
    element.dataset.componentId = this.data.id;
    element.dataset.componentType = TemplateComponent.type;
    
    // Set the HTML content
    element.innerHTML = `
      <div class="${styles.header}">
        <div class="${styles.title}">${title || 'New Component'}</div>
        <div class="${styles.controls}">
          <button class="${styles.controlBtn} ${styles.moveUpBtn}" title="Move Up">↑</button>
          <button class="${styles.controlBtn} ${styles.moveDownBtn}" title="Move Down">↓</button>
          <button class="${styles.controlBtn} ${styles.duplicateBtn}" title="Duplicate">⧉</button>
          <button class="${styles.controlBtn} ${styles.deleteBtn}" title="Delete">✕</button>
        </div>
      </div>
      <div class="${styles.content}" contenteditable="true">${text || 'Enter content here...'}</div>
    `;
    
    // Set up event listeners
    this.setupEventListeners(element);
    this.element = element;
    
    return element;
  }
  
  /**
   * Set up event listeners for the component
   * @param {HTMLElement} element - Component element
   */
  setupEventListeners(element) {
    // Handle content editing
    const content = element.querySelector(`.${styles.content}`);
    if (content) {
      content.addEventListener('input', () => {
        this.data.content.text = content.textContent;
        this.events.emit('component-changed', { 
          id: this.data.id, 
          type: TemplateComponent.type,
          data: this.data
        });
      });
    }
    
    // Handle move up button
    const moveUpBtn = element.querySelector(`.${styles.moveUpBtn}`);
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.events.emit('component-move-up', { id: this.data.id });
      });
    }
    
    // Handle move down button
    const moveDownBtn = element.querySelector(`.${styles.moveDownBtn}`);
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.events.emit('component-move-down', { id: this.data.id });
      });
    }
    
    // Handle duplicate button
    const duplicateBtn = element.querySelector(`.${styles.duplicateBtn}`);
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.events.emit('component-duplicate', { id: this.data.id });
      });
    }
    
    // Handle delete button
    const deleteBtn = element.querySelector(`.${styles.deleteBtn}`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this component?')) {
          this.events.emit('component-delete', { id: this.data.id });
        }
      });
    }
  }
  
  /**
   * Get the component data
   * @returns {Object} Component data
   */
  getData() {
    return { ...this.data };
  }
  
  /**
   * Update the component with new data
   * @param {Object} newData - New component data
   */
  update(newData) {
    this.data = { ...this.data, ...newData };
    
    if (this.element) {
      // Update title
      const title = this.element.querySelector(`.${styles.title}`);
      if (title && this.data.content.title) {
        title.textContent = this.data.content.title;
      }
      
      // Update content
      const content = this.element.querySelector(`.${styles.content}`);
      if (content && this.data.content.text) {
        content.textContent = this.data.content.text;
      }
      
      // Update any other properties specific to this component
    }
  }
}

export default TemplateComponent;
