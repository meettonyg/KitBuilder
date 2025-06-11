/**
 * Export Manager
 * Handles PDF, image, HTML, and embed code generation
 */

class ExportManager {
    constructor(builder) {
        this.builder = builder;
        this.exportInProgress = false;
        
        this.init();
    }

    init() {
        this.setupExportListeners();
    }

    setupExportListeners() {
        // Export button
        const exportBtn = document.getElementById('mkb-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }

        // Export options
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mkb-export-option')) {
                const exportType = e.target.closest('.mkb-export-option').dataset.export;
                this.handleExport(exportType);
            }
        });
    }

    showExportModal() {
        const modal = document.getElementById('mkb-export-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideExportModal() {
        const modal = document.getElementById('mkb-export-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleExport(type) {
        if (this.exportInProgress) return;
        
        this.exportInProgress = true;
        
        try {
            switch(type) {
                case 'pdf':
                    await this.exportToPDF();
                    break;
                case 'image':
                    await this.exportToImage();
                    break;
                case 'html':
                    await this.exportToHTML();
                    break;
                case 'embed':
                    await this.generateEmbedCode();
                    break;
                default:
                    console.error('Unknown export type:', type);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            this.exportInProgress = false;
            this.hideExportModal();
        }
    }

    async exportToPDF() {
        // Show loading state
        this.showExportProgress('Generating PDF...');
        
        try {
            // Prepare data for server-side PDF generation
            const data = this.prepareExportData();
            
            // Send to server
            const response = await this.builder.api('export_pdf', {
                kit_id: this.builder.state.mediaKitId,
                content: data.content,
                styles: data.styles,
                options: {
                    format: 'letter', // 8.5x11
                    orientation: 'portrait',
                    watermark: !this.builder.state.userData.isPro
                }
            });
            
            if (response.success && response.data.url) {
                // Download the PDF
                this.downloadFile(response.data.url, `media-kit-${Date.now()}.pdf`);
            } else {
                throw new Error('PDF generation failed');
            }
            
        } catch (error) {
            console.error('PDF export error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            this.hideExportProgress();
        }
    }

    async exportToImage() {
        // Show loading state
        this.showExportProgress('Generating image...');
        
        try {
            // Use html2canvas if available, otherwise server-side
            if (typeof html2canvas !== 'undefined') {
                const preview = document.getElementById('mkb-media-kit-preview');
                const canvas = await html2canvas(preview, {
                    scale: 2, // High resolution
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                });
                
                // Convert to blob and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    this.downloadFile(url, `media-kit-${Date.now()}.png`);
                    URL.revokeObjectURL(url);
                }, 'image/png');
            } else {
                // Fallback to server-side generation
                await this.serverSideImageExport();
            }
            
        } catch (error) {
            console.error('Image export error:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            this.hideExportProgress();
        }
    }

    async serverSideImageExport() {
        const data = this.prepareExportData();
        
        const response = await this.builder.api('export_image', {
            kit_id: this.builder.state.mediaKitId,
            content: data.content,
            styles: data.styles,
            options: {
                width: 1200,
                format: 'png'
            }
        });
        
        if (response.success && response.data.url) {
            this.downloadFile(response.data.url, `media-kit-${Date.now()}.png`);
        } else {
            throw new Error('Image generation failed');
        }
    }

    async exportToHTML() {
        this.showExportProgress('Generating shareable link...');
        
        try {
            // Save current state and get public URL
            await this.builder.saveMediaKit();
            
            const response = await this.builder.api('generate_public_link', {
                kit_id: this.builder.state.mediaKitId
            });
            
            if (response.success && response.data.url) {
                // Show share modal with link
                this.showShareModal(response.data.url);
            } else {
                throw new Error('Failed to generate public link');
            }
            
        } catch (error) {
            console.error('HTML export error:', error);
            alert('Failed to generate shareable link. Please try again.');
        } finally {
            this.hideExportProgress();
        }
    }

    async generateEmbedCode() {
        this.showExportProgress('Generating embed code...');
        
        try {
            // Save current state and get embed code
            await this.builder.saveMediaKit();
            
            const response = await this.builder.api('generate_embed_code', {
                kit_id: this.builder.state.mediaKitId,
                options: {
                    width: '100%',
                    height: '600px',
                    responsive: true
                }
            });
            
            if (response.success && response.data.code) {
                // Show embed code modal
                this.showEmbedModal(response.data.code);
            } else {
                throw new Error('Failed to generate embed code');
            }
            
        } catch (error) {
            console.error('Embed code error:', error);
            alert('Failed to generate embed code. Please try again.');
        } finally {
            this.hideExportProgress();
        }
    }

    prepareExportData() {
        const preview = document.getElementById('mkb-media-kit-preview');
        
        // Clone the preview for export
        const exportClone = preview.cloneNode(true);
        
        // Remove editor-specific elements
        exportClone.querySelectorAll('.mkb-element-controls').forEach(el => el.remove());
        exportClone.querySelectorAll('.mkb-drop-zone').forEach(el => el.remove());
        exportClone.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        
        // Remove selection classes
        exportClone.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Get computed styles
        const styles = this.getExportStyles();
        
        return {
            content: exportClone.innerHTML,
            styles: styles,
            theme: this.builder.state.currentTheme,
            metadata: {
                title: this.getMediaKitTitle(),
                author: this.builder.state.userData.name || 'Guest User',
                date: new Date().toISOString()
            }
        };
    }

    getExportStyles() {
        // Collect all relevant styles for export
        const styles = {
            theme: this.builder.state.currentTheme,
            customCSS: '',
            variables: {}
        };
        
        // Get CSS variables
        const computedStyle = getComputedStyle(document.documentElement);
        ['--theme-primary', '--theme-secondary', '--theme-accent', '--primary-font', '--border-radius'].forEach(varName => {
            styles.variables[varName] = computedStyle.getPropertyValue(varName);
        });
        
        // Get custom styles from style tags
        document.querySelectorAll('style').forEach(styleTag => {
            if (styleTag.textContent.includes('mkb-')) {
                styles.customCSS += styleTag.textContent;
            }
        });
        
        return styles;
    }

    getMediaKitTitle() {
        // Try to get title from hero name or first heading
        const heroName = document.querySelector('.mkb-hero-name');
        if (heroName) {
            return heroName.textContent + ' - Media Kit';
        }
        
        return 'Media Kit';
    }

    showShareModal(url) {
        const modal = document.createElement('div');
        modal.className = 'mkb-modal-overlay';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="mkb-modal-content" style="max-width: 500px;">
                <div class="mkb-modal-header">
                    <div class="mkb-modal-title">Share Your Media Kit</div>
                    <button class="mkb-close-modal">&times;</button>
                </div>
                <div class="mkb-modal-body">
                    <p style="margin-bottom: 16px;">Your media kit is ready to share!</p>
                    
                    <div class="mkb-form-group">
                        <label class="mkb-form-label">Shareable Link</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" class="mkb-form-input" value="${url}" readonly id="share-link">
                            <button class="mkb-toolbar-btn primary" onclick="navigator.clipboard.writeText(document.getElementById('share-link').value).then(() => alert('Copied to clipboard!'))">
                                Copy
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 24px;">
                        <button class="mkb-toolbar-btn" style="flex: 1;" onclick="window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent('${url}') + '&text=' + encodeURIComponent('Check out my media kit!'))">
                            Share on Twitter
                        </button>
                        <button class="mkb-toolbar-btn" style="flex: 1;" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent('${url}'))">
                            Share on LinkedIn
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        this.setupModalClose(modal);
    }

    showEmbedModal(embedCode) {
        const modal = document.createElement('div');
        modal.className = 'mkb-modal-overlay';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="mkb-modal-content" style="max-width: 600px;">
                <div class="mkb-modal-header">
                    <div class="mkb-modal-title">Embed Your Media Kit</div>
                    <button class="mkb-close-modal">&times;</button>
                </div>
                <div class="mkb-modal-body">
                    <p style="margin-bottom: 16px;">Copy this code and paste it into your website:</p>
                    
                    <div class="mkb-form-group">
                        <label class="mkb-form-label">Embed Code</label>
                        <textarea class="mkb-form-input mkb-form-textarea" rows="6" readonly id="embed-code">${embedCode}</textarea>
                    </div>
                    
                    <button class="mkb-toolbar-btn primary" style="width: 100%;" onclick="navigator.clipboard.writeText(document.getElementById('embed-code').value).then(() => alert('Copied to clipboard!'))">
                        Copy Embed Code
                    </button>
                    
                    <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
                        <strong>Note:</strong> This embed code will create a responsive iframe that adjusts to your website's layout.
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        this.setupModalClose(modal);
    }

    setupModalClose(modal) {
        // Close button
        modal.querySelector('.mkb-close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showExportProgress(message) {
        const progress = document.createElement('div');
        progress.className = 'mkb-export-progress';
        progress.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--mkb-dark-panel);
            padding: 24px 32px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 3000;
            text-align: center;
        `;
        
        progress.innerHTML = `
            <div class="mkb-spinner" style="margin: 0 auto 16px; width: 32px; height: 32px;"></div>
            <div style="color: var(--mkb-text-primary); font-size: 14px;">${message}</div>
        `;
        
        document.body.appendChild(progress);
        this.progressElement = progress;
    }

    hideExportProgress() {
        if (this.progressElement) {
            this.progressElement.remove();
            this.progressElement = null;
        }
    }

    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Print functionality
    printMediaKit() {
        // Create print-specific styles
        const printStyles = `
            @media print {
                body * {
                    visibility: hidden;
                }
                
                #mkb-media-kit-preview,
                #mkb-media-kit-preview * {
                    visibility: visible;
                }
                
                #mkb-media-kit-preview {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                
                .mkb-element-controls,
                .mkb-drop-zone {
                    display: none !important;
                }
                
                [contenteditable] {
                    border: none !important;
                    outline: none !important;
                }
                
                @page {
                    size: letter;
                    margin: 0.5in;
                }
            }
        `;
        
        // Add print styles
        const styleTag = document.createElement('style');
        styleTag.textContent = printStyles;
        document.head.appendChild(styleTag);
        
        // Print
        window.print();
        
        // Remove print styles after a delay
        setTimeout(() => {
            styleTag.remove();
        }, 1000);
    }
}

// Export for use in main builder
window.ExportManager = ExportManager;