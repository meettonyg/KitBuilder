/**
 * Preview Area
 * Displays the media kit being built
 */

import UIComponent from './components/base-component';
import styles from '@styles/components/preview.module.css';

export class Preview extends UIComponent {
  /**
   * Create a new preview area
   * @param {EventEmitter} events - Event system
   * @param {Object} options - Configuration options
   * @param {StateManager} options.state - State manager
   * @param {ComponentRegistry} options.registry - Component registry
   */
  constructor(events, options = {}) {
    super(events);
    this.state = options.state;
    this.registry = options.registry;
    this.components = [];
    this.dragState = {
      isDragging: false,
      draggedItem: null,
      dropTarget: null
    };
  }

  /**
   * Create the preview element
   * @returns {HTMLElement} The created element
   */
  createElement() {
    const element = document.createElement('div');
    element.className = styles.preview;
    element.innerHTML = `
      <div class="${styles.header}">
        <h3 class="${styles.title}">Media Kit Preview</h3>
        <div class="${styles.viewControls}">
          <button class="${styles.viewBtn} ${styles.active}" data-view="desktop">
            <i class="icon-desktop"></i>
          </button>
          <button class="${styles.viewBtn}" data-view="tablet">
            <i class="icon-tablet"></i>
          </button>
          <button class="${styles.viewBtn}" data-view="mobile">
            <i class="icon-mobile"></i>
          </button>
        </div>
      </div>
      <div class="${styles.previewContainer} ${styles.desktopView}">
        <div class="${styles.dropZone}" data-position="0">
          <div class="${styles.dropIndicator}">Drop component here</div>
        </div>
      </div>
      <div class="${styles.emptyState}">
        <div class="${styles.emptyIcon}">
          <i class="icon-plus-circle"></i>
        </div>
        <h4>Your media kit is empty</h4>
        <p>Drag components from the palette to start building your media kit</p>
      </div>
    `;

    return element;
  }

