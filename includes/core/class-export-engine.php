<?php
/**
 * Media Kit Builder - Export Engine System
 * 
 * Handles PDF generation and export functionality with tag-based features.
 * This is one of the 7 Core Systems following Direct Operations principle.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * MKB_Export_Engine Class
 * 
 * Core System #7: Export Engine System
 * Purpose: PDF generation with tag-based features
 */
class MKB_Export_Engine {
    
    /**
     * Instance
     * @var MKB_Export_Engine
     */
    private static $instance = null;
    
    /**
     * PDF library
     * @var string
     */
    private $pdf_library = 'dompdf'; // dompdf, tcpdf, mpdf
    
    /**
     * Export queue table
     * @var string
     */
    private $export_queue_table;
    
    /**
     * Supported export formats
     * @var array
     */
    private $supported_formats = array();
    
    /**
     * Export templates path
     * @var string
     */
    private $templates_path;
    
    /**
     * Get instance
     * 
     * @return MKB_Export_Engine
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        global $wpdb;
        $this->export_queue_table = $wpdb->prefix . 'mkb_export_queue';
        $this->templates_path = MKB_PLUGIN_DIR . 'pdf-templates/';
        
        $this->init_supported_formats();
        $this->init_hooks();
        $this->setup_pdf_library();
    }
    
    /**
     * Initialize supported formats
     */
    private function init_supported_formats() {
        $this->supported_formats = array(
            'pdf' => array(
                'name' => __('PDF Document', 'media-kit-builder'),
                'description' => __('Portable Document Format', 'media-kit-builder'),
                'extension' => 'pdf',
                'mime_type' => 'application/pdf',
                'premium' => false
            ),
            'pdf_watermarked' => array(
                'name' => __('PDF with Watermark', 'media-kit-builder'),
                'description' => __('PDF with Guestify watermark', 'media-kit-builder'),
                'extension' => 'pdf',
                'mime_type' => 'application/pdf',
                'premium' => false
            ),
            'png' => array(
                'name' => __('PNG Image', 'media-kit-builder'),
                'description' => __('High-resolution image', 'media-kit-builder'),
                'extension' => 'png',
                'mime_type' => 'image/png',
                'premium' => true
            ),
            'html' => array(
                'name' => __('HTML Page', 'media-kit-builder'),
                'description' => __('Shareable web page', 'media-kit-builder'),
                'extension' => 'html',
                'mime_type' => 'text/html',
                'premium' => true
            ),
            'svg' => array(
                'name' => __('SVG Vector', 'media-kit-builder'),
                'description' => __('Scalable vector graphics', 'media-kit-builder'),
                'extension' => 'svg',
                'mime_type' => 'image/svg+xml',
                'premium' => true
            )
        );
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // AJAX endpoints
        add_action('wp_ajax_mkb_export_media_kit', array($this, 'ajax_export_media_kit'));
        add_action('wp_ajax_nopriv_mkb_export_media_kit', array($this, 'ajax_export_media_kit'));
        
        add_action('wp_ajax_mkb_check_export_status', array($this, 'ajax_check_export_status'));
        add_action('wp_ajax_nopriv_mkb_check_export_status', array($this, 'ajax_check_export_status'));
        
        add_action('wp_ajax_mkb_download_export', array($this, 'ajax_download_export'));
        add_action('wp_ajax_nopriv_mkb_download_export', array($this, 'ajax_download_export'));
        
        // Background processing
        add_action('mkb_process_export_queue', array($this, 'process_export_queue'));
        
        // Cleanup
        add_action('mkb_daily_cleanup', array($this, 'cleanup_old_exports'));
        
        // Schedule queue processing
        if (!wp_next_scheduled('mkb_process_export_queue')) {
            wp_schedule_event(time(), 'every_minute', 'mkb_process_export_queue');
        }
    }
    
