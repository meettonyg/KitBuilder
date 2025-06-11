/**
 * Complete Preview JavaScript for WordPress Integration
 * Handles media kit preview display and interactions
 */

// Configuration from WordPress
const config = window.MediaKitPreview?.config || {
    entryKey: '',
    entryId: 0,
    ajaxUrl: '/wp-admin/admin-ajax.php',
    nonce: '',
    pluginUrl: '',
    isPreview: true
};

// Field mappings for data display
const fieldMappings = window.MediaKitPreview?.fieldMappings || {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializePreview();
});

function initializePreview() {
    console.log('Initializing Media Kit Preview v2.0');
    console.log('Configuration:', config);
    
    loadMediaKitPreview();
    setupDownloadButton();
    setupShareButtons();
}

function loadMediaKitPreview() {
    console.log('Loading media kit preview for:', config.entryKey);
    
    if (!config.entryKey) {
        showError('Media kit not found', 'The requested media kit could not be found.');
        return;
    }
    
    // Make AJAX request to load preview data
    const formData = new FormData();
    formData.append('action', 'mkb_load_data');
    formData.append('nonce', config.nonce);
    formData.append('entry_key', config.entryKey);
    
    fetch(config.ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Preview data loaded:', data);
        
        if (data.success) {
            renderMediaKit(data.data.data || {});
        } else {
            console.error('Failed to load preview data:', data.data);
            showError('Failed to load', 'There was an error loading this media kit.');
        }
    })
    .catch(error => {
        console.error('Error loading preview data:', error);
        showError('Connection Error', 'Unable to connect to the server.');
    });
}

function renderMediaKit(data) {
    console.log('Rendering media kit with data:', data);
    
    const container = document.getElementById('media-kit-container');
    
    // Generate avatar initials
    const name = data.hero_full_name || 'Unknown';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    container.innerHTML = `
        <div class="hero-section">
            <div class="hero-avatar">
                ${data.hero_headshot ? 
                    `<img src="${escapeHtml(data.hero_headshot)}" alt="${escapeHtml(name)}">` : 
                    `<span>${initials}</span>`
                }
            </div>
            <h1 class="hero-name">${escapeHtml(data.hero_full_name || 'Professional Speaker')}</h1>
            <div class="hero-title">${escapeHtml(data.hero_title || 'Expert & Thought Leader')}</div>
            <p class="hero-bio">${escapeHtml(data.bio_text || 'Professional biography and expertise description.')}</p>
        </div>

        ${renderTopicsSection(data)}
        ${renderQuestionsSection(data)}
        ${renderStatsSection(data)}
        ${renderSocialSection(data)}
        ${renderContactSection(data)}
        ${renderTestimonialsSection(data)}
        ${renderLogoGridSection(data)}
    `;
    
    // Update page title
    document.title = `${name} - Media Kit`;
    
    // Setup interactions
    setupInteractions();
}

function renderTopicsSection(data) {
    const topics = [];
    for (let i = 1; i <= 5; i++) {
        const topic = data[`topic_${i}`];
        if (topic && topic.trim()) {
            topics.push(topic.trim());
        }
    }
    
    if (topics.length === 0) {
        return '';
    }
    
    return `
        <div class="content-section">
            <h2 class="section-title">Speaking Topics</h2>
            <div class="topics-grid">
                ${topics.map(topic => `<div class="topic-item">${escapeHtml(topic)}</div>`).join('')}
            </div>
        </div>
    `;
}

function renderQuestionsSection(data) {
    const questions = [];
    for (let i = 1; i <= 25; i++) {
        const question = data[`question_${i}`];
        if (question && question.trim()) {
            questions.push(question.trim());
        }
    }
    
    if (questions.length === 0) {
        return '';
    }
    
    // Show only first 5 questions in preview
    const displayQuestions = questions.slice(0, 5);
    
    return `
        <div class="content-section">
            <h2 class="section-title">Interview Questions</h2>
            <div class="questions-list">
                ${displayQuestions.map(question => `<div class="question-item">${escapeHtml(question)}</div>`).join('')}
            </div>
            ${questions.length > 5 ? `<p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 16px;">And ${questions.length - 5} more questions...</p>` : ''}
        </div>
    `;
}

function renderStatsSection(data) {
    // This would be populated with actual stats data if available
    // For now, we'll show placeholder stats or skip if no data
    const hasStats = data.stat_1 || data.stat_2 || data.stat_3 || data.stat_4;
    
    if (!hasStats) {
        // Return default stats for demonstration
        return `
            <div class="content-section">
                <h2 class="section-title">Key Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">500+</span>
                        <div class="stat-label">Speaking Engagements</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">50K</span>
                        <div class="stat-label">Audience Reached</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">15+</span>
                        <div class="stat-label">Years Experience</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">25</span>
                        <div class="stat-label">Industries Served</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return ''; // Skip stats section if no data
}

