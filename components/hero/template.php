<?php
/**
 * Hero Component Template
 *
 * Renders the hero section with profile image, name, title, and tagline.
 *
 * Available variables:
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
$component_id = $component_id ?? 'hero_' . uniqid();
$component_settings = $component_settings ?? [];
$post_id = $post_id ?? get_the_ID();
$is_editor_mode = $is_editor_mode ?? false;

// Fetch Pods object for the current guest post if Pods plugin is active
$guest_pod = null;
if (function_exists('pods')) {
    $guest_pod = pods( 'guests', $post_id );
}

// --- Component Settings with Fallbacks ---
$full_name = $component_settings['full_name'] ?? '';
$professional_title = $component_settings['professional_title'] ?? '';
$tagline = $component_settings['tagline'] ?? '';
$background_style = $component_settings['background_style'] ?? 'gradient';
$text_alignment = $component_settings['text_alignment'] ?? 'center';
$show_profile_image = $component_settings['show_profile_image'] ?? true;
$profile_image_style = $component_settings['profile_image_style'] ?? 'circle';

// Try to get data from Pods if settings are empty
if (empty($full_name) && $guest_pod && $guest_pod->exists()) {
    $full_name = $guest_pod->field('full_name') ?: $guest_pod->field('first_name') . ' ' . $guest_pod->field('last_name');
}

if (empty($professional_title) && $guest_pod && $guest_pod->exists()) {
    $professional_title = $guest_pod->field('title') ?: $guest_pod->field('professional_title');
}

if (empty($tagline) && $guest_pod && $guest_pod->exists()) {
    $tagline = $guest_pod->field('tagline') ?: $guest_pod->field('bio_short');
}

// Fallback content for editor mode
if ($is_editor_mode) {
    if (empty($full_name)) {
        $full_name = __('Your Full Name', 'guestify-mkb');
    }
    if (empty($professional_title)) {
        $professional_title = __('Your Professional Title', 'guestify-mkb');
    }
    if (empty($tagline)) {
        $tagline = __('A compelling tagline that describes what makes you unique and valuable as a speaker or expert.', 'guestify-mkb');
    }
}

// Get profile image
$profile_image_url = '';
if ($guest_pod && $guest_pod->exists()) {
    $headshot = $guest_pod->field('headshot');
    if (is_array($headshot) && isset($headshot['ID'])) {
        $profile_image_url = wp_get_attachment_image_url($headshot['ID'], 'medium');
    } elseif (is_numeric($headshot)) {
        $profile_image_url = wp_get_attachment_image_url($headshot, 'medium');
    }
}

// Container classes
$container_classes = [
    'mkb-hero-component-wrapper',
    'hero-section',
    'text-' . $text_alignment,
    'bg-' . $background_style
];

?>

<div class="<?php echo esc_attr(implode(' ', $container_classes)); ?>" 
     data-component-type="hero" 
     data-component-id="<?php echo esc_attr($component_id); ?>">
     
    <?php if ($show_profile_image) : ?>
        <div class="mkb-hero-avatar mkb-profile-image-<?php echo esc_attr($profile_image_style); ?>">
            <?php if (!empty($profile_image_url)) : ?>
                <img src="<?php echo esc_url($profile_image_url); ?>" 
                     alt="<?php echo esc_attr($full_name); ?>" 
                     class="mkb-profile-image">
            <?php else : ?>
                <div class="mkb-profile-placeholder">
                    <?php if ($is_editor_mode) : ?>
                        <span class="mkb-placeholder-text">Upload Profile Image</span>
                    <?php else : ?>
                        <?php echo esc_html(strtoupper(substr($full_name, 0, 2))); ?>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <h1 class="mkb-hero-name hero-name"
        <?php if ($is_editor_mode) echo 'contenteditable="true" data-setting="full_name"'; ?>>
        <?php echo esc_html($full_name); ?>
    </h1>

    <?php if (!empty($professional_title)) : ?>
        <div class="mkb-hero-title hero-title"
             <?php if ($is_editor_mode) echo 'contenteditable="true" data-setting="professional_title"'; ?>>
            <?php echo esc_html($professional_title); ?>
        </div>
    <?php endif; ?>

    <?php if (!empty($tagline)) : ?>
        <p class="mkb-hero-tagline hero-bio"
           <?php if ($is_editor_mode) echo 'contenteditable="true" data-setting="tagline"'; ?>>
            <?php echo wp_kses_post($tagline); ?>
        </p>
    <?php endif; ?>
</div>