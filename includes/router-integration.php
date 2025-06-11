<?php
/**
 * Media Kit Builder - Router Integration
 * 
 * Integrates the v2 builder interface with the URL routing system
 */

add_action('mkb_route_media-kit-builder', 'mkb_handle_builder_routes');
add_action('mkb_route_media-kit', 'mkb_handle_media_kit_routes');

/**
 * Handle builder routes
 */
function mkb_handle_builder_routes() {
    $path = trim($_SERVER['REQUEST_URI'], '/');
    $parts = explode('/', $path);
    
    // Remove 'media-kit-builder' from parts
    array_shift($parts);
    
    $action = !empty($parts[0]) ? $parts[0] : 'gallery';
    $kit_id = !empty($parts[1]) ? $parts[1] : null;
    
    // Initialize builder interface
    if (class_exists('\MediaKitBuilder\Admin\BuilderInterface')) {
        $builder = new \MediaKitBuilder\Admin\BuilderInterface();
        
        switch($action) {
            case 'new':
                // Render new media kit builder
                $builder->render_builder_page();
                break;
                
            case 'edit':
                if ($kit_id) {
                    $_GET['kit_id'] = $kit_id;
                    $builder->render_builder_page();
                }
                break;
                
            case 'preview':
                if ($kit_id) {
                    mkb_render_preview($kit_id);
                }
                break;
                
            case 'gallery':
            default:
                mkb_render_gallery();
                break;
        }
    }
}

/**
 * Handle media kit public routes
 */
function mkb_handle_media_kit_routes() {
    $path = trim($_SERVER['REQUEST_URI'], '/');
    $parts = explode('/', $path);
    
    // Remove 'media-kit' from parts
    array_shift($parts);
    
    $action = !empty($parts[0]) ? $parts[0] : '';
    $hash = !empty($parts[1]) ? $parts[1] : null;
    
    switch($action) {
        case 'view':
            if ($hash) {
                mkb_render_public_view($hash);
            }
            break;
            
        case 'embed':
            if ($hash) {
                mkb_render_embed_view($hash);
            }
            break;
    }
}

/**
 * Render template gallery
 */
function mkb_render_gallery() {
    ?>
    <!DOCTYPE html>
    <html <?php language_attributes(); ?>>
    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php _e('Media Kit Templates', 'media-kit-builder'); ?> - <?php bloginfo('name'); ?></title>
        <?php wp_head(); ?>
        <style>
            body {
                background: #f0f0f1;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .mkb-gallery-header {
                background: #fff;
                padding: 40px 0;
                text-align: center;
                border-bottom: 1px solid #ddd;
            }
            .mkb-gallery-container {
                max-width: 1200px;
                margin: 40px auto;
                padding: 0 20px;
            }
            .mkb-templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 30px;
            }
            .mkb-template-card {
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: pointer;
            }
            .mkb-template-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .mkb-template-preview {
                aspect-ratio: 16/9;
                background: #f0f0f1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
            }
            .mkb-template-info {
                padding: 20px;
            }
            .mkb-template-name {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            .mkb-template-description {
                color: #666;
                font-size: 14px;
                line-height: 1.5;
            }
            .mkb-cta-section {
                text-align: center;
                margin: 60px 0;
            }
            .mkb-cta-button {
                display: inline-block;
                background: #0ea5e9;
                color: white;
                padding: 12px 30px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                transition: background 0.2s;
            }
            .mkb-cta-button:hover {
                background: #0284c7;
            }
        </style>
    </head>
    <body>
        <div class="mkb-gallery-header">
            <h1><?php _e('Choose a Media Kit Template', 'media-kit-builder'); ?></h1>
            <p><?php _e('Select a template to start building your professional media kit', 'media-kit-builder'); ?></p>
        </div>
        
        <div class="mkb-gallery-container">
            <div class="mkb-templates-grid">
                <div class="mkb-template-card" onclick="window.location.href='<?php echo home_url('/media-kit-builder/new?template=modern'); ?>'">
                    <div class="mkb-template-preview">
                        <span>Modern Professional</span>
                    </div>
                    <div class="mkb-template-info">
                        <h3 class="mkb-template-name"><?php _e('Modern Professional', 'media-kit-builder'); ?></h3>
                        <p class="mkb-template-description"><?php _e('Clean, minimalist design perfect for professionals', 'media-kit-builder'); ?></p>
                    </div>
                </div>
                
                <div class="mkb-template-card" onclick="window.location.href='<?php echo home_url('/media-kit-builder/new?template=speaker'); ?>'">
                    <div class="mkb-template-preview">
                        <span>Professional Speaker</span>
                    </div>
                    <div class="mkb-template-info">
                        <h3 class="mkb-template-name"><?php _e('Professional Speaker', 'media-kit-builder'); ?></h3>
                        <p class="mkb-template-description"><?php _e('Showcase your speaking topics and expertise', 'media-kit-builder'); ?></p>
                    </div>
                </div>
                
                <div class="mkb-template-card" onclick="window.location.href='<?php echo home_url('/media-kit-builder/new?template=blank'); ?>'">
                    <div class="mkb-template-preview">
                        <span>Blank Template</span>
                    </div>
                    <div class="mkb-template-info">
                        <h3 class="mkb-template-name"><?php _e('Start from Scratch', 'media-kit-builder'); ?></h3>
                        <p class="mkb-template-description"><?php _e('Build your media kit from a blank canvas', 'media-kit-builder'); ?></p>
                    </div>
                </div>
            </div>
            
            <div class="mkb-cta-section">
                <h2><?php _e('Ready to Create Your Media Kit?', 'media-kit-builder'); ?></h2>
                <p><?php _e('No registration required. Start building immediately!', 'media-kit-builder'); ?></p>
                <a href="<?php echo home_url('/media-kit-builder/new'); ?>" class="mkb-cta-button">
                    <?php _e('Start Building Now', 'media-kit-builder'); ?>
                </a>
            </div>
        </div>
        
        <?php wp_footer(); ?>
    </body>
    </html>
    <?php
    exit;
}

/**
 * Render preview
 */
function mkb_render_preview($kit_id) {
    // TODO: Implement preview rendering
    echo '<h1>Preview: ' . esc_html($kit_id) . '</h1>';
    exit;
}

/**
 * Render public view
 */
function mkb_render_public_view($hash) {
    // TODO: Implement public view rendering
    echo '<h1>Public View: ' . esc_html($hash) . '</h1>';
    exit;
}

/**
 * Render embed view
 */
function mkb_render_embed_view($hash) {
    // TODO: Implement embed view rendering
    echo '<h1>Embed View: ' . esc_html($hash) . '</h1>';
    exit;
}