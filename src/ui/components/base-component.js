/**
 * Base UI Component
 * Foundation class for all UI components
 */

export class UIComponent {
  /**
   * Create a base UI component
   * @param {EventEmitter} events - Event system
   */
  constructor(events) {
    this.events = events;
    this.element = null;
    this.rendered = false;
  }

  /**
   * Render the component to a container
   * @param {HTMLElement|string} container - Container element or selector
   * @returns {HTMLElement} The rendered element
   */
  render(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      throw new Error('Container not found');
    }

    const element = this.createElement();
    container.appendChild(element);
    this.element = element;
    this.rendered = true;
    this.setupEventListeners();
    
    return element;
  }

  /**
   * Create the component's DOM element
   * To be implemented by subclasses
   * @returns {HTMLElement} The created element
   */
  createElement() {
    throw new Error('createElement() must be implemented by subclass');
  }

  /**
   * Set up event listeners for the component
   * To be implemented by subclasses
   */
  setupEventListeners() {
    // Default implementation does nothing
  }

  /**
   * Update the component with new data
   * @param {Object} data - New data for the component
   */
  update(data) {
    // Default implementation does nothing
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.rendered = false;
  }
}

export default UIComponent;