    /**
     * Setup PDF library
     */
    private function setup_pdf_library() {
        $library = get_option('mkb_pdf_library', $this->pdf_library);
        
        switch ($library) {
            case 'tcpdf':
                if (class_exists('TCPDF')) {
                    $this->pdf_library = 'tcpdf';
                }
                break;
                
            case 'mpdf':
                if (class_exists('Mpdf\\Mpdf')) {
                    $this->pdf_library = 'mpdf';
                }
                break;
                
            default:
                // Try to load DomPDF
                if (!class_exists('Dompdf\\Dompdf')) {
                    // Include DomPDF if available
                    $dompdf_path = ABSPATH . 'wp-content/plugins/dompdf/autoload.inc.php';
                    if (file_exists($dompdf_path)) {
                        require_once $dompdf_path;
                    }
                }
                
                if (class_exists('Dompdf\\Dompdf')) {
                    $this->pdf_library = 'dompdf';
                }
                break;
        }
    }
    
    /**
     * Export media kit
     * 
     * @param int|string $context_id
     * @param string $format
     * @param array $options
     * @return array|false
     */
    public function export_media_kit($context_id, $format = 'pdf', $options = array()) {
        if (empty($context_id)) {
            return false;
        }
        
        // Check if format is supported
        if (!isset($this->supported_formats[$format])) {
            return false;
        }
        
        // Check user access for premium formats
        if ($this->supported_formats[$format]['premium']) {
            $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
            if ($wpfusion_reader && !$wpfusion_reader->can_export_format($format)) {
                return array('error' => __('Premium format requires upgrade', 'media-kit-builder'));
            }
        }
        
        // Load builder state
        $builder_state = media_kit_builder()->get_system('state');
        $state_data = $builder_state->load_state($context_id);
        
        if (!$state_data) {
            return array('error' => __('No data found to export', 'media-kit-builder'));
        }
        
        // Prepare export options
        $defaults = array(
            'template' => 'default',
            'page_size' => 'letter', // letter, a4
            'orientation' => 'portrait',
            'margins' => array('top' => 20, 'right' => 20, 'bottom' => 20, 'left' => 20),
            'watermark' => $this->should_add_watermark($format),
            'white_label' => $this->should_use_white_label(),
            'background_processing' => true,
            'filename' => $this->generate_filename($context_id, $format)
        );
        
        $options = wp_parse_args($options, $defaults);
        
        // For large exports or complex formats, use background processing
        if ($options['background_processing']) {
            return $this->queue_export($context_id, $format, $state_data, $options);
        } else {
            return $this->process_export_immediately($context_id, $format, $state_data, $options);
        }
    }
    
    /**
     * Process export immediately
     * 
     * @param int|string $context_id
     * @param string $format
     * @param array $state_data
     * @param array $options
     * @return array|false
     */
    private function process_export_immediately($context_id, $format, $state_data, $options) {
        try {
            // Generate export based on format
            switch ($format) {
                case 'pdf':
                case 'pdf_watermarked':
                    $result = $this->generate_pdf($state_data, $options);
                    break;
                    
                case 'png':
                    $result = $this->generate_png($state_data, $options);
                    break;
                    
                case 'html':
                    $result = $this->generate_html($state_data, $options);
                    break;
                    
                case 'svg':
                    $result = $this->generate_svg($state_data, $options);
                    break;
                    
                default:
                    return array('error' => __('Unsupported export format', 'media-kit-builder'));
            }
            
            if ($result && isset($result['file_path'])) {
                // Store export record
                $export_id = $this->store_export_record($context_id, $format, $result, $options);
                
                return array(
                    'success' => true,
                    'export_id' => $export_id,
                    'download_url' => $this->get_download_url($export_id),
                    'file_size' => filesize($result['file_path']),
                    'format' => $format,
                    'filename' => $options['filename']
                );
            }
            
            return array('error' => __('Export generation failed', 'media-kit-builder'));
            
        } catch (Exception $e) {
            error_log('MKB Export Error: ' . $e->getMessage());
            return array('error' => __('Export processing error', 'media-kit-builder'));
        }
    }
    
