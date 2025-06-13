/**
 * UI Controls for Media Kit Builder
 * Provides toolbar buttons for save, undo, redo, export
 */

import UIComponent from './components/base-component';
import styles from '@styles/components/controls.module.css';

export class Controls extends UIComponent {
  /**
   * Create UI controls
   * @param {EventEmitter} events - Event system
   * @param {Object} options - Configuration options
   * @param {StateManager} options.state - State manager
   */
  constructor(events, options = {}) {
    super(events);
    this.state = options.state;
    this.saving = false;
  }

  /**
   * Create the controls element
   * @returns {HTMLElement} The created element
   */
  createElement() {
    const element = document.createElement('div');
    element.className = styles.controls;
    element.innerHTML = `
      <div class="${styles.group}">
        <button class="${styles.button} ${styles.primary}" data-action="save">
          <i class="icon-save"></i>
          <span>Save</span>
        </button>
        <button class="${styles.button}" data-action="undo" disabled>
          <i class="icon-undo"></i>
          <span>Undo</span>
        </button>
        <button class="${styles.button}" data-action="redo" disabled>
          <i class="icon-redo"></i>
          <span>Redo</span>
        </button>
      </div>
      <div class="${styles.group}">
        <button class="${styles.button}" data-action="preview">
          <i class="icon-eye"></i>
          <span>Preview</span>
        </button>
        <button class="${styles.button}" data-action="export">
          <i class="icon-download"></i>
          <span>Export</span>
        </button>
      </div>
    `;

    return element;
  }

  /**
   * Set up event listeners for the controls
   */
  setupEventListeners() {
    if (!this.element) return;

    // Handle button clicks
    this.element.querySelectorAll(`.${styles.button}`).forEach(button => {
      button.addEventListener('click', e => {
        const action = button.dataset.action;
        if (action) {
          this.handleAction(action);
        }
      });
    });

    // Listen for state changes
    if (this.state) {
      this.state.subscribe(this.handleStateChange.bind(this));
    }
  }

  /**
   * Handle control actions
   * @param {string} action - Action name
   */
  handleAction(action) {
    switch (action) {
      case 'save':
        this.handleSave();
        break;
      case 'undo':
        this.handleUndo();
        break;
      case 'redo':
        this.handleRedo();
        break;
      case 'preview':
        this.handlePreview();
        break;
      case 'export':
        this.handleExport();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Handle save action
   */
  handleSave() {
    if (this.saving) return;
    
    this.saving = true;
    this.updateSaveButton(true);
    
    // Emit save event
    this.events.emit('save-requested', {
      timestamp: new Date()
    });
    
    // In a real implementation, we would wait for a save-completed event
    // For now, simulate a save
    setTimeout(() => {
      this.saving = false;
      this.updateSaveButton(false);
      
      if (this.state) {
        this.state.markClean();
      }
      
      this.events.emit('save-completed', {
        success: true,
        timestamp: new Date()
      });
    }, 1000);
  }

  /**
   * Update the save button state
   * @param {boolean} saving - Whether save is in progress
   */
  updateSaveButton(saving) {
    const saveBtn = this.element.querySelector(`[data-action="save"]`);
    if (saveBtn) {
      if (saving) {
        saveBtn.innerHTML = `
          <i class="icon-spinner icon-spin"></i>
          <span>Saving...</span>
        `;
        saveBtn.disabled = true;
      } else {
        saveBtn.innerHTML = `
          <i class="icon-save"></i>
          <span>Save</span>
        `;
        saveBtn.disabled = false;
      }
    }
  }

  /**
   * Handle undo action
   */
  handleUndo() {
    if (this.state) {
      this.state.undo();
    }
    
    this.events.emit('undo-requested');
  }

  /**
   * Handle redo action
   */
  handleRedo() {
    if (this.state) {
      this.state.redo();
    }
    
    this.events.emit('redo-requested');
  }

  /**
   * Handle preview action
   */
  handlePreview() {
    this.events.emit('preview-requested');
  }

  /**
   * Handle export action
   */
  handleExport() {
    this.events.emit('export-requested');
  }

  /**
   * Handle state changes
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   */
  handleStateChange(oldState, newState) {
    // Update undo/redo buttons
    const undoBtn = this.element.querySelector(`[data-action="undo"]`);
    if (undoBtn) {
      undoBtn.disabled = !newState.canUndo;
    }
    
    const redoBtn = this.element.querySelector(`[data-action="redo"]`);
    if (redoBtn) {
      redoBtn.disabled = !newState.canRedo;
    }
    
    // Update save button based on dirty state
    const saveBtn = this.element.querySelector(`[data-action="save"]`);
    if (saveBtn && !this.saving) {
      saveBtn.disabled = !newState.isDirty;
    }
  }
}

export default Controls;
