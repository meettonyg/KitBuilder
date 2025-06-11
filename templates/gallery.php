<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? esc_html($page_title) : 'Template Gallery - Guestify'; ?></title>
    <?php wp_head(); ?>
</head>
<body class="<?php echo isset($body_class) ? esc_attr($body_class) : 'mkb-gallery-page'; ?>">

<div class="gallery-container">
    <div class="gallery-header">
        <h1>Choose Your Media Kit Template</h1>
        <p>Start with a professionally designed template or create from scratch</p>
        
        <?php if (isset($is_logged_in) && $is_logged_in): ?>
            <div class="user-info">
                👋 Welcome back, <?php echo esc_html(wp_get_current_user()->display_name); ?>
                <span style="margin-left: 10px; opacity: 0.7;">
                    <?php echo isset($access_tier) ? ucfirst($access_tier) : 'Free'; ?> Plan
                </span>
            </div>
        <?php else: ?>
            <div class="user-info">
                🎉 Guest Mode - No signup required to start building!
            </div>
        <?php endif; ?>
    </div>

    <div class="gallery-content">
        <div class="templates-grid" id="templates-grid">
            
            <!-- Start from Scratch -->
            <div class="template-card create-blank" onclick="window.location.href='<?php echo home_url('/media-kit-builder/new'); ?>'">
                <div class="create-blank-icon">✨</div>
                <h3 style="font-size: 24px; margin-bottom: 10px;">Start from Scratch</h3>
                <p style="opacity: 0.8; line-height: 1.5;">Create a completely custom media kit with our drag-and-drop builder</p>
            </div>

            <!-- Business Professional Template -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge free">Free</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/business-simple-preview.svg'; ?>" 
                         alt="Business Professional Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Business Professional</h3>
                    <p class="template-description">Clean, corporate design perfect for executives, consultants, and business speakers.</p>
                    <div class="template-features">
                        <span class="feature-tag">Executive Bio</span>
                        <span class="feature-tag">Speaking Topics</span>
                        <span class="feature-tag">Contact Info</span>
                        <span class="feature-tag">Social Links</span>
                    </div>
                    <div class="template-actions">
                        <a href="<?php echo home_url('/media-kit-builder/new?template=business'); ?>" class="btn btn-primary">Use This Template</a>
                        <a href="<?php echo home_url('/media-kit-builder/preview/business-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

            <!-- Creative Professional Template -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge free">Free</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/creative-basic-preview.svg'; ?>" 
                         alt="Creative Professional Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Creative Professional</h3>
                    <p class="template-description">Vibrant design for artists, designers, influencers, and creative professionals.</p>
                    <div class="template-features">
                        <span class="feature-tag">Portfolio Grid</span>
                        <span class="feature-tag">Creative Bio</span>
                        <span class="feature-tag">Project Showcase</span>
                        <span class="feature-tag">Social Media</span>
                    </div>
                    <div class="template-actions">
                        <a href="<?php echo home_url('/media-kit-builder/new?template=creative'); ?>" class="btn btn-primary">Use This Template</a>
                        <a href="<?php echo home_url('/media-kit-builder/preview/creative-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

            <!-- Health & Wellness Template -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge free">Free</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/health-wellness-preview.svg'; ?>" 
                         alt="Health & Wellness Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Health & Wellness</h3>
                    <p class="template-description">Calming, professional design for health experts, coaches, and wellness speakers.</p>
                    <div class="template-features">
                        <span class="feature-tag">Certifications</span>
                        <span class="feature-tag">Testimonials</span>
                        <span class="feature-tag">Programs</span>
                        <span class="feature-tag">Contact</span>
                    </div>
                    <div class="template-actions">
                        <a href="<?php echo home_url('/media-kit-builder/new?template=health'); ?>" class="btn btn-primary">Use This Template</a>
                        <a href="<?php echo home_url('/media-kit-builder/preview/health-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

            <!-- Technology Expert Template (Pro) -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge pro">Pro</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/tech-advanced-preview.svg'; ?>" 
                         alt="Technology Expert Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Technology Expert</h3>
                    <p class="template-description">Modern, tech-forward design with advanced components and interactive elements.</p>
                    <div class="template-features">
                        <span class="feature-tag">Video Intro</span>
                        <span class="feature-tag">Code Samples</span>
                        <span class="feature-tag">Project Gallery</span>
                        <span class="feature-tag">Analytics</span>
                    </div>
                    <div class="template-actions">
                        <?php if (isset($access_tier) && in_array($access_tier, ['pro', 'agency'])): ?>
                            <a href="<?php echo home_url('/media-kit-builder/new?template=tech'); ?>" class="btn btn-primary">Use This Template</a>
                        <?php else: ?>
                            <a href="#upgrade" class="btn btn-primary" onclick="showUpgradeModal()">Upgrade to Use</a>
                        <?php endif; ?>
                        <a href="<?php echo home_url('/media-kit-builder/preview/tech-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

            <!-- Author & Speaker Template (Pro) -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge pro">Pro</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/author-speaker-preview.svg'; ?>" 
                         alt="Author & Speaker Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Author & Speaker</h3>
                    <p class="template-description">Elegant design for authors, keynote speakers, and thought leaders.</p>
                    <div class="template-features">
                        <span class="feature-tag">Book Showcase</span>
                        <span class="feature-tag">Speaking Topics</span>
                        <span class="feature-tag">Media Coverage</span>
                        <span class="feature-tag">Booking Info</span>
                    </div>
                    <div class="template-actions">
                        <?php if (isset($access_tier) && in_array($access_tier, ['pro', 'agency'])): ?>
                            <a href="<?php echo home_url('/media-kit-builder/new?template=author'); ?>" class="btn btn-primary">Use This Template</a>
                        <?php else: ?>
                            <a href="#upgrade" class="btn btn-primary" onclick="showUpgradeModal()">Upgrade to Use</a>
                        <?php endif; ?>
                        <a href="<?php echo home_url('/media-kit-builder/preview/author-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

            <!-- Product Launch Template (Agency) -->
            <div class="template-card">
                <div class="template-preview">
                    <div class="tier-badge" style="background: linear-gradient(45deg, #8b5cf6 0%, #7c3aed 100%);">Agency</div>
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/templates/product-launch-preview.svg'; ?>" 
                         alt="Product Launch Template Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="template-info">
                    <h3 class="template-name">Product Launch</h3>
                    <p class="template-description">Premium template for product launches with white-label capabilities.</p>
                    <div class="template-features">
                        <span class="feature-tag">Product Showcase</span>
                        <span class="feature-tag">Team Bios</span>
                        <span class="feature-tag">Press Kit</span>
                        <span class="feature-tag">White Label</span>
                    </div>
                    <div class="template-actions">
                        <?php if (isset($access_tier) && $access_tier === 'agency'): ?>
                            <a href="<?php echo home_url('/media-kit-builder/new?template=product'); ?>" class="btn btn-primary">Use This Template</a>
                        <?php else: ?>
                            <a href="#upgrade" class="btn btn-primary" onclick="showUpgradeModal()">Upgrade to Use</a>
                        <?php endif; ?>
                        <a href="<?php echo home_url('/media-kit-builder/preview/product-demo'); ?>" class="btn btn-secondary">Preview</a>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <div class="footer-actions">
        <p>Need help choosing? <a href="#" style="color: #0ea5e9; text-decoration: none;">View our template guide</a> or <a href="#" style="color: #0ea5e9; text-decoration: none;">contact support</a></p>
        
        <?php if (!isset($is_logged_in) || !$is_logged_in): ?>
            <p style="margin-top: 15px;">
                <a href="/login" class="btn btn-secondary" style="margin-right: 10px;">Sign In</a>
                <a href="/register" class="btn btn-primary">Create Account</a>
            </p>
        <?php endif; ?>
    </div>