function renderSocialSection(data) {
    const socialLinks = [];
    
    const socialPlatforms = [
        { key: 'social_twitter', icon: 'twitter', label: 'Twitter' },
        { key: 'social_linkedin', icon: 'linkedin', label: 'LinkedIn' },
        { key: 'social_instagram', icon: 'instagram', label: 'Instagram' },
        { key: 'social_facebook', icon: 'facebook', label: 'Facebook' },
        { key: 'social_youtube', icon: 'youtube', label: 'YouTube' },
        { key: 'social_pinterest', icon: 'pinterest', label: 'Pinterest' },
        { key: 'social_tiktok', icon: 'tiktok', label: 'TikTok' }
    ];
    
    socialPlatforms.forEach(platform => {
        const url = data[platform.key];
        if (url && url.trim()) {
            socialLinks.push({
                url: url.trim(),
                icon: platform.icon,
                label: platform.label
            });
        }
    });
    
    if (socialLinks.length === 0) {
        return '';
    }
    
    return `
        <div class="social-links">
            ${socialLinks.map(link => `
                <a href="${escapeHtml(link.url)}" class="social-link" title="${escapeHtml(link.label)}" target="_blank" rel="noopener">
                    ${getSocialIcon(link.icon)}
                </a>
            `).join('')}
        </div>
    `;
}

function renderContactSection(data) {
    const contactInfo = [];
    
    if (data.hero_organization) {
        contactInfo.push(`🏢 ${data.hero_organization}`);
    }
    
    if (data.contact_email) {
        contactInfo.push(`📧 ${data.contact_email}`);
    }
    
    if (data.contact_phone) {
        contactInfo.push(`📱 ${data.contact_phone}`);
    }
    
    if (data.contact_website) {
        contactInfo.push(`🌐 ${data.contact_website}`);
    }
    
    // Add default contact info if none provided
    if (contactInfo.length === 0) {
        contactInfo.push('📧 Contact for speaking opportunities');
        contactInfo.push('📱 Available for interviews and podcasts');
    }
    
    return `
        <div class="content-section">
            <h2 class="section-title">Get In Touch</h2>
            <div class="contact-info">
                ${contactInfo.map(info => `<div class="contact-item">${escapeHtml(info)}</div>`).join('')}
            </div>
        </div>
    `;
}

function renderTestimonialsSection(data) {
    const testimonials = [];
    
    // Check for testimonial data
    for (let i = 1; i <= 5; i++) {
        const quote = data[`testimonial_${i}_quote`];
        const author = data[`testimonial_${i}_author`];
        const role = data[`testimonial_${i}_role`];
        
        if (quote && quote.trim()) {
            testimonials.push({
                quote: quote.trim(),
                author: author ? author.trim() : 'Anonymous',
                role: role ? role.trim() : ''
            });
        }
    }
    
    if (testimonials.length === 0) {
        return '';
    }
    
    return `
        <div class="content-section">
            <h2 class="section-title">What People Say</h2>
            ${testimonials.map(testimonial => `
                <div class="testimonial-card">
                    <p class="testimonial-quote">${escapeHtml(testimonial.quote)}</p>
                    <div class="testimonial-author">${escapeHtml(testimonial.author)}</div>
                    ${testimonial.role ? `<div class="testimonial-role">${escapeHtml(testimonial.role)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderLogoGridSection(data) {
    const logos = [];
    
    // Check for logo data
    for (let i = 1; i <= 12; i++) {
        const logo = data[`logo_${i}`];
        const logoName = data[`logo_${i}_name`];
        
        if (logo && logo.trim()) {
            logos.push({
                url: logo.trim(),
                name: logoName ? logoName.trim() : `Logo ${i}`
            });
        }
    }
    
    if (logos.length === 0) {
        return '';
    }
    
    return `
        <div class="content-section">
            <h2 class="section-title">Featured On</h2>
            <div class="logo-grid">
                ${logos.map(logo => `
                    <div class="logo-item">
                        <img src="${escapeHtml(logo.url)}" alt="${escapeHtml(logo.name)}" loading="lazy">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getSocialIcon(platform) {
    const icons = {
        twitter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
        </svg>`,
        linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
            <circle cx="4" cy="4" r="2"/>
        </svg>`,
        instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>`,
        facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>`,
        youtube: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/>
            <polygon points="9.75,15.02 15.5,11.75 9.75,8.48"/>
        </svg>`,
        pinterest: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.372 0 12 0 17.084 3.163 21.426 7.627 23.174c-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.562-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.001 24c6.624 0 11.99-5.373 11.99-12C24 5.372 18.627.001 12.001.001z"/>
        </svg>`,
        tiktok: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>`
    };
    
    return icons[platform] || '🔗';
}

function setupInteractions() {
    // Setup image lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Setup smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Track view analytics
    trackView();
}

function setupDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadPDF();
        });
    }
}

