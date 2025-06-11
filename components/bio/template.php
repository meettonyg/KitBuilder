<?php
/**
 * Bio Component Template (New Architecture)
 *
 * Renders the biography block.
 * Based on guestify-media-kit-builder/templates/components/bio/bio.php
 *
 * Available variables (passed by the generic component rendering system):
 * @var string $component_id          Unique ID of this component instance.
 * @var array  $component_data        Data for this instance, including 'type' and 'settings'.
 * @var array  $component_settings    Specific settings for this instance.
 * @var int    $post_id               ID of the current Guest post.
 * @var bool   $is_editor_mode        True if accessed in editor mode.
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Ensure variables are available, with fallbacks if necessary
$component_id = $component_id ?? 'bio_' . uniqid();
$component_settings = $component_settings ?? [];
$post_id = $post_id ?? get_the_ID();
$is_editor_mode = $is_editor_mode ?? false;

global $post; // Access global $post object for post_content if needed
$guest_post_obj = get_post($post_id);

// Fetch Pods object for the current guest post if Pods plugin is active
$guest_pod = null;
if (function_exists('pods')) {
    $guest_pod = pods( 'guests', $post_id ); // Ensure 'guests' is your CPT slug
}

// --- Component Settings with Fallbacks ---
$section_title    = $component_settings['section_title'] ?? __('About Me', 'guestify-mkb');
$content_source   = $component_settings['content_source'] ?? 'pods_biography';
$custom_text_from_settings = $component_settings['custom_text_content'] ?? '';

// --- Determine Biography Content ---
$bio_content_to_display = '';

if ($content_source === 'custom_text') {
    $bio_content_to_display = $custom_text_from_settings;
} elseif ($content_source === 'post_content' && $guest_post_obj) {
    $bio_content_to_display = $guest_post_obj->post_content;
} elseif ($content_source === 'pods_biography' && $guest_pod && $guest_pod->exists()) {
    $bio_content_to_display = $guest_pod->field('biography');
}

if (empty($bio_content_to_display) && $is_editor_mode) {
    if ($content_source === 'custom_text') {
        $bio_content_to_display = __('Enter your custom biography text here. This content will be directly editable in the preview if this source is selected.', 'guestify-mkb');
    } elseif ($content_source === 'pods_biography') {
        $bio_content_to_display = __('The biography from your "Guest Profile (Pods)" will appear here. Edit directly in this preview to update it.', 'guestify-mkb');
    } else {
        $bio_content_to_display = __('Biography content will be displayed from the selected source (Post Content). Please ensure data exists in the chosen source.', 'guestify-mkb');
    }
}

$container_classes = "mkb-bio-component-wrapper content-section";

?>

<div class="<?php echo esc_attr($container_classes); ?>" data-component-type="bio" data-component-id="<?php echo esc_attr($component_id); ?>">
    <?php if ( ! empty( $section_title ) ) : ?>
        <h2 class="mkb-component-title section-title-mk"
            <?php if ($is_editor_mode) echo 'contenteditable="true" data-setting="section_title"'; ?>
            >
            <?php echo esc_html( $section_title ); ?>
        </h2>
    <?php endif; ?>

    <div class="mkb-bio-text"
         <?php
            if ($is_editor_mode) {
                if ($content_source === 'custom_text') {
                    echo 'contenteditable="true" data-setting="custom_text_content"';
                } elseif ($content_source === 'pods_biography') {
                    // Make Pods-sourced bio editable in preview, using a distinct data-setting
                    echo 'contenteditable="true" data-setting="pods_biography_live_edit"';
                }
                // Note: 'post_content' source is typically not made directly contenteditable here
                // as it's usually managed by the main WordPress editor.
            }
         ?>
         >
        <?php
        // Display logic:
        // If editor mode AND (custom_text OR pods_biography is selected), output raw for contenteditable.
        // Otherwise (public view OR post_content source), apply wpautop.
        if ($is_editor_mode && ($content_source === 'custom_text' || $content_source === 'pods_biography')) {
            echo wp_kses_post( $bio_content_to_display );
        } else {
            echo wp_kses_post( wpautop( $bio_content_to_display ) );
        }
        ?>
    </div>
</div>