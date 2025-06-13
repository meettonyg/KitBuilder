/**
 * Error manager for Media Kit Builder
 * Handles error logging, tracking, and reporting
 */
export class ErrorManager {
  /**
   * Initialize the error manager
   * @param {Object} events - EventEmitter instance
   */
  constructor(events) {
    this.events = events;
    this.errors = [];
    
    // Listen for global errors
    window.addEventListener('error', this.handleGlobalError.bind(this));
    this.events.on('error', this.handleError.bind(this));
  }
  
  /**
   * Handle an error from any source
   * @param {Error|Object|string} error - Error to handle
   * @returns {Object} Processed error object
   */
  handleError(error) {
    const errorObj = {
      message: error.message || String(error),
      stack: error.stack || '',
      context: error.context || 'unknown',
      timestamp: new Date()
    };
    
    this.errors.push(errorObj);
    console.error(`[MediaKitBuilder] Error (${errorObj.context}):`, error);
    
    // Emit error event for logging/UI
    this.events.emit('error-logged', errorObj);
    
    return errorObj;
  }
  
  /**
   * Handle global window error
   * @param {ErrorEvent} event - Error event from window
   */
  handleGlobalError(event) {
    // Prevent default browser error handling
    event.preventDefault();
    
    // Convert window error event to managed error
    this.handleError({
      message: event.message,
      stack: event.error ? event.error.stack : '',
      context: 'global',
      originalEvent: event
    });
  }
  
  /**
   * Get all logged errors
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return [...this.errors];
  }
  
  /**
   * Clear all logged errors
   */
  clearErrors() {
    this.errors = [];
    this.events.emit('errors-cleared');
  }
  
  /**
   * Log an error to console and internal store
   * @param {string} context - Context in which the error occurred
   * @param {Error|string} error - Error object or message
   */
  logError(context, error) {
    this.handleError({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : '',
      context
    });
  }
  
  /**
   * Create a wrapped function that catches and logs errors
   * @param {Function} fn - Function to wrap
   * @param {string} context - Error context
   * @returns {Function} Wrapped function with error handling
   */
  catchErrors(fn, context) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.logError(context, error);
        throw error;
      }
    };
  }
  
  /**
   * Wrap async function to catch and log errors
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Error context
   * @returns {Function} Wrapped async function with error handling
   */
  catchAsyncErrors(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(context, error);
        throw error;
      }
    };
  }
}