    /**
     * Queue export for background processing
     * 
     * @param int|string $context_id
     * @param string $format
     * @param array $state_data
     * @param array $options
     * @return array
     */
    private function queue_export($context_id, $format, $state_data, $options) {
        global $wpdb;
        
        $queue_id = wp_generate_uuid4();
        
        $result = $wpdb->insert(
            $this->export_queue_table,
            array(
                'queue_id' => $queue_id,
                'context_id' => $context_id,
                'format' => $format,
                'state_data' => json_encode($state_data),
                'options' => json_encode($options),
                'status' => 'queued',
                'user_id' => get_current_user_id(),
                'session_id' => $this->get_session_id(),
                'created_at' => current_time('mysql'),
                'priority' => $this->get_export_priority($format)
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%d')
        );
        
        if ($result) {
            return array(
                'success' => true,
                'queued' => true,
                'queue_id' => $queue_id,
                'estimated_time' => $this->estimate_processing_time($format),
                'status_url' => admin_url('admin-ajax.php?action=mkb_check_export_status&queue_id=' . $queue_id)
            );
        }
        
        return array('error' => __('Failed to queue export', 'media-kit-builder'));
    }
    
    /**
     * Generate PDF
     * 
     * @param array $state_data
     * @param array $options
     * @return array|false
     */
    private function generate_pdf($state_data, $options) {
        // Generate HTML content
        $html_content = $this->generate_html_content($state_data, $options);
        
        if (!$html_content) {
            return false;
        }
        
        // Add watermark if needed
        if ($options['watermark']) {
            $html_content = $this->add_watermark_to_html($html_content);
        }
        
        // Generate PDF based on available library
        switch ($this->pdf_library) {
            case 'dompdf':
                return $this->generate_pdf_with_dompdf($html_content, $options);
                
            case 'tcpdf':
                return $this->generate_pdf_with_tcpdf($html_content, $options);
                
            case 'mpdf':
                return $this->generate_pdf_with_mpdf($html_content, $options);
                
            default:
                // Fallback to simple HTML to PDF conversion
                return $this->generate_pdf_fallback($html_content, $options);
        }
    }
    
    /**
     * Generate PDF with DomPDF
     * 
     * @param string $html_content
     * @param array $options
     * @return array|false
     */
    private function generate_pdf_with_dompdf($html_content, $options) {
        if (!class_exists('Dompdf\\Dompdf')) {
            return false;
        }
        
        try {
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($html_content);
            
            // Set paper size and orientation
            $paper_size = $options['page_size'] === 'a4' ? 'A4' : 'letter';
            $dompdf->setPaper($paper_size, $options['orientation']);
            
            // Render PDF
            $dompdf->render();
            
            // Save to file
            $upload_dir = wp_upload_dir();
            $export_dir = $upload_dir['basedir'] . '/mkb-exports/';
            
            if (!file_exists($export_dir)) {
                wp_mkdir_p($export_dir);
            }
            
            $filename = $options['filename'];
            $file_path = $export_dir . $filename;
            
            file_put_contents($file_path, $dompdf->output());
            
            return array(
                'file_path' => $file_path,
                'file_url' => $upload_dir['baseurl'] . '/mkb-exports/' . $filename,
                'file_size' => filesize($file_path)
            );
            
        } catch (Exception $e) {
            error_log('DomPDF Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate HTML content for export
     * 
     * @param array $state_data
     * @param array $options
     * @return string|false
     */
    private function generate_html_content($state_data, $options) {
        if (empty($state_data['components'])) {
            return false;
        }
        
        // Load template
        $template_path = $this->get_template_path($options['template']);
        
        if (!file_exists($template_path)) {
            $template_path = $this->get_template_path('default');
        }
        
        if (!file_exists($template_path)) {
            return false;
        }
        
        // Start output buffering
        ob_start();
        
        // Set up template variables
        $components_html = '';
        $component_registry = media_kit_builder()->get_system('components');
        
        foreach ($state_data['components'] as $component) {
            $component_html = $component_registry->render_component(
                $component['type'],
                $component['data'] ?? array(),
                array('export_mode' => true)
            );
            
            if ($component_html) {
                $components_html .= $component_html;
            }
        }
        
        // Extract template variables
        $template_vars = array(
            'components_html' => $components_html,
            'state_data' => $state_data,
            'options' => $options,
            'styles' => $this->get_export_styles($options),
            'title' => $this->get_export_title($state_data)
        );
        
        extract($template_vars);
        
        // Include template
        include $template_path;
        
        return ob_get_clean();
    }
    
    /**
     * Generate PNG image
     * 
     * @param array $state_data
     * @param array $options
     * @return array|false
     */
    private function generate_png($state_data, $options) {
        // This would require a library like wkhtmltopdf or puppeteer
        // For now, return a placeholder implementation
        
        $html_content = $this->generate_html_content($state_data, $options);
        
        if (!$html_content) {
            return false;
        }
        
        // Use a service or library to convert HTML to PNG
        // This is a placeholder - implement with actual image generation library
        
        return array(
            'file_path' => '',
            'file_url' => '',
            'file_size' => 0
        );
    }
    
    /**
     * Generate HTML export
     * 
     * @param array $state_data
     * @param array $options
     * @return array|false
     */
    private function generate_html($state_data, $options) {
        $html_content = $this->generate_html_content($state_data, $options);
        
        if (!$html_content) {
            return false;
        }
        
        // Save HTML file
        $upload_dir = wp_upload_dir();
        $export_dir = $upload_dir['basedir'] . '/mkb-exports/';
        
        if (!file_exists($export_dir)) {
            wp_mkdir_p($export_dir);
        }
        
        $filename = str_replace('.pdf', '.html', $options['filename']);
        $file_path = $export_dir . $filename;
        
        file_put_contents($file_path, $html_content);
        
        return array(
            'file_path' => $file_path,
            'file_url' => $upload_dir['baseurl'] . '/mkb-exports/' . $filename,
            'file_size' => filesize($file_path)
        );
    }
    
    /**
     * AJAX: Export media kit
     */
    public function ajax_export_media_kit() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $context_id = sanitize_text_field($_POST['context_id'] ?? '');
        $format = sanitize_text_field($_POST['format'] ?? 'pdf');
        $options = $_POST['options'] ?? array();
        
        if (empty($context_id)) {
            wp_send_json_error('Context ID required');
            return;
        }
        
        $result = $this->export_media_kit($context_id, $format, $options);
        
        if ($result && !isset($result['error'])) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result['error'] ?? 'Export failed');
        }
    }
    
    /**
     * AJAX: Check export status
     */
    public function ajax_check_export_status() {
        check_ajax_referer('mkb_nonce', 'nonce');
        
        $queue_id = sanitize_text_field($_POST['queue_id'] ?? '');
        
        if (empty($queue_id)) {
            wp_send_json_error('Queue ID required');
            return;
        }
        
        $status = $this->get_export_status($queue_id);
        
        wp_send_json_success($status);
    }
    
    /**
     * AJAX: Download export
     */
    public function ajax_download_export() {
        $export_id = sanitize_text_field($_GET['export_id'] ?? '');
        $nonce = sanitize_text_field($_GET['nonce'] ?? '');
        
        if (!wp_verify_nonce($nonce, 'mkb_download_' . $export_id)) {
            wp_die(__('Invalid download link', 'media-kit-builder'));
        }
        
        $this->serve_export_file($export_id);
    }
    
    /**
     * Process export queue
     */
    public function process_export_queue() {
        global $wpdb;
        
        // Get next queued export
        $export = $wpdb->get_row(
            "SELECT * FROM {$this->export_queue_table} 
             WHERE status = 'queued' 
             ORDER BY priority DESC, created_at ASC 
             LIMIT 1",
            ARRAY_A
        );
        
        if (!$export) {
            return; // No exports to process
        }
        
        // Mark as processing
        $wpdb->update(
            $this->export_queue_table,
            array(
                'status' => 'processing',
                'started_at' => current_time('mysql')
            ),
            array('id' => $export['id']),
            array('%s', '%s'),
            array('%d')
        );
        
        // Process the export
        $state_data = json_decode($export['state_data'], true);
        $options = json_decode($export['options'], true);
        
        $result = $this->process_export_immediately(
            $export['context_id'],
            $export['format'],
            $state_data,
            $options
        );
        
        // Update status
        if ($result && !isset($result['error'])) {
            $wpdb->update(
                $this->export_queue_table,
                array(
                    'status' => 'completed',
                    'completed_at' => current_time('mysql'),
                    'export_id' => $result['export_id'],
                    'file_size' => $result['file_size']
                ),
                array('id' => $export['id']),
                array('%s', '%s', '%s', '%d'),
                array('%d')
            );
            
            // Send notification if user has email
            $this->send_export_notification($export, $result);
            
        } else {
            $wpdb->update(
                $this->export_queue_table,
                array(
                    'status' => 'failed',
                    'error_message' => $result['error'] ?? 'Unknown error',
                    'completed_at' => current_time('mysql')
                ),
                array('id' => $export['id']),
                array('%s', '%s', '%s'),
                array('%d')
            );
        }
    }
    
    /**
     * Get supported formats
     * 
     * @param bool $user_access_check
     * @return array
     */
    public function get_supported_formats($user_access_check = true) {
        $formats = $this->supported_formats;
        
        if ($user_access_check) {
            $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
            
            foreach ($formats as $key => $format) {
                if ($format['premium'] && $wpfusion_reader) {
                    $formats[$key]['can_access'] = $wpfusion_reader->can_export_format($key);
                } else {
                    $formats[$key]['can_access'] = true;
                }
            }
        }
        
        return $formats;
    }
    
    /**
     * Check if watermark should be added
     * 
     * @param string $format
     * @return bool
     */
    private function should_add_watermark($format) {
        // Add watermark for free users or when specifically requested
        if ($format === 'pdf_watermarked') {
            return true;
        }
        
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        if ($wpfusion_reader) {
            $access_level = $wpfusion_reader->get_user_access_level();
            return in_array($access_level, array('guest', 'free_user'));
        }
        
        return true; // Default to watermark
    }
    
    /**
     * Check if white label should be used
     * 
     * @return bool
     */
    private function should_use_white_label() {
        $wpfusion_reader = media_kit_builder()->get_system('wpfusion');
        
        if ($wpfusion_reader) {
            return $wpfusion_reader->can_access_feature('white_label');
        }
        
        return false;
    }
    
    /**
     * Generate filename
     * 
     * @param int|string $context_id
     * @param string $format
     * @return string
     */
    private function generate_filename($context_id, $format) {
        $extension = $this->supported_formats[$format]['extension'] ?? 'pdf';
        $timestamp = date('Y-m-d_H-i-s');
        
        return "media-kit-{$context_id}-{$timestamp}.{$extension}";
    }
    
    /**
     * Get template path
     * 
     * @param string $template
     * @return string
     */
    private function get_template_path($template) {
        return $this->templates_path . $template . '.php';
    }
    
    /**
     * Additional helper methods would be implemented here...
     * These include:
     * - store_export_record()
     * - get_download_url()
     * - serve_export_file()
     * - get_export_status()
     * - cleanup_old_exports()
     * - send_export_notification()
     * - get_export_styles()
     * - get_export_title()
     * - add_watermark_to_html()
     * - estimate_processing_time()
     * - get_export_priority()
     * - get_session_id()
     */
    
    private function store_export_record($context_id, $format, $result, $options) {
        // Store export record in database
        global $wpdb;
        
        $export_id = wp_generate_uuid4();
        
        $wpdb->insert(
            $wpdb->prefix . 'mkb_exports',
            array(
                'export_id' => $export_id,
                'context_id' => $context_id,
                'format' => $format,
                'file_path' => $result['file_path'],
                'file_size' => $result['file_size'],
                'options' => json_encode($options),
                'user_id' => get_current_user_id(),
                'created_at' => current_time('mysql'),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days'))
            )
        );
        
        return $export_id;
    }
    
    private function get_download_url($export_id) {
        return admin_url('admin-ajax.php') . '?action=mkb_download_export&export_id=' . $export_id . '&nonce=' . wp_create_nonce('mkb_download_' . $export_id);
    }
    
    private function get_session_id() {
        $session_manager = media_kit_builder()->get_system('session');
        return $session_manager ? $session_manager->get_guest_session_id() : '';
    }
    
    private function get_export_priority($format) {
        $priorities = array(
            'pdf' => 10,
            'pdf_watermarked' => 10,
            'html' => 5,
            'png' => 3,
            'svg' => 1
        );
        
        return $priorities[$format] ?? 5;
    }
    
    private function estimate_processing_time($format) {
        $times = array(
            'pdf' => 30, // seconds
            'pdf_watermarked' => 30,
            'html' => 10,
            'png' => 60,
            'svg' => 20
        );
        
        return $times[$format] ?? 30;
    }
    
    public function cleanup_old_exports() {
        global $wpdb;
        
        // Delete expired exports
        $wpdb->query(
            "DELETE FROM {$wpdb->prefix}mkb_exports WHERE expires_at < NOW()"
        );
        
        // Delete old queue entries
        $wpdb->query(
            "DELETE FROM {$this->export_queue_table} WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );
    }
}
