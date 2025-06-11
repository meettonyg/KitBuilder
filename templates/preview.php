<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? esc_html($page_title) : 'Media Kit Preview - Guestify'; ?></title>
    <?php wp_head(); ?>
</head>
<body class="<?php echo isset($body_class) ? esc_attr($body_class) : 'mkb-preview-page'; ?>">

<div class="preview-header">
    <div class="preview-header-content">
        <div class="preview-logo">Guestify</div>
        <div class="preview-actions">
            <a href="#" class="preview-btn secondary" id="download-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download PDF
            </a>
            <a href="<?php echo home_url('/media-kit-builder/'); ?>" class="preview-btn primary">
                Create Your Own
            </a>
        </div>
    </div>
</div>

<div class="media-kit-container" id="media-kit-container">
    <div class="loading-container" id="loading-container">
        <div class="loading-spinner"></div>
        <div>Loading media kit...</div>
    </div>
</div>

<div class="preview-footer">
    <div class="footer-content">
        <div class="footer-text">
            Professional media kits made easy with 
            <span class="footer-logo">Guestify</span>
        </div>
        <div style="opacity: 0.6; font-size: 14px;">
            Create your own media kit in minutes - no design skills required
        </div>
    </div>
</div>

<script>
// Initialize preview with WordPress configuration
window.MediaKitPreview = {
    config: {
        entryKey: '<?php echo isset($entry_key) ? esc_js($entry_key) : ""; ?>',
        entryId: <?php echo isset($entry_id) ? intval($entry_id) : 0; ?>,
        ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
        nonce: '<?php echo wp_create_nonce('mkb_nonce'); ?>',
        pluginUrl: '<?php echo plugin_dir_url(dirname(__FILE__)); ?>',
        isPreview: true
    },
    
    // Field mappings for data display
    fieldMappings: {
        // Hero Section
        'hero_full_name': 8517,
        'hero_first_name': 8029,
        'hero_last_name': 8176,
        'hero_title': 10388,
        'hero_organization': 8032,
        'hero_tagline': 8489,
        
        // Biography
        'bio_text': 8045,
        'bio_ai_generated': 10077,
        
        // Topics (5 individual fields)
        'topic_1': 8498,
        'topic_2': 8499,
        'topic_3': 8500,
        'topic_4': 8501,
        'topic_5': 8502,
        
        // Social Media
        'social_facebook': 8035,
        'social_twitter': 8036,
        'social_instagram': 8037,
        'social_linkedin': 8038,
        'social_youtube': 8381,
        'social_pinterest': 8382,
        'social_tiktok': 8383,
        
        // Media
        'headshot_primary': 8046,
        'logo_main': 8047,
        'carousel_images': 10423
    },
    
    // Initialize function
    init: function() {
        console.log('Media Kit Preview v2.0 - WordPress Integration');
        console.log('Configuration:', this.config);
        
        // The main preview JavaScript will take over from here
        // This just provides the WordPress integration layer
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.MediaKitPreview.init();
});
</script>

<?php wp_footer(); ?>
</body>
</html>