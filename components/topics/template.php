<?php
/**
 * Topics Component Template
 *
 * Renders speaking topics in a grid layout.
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
$component_id = $component_id ?? 'topics_' . uniqid();
$component_settings = $component_settings ?? [];
$post_id = $post_id ?? get_the_ID();
$is_editor_mode = $is_editor_mode ?? false;

// Fetch Pods object for the current guest post if Pods plugin is active
$guest_pod = null;
if (function_exists('pods')) {
    $guest_pod = pods( 'guests', $post_id );
}

// --- Component Settings with Fallbacks ---
$section_title = $component_settings['section_title'] ?? __('Speaking Topics', 'guestify-mkb');
$content_source = $component_settings['content_source'] ?? 'pods_topics';
$max_topics = intval($component_settings['max_topics'] ?? 6);
$grid_columns = intval($component_settings['grid_columns'] ?? 3);
$topic_style = $component_settings['topic_style'] ?? 'cards';
$custom_topics_text = $component_settings['custom_topics'] ?? '';

// --- Gather Topics Data ---
$topics_array = [];

if ($content_source === 'custom_topics' && !empty($custom_topics_text)) {
    // Parse custom topics from textarea (one per line)
    $topics_array = array_filter(array_map('trim', explode("\n", $custom_topics_text)));
} elseif ($content_source === 'pods_topics' && $guest_pod && $guest_pod->exists()) {
    // Try to get topics from Pods - check for common field names
    $possible_topic_fields = [
        'topics', 'speaking_topics', 'topic_1', 'topic_2', 'topic_3', 'topic_4', 'topic_5'
    ];
    
    foreach ($possible_topic_fields as $field_name) {
        $field_value = $guest_pod->field($field_name);
        if (!empty($field_value)) {
            if (is_array($field_value)) {
                $topics_array = array_merge($topics_array, $field_value);
            } else {
                $topics_array[] = $field_value;
            }
        }
    }
    
    // Remove empty values and limit
    $topics_array = array_filter($topics_array);
}

// Fallback content for editor mode
if (empty($topics_array) && $is_editor_mode) {
    $topics_array = [
        __('Technology Innovation', 'guestify-mkb'),
        __('Digital Transformation', 'guestify-mkb'),
        __('Leadership Development', 'guestify-mkb'),
        __('Future of Work', 'guestify-mkb'),
        __('Entrepreneurship', 'guestify-mkb'),
        __('Industry Trends', 'guestify-mkb')
    ];
}

// Limit topics to max_topics setting
if (count($topics_array) > $max_topics) {
    $topics_array = array_slice($topics_array, 0, $max_topics);
}

// Container classes
$container_classes = [
    'mkb-topics-component-wrapper',
    'content-section',
    'topics-style-' . $topic_style,
    'topics-columns-' . $grid_columns
];

?>

<div class="<?php echo esc_attr(implode(' ', $container_classes)); ?>" 
     data-component-type="topics" 
     data-component-id="<?php echo esc_attr($component_id); ?>">
     
    <?php if (!empty($section_title)) : ?>
        <h2 class="mkb-component-title section-title-mk"
            <?php if ($is_editor_mode) echo 'contenteditable="true" data-setting="section_title"'; ?>>
            <?php echo esc_html($section_title); ?>
        </h2>
    <?php endif; ?>

    <div class="mkb-topics-grid topics-grid" 
         data-columns="<?php echo esc_attr($grid_columns); ?>">
        <?php if (!empty($topics_array)) : ?>
            <?php foreach ($topics_array as $index => $topic) : ?>
                <div class="mkb-topic-item topic-item"
                     data-topic-index="<?php echo esc_attr($index); ?>"
                     <?php if ($is_editor_mode && $content_source === 'custom_topics') : ?>
                         contenteditable="true" 
                         data-setting="topic_<?php echo esc_attr($index); ?>"
                     <?php endif; ?>>
                    <?php echo esc_html(trim($topic)); ?>
                </div>
            <?php endforeach; ?>
        <?php else : ?>
            <?php if ($is_editor_mode) : ?>
                <div class="mkb-topic-item topic-item mkb-placeholder">
                    <?php _e('Add your topics in the design panel or connect to your Pods data.', 'guestify-mkb'); ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>
        
        <?php if ($is_editor_mode && $content_source === 'custom_topics') : ?>
            <div class="mkb-add-topic-btn" 
                 onclick="window.GuestifyMKB?.Components?.Topics?.addTopic('<?php echo esc_js($component_id); ?>')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <?php _e('Add Topic', 'guestify-mkb'); ?>
            </div>
        <?php endif; ?>
    </div>
</div>