  /**
   * Set up event listeners for the preview
   */
  setupEventListeners() {
    if (!this.element) return;

    // Handle view controls
    this.element.querySelectorAll(`.${styles.viewBtn}`).forEach(btn => {
      btn.addEventListener('click', e => {
        const view = btn.dataset.view;
        this.setPreviewMode(view);
        
        // Update active button
        this.element.querySelectorAll(`.${styles.viewBtn}`).forEach(b => {
          b.classList.toggle(styles.active, b === btn);
        });
      });
    });

    // Listen for component selection
    this.events.on('component-selected', this.handleComponentSelected.bind(this));

    // Setup drag and drop
    this.setupDragAndDrop();
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    const previewContainer = this.element.querySelector(`.${styles.previewContainer}`);
    
    // Handle dragover on the entire preview container
    previewContainer.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    });

    // Handle drop on the entire preview container
    previewContainer.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      
      const componentType = e.dataTransfer.getData('component-type');
      if (componentType) {
        // Find the closest drop zone
        const dropZone = e.target.closest(`.${styles.dropZone}`);
        if (dropZone) {
          const position = parseInt(dropZone.dataset.position, 10);
          this.addComponent(componentType, position);
        }
      }
    });

    // Update drop zones when dragging components from palette
    this.events.on('component-drag-start', data => {
      this.showDropZones();
    });

    this.events.on('component-drag-end', () => {
      this.hideDropZones();
    });
  }

  /**
   * Handle component selection from palette
   * @param {Object} data - Event data
   */
  handleComponentSelected(data) {
    if (data && data.type) {
      this.addComponent(data.type, this.components.length);
    }
  }

  /**
   * Add a component to the preview
   * @param {string} type - Component type
   * @param {number} position - Position to add the component
   */
  addComponent(type, position) {
    if (!this.registry) {
      console.error('Component registry not available');
      return;
    }

    try {
      // Get component definition
      const componentDef = this.registry.getComponent(type);
      if (!componentDef) {
        throw new Error(`Component type '${type}' not found in registry`);
      }

      // Create component instance
      const componentData = {
        id: this.generateComponentId(),
        type,
        content: { ...componentDef.defaultContent },
        styles: { ...componentDef.defaultStyles }
      };

      // Add to state
      if (this.state) {
        this.state.addComponent(componentData, position);
      }

      // Add to local components array
      this.components.splice(position, 0, componentData);

      // Render the component
      this.renderComponents();

      // Hide empty state if needed
      this.toggleEmptyState(this.components.length === 0);

      // Notify that a component was added
      this.events.emit('component-added', { 
        component: componentData,
        position 
      });
    } catch (error) {
      console.error('Failed to add component:', error);
      this.events.emit('error', { 
        message: `Failed to add component: ${error.message}`,
        error,
        context: 'preview-add-component'
      });
    }
  }

  /**
   * Generate a unique component ID
   * @returns {string} Unique ID
   */
  generateComponentId() {
    return `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Render all components in the preview
   */
  renderComponents() {
    const previewContainer = this.element.querySelector(`.${styles.previewContainer}`);
    if (!previewContainer) return;

    // Clear existing content
    previewContainer.innerHTML = '';

    // Add initial drop zone
    this.addDropZone(previewContainer, 0);

    // Render each component
    this.components.forEach((componentData, index) => {
      const componentElement = this.renderComponent(componentData);
      previewContainer.appendChild(componentElement);
      
      // Add drop zone after component
      this.addDropZone(previewContainer, index + 1);
    });
  }

  /**
   * Render a single component
   * @param {Object} componentData - Component data
   * @returns {HTMLElement} The rendered component element
   */
  renderComponent(componentData) {
    const componentWrapper = document.createElement('div');
    componentWrapper.className = styles.componentWrapper;
    componentWrapper.dataset.componentId = componentData.id;
    componentWrapper.dataset.componentType = componentData.type;

    // Add component controls
    componentWrapper.innerHTML = `
      <div class="${styles.componentControls}">
        <button class="${styles.controlBtn} ${styles.moveUpBtn}" title="Move Up">↑</button>
        <button class="${styles.controlBtn} ${styles.moveDownBtn}" title="Move Down">↓</button>
        <button class="${styles.controlBtn} ${styles.duplicateBtn}" title="Duplicate">⧉</button>
        <button class="${styles.controlBtn} ${styles.deleteBtn}" title="Delete">✕</button>
      </div>
      <div class="${styles.componentContent}"></div>
    `;

    // Set up component event listeners
    this.setupComponentEventListeners(componentWrapper, componentData);

    // Render the actual component content
    if (this.registry) {
      try {
        const ComponentClass = this.registry.getComponentClass(componentData.type);
        if (ComponentClass) {
          const component = new ComponentClass(this.events, componentData);
          const contentElement = component.render();
          
          const contentContainer = componentWrapper.querySelector(`.${styles.componentContent}`);
          contentContainer.appendChild(contentElement);
        }
      } catch (error) {
        console.error(`Failed to render component ${componentData.type}:`, error);
        componentWrapper.querySelector(`.${styles.componentContent}`).innerHTML = `
          <div class="${styles.componentError}">
            <p>Error rendering component: ${error.message}</p>
          </div>
        `;
      }
    }

    return componentWrapper;
  }

  /**
   * Set up event listeners for a component
   * @param {HTMLElement} componentElement - Component element
   * @param {Object} componentData - Component data
   */
  setupComponentEventListeners(componentElement, componentData) {
    // Click to select
    componentElement.addEventListener('click', e => {
      if (!e.target.closest(`.${styles.controlBtn}`)) {
        this.selectComponent(componentData.id);
      }
    });

    // Move up button
    const moveUpBtn = componentElement.querySelector(`.${styles.moveUpBtn}`);
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.moveComponent(componentData.id, 'up');
      });
    }

    // Move down button
    const moveDownBtn = componentElement.querySelector(`.${styles.moveDownBtn}`);
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.moveComponent(componentData.id, 'down');
      });
    }

    // Duplicate button
    const duplicateBtn = componentElement.querySelector(`.${styles.duplicateBtn}`);
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.duplicateComponent(componentData.id);
      });
    }

    // Delete button
    const deleteBtn = componentElement.querySelector(`.${styles.deleteBtn}`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.deleteComponent(componentData.id);
      });
    }

    // Make draggable
    componentElement.setAttribute('draggable', 'true');
    
    componentElement.addEventListener('dragstart', e => {
      e.dataTransfer.setData('component-id', componentData.id);
      e.dataTransfer.effectAllowed = 'move';
      
      this.dragState.isDragging = true;
      this.dragState.draggedItem = componentData.id;
      
      componentElement.classList.add(styles.dragging);
      this.showDropZones();
    });

    componentElement.addEventListener('dragend', e => {
      this.dragState.isDragging = false;
      this.dragState.draggedItem = null;
      
      componentElement.classList.remove(styles.dragging);
      this.hideDropZones();
    });
  }

  /**
   * Add a drop zone to the preview
   * @param {HTMLElement} container - Container element
   * @param {number} position - Position index
   */
  addDropZone(container, position) {
    const dropZone = document.createElement('div');
    dropZone.className = styles.dropZone;
    dropZone.dataset.position = position;
    dropZone.innerHTML = `<div class="${styles.dropIndicator}">Drop component here</div>`;

    // Handle dragover
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      dropZone.classList.add(styles.active);
      this.dragState.dropTarget = position;
    });

    // Handle dragleave
    dropZone.addEventListener('dragleave', e => {
      dropZone.classList.remove(styles.active);
      if (this.dragState.dropTarget === position) {
        this.dragState.dropTarget = null;
      }
    });

    // Handle drop
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      
      const componentId = e.dataTransfer.getData('component-id');
      const componentType = e.dataTransfer.getData('component-type');
      
      if (componentId) {
        // Move existing component
        this.moveComponentToPosition(componentId, position);
      } else if (componentType) {
        // Add new component
        this.addComponent(componentType, position);
      }
      
      dropZone.classList.remove(styles.active);
      this.dragState.dropTarget = null;
    });

    container.appendChild(dropZone);
  }

  /**
   * Show all drop zones
   */
  showDropZones() {
    if (!this.element) return;
    this.element.querySelectorAll(`.${styles.dropZone}`).forEach(zone => {
      zone.classList.add(styles.visible);
    });
  }

  /**
   * Hide all drop zones
   */
  hideDropZones() {
    if (!this.element) return;
    this.element.querySelectorAll(`.${styles.dropZone}`).forEach(zone => {
      zone.classList.remove(styles.visible);
      zone.classList.remove(styles.active);
    });
  }

  /**
   * Select a component
   * @param {string} componentId - Component ID
   */
  selectComponent(componentId) {
    if (!this.element) return;
    
    // Deselect all components
    this.element.querySelectorAll(`.${styles.componentWrapper}`).forEach(el => {
      el.classList.remove(styles.selected);
    });
    
    // Select the target component
    const componentElement = this.element.querySelector(`.${styles.componentWrapper}[data-component-id="${componentId}"]`);
    if (componentElement) {
      componentElement.classList.add(styles.selected);
    }
    
    // Update state if available
    if (this.state) {
      this.state.setSelectedComponentId(componentId);
    }
    
    // Emit selection event
    const componentData = this.components.find(c => c.id === componentId);
    if (componentData) {
      this.events.emit('component-selected', { component: componentData });
    }
  }

  /**
   * Move a component up or down
   * @param {string} componentId - Component ID
   * @param {string} direction - Direction ('up' or 'down')
   */
  moveComponent(componentId, direction) {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index === -1) return;
    
    let newIndex;
    if (direction === 'up' && index > 0) {
      newIndex = index - 1;
    } else if (direction === 'down' && index < this.components.length - 1) {
      newIndex = index + 1;
    } else {
      return; // Can't move further in that direction
    }
    
    this.moveComponentToPosition(componentId, newIndex);
  }

  /**
   * Move a component to a specific position
   * @param {string} componentId - Component ID
   * @param {number} position - New position
   */
  moveComponentToPosition(componentId, position) {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index === -1) return;
    
    // Adjust position if moving to a later position (after removing the item)
    const adjustedPosition = position > index ? position - 1 : position;
    
    // Remove from current position
    const [component] = this.components.splice(index, 1);
    
    // Insert at new position
    this.components.splice(adjustedPosition, 0, component);
    
    // Update state if available
    if (this.state) {
      this.state.moveComponent(componentId, adjustedPosition);
    }
    
    // Re-render components
    this.renderComponents();
    
    // Re-select the component
    this.selectComponent(componentId);
    
    // Emit event
    this.events.emit('component-moved', {
      component,
      oldPosition: index,
      newPosition: adjustedPosition
    });
  }

  /**
   * Duplicate a component
   * @param {string} componentId - Component ID
   */
  duplicateComponent(componentId) {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index === -1) return;
    
    const original = this.components[index];
    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateComponentId()
    };
    
    // Insert after the original
    this.components.splice(index + 1, 0, duplicate);
    
    // Update state if available
    if (this.state) {
      this.state.addComponent(duplicate, index + 1);
    }
    
    // Re-render components
    this.renderComponents();
    
    // Select the new component
    this.selectComponent(duplicate.id);
    
    // Emit event
    this.events.emit('component-duplicated', {
      original,
      duplicate,
      position: index + 1
    });
  }

  /**
   * Delete a component
   * @param {string} componentId - Component ID
   */
  deleteComponent(componentId) {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index === -1) return;
    
    const component = this.components[index];
    
    // Remove from array
    this.components.splice(index, 1);
    
    // Update state if available
    if (this.state) {
      this.state.removeComponent(componentId);
    }
    
    // Re-render components
    this.renderComponents();
    
    // Toggle empty state if needed
    this.toggleEmptyState(this.components.length === 0);
    
    // Emit event
    this.events.emit('component-deleted', {
      component,
      position: index
    });
  }

  /**
   * Set the preview mode (desktop, tablet, mobile)
   * @param {string} mode - View mode
   */
  setPreviewMode(mode) {
    if (!this.element) return;
    
    const previewContainer = this.element.querySelector(`.${styles.previewContainer}`);
    if (!previewContainer) return;
    
    // Remove all view classes
    previewContainer.classList.remove(
      styles.desktopView,
      styles.tabletView,
      styles.mobileView
    );
    
    // Add the selected view class
    previewContainer.classList.add(styles[`${mode}View`]);
    
    // Emit event
    this.events.emit('preview-mode-changed', { mode });
  }

  /**
   * Toggle the empty state message
   * @param {boolean} isEmpty - Whether the preview is empty
   */
  toggleEmptyState(isEmpty) {
    if (!this.element) return;
    
    const emptyState = this.element.querySelector(`.${styles.emptyState}`);
    if (emptyState) {
      emptyState.style.display = isEmpty ? 'flex' : 'none';
    }
  }

  /**
   * Update the preview with new component data
   * @param {Array} components - Array of component data
   */
  update(components) {
    if (Array.isArray(components)) {
      this.components = [...components];
      this.renderComponents();
      this.toggleEmptyState(this.components.length === 0);
    }
  }
}

export default Preview;
