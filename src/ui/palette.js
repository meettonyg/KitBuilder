/**
 * Component Palette
 * Displays available components that can be added to the media kit
 */

import UIComponent from './base-component';
import styles from '@styles/components/palette.module.css';

export class Palette extends UIComponent {
  /**
   * Create a new component palette
   * @param {EventEmitter} events - Event system
   * @param {Object} options - Configuration options
   * @param {ComponentRegistry} options.registry - Component registry
   */
  constructor(events, options = {}) {
    super(events);
    this.registry = options.registry;
    this.components = [];
    this.categoryFilter = null;
    this.searchTerm = '';
  }

  /**
   * Initialize the palette with components
   */
  initialize() {
    if (this.registry) {
      this.components = this.registry.getAllComponentTypes().map(type => {
        const component = this.registry.getComponent(type);
        return {
          type,
          title: component.title || type,
          description: component.description || '',
          icon: component.icon || 'default-icon',
          category: component.category || 'general'
        };
      });
    }
  }

  /**
   * Create the palette element
   * @returns {HTMLElement} The created element
   */
  createElement() {
    this.initialize();

    const element = document.createElement('div');
    element.className = styles.palette;
    element.innerHTML = `
      <div class="${styles.header}">
        <h3 class="${styles.title}">Components</h3>
        <div class="${styles.search}">
          <input type="text" placeholder="Search components..." class="${styles.searchInput}">
        </div>
        <div class="${styles.categories}">
          <button class="${styles.categoryBtn} ${!this.categoryFilter ? styles.active : ''}" data-category="all">All</button>
          <button class="${styles.categoryBtn}" data-category="content">Content</button>
          <button class="${styles.categoryBtn}" data-category="media">Media</button>
          <button class="${styles.categoryBtn}" data-category="layout">Layout</button>
        </div>
      </div>
      <div class="${styles.components}">
        ${this.renderComponentItems()}
      </div>
    `;

    return element;
  }

  /**
   * Render the list of component items
   * @returns {string} HTML for component items
   */
  renderComponentItems() {
    if (!this.components.length) {
      return `<div class="${styles.emptyState}">No components available</div>`;
    }

    return this.getFilteredComponents()
      .map(component => `
        <div class="${styles.componentItem}" data-component-type="${component.type}">
          <div class="${styles.componentIcon}">
            <i class="${component.icon}"></i>
          </div>
          <div class="${styles.componentInfo}">
            <div class="${styles.componentTitle}">${component.title}</div>
            <div class="${styles.componentDesc}">${component.description}</div>
          </div>
        </div>
      `)
      .join('');
  }

  /**
   * Get components filtered by category and search term
   * @returns {Array} Filtered components
   */
  getFilteredComponents() {
    return this.components.filter(component => {
      const matchesCategory = !this.categoryFilter || this.categoryFilter === 'all' || component.category === this.categoryFilter;
      const matchesSearch = !this.searchTerm || 
        component.title.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        component.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }

  /**
   * Set up event listeners for the palette
   */
  setupEventListeners() {
    if (!this.element) return;

    // Handle component selection
    this.element.querySelectorAll(`.${styles.componentItem}`).forEach(item => {
      item.addEventListener('click', e => {
        const componentType = item.dataset.componentType;
        this.events.emit('component-selected', { type: componentType });
      });
    });

    // Handle search input
    const searchInput = this.element.querySelector(`.${styles.searchInput}`);
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.searchTerm = e.target.value;
        this.updateComponentList();
      });
    }

    // Handle category filters
    this.element.querySelectorAll(`.${styles.categoryBtn}`).forEach(btn => {
      btn.addEventListener('click', e => {
        const category = btn.dataset.category;
        this.categoryFilter = category === 'all' ? null : category;
        
        // Update active button
        this.element.querySelectorAll(`.${styles.categoryBtn}`).forEach(b => {
          b.classList.toggle(styles.active, b === btn);
        });
        
        this.updateComponentList();
      });
    });
  }

  /**
   * Update the component list based on filters
   */
  updateComponentList() {
    if (!this.element) return;
    
    const componentsContainer = this.element.querySelector(`.${styles.components}`);
    if (componentsContainer) {
      componentsContainer.innerHTML = this.renderComponentItems();
      
      // Re-attach event listeners to new items
      this.element.querySelectorAll(`.${styles.componentItem}`).forEach(item => {
        item.addEventListener('click', e => {
          const componentType = item.dataset.componentType;
          this.events.emit('component-selected', { type: componentType });
        });
      });
    }
  }
}

export default Palette;
