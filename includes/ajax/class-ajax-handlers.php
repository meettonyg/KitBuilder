<?php
/**
 * Media Kit Builder AJAX Handlers
 * 
 * Handles AJAX requests for the Media Kit Builder
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * AJAX Handlers class
 */
class MKB_AJAX_Handlers {
    /**
     * Instance of this class
     */
    private static $instance;
    
    /**
     * Get instance of this class
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
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Save media kit
        add_action('wp_ajax_mkb_save_media_kit', array($this, 'save_media_kit'));
        add_action('wp_ajax_nopriv_mkb_save_media_kit', array($this, 'save_media_kit_guest'));
        
        // Load media kit
        add_action('wp_ajax_mkb_load_media_kit', array($this, 'load_media_kit'));
        add_action('wp_ajax_nopriv_mkb_load_media_kit', array($this, 'load_media_kit_guest'));
        
        // Export media kit to PDF
        add_action('wp_ajax_mkb_export_pdf', array($this, 'export_pdf'));
        
        // Delete media kit
        add_action('wp_ajax_mkb_delete_media_kit', array($this, 'delete_media_kit'));
    }
    
    /**
     * Save media kit (logged in users)
     */
    public function save_media_kit() {
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Check user capability
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('message' => 'You do not have permission to save media kits.'));
        }
        
        // Get data
        $data = isset($_POST['data']) ? json_decode(stripslashes($_POST['data']), true) : null;
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        if (empty($data)) {
            wp_send_json_error(array('message' => 'No data provided.'));
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($data);
        
        // Save to database
        try {
            $result = $this->save_kit_to_db($sanitized_data, get_current_user_id(), $entry_key);
            
            wp_send_json_success(array(
                'message' => 'Media kit saved successfully.',
                'entry_key' => $result['entry_key']
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Save media kit for guest users
     */
    public function save_media_kit_guest() {
        // Check if guest access is allowed
        $guest_access = get_option('mkb_guest_access', true);
        
        if (!$guest_access) {
            wp_send_json_error(array('message' => 'Guest access is not allowed.'));
        }
        
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Get data
        $data = isset($_POST['data']) ? json_decode(stripslashes($_POST['data']), true) : null;
        $session_id = isset($_POST['session_id']) ? sanitize_text_field($_POST['session_id']) : null;
        
        if (empty($data)) {
            wp_send_json_error(array('message' => 'No data provided.'));
        }
        
        if (empty($session_id)) {
            wp_send_json_error(array('message' => 'No session ID provided.'));
        }
        
        // Sanitize data
        $sanitized_data = $this->sanitize_kit_data($data);
        
        // Save to session table
        try {
            $result = $this->save_guest_session($sanitized_data, $session_id);
            
            wp_send_json_success(array(
                'message' => 'Media kit saved to session.',
                'session_id' => $result['session_id']
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Load media kit (logged in users)
     */
    public function load_media_kit() {
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Check user capability
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('message' => 'You do not have permission to load media kits.'));
        }
        
        // Get entry key
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        if (empty($entry_key)) {
            wp_send_json_error(array('message' => 'No entry key provided.'));
        }
        
        // Load from database
        try {
            $data = $this->load_kit_from_db($entry_key, get_current_user_id());
            
            if (!$data) {
                wp_send_json_error(array('message' => 'Media kit not found.'));
            }
            
            wp_send_json_success(array(
                'message' => 'Media kit loaded successfully.',
                'data' => $data
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Load media kit for guest users
     */
    public function load_media_kit_guest() {
        // Check if guest access is allowed
        $guest_access = get_option('mkb_guest_access', true);
        
        if (!$guest_access) {
            wp_send_json_error(array('message' => 'Guest access is not allowed.'));
        }
        
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Get session ID
        $session_id = isset($_POST['session_id']) ? sanitize_text_field($_POST['session_id']) : null;
        
        if (empty($session_id)) {
            wp_send_json_error(array('message' => 'No session ID provided.'));
        }
        
        // Load from session table
        try {
            $data = $this->load_guest_session($session_id);
            
            if (!$data) {
                wp_send_json_error(array('message' => 'Session not found.'));
            }
            
            wp_send_json_success(array(
                'message' => 'Media kit loaded from session.',
                'data' => $data
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Export media kit to PDF
     */
    public function export_pdf() {
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Check user capability
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('message' => 'You do not have permission to export media kits.'));
        }
        
        // Check premium access
        $access_tier = $this->get_user_access_tier();
        
        if ($access_tier !== 'pro' && $access_tier !== 'agency') {
            wp_send_json_error(array('message' => 'PDF export is a premium feature.'));
        }
        
        // Get data
        $data = isset($_POST['data']) ? json_decode(stripslashes($_POST['data']), true) : null;
        
        if (empty($data)) {
            wp_send_json_error(array('message' => 'No data provided.'));
        }
        
        // Generate PDF
        try {
            $pdf_result = $this->generate_pdf($data);
            
            wp_send_json_success(array(
                'message' => 'PDF generated successfully.',
                'url' => $pdf_result['url'],
                'filename' => $pdf_result['filename']
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Delete media kit
     */
    public function delete_media_kit() {
        // Check nonce
        if (!check_ajax_referer('media_kit_builder_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token.'));
        }
        
        // Check user capability
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('message' => 'You do not have permission to delete media kits.'));
        }
        
        // Get entry key
        $entry_key = isset($_POST['entry_key']) ? sanitize_text_field($_POST['entry_key']) : null;
        
        if (empty($entry_key)) {
            wp_send_json_error(array('message' => 'No entry key provided.'));
        }
        
        // Delete from database
        try {
            $result = $this->delete_kit_from_db($entry_key, get_current_user_id());
            
            if (!$result) {
                wp_send_json_error(array('message' => 'Media kit not found.'));
            }
            
            wp_send_json_success(array(
                'message' => 'Media kit deleted successfully.'
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * Sanitize media kit data
     * 
     * @param array $data Data to sanitize
     * @return array Sanitized data
     */
    private function sanitize_kit_data($data) {
        // Deep sanitization of all fields
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    $data[$key] = $this->sanitize_kit_data($value);
                } else if (is_string($value)) {
                    // Allow certain HTML in content fields
                    if (in_array($key, array('content', 'html', 'text'))) {
                        $data[$key] = wp_kses_post($value);
                    } else {
                        $data[$key] = sanitize_text_field($value);
                    }
                }
            }
        }
        
        return $data;
    }
    
    /**
     * Save media kit to database
     * 
     * @param array $data Media kit data
     * @param int $user_id User ID
     * @param string $entry_key Entry key
     * @return array Result
     */
    private function save_kit_to_db($data, $user_id, $entry_key = null) {
        global $wpdb;
        
        // Prepare data for database
        $json_data = wp_json_encode($data);
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Transaction to ensure data integrity
        $wpdb->query('START TRANSACTION');
        
        try {
            if ($entry_key) {
                // Update existing media kit
                $result = $wpdb->update(
                    $table_name,
                    array(
                        'data' => $json_data,
                        'modified' => current_time('mysql'),
                    ),
                    array(
                        'entry_key' => $entry_key,
                        'user_id' => $user_id
                    ),
                    array('%s', '%s'),
                    array('%s', '%d')
                );
                
                if ($result === false) {
                    throw new Exception('Failed to update media kit: ' . $wpdb->last_error);
                }
            } else {
                // Create new media kit
                $entry_key = md5(uniqid($user_id, true));
                
                $result = $wpdb->insert(
                    $table_name,
                    array(
                        'entry_key' => $entry_key,
                        'user_id' => $user_id,
                        'data' => $json_data,
                        'created' => current_time('mysql'),
                        'modified' => current_time('mysql'),
                    ),
                    array('%s', '%d', '%s', '%s', '%s')
                );
                
                if ($result === false) {
                    throw new Exception('Failed to create media kit: ' . $wpdb->last_error);
                }
            }
            
            // Commit transaction
            $wpdb->query('COMMIT');
            
            return array(
                'success' => true,
                'entry_key' => $entry_key
            );
        } catch (Exception $e) {
            // Rollback transaction on error
            $wpdb->query('ROLLBACK');
            throw $e;
        }
    }
    
    /**
     * Load media kit from database
     * 
     * @param string $entry_key Entry key
     * @param int $user_id User ID
     * @return array Media kit data
     */
    private function load_kit_from_db($entry_key, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Query database
        $query = $wpdb->prepare(
            "SELECT data FROM {$table_name} WHERE entry_key = %s AND user_id = %d",
            $entry_key,
            $user_id
        );
        
        $result = $wpdb->get_var($query);
        
        if (!$result) {
            return false;
        }
        
        // Decode JSON data
        $kit_data = json_decode($result, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data: ' . json_last_error_msg());
        }
        
        return $kit_data;
    }
    
    /**
     * Delete media kit from database
     * 
     * @param string $entry_key Entry key
     * @param int $user_id User ID
     * @return bool Success
     */
    private function delete_kit_from_db($entry_key, $user_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kits';
        
        // Delete from database
        $result = $wpdb->delete(
            $table_name,
            array(
                'entry_key' => $entry_key,
                'user_id' => $user_id
            ),
            array('%s', '%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Save guest session
     * 
     * @param array $data Session data
     * @param string $session_id Session ID
     * @return array Result
     */
    private function save_guest_session($data, $session_id) {
        global $wpdb;
        
        // Prepare data for database
        $json_data = wp_json_encode($data);
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kit_sessions';
        
        // Check if table exists, create if not
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            $this->create_sessions_table();
        }
        
        // Transaction to ensure data integrity
        $wpdb->query('START TRANSACTION');
        
        try {
            // Check if session exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table_name} WHERE session_id = %s",
                $session_id
            ));
            
            if ($exists) {
                // Update existing session
                $result = $wpdb->update(
                    $table_name,
                    array(
                        'data' => $json_data,
                        'modified' => current_time('mysql'),
                    ),
                    array(
                        'session_id' => $session_id
                    ),
                    array('%s', '%s'),
                    array('%s')
                );
                
                if ($result === false) {
                    throw new Exception('Failed to update session: ' . $wpdb->last_error);
                }
            } else {
                // Create new session
                $result = $wpdb->insert(
                    $table_name,
                    array(
                        'session_id' => $session_id,
                        'data' => $json_data,
                        'created' => current_time('mysql'),
                        'modified' => current_time('mysql'),
                        'expires' => date('Y-m-d H:i:s', strtotime('+7 days'))
                    ),
                    array('%s', '%s', '%s', '%s', '%s')
                );
                
                if ($result === false) {
                    throw new Exception('Failed to create session: ' . $wpdb->last_error);
                }
            }
            
            // Commit transaction
            $wpdb->query('COMMIT');
            
            return array(
                'success' => true,
                'session_id' => $session_id
            );
        } catch (Exception $e) {
            // Rollback transaction on error
            $wpdb->query('ROLLBACK');
            throw $e;
        }
    }
    
    /**
     * Load guest session
     * 
     * @param string $session_id Session ID
     * @return array Session data
     */
    private function load_guest_session($session_id) {
        global $wpdb;
        
        // Get table name
        $table_name = $wpdb->prefix . 'media_kit_sessions';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return false;
        }
        
        // Query database
        $query = $wpdb->prepare(
            "SELECT data FROM {$table_name} WHERE session_id = %s AND expires > %s",
            $session_id,
            current_time('mysql')
        );
        
        $result = $wpdb->get_var($query);
        
        if (!$result) {
            return false;
        }
        
        // Decode JSON data
        $session_data = json_decode($result, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data: ' . json_last_error_msg());
        }
        
        return $session_data;
    }
    
    /**
     * Create sessions table
     */
    private function create_sessions_table() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Sessions table
        $table_name = $wpdb->prefix . 'media_kit_sessions';
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(32) NOT NULL,
            data longtext NOT NULL,
            created datetime NOT NULL,
            modified datetime NOT NULL,
            expires datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY session_id (session_id),
            KEY expires (expires)
        ) $charset_collate;";
        
        // Create table
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        
        // Suppress errors during table creation
        $wpdb->hide_errors();
        
        dbDelta($sql);
        
        // Restore error display
        $wpdb->show_errors();
    }
    
    /**
     * Generate PDF
     * 
     * @param array $data Media kit data
     * @return array Result
     */
    private function generate_pdf($data) {
        // Create uploads directory if it doesn't exist
        $upload_dir = wp_upload_dir();
        $pdf_dir = $upload_dir['basedir'] . '/media-kits';
        
        if (!is_dir($pdf_dir)) {
            wp_mkdir_p($pdf_dir);
        }
        
        // Generate filename
        $filename = 'media-kit-' . date('Y-m-d-H-i-s') . '.pdf';
        $pdf_path = $pdf_dir . '/' . $filename;
        
        // Check if PDF libraries are available
        if (!class_exists('TCPDF') && !class_exists('Dompdf\Dompdf')) {
            throw new Exception('PDF libraries not available.');
        }
        
        // Generate PDF
        if (class_exists('TCPDF')) {
            $this->generate_pdf_tcpdf($data, $pdf_path);
        } else {
            $this->generate_pdf_dompdf($data, $pdf_path);
        }
        
        // Check if PDF was created
        if (!file_exists($pdf_path)) {
            throw new Exception('Failed to generate PDF.');
        }
        
        // Return PDF URL
        $pdf_url = $upload_dir['baseurl'] . '/media-kits/' . $filename;
        
        return array(
            'url' => $pdf_url,
            'filename' => $filename
        );
    }
    
    /**
     * Generate PDF using TCPDF
     * 
     * @param array $data Media kit data
     * @param string $pdf_path Path to save PDF
     */
    private function generate_pdf_tcpdf($data, $pdf_path) {
        // Placeholder function - implement TCPDF generation
        // This is just a basic implementation - extend as needed
        
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('Media Kit Builder');
        $pdf->SetAuthor('Media Kit Builder');
        $pdf->SetTitle('Media Kit');
        $pdf->SetSubject('Media Kit');
        $pdf->SetKeywords('Media Kit, PDF');
        
        // Remove header/footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        
        // Set default monospaced font
        $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
        
        // Set margins
        $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
        
        // Set auto page breaks
        $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
        
        // Set image scale factor
        $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
        
        // Add a page
        $pdf->AddPage();
        
        // Set font
        $pdf->SetFont('helvetica', '', 12);
        
        // Generate HTML content
        $html = $this->generate_html_for_pdf($data);
        
        // Print content
        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Close and output PDF
        $pdf->Output($pdf_path, 'F');
    }
    
    /**
     * Generate PDF using DomPDF
     * 
     * @param array $data Media kit data
     * @param string $pdf_path Path to save PDF
     */
    private function generate_pdf_dompdf($data, $pdf_path) {
        // Placeholder function - implement DomPDF generation
        // This is just a basic implementation - extend as needed
        
        $dompdf = new Dompdf\Dompdf();
        
        // Generate HTML content
        $html = $this->generate_html_for_pdf($data);
        
        // Load HTML
        $dompdf->loadHtml($html);
        
        // Set paper size and orientation
        $dompdf->setPaper('A4', 'portrait');
        
        // Render PDF
        $dompdf->render();
        
        // Save to file
        file_put_contents($pdf_path, $dompdf->output());
    }
    
    /**
     * Generate HTML for PDF
     * 
     * @param array $data Media kit data
     * @return string HTML content
     */
    private function generate_html_for_pdf($data) {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Media Kit</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .section {
            margin-bottom: 20px;
            padding: 20px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #0ea5e9;
        }
        .biography {
            margin-bottom: 20px;
        }
        .topics {
            margin-bottom: 20px;
        }
        .topic-item {
            display: inline-block;
            background-color: #f3f4f6;
            padding: 5px 10px;
            margin: 0 5px 5px 0;
            border-radius: 4px;
        }
        .questions {
            margin-bottom: 20px;
        }
        .question-item {
            margin-bottom: 10px;
            padding: 5px 10px;
            background-color: #f3f4f6;
            border-radius: 4px;
        }
        .social {
            margin-bottom: 20px;
        }
        .social-item {
            margin-bottom: 5px;
        }
        .footer {
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>';
        
        // Check if sections exist
        if (isset($data['sections']) && is_array($data['sections'])) {
            foreach ($data['sections'] as $section) {
                $html .= '<div class="section">';
                
                // Check if components exist in section
                if (isset($section['components'])) {
                    if (is_array($section['components'])) {
                        if (isset($section['components'][0])) {
                            // Single column layout
                            foreach ($section['components'] as $componentId) {
                                if (isset($data['components'][$componentId])) {
                                    $component = $data['components'][$componentId];
                                    $html .= $this->generate_component_html($component);
                                }
                            }
                        } else {
                            // Multi-column layout
                            foreach ($section['components'] as $column => $componentIds) {
                                foreach ($componentIds as $componentId) {
                                    if (isset($data['components'][$componentId])) {
                                        $component = $data['components'][$componentId];
                                        $html .= $this->generate_component_html($component);
                                    }
                                }
                            }
                        }
                    }
                }
                
                $html .= '</div>';
            }
        } else {
            // Fallback for older data format
            if (isset($data['components']) && is_array($data['components'])) {
                $html .= '<div class="section">';
                foreach ($data['components'] as $component) {
                    $html .= $this->generate_component_html($component);
                }
                $html .= '</div>';
            }
        }
        
        // Add watermark if not pro or agency
        $access_tier = $this->get_user_access_tier();
        
        if ($access_tier !== 'pro' && $access_tier !== 'agency') {
            $html .= '<div class="footer">Generated with Media Kit Builder - Upgrade to remove this watermark</div>';
        }
        
        $html .= '</body></html>';
        
        return $html;
    }
    
    /**
     * Generate component HTML
     * 
     * @param array $component Component data
     * @return string HTML content
     */
    private function generate_component_html($component) {
        $html = '';
        
        if (!isset($component['type'])) {
            return $html;
        }
        
        switch ($component['type']) {
            case 'biography':
                $html .= '<div class="biography">';
                if (isset($component['content']['text'])) {
                    $html .= $component['content']['text'];
                }
                $html .= '</div>';
                break;
                
            case 'topics':
                $html .= '<div class="topics">';
                if (isset($component['content']['topics']) && is_array($component['content']['topics'])) {
                    foreach ($component['content']['topics'] as $topic) {
                        $html .= '<div class="topic-item">' . $topic . '</div>';
                    }
                }
                $html .= '</div>';
                break;
                
            case 'questions':
                $html .= '<div class="questions">';
                if (isset($component['content']['questions']) && is_array($component['content']['questions'])) {
                    foreach ($component['content']['questions'] as $question) {
                        $html .= '<div class="question-item">' . $question . '</div>';
                    }
                }
                $html .= '</div>';
                break;
                
            case 'social':
                $html .= '<div class="social">';
                if (isset($component['content']['platforms']) && is_array($component['content']['platforms'])) {
                    foreach ($component['content']['platforms'] as $platform) {
                        if (isset($platform['platform']) && isset($platform['link'])) {
                            $html .= '<div class="social-item">';
                            $html .= $platform['platform'] . ': ' . $platform['link'];
                            $html .= '</div>';
                        }
                    }
                }
                $html .= '</div>';
                break;
                
            case 'logo':
                // Skip logos in PDF for now
                break;
                
            default:
                // Skip unknown components
                break;
        }
        
        return $html;
    }
    
    /**
     * Get user access tier
     * 
     * @return string Access tier
     */
    private function get_user_access_tier() {
        // Check if WP Fusion is active
        if (function_exists('wp_fusion')) {
            // Get user tags
            $user_tags = wp_fusion()->user->get_tags();
            
            // Check for agency tag
            if (is_array($user_tags) && in_array('agency', $user_tags)) {
                return 'agency';
            }
            
            // Check for pro tag
            if (is_array($user_tags) && in_array('pro', $user_tags)) {
                return 'pro';
            }
            
            // Check for free tag
            if (is_array($user_tags) && in_array('free', $user_tags)) {
                return 'free';
            }
        }
        
        // Default to guest for non-logged in users
        if (!is_user_logged_in()) {
            return 'guest';
        }
        
        // Default to free for logged in users
        return 'free';
    }
}

// Initialize
MKB_AJAX_Handlers::instance();