function setupShareButtons() {
    // Setup native sharing if available
    if (navigator.share) {
        const shareData = {
            title: document.title,
            text: 'Check out this professional media kit',
            url: window.location.href
        };

        // Add share button click handler
        document.addEventListener('click', function(e) {
            if (e.target.matches('.share-btn')) {
                e.preventDefault();
                navigator.share(shareData).catch(console.error);
            }
        });
    }

    // Social sharing buttons
    setupSocialSharing();
}

function setupSocialSharing() {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(document.title);
    
    // Twitter share
    document.addEventListener('click', function(e) {
        if (e.target.matches('.twitter-share')) {
            e.preventDefault();
            const url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
            window.open(url, '_blank', 'width=600,height=400');
        }
    });

    // LinkedIn share
    document.addEventListener('click', function(e) {
        if (e.target.matches('.linkedin-share')) {
            e.preventDefault();
            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
            window.open(url, '_blank', 'width=600,height=400');
        }
    });

    // Facebook share
    document.addEventListener('click', function(e) {
        if (e.target.matches('.facebook-share')) {
            e.preventDefault();
            const url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
            window.open(url, '_blank', 'width=600,height=400');
        }
    });

    // Copy link
    document.addEventListener('click', function(e) {
        if (e.target.matches('.copy-link')) {
            e.preventDefault();
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Link copied to clipboard!');
            });
        }
    });
}

function downloadPDF() {
    console.log('Downloading PDF for:', config.entryKey);
    
    const formData = new FormData();
    formData.append('action', 'mkb_export_pdf');
    formData.append('nonce', config.nonce);
    formData.append('entry_key', config.entryKey);
    
    fetch(config.ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Export failed');
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `media-kit-${config.entryKey}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error('PDF download error:', error);
        showNotification('PDF download is not available yet. Feature coming soon!');
    });
}

function trackView() {
    // Track pageview for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
                'media_kit_id': config.entryKey
            }
        });
    }

    // Track view in database
    const formData = new FormData();
    formData.append('action', 'mkb_track_view');
    formData.append('nonce', config.nonce);
    formData.append('entry_key', config.entryKey);
    
    fetch(config.ajaxUrl, {
        method: 'POST',
        body: formData
    }).catch(() => {
        // Silently fail for analytics
    });
}

function showError(title, message) {
    const container = document.getElementById('media-kit-container');
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">❌</div>
            <h2 class="error-title">${escapeHtml(title)}</h2>
            <p class="error-message">${escapeHtml(message)}</p>
            <a href="${escapeHtml(window.location.origin)}/media-kit-builder/" class="preview-btn primary">
                Create Your Own Media Kit
            </a>
        </div>
    `;
}

function showNotification(message) {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #0ea5e9;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Print functionality
function setupPrintStyles() {
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Initialize print functionality
document.addEventListener('DOMContentLoaded', function() {
    setupPrintStyles();
});

// Expose API for external use
window.MediaKitPreviewAPI = {
    renderMediaKit,
    downloadPDF,
    showNotification,
    trackView
};

console.log('Media Kit Preview loaded for entry:', config.entryKey);
