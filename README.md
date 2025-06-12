# Media Kit Builder Plugin

## Overview
The Media Kit Builder is a WordPress plugin that allows users to create professional media kits using a modern drag-and-drop interface, with seamless guest-to-user conversion and integration with existing WP Fusion and Pods systems.

## Installation

1. Upload the `media-kit-builder` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Add the shortcode `[media_kit_builder]` to any page where you want the builder to appear

## Script Loading Order

The Media Kit Builder plugin has a specific script loading order that must be maintained:

1. `standalone-initializer.js` - Sets up the global namespace and initialization functions
2. `builder.js` - Core builder functionality
3. `builder-wordpress.js` - WordPress-specific adapter
4. Additional scripts (premium-access-control.js, section-templates.js, export.js)

This order is automatically managed by the plugin when you use the shortcode or access the plugin page in the admin.

## Troubleshooting

### Missing Containers
If you see "Required DOM elements not found" errors in the console, the plugin will attempt to create the necessary containers automatically. You can also ensure the following elements exist in your template:

```html
<div id="media-kit-builder" class="media-kit-builder">
    <div id="media-kit-preview" class="media-kit-preview"></div>
    <div id="component-palette" class="component-palette"></div>
</div>
```

### Initialization Issues
If you're experiencing initialization issues, check that:

1. The `standalone-initializer.js` script is loaded before any other Media Kit Builder scripts
2. jQuery is available on the page
3. The `mkbData` object is properly localized with WordPress data

### AJAX Connection Test Errors
If you see AJAX connection test errors, ensure that:

1. The `ajax-handlers.php` file is included in your plugin
2. The proper AJAX hooks are registered
3. The WordPress nonce is correctly passed to the AJAX calls

## Advanced Usage

### Custom Templates
You can create custom templates by extending the base template system:

1. Create a new template file in the `templates` directory
2. Register the template in the `Template_Manager` class
3. Use the `template` attribute in the shortcode to specify your template

### WP Fusion Integration
The plugin integrates with WP Fusion for access control:

- Guest users can access basic components
- Free users can save media kits
- Pro users can access premium components, templates, and PDF export
- Agency users can also access white-label features

### Shortcode Attributes
The `[media_kit_builder]` shortcode accepts the following attributes:

- `entry_key`: The unique key of an existing media kit to edit
- `formidable_key`: The Formidable Forms entry ID to associate with the media kit
- `post_id`: The post ID to associate with the media kit
- `template`: The template to use (default: 'default')

## Development

### Directory Structure
```
media-kit-builder/
├── assets/
│   ├── css/
│   ├── js/
│   │   ├── standalone-initializer.js
│   │   ├── builder.js
│   │   ├── builder-wordpress.js
│   │   ├── premium-access-control.js
│   │   ├── section-templates.js
│   │   ├── export.js
│   │   └── debug-helper.js
│   └── images/
├── templates/
│   └── builder.php
├── admin/
│   └── admin.php
├── ajax-handlers.php
└── media-kit-builder.php
```

### Adding New Components
To add a new component:

1. Add the component template to the `getComponentTemplate()` method in `builder.js`
2. Add the component to the palette in the `builder.php` template
3. Add component-specific styles to the `builder.css` file
4. Add component-specific functionality to the `builder.js` file

### Adding New Templates
To add a new template:

1. Create a new template file in the `templates` directory
2. Register the template in the `section-templates.js` file
3. Add the template to the template gallery

## Support
For additional support, please contact the plugin developer or refer to the detailed documentation.