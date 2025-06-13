/**
 * Biography component implementation
 */
import { biographySchema } from '../schemas/component-schema.js';
import styles from '../../styles/components/biography.module.css';

export class BiographyComponent {
  // Static properties for component discovery
  static type = 'biography';
  static schema = biographySchema;
  static title = 'Biography';
  static description = 'Displays a biography section with optional image and headline';
  static icon = 'icon-biography';
  static category = 'content';
  static defaultContent = {
    text: 'Enter your biography here...',
    headline: 'Biography',
    image: null
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
    const { text, headline, image } = this.data.content;
    
    const element = document.createElement('div');
    element.className = styles.container;
    element.dataset.componentId = this.data.id;
    element.dataset.componentType = BiographyComponent.type;
    
    let imageHtml = '';
    if (image && image.url) {
      imageHtml = `
        <div class="${styles.imageContainer}">
          <img src="${image.url}" alt="${image.alt || 'Biography image'}" />
        </div>
      `;
    }
    
    element.innerHTML = `
      <div class="${styles.header}">
        <div class="${styles.title}">${headline || 'Biography'}</div>
        <div class="${styles.controls}">
          <button class="${styles.controlBtn} ${styles.moveUpBtn}" title="Move Up">↑</button>
          <button class="${styles.controlBtn} ${styles.moveDownBtn}" title="Move Down">↓</button>
          <button class="${styles.controlBtn} ${styles.duplicateBtn}" title="Duplicate">⧉</button>
          <button class="${styles.controlBtn} ${styles.deleteBtn}" title="Delete">✕</button>
        </div>
      </div>
      ${imageHtml}
      <div class="${styles.content}" contenteditable="true">${text || 'Enter your biography here...'}</div>
    `;
    
    this.setupEventListeners(element);
    this.element = element;
    
    return element;
  }
  
  /**
   * Set up event listeners for the component
   * @param {HTMLElement} element - Component element
   */
  setupEventListeners(element) {
    const content = element.querySelector(`.${styles.content}`);
    
    content.addEventListener('input', () => {
      this.data.content.text = content.textContent;
      this.events.emit('component-changed', { 
        id: this.data.id, 
        type: BiographyComponent.type,
        data: this.data
      });
    });
    
    const moveUpBtn = element.querySelector(`.${styles.moveUpBtn}`);
    moveUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.events.emit('component-move-up', { id: this.data.id });
    });
    
    const moveDownBtn = element.querySelector(`.${styles.moveDownBtn}`);
    moveDownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.events.emit('component-move-down', { id: this.data.id });
    });
    
    const duplicateBtn = element.querySelector(`.${styles.duplicateBtn}`);
    duplicateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.events.emit('component-duplicate', { id: this.data.id });
    });
    
    const deleteBtn = element.querySelector(`.${styles.deleteBtn}`);
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this component?')) {
        this.events.emit('component-delete', { id: this.data.id });
      }
    });
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
      const content = this.element.querySelector(`.${styles.content}`);
      content.textContent = this.data.content.text;
      
      const title = this.element.querySelector(`.${styles.title}`);
      title.textContent = this.data.content.headline || 'Biography';
      
      // If image has changed, update it
      if (newData.content && newData.content.image) {
        const imageContainer = this.element.querySelector(`.${styles.imageContainer}`);
        if (imageContainer) {
          // Image exists, update it
          const img = imageContainer.querySelector('img');
          img.src = newData.content.image.url;
          img.alt = newData.content.image.alt || 'Biography image';
        } else if (newData.content.image.url) {
          // Image doesn't exist, add it
          const newImageContainer = document.createElement('div');
          newImageContainer.className = styles.imageContainer;
          newImageContainer.innerHTML = `
            <img src="${newData.content.image.url}" alt="${newData.content.image.alt || 'Biography image'}" />
          `;
          
          // Insert after header
          const header = this.element.querySelector(`.${styles.header}`);
          header.insertAdjacentElement('afterend', newImageContainer);
        }
      }
    }
  }
}

export default BiographyComponent;
