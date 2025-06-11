/**
 * Drag and Drop Manager
 * Handles all drag-drop functionality for the Media Kit Builder
 */

class DragDropManager {
    constructor(builder) {
        this.builder = builder;
        this.draggedElement = null;
        this.draggedComponent = null;
        this.dropIndicator = null;
        
        this.init();
    }

    init() {
        this.createDropIndicator();
        this.setupComponentDragging();
        this.setupDropZones();
        this.setupElementReordering();
    }

    createDropIndicator() {
        this.dropIndicator = document.createElement('div');
        this.dropIndicator.className = 'mkb-drop-indicator';
        this.dropIndicator.style.cssText = `
            height: 3px;
            background: #0ea5e9;
            position: absolute;
            left: 0;
            right: 0;
            display: none;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.dropIndicator);
    }

    setupComponentDragging() {
        // Setup dragging for component palette items
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('mkb-component-item')) {
                this.handleComponentDragStart(e);
            } else if (e.target.classList.contains('mkb-editable-element')) {
                this.handleElementDragStart(e);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('mkb-component-item')) {
                this.handleComponentDragEnd(e);
            } else if (e.target.classList.contains('mkb-editable-element')) {
                this.handleElementDragEnd(e);
            }
        });
    }

    setupDropZones() {
        const dropZones = document.querySelectorAll('.mkb-drop-zone');
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('drop', (e) => this.handleDrop(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
            // Click to add component
            if (zone.classList.contains('empty')) {
                zone.addEventListener('click', () => {
                    this.builder.showComponentLibrary();
                });
            }
        });
    }

    setupElementReordering() {
        // Make existing elements draggable for reordering
        document.querySelectorAll('.mkb-editable-element').forEach(element => {
            element.draggable = true;
            
            element.addEventListener('dragover', (e) => this.handleElementDragOver(e));
            element.addEventListener('drop', (e) => this.handleElementDrop(e));
        });
    }

    handleComponentDragStart(e) {
        const componentType = e.target.dataset.component;
        this.draggedComponent = componentType;
        this.builder.state.draggedComponent = componentType;
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('component', componentType);
        
        // Show all drop zones
        document.querySelectorAll('.mkb-drop-zone').forEach(zone => {
            zone.classList.add('active');
        });
    }

    handleComponentDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedComponent = null;
        this.builder.state.draggedComponent = null;
        
        // Hide drop zones
        document.querySelectorAll('.mkb-drop-zone').forEach(zone => {
            zone.classList.remove('active', 'drag-over');
        });
        
        this.hideDropIndicator();
    }

    handleElementDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('element', 'true');
    }

    handleElementDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
        this.hideDropIndicator();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const zone = e.currentTarget;
        zone.classList.add('drag-over');
        
        // Show drop indicator
        this.showDropIndicator(zone);
    }

    handleDragLeave(e) {
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');
        
        if (this.draggedComponent) {
            this.dropComponent(zone);
        } else if (this.draggedElement) {
            this.dropElement(zone);
        }
        
        this.hideDropIndicator();
    }

    handleElementDragOver(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(e.currentTarget.parentElement, e.clientY);
        
        if (afterElement == null) {
            this.showDropIndicator(e.currentTarget, 'after');
        } else {
            this.showDropIndicator(afterElement, 'before');
        }
    }

    handleElementDrop(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const container = e.currentTarget.parentElement;
        const afterElement = this.getDragAfterElement(container, e.clientY);
        
        if (afterElement == null) {
            container.appendChild(this.draggedElement);
        } else {
            container.insertBefore(this.draggedElement, afterElement);
        }
        
        this.builder.markDirty();
        this.builder.saveCurrentState();
    }

    dropComponent(zone) {
        const componentItem = document.querySelector(`[data-component="${this.draggedComponent}"]`);
        
        // Check if premium component
        if (componentItem && componentItem.classList.contains('premium')) {
            this.showUpgradePrompt();
            return;
        }
        
        // Get component template
        const template = this.getComponentTemplate(this.draggedComponent);
        
        // Replace empty zone with component
        zone.classList.remove('empty');
        zone.innerHTML = template;
        
        // Add new drop zone after the component
        const newDropZone = document.createElement('div');
        newDropZone.className = 'mkb-drop-zone empty';
        newDropZone.dataset.zone = Date.now(); // Unique identifier
        zone.parentNode.insertBefore(newDropZone, zone.nextSibling);
        
        // Setup the new component
        this.builder.setupEditableElements();
        this.setupDropZones();
        this.setupElementReordering();
        
        // Select the new component
        const newElement = zone.querySelector('.mkb-editable-element');
        if (newElement) {
            this.builder.selectElement(newElement);
        }
        
        this.builder.markDirty();
        this.builder.saveCurrentState();
    }

    dropElement(zone) {
        if (!this.draggedElement) return;
        
        // Move element to the drop zone
        zone.appendChild(this.draggedElement);
        
        this.builder.markDirty();
        this.builder.saveCurrentState();
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.mkb-editable-element:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    showDropIndicator(element, position = 'after') {
        const rect = element.getBoundingClientRect();
        
        this.dropIndicator.style.display = 'block';
        this.dropIndicator.style.top = position === 'after' 
            ? `${rect.bottom + window.scrollY}px`
            : `${rect.top + window.scrollY}px`;
        this.dropIndicator.style.left = `${rect.left}px`;
        this.dropIndicator.style.width = `${rect.width}px`;
    }

    hideDropIndicator() {
        this.dropIndicator.style.display = 'none';
    }

    showUpgradePrompt() {
        // Show upgrade modal or alert
        alert('This is a premium component. Upgrade to Pro to unlock advanced features!');
    }

    getComponentTemplate(componentType) {
        const templates = {
            'hero': `
                <div class="mkb-hero-section mkb-editable-element" data-element="hero" data-component="hero">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <div class="mkb-hero-avatar">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='50' text-anchor='middle' x='50' fill='%2364748b'%3E👤%3C/text%3E%3C/svg%3E" alt="Profile">
                    </div>
                    <h1 class="mkb-hero-name" contenteditable="true">Your Name</h1>
                    <div class="mkb-hero-title" contenteditable="true">Your Professional Title</div>
                    <p class="mkb-hero-bio" contenteditable="true">Tell your story here...</p>
                </div>
            `,
            'bio': `
                <div class="mkb-content-section mkb-editable-element" data-element="bio" data-component="bio">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">About Me</h2>
                    <p contenteditable="true">Share your professional background, expertise, and what makes you unique...</p>
                </div>
            `,
            'topics': `
                <div class="mkb-content-section mkb-editable-element" data-element="topics" data-component="topics">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">Speaking Topics</h2>
                    <div class="mkb-topics-grid">
                        <div class="mkb-topic-item" contenteditable="true">Topic 1</div>
                        <div class="mkb-topic-item" contenteditable="true">Topic 2</div>
                        <div class="mkb-topic-item" contenteditable="true">Topic 3</div>
                        <div class="mkb-topic-item" contenteditable="true">Topic 4</div>
                    </div>
                </div>
            `,
            'social': `
                <div class="mkb-social-links mkb-editable-element" data-element="social" data-component="social">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <a href="#" class="mkb-social-link" title="Twitter">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                    </a>
                    <a href="#" class="mkb-social-link" title="LinkedIn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                            <circle cx="4" cy="4" r="2"/>
                        </svg>
                    </a>
                    <a href="#" class="mkb-social-link" title="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </a>
                </div>
            `,
            'stats': `
                <div class="mkb-content-section mkb-editable-element" data-element="stats" data-component="stats">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">Key Statistics</h2>
                    <div class="mkb-stats-grid">
                        <div class="mkb-stat-item">
                            <span class="mkb-stat-number" contenteditable="true">100+</span>
                            <div class="mkb-stat-label" contenteditable="true">Metric 1</div>
                        </div>
                        <div class="mkb-stat-item">
                            <span class="mkb-stat-number" contenteditable="true">50K</span>
                            <div class="mkb-stat-label" contenteditable="true">Metric 2</div>
                        </div>
                        <div class="mkb-stat-item">
                            <span class="mkb-stat-number" contenteditable="true">5</span>
                            <div class="mkb-stat-label" contenteditable="true">Metric 3</div>
                        </div>
                        <div class="mkb-stat-item">
                            <span class="mkb-stat-number" contenteditable="true">98%</span>
                            <div class="mkb-stat-label" contenteditable="true">Metric 4</div>
                        </div>
                    </div>
                </div>
            `,
            'cta': `
                <div class="mkb-content-section mkb-editable-element" data-element="cta" data-component="cta">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <div class="mkb-cta-section">
                        <h2 class="mkb-section-title" contenteditable="true">Ready to Connect?</h2>
                        <p contenteditable="true">Let's discuss how we can work together.</p>
                        <a href="#" class="mkb-cta-button" contenteditable="true">Get In Touch</a>
                    </div>
                </div>
            `,
            'logo-grid': `
                <div class="mkb-content-section mkb-editable-element" data-element="logo-grid" data-component="logo-grid">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">Featured On</h2>
                    <div class="mkb-logo-grid">
                        <div class="mkb-logo-item">
                            <div class="mkb-logo-placeholder">Click to add logo</div>
                        </div>
                        <div class="mkb-logo-item">
                            <div class="mkb-logo-placeholder">Click to add logo</div>
                        </div>
                        <div class="mkb-logo-item">
                            <div class="mkb-logo-placeholder">Click to add logo</div>
                        </div>
                        <div class="mkb-logo-item">
                            <div class="mkb-logo-placeholder">Click to add logo</div>
                        </div>
                    </div>
                </div>
            `,
            'testimonials': `
                <div class="mkb-content-section mkb-editable-element" data-element="testimonials" data-component="testimonials">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">What People Say</h2>
                    <div class="mkb-testimonial-card">
                        <p class="mkb-testimonial-quote" contenteditable="true">"Add a testimonial from a client or colleague here..."</p>
                        <div class="mkb-testimonial-author" contenteditable="true">Client Name</div>
                        <div class="mkb-testimonial-role" contenteditable="true">Their Role/Company</div>
                    </div>
                </div>
            `,
            'contact': `
                <div class="mkb-content-section mkb-editable-element" data-element="contact" data-component="contact">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">Contact Information</h2>
                    <div class="mkb-contact-info">
                        <p contenteditable="true">📧 your.email@example.com</p>
                        <p contenteditable="true">📱 +1 (555) 123-4567</p>
                        <p contenteditable="true">🌐 www.yourwebsite.com</p>
                    </div>
                </div>
            `,
            'questions': `
                <div class="mkb-content-section mkb-editable-element" data-element="questions" data-component="questions">
                    <div class="mkb-element-controls">
                        <button class="mkb-control-btn" title="Move Up">↑</button>
                        <button class="mkb-control-btn" title="Move Down">↓</button>
                        <button class="mkb-control-btn" title="Duplicate">⧉</button>
                        <button class="mkb-control-btn" title="Delete">×</button>
                    </div>
                    <h2 class="mkb-section-title" contenteditable="true">Interview Questions</h2>
                    <div class="mkb-questions-list">
                        <div class="mkb-question-item" contenteditable="true">What inspired you to start your journey?</div>
                        <div class="mkb-question-item" contenteditable="true">What's your biggest achievement?</div>
                        <div class="mkb-question-item" contenteditable="true">What advice would you give to beginners?</div>
                    </div>
                </div>
            `
        };
        
        return templates[componentType] || '<div class="mkb-content-section"><p>Component not found</p></div>';
    }
}

// Export for use in main builder
window.DragDropManager = DragDropManager;