/**
 * State management system for Media Kit Builder
 * Manages application state and notifies subscribers of changes
 */
export class StateManager {
  /**
   * Initialize the state manager with default state
   */
  constructor() {
    this.state = {
      initialized: false,
      isDirty: false,
      selectedElement: null,
      selectedSection: null,
      sections: [],
      undoStack: [],
      redoStack: [],
      lastSaved: null,
      lastModified: null
    };
    this.listeners = [];
  }
  
  /**
   * Get a copy of the current state
   * @returns {Object} Copy of the current state
   */
  getState() {
    return { ...this.state }; // Return a copy to prevent direct mutation
  }
  
  /**
   * Update the state with new values
   * @param {Object} newState - Partial state to merge with current state
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.notifyListeners(oldState, this.state);
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function to execute on state change
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify all listeners of state change
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   */
  notifyListeners(oldState, newState) {
    this.listeners.forEach(listener => listener(oldState, newState));
  }
  
  /**
   * Mark the state as dirty (unsaved changes)
   */
  markDirty() {
    if (!this.state.isDirty) {
      this.setState({ isDirty: true, lastModified: new Date() });
    }
  }
  
  /**
   * Mark the state as clean (saved)
   */
  markClean() {
    if (this.state.isDirty) {
      this.setState({ isDirty: false, lastSaved: new Date() });
    }
  }
  
  /**
   * Set the selected element
   * @param {Object} element - Element to select
   */
  setSelectedElement(element) {
    this.setState({ selectedElement: element });
  }
  
  /**
   * Clear the selected element
   */
  clearSelectedElement() {
    this.setState({ selectedElement: null });
  }
  
  /**
   * Set the selected section
   * @param {Object} section - Section to select
   */
  setSelectedSection(section) {
    this.setState({ selectedSection: section });
  }
  
  /**
   * Clear the selected section
   */
  clearSelectedSection() {
    this.setState({ selectedSection: null });
  }
  
  /**
   * Add state to the undo stack
   * @param {Object} state - State to add to undo stack
   */
  addToUndoStack(state) {
    const undoStack = [...this.state.undoStack];
    undoStack.push(state);
    
    // Limit stack size to prevent memory issues
    if (undoStack.length > 20) {
      undoStack.shift();
    }
    
    this.setState({ 
      undoStack,
      redoStack: [] // Clear redo stack on new action
    });
    
    this.markDirty();
  }
  
  /**
   * Perform undo operation
   */
  undo() {
    if (this.state.undoStack.length === 0) return;
    
    const undoStack = [...this.state.undoStack];
    const redoStack = [...this.state.redoStack];
    
    // Move current state to redo stack
    redoStack.push({ ...this.state });
    
    // Pop state from undo stack
    const previousState = undoStack.pop();
    
    // Apply previous state, but keep undo/redo stacks
    this.state = {
      ...previousState,
      undoStack,
      redoStack
    };
    
    this.markDirty();
    this.notifyListeners(this.state, this.state);
  }
  
  /**
   * Perform redo operation
   */
  redo() {
    if (this.state.redoStack.length === 0) return;
    
    const undoStack = [...this.state.undoStack];
    const redoStack = [...this.state.redoStack];
    
    // Move current state to undo stack
    undoStack.push({ ...this.state });
    
    // Pop state from redo stack
    const nextState = redoStack.pop();
    
    // Apply next state, but keep undo/redo stacks
    this.state = {
      ...nextState,
      undoStack,
      redoStack
    };
    
    this.markDirty();
    this.notifyListeners(this.state, this.state);
  }
}
