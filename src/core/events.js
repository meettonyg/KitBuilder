/**
 * Event emitter system for Media Kit Builder
 * Provides a pub/sub pattern for communication between components
 */
export class EventEmitter {
  /**
   * Initialize the event emitter
   */
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * 
   * @param {string} event - Event name to subscribe to
   * @param {Function} handler - Callback function to execute when event occurs
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param {string} event - Event name to unsubscribe from
   * @param {Function} handler - Handler to remove
   */
  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }
  
  /**
   * Emit an event with data
   * 
   * @param {string} event - Event name to emit
   * @param {Object} data - Data to pass to handlers
   */
  emit(event, data = {}) {
    if (!this.events[event]) return;
    
    const eventData = { 
      ...data, 
      timestamp: new Date(),
      eventName: event
    };
    
    this.events[event].forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
