/**
 * Block Editor Integration for Media Kit Builder
 * Provides Gutenberg block for embedding media kits
 * 
 * @package MediaKitBuilder
 * @since 1.0.0
 */

(function(wp) {
    'use strict';

    const { registerBlockType } = wp.blocks;
    const { createElement: el, Fragment } = wp.element;
    const { InspectorControls } = wp.blockEditor;
    const { PanelBody, SelectControl, ToggleControl, Button } = wp.components;
    const { __ } = wp.i18n;

    // Register Media Kit Block
    registerBlockType('mkb/media-kit', {
        title: __('Media Kit', 'media-kit-builder'),
        description: __('Display a media kit created with Media Kit Builder', 'media-kit-builder'),
        icon: 'id-alt',
        category: 'embed',
        keywords: [
            __('media kit', 'media-kit-builder'),
            __('speaker', 'media-kit-builder'),
            __('press kit', 'media-kit-builder')
        ],
        
        attributes: {
            kitId: {
                type: 'string',
                default: ''
            },
            showHeader: {
                type: 'boolean',
                default: true
            },
            showSocial: {
                type: 'boolean',
                default: true
            },
            compactMode: {
                type: 'boolean',
                default: false
            },
            alignment: {
                type: 'string',
                default: 'center'
            }
        },

        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { kitId, showHeader, showSocial, compactMode, alignment } = attributes;

            // Get available media kits
            const mediaKits = window.mkbBlockData ? window.mkbBlockData.mediaKits : [];

            return el(Fragment, {},
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Media Kit Settings', 'media-kit-builder'),
                        initialOpen: true
                    },
                        el(SelectControl, {
                            label: __('Select Media Kit', 'media-kit-builder'),
                            value: kitId,
                            options: [
                                { label: __('Choose a media kit...', 'media-kit-builder'), value: '' },
                                ...mediaKits.map(kit => ({
                                    label: kit.title,
                                    value: kit.id
                                }))
                            ],
                            onChange: (value) => setAttributes({ kitId: value })
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Header', 'media-kit-builder'),
                            checked: showHeader,
                            onChange: (value) => setAttributes({ showHeader: value })
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Social Links', 'media-kit-builder'),
                            checked: showSocial,
                            onChange: (value) => setAttributes({ showSocial: value })
                        }),
                        
                        el(ToggleControl, {
                            label: __('Compact Mode', 'media-kit-builder'),
                            checked: compactMode,
                            onChange: (value) => setAttributes({ compactMode: value })
                        }),
                        
                        el(SelectControl, {
                            label: __('Alignment', 'media-kit-builder'),
                            value: alignment,
                            options: [
                                { label: __('Left', 'media-kit-builder'), value: 'left' },
                                { label: __('Center', 'media-kit-builder'), value: 'center' },
                                { label: __('Right', 'media-kit-builder'), value: 'right' }
                            ],
                            onChange: (value) => setAttributes({ alignment: value })
                        })
                    )
                ),
                
                el('div', {
                    className: 'mkb-block-preview',
                    style: {
                        border: '2px dashed #ccc',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9'
                    }
                },
                    kitId ? 
                        el('div', {},
                            el('h3', {}, __('Media Kit Preview', 'media-kit-builder')),
                            el('p', {}, __('Media Kit ID:', 'media-kit-builder') + ' ' + kitId),
                            el('div', {
                                style: {
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    marginTop: '10px'
                                }
                            },
                                el(Button, {
                                    isPrimary: true,
                                    href: `${window.mkbBlockData.adminUrl}admin.php?page=media-kit-builder&kit_id=${kitId}`,
                                    target: '_blank'
                                }, __('Edit Media Kit', 'media-kit-builder')),
                                
                                el(Button, {
                                    isSecondary: true,
                                    onClick: () => {
                                        // Preview functionality
                                        window.open(`${window.mkbBlockData.previewUrl}${kitId}`, '_blank');
                                    }
                                }, __('Preview', 'media-kit-builder'))
                            )
                        ) :
                        el('div', {},
                            el('h3', {}, __('Media Kit Block', 'media-kit-builder')),
                            el('p', {}, __('Select a media kit from the settings panel to display it here.', 'media-kit-builder')),
                            el(Button, {
                                isPrimary: true,
                                href: `${window.mkbBlockData.adminUrl}admin.php?page=media-kit-builder`,
                                target: '_blank'
                            }, __('Create New Media Kit', 'media-kit-builder'))
                        )
                )
            );
        },

        save: function(props) {
            const { attributes } = props;
            const { kitId, showHeader, showSocial, compactMode, alignment } = attributes;

            if (!kitId) {
                return null;
            }

            return el('div', {
                className: 'mkb-block-container',
                'data-kit-id': kitId,
                'data-show-header': showHeader,
                'data-show-social': showSocial,
                'data-compact-mode': compactMode,
                'data-alignment': alignment
            }, `[media_kit_builder id="${kitId}" show_header="${showHeader}" show_social="${showSocial}" compact="${compactMode}" align="${alignment}"]`);
        }
    });

    console.log('📦 Media Kit Builder block registered');

})(window.wp);

// Initialize block data
document.addEventListener('DOMContentLoaded', function() {
    // Ensure block data is available
    if (!window.mkbBlockData) {
        window.mkbBlockData = {
            mediaKits: [],
            adminUrl: '/wp-admin/',
            previewUrl: '/media-kit-preview/?id='
        };
    }
});
