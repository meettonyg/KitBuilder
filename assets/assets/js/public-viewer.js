/**
 * Public Viewer for Media Kit Builder
 * Handles displaying media kits on the frontend
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function($) {
    'use strict';

    // Public Viewer
    window.MKB_PublicViewer = {
        
        /**
         * Initialize public viewer
         */
        init: function() {
            this.setupViewerEnhancements();
            this.bindEvents();
            console.log('👁️ Public viewer loaded');
        },

        /**
         * Setup viewer enhancements
         */
        setupViewerEnhancements: function() {
            // Add smooth scrolling
            this.addSmoothScrolling();
            
            // Add image lazy loading
            this.addLazyLoading();
            
            // Add social sharing
            this.addSocialSharing();
            
            // Add print optimization
            this.addPrintOptimization();
        },

        /**
         * Bind public viewer events
         */
        bindEvents: function() {
            $(document).on('click', '.mkb-social-share', this.handleSocialShare.bind(this));
            $(document).on('click', '.mkb-print-kit', this.handlePrint.bind(this));
            $(document).on('click', '.mkb-download-pdf', this.handlePDFDownload.bind(this));
        },

        /**
         * Add smooth scrolling to anchor links
         */
        addSmoothScrolling: function() {
            $(document).on('click', 'a[href^="#"]', function(e) {
                e.preventDefault();
                const target = $(this.getAttribute('href'));
                
                if (target.length) {
                    $('html, body').animate({
                        scrollTop: target.offset().top - 50
                    }, 600);
                }
            });
        },

        /**
         * Add lazy loading for images
         */
        addLazyLoading: function() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('mkb-lazy');
                            imageObserver.unobserve(img);
                        }
                    });
                });

                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }
        },

        /**
         * Add social sharing functionality
         */
        addSocialSharing: function() {
            const shareData = {
                title: document.title,
                url: window.location.href,
                text: 'Check out this media kit created with Guestify'
            };

            // Add Web Share API support
            if (navigator.share) {
                $('.mkb-share-native').show().on('click', function(e) {
                    e.preventDefault();
                    navigator.share(shareData);
                });
            }
        },

        /**
         * Add print optimization
         */
        addPrintOptimization: function() {
            // Add print-specific styles
            const printStyles = `
                <style media="print">
                    .mkb-no-print { display: none !important; }
                    .mkb-media-kit { box-shadow: none !important; }
                    .mkb-section { page-break-inside: avoid; }
                    .mkb-hero { page-break-after: avoid; }
                </style>
            `;
            $('head').append(printStyles);
        },

        /**
         * Handle social share click
         */
        handleSocialShare: function(e) {
            e.preventDefault();
            const $btn = $(e.currentTarget);
            const platform = $btn.data('platform');
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            let shareUrl = '';
            
            switch (platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${title}&body=Check out this media kit: ${url}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        },

        /**
         * Handle print button click
         */
        handlePrint: function(e) {
            e.preventDefault();
            window.print();
        },

        /**
         * Handle PDF download
         */
        handlePDFDownload: function(e) {
            e.preventDefault();
            const kitId = $(e.currentTarget).data('kit-id');
            
            if (window.mkbConfig && window.mkbConfig.ajaxUrl) {
                // Show loading
                $(e.currentTarget).addClass('mkb-loading').text('Generating PDF...');
                
                // Request PDF generation
                $.ajax({
                    url: window.mkbConfig.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mkb_generate_pdf',
                        kit_id: kitId,
                        nonce: window.mkbConfig.nonce
                    },
                    success: function(response) {
                        if (response.success && response.data.download_url) {
                            // Create temporary download link
                            const link = document.createElement('a');
                            link.href = response.data.download_url;
                            link.download = response.data.filename || 'media-kit.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } else {
                            alert('Failed to generate PDF. Please try again.');
                        }
                    },
                    error: function() {
                        alert('Error generating PDF. Please try again.');
                    },
                    complete: function() {
                        $(e.currentTarget).removeClass('mkb-loading').text('Download PDF');
                    }
                });
            }
        },

        /**
         * Add viewer analytics
         */
        trackView: function(kitId) {
            if (window.mkbConfig && window.mkbConfig.ajaxUrl) {
                $.post(window.mkbConfig.ajaxUrl, {
                    action: 'mkb_track_view',
                    kit_id: kitId,
                    nonce: window.mkbConfig.nonce,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent
                });
            }
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        window.MKB_PublicViewer.init();
        
        // Track view if kit ID is available
        const kitId = $('body').data('kit-id') || $('.mkb-media-kit').data('kit-id');
        if (kitId) {
            window.MKB_PublicViewer.trackView(kitId);
        }
    });

})(jQuery);