</div>

<script>
// Initialize gallery with WordPress data
window.MediaKitGallery = {
    ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
    nonce: '<?php echo wp_create_nonce('mkb_nonce'); ?>',
    userTier: '<?php echo isset($access_tier) ? esc_js($access_tier) : 'guest'; ?>',
    isLoggedIn: <?php echo isset($is_logged_in) && $is_logged_in ? 'true' : 'false'; ?>,
    userId: <?php echo isset($user_id) ? intval($user_id) : 0; ?>,
    sessionId: 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
    pluginUrl: '<?php echo plugin_dir_url(dirname(__FILE__)); ?>',
    templates: {
        'business': {
            name: 'Business Professional',
            description: 'Clean, corporate design perfect for executives, consultants, and business speakers.',
            features: ['Executive Bio', 'Speaking Topics', 'Contact Info', 'Social Links'],
            tier: 'free',
            category: 'business'
        },
        'creative': {
            name: 'Creative Professional',
            description: 'Vibrant design for artists, designers, influencers, and creative professionals.',
            features: ['Portfolio Grid', 'Creative Bio', 'Project Showcase', 'Social Media'],
            tier: 'free',
            category: 'creative'
        },
        'health': {
            name: 'Health & Wellness',
            description: 'Calming, professional design for health experts, coaches, and wellness speakers.',
            features: ['Certifications', 'Testimonials', 'Programs', 'Contact'],
            tier: 'free',
            category: 'health'
        },
        'tech': {
            name: 'Technology Expert',
            description: 'Modern, tech-forward design with advanced components and interactive elements.',
            features: ['Video Intro', 'Code Samples', 'Project Gallery', 'Analytics'],
            tier: 'pro',
            category: 'tech'
        },
        'author': {
            name: 'Author & Speaker',
            description: 'Elegant design for authors, keynote speakers, and thought leaders.',
            features: ['Book Showcase', 'Speaking Topics', 'Media Coverage', 'Booking Info'],
            tier: 'pro',
            category: 'creative'
        },
        'product': {
            name: 'Product Launch',
            description: 'Premium template for product launches with white-label capabilities.',
            features: ['Product Showcase', 'Team Bios', 'Press Kit', 'White Label'],
            tier: 'agency',
            category: 'business'
        }
    }
};

function showUpgradeModal() {
    alert('Upgrade to Pro or Agency to unlock premium templates with advanced features!');
    // This would open an actual upgrade modal in the real implementation
}

// Track template selections
document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return; // Don't track button clicks
        
        const templateName = this.querySelector('.template-name')?.textContent || 'Unknown';
        console.log('Template viewed:', templateName);
        
        // Send analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'template_view', {
                'template_name': templateName,
                'user_tier': '<?php echo isset($access_tier) ? $access_tier : "guest"; ?>'
            });
        }
    });
});
</script>

<?php wp_footer(); ?>
</body>
</html>