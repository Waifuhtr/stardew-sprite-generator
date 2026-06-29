<?php
/**
 * Asset Yönetim Sistemi
 * Medya yükleme, işleme ve organizasyon
 */

if (!defined('ABSPATH')) exit;

class SSG_Asset_Manager {
    
    public static function init() {
        add_action('wp_ajax_ssg_upload_asset', [__CLASS__, 'handle_upload']);
        add_filter('upload_mimes', [__CLASS__, 'allow_png_upload']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
    }
    
    public static function enqueue_assets() {
        global $post;
        
        // Eklenti sayfasında mı kontrol et
        if (!is_page() && !is_single()) return;
        
        $page_content = $post ? $post->post_content : '';
        if (strpos($page_content, '[stardew_sprite_generator') === false) return;
        
        // React uygulamasını yükle
        wp_enqueue_script(
            'ssg-react-app',
            SSG_PLUGIN_URL . 'public/js/dist/app.js',
            [],
            SSG_VERSION,
            true
        );
        
        wp_enqueue_style(
            'ssg-styles',
            SSG_PLUGIN_URL . 'public/css/style.css',
            [],
            SSG_VERSION
        );
        
        // WordPress REST API nonce ve URL bilgisi
        wp_localize_script('ssg-react-app', 'ssgConfig', [
            'restUrl'   => esc_url_raw(rest_url('ssg/v1/')),
            'nonce'     => wp_create_nonce('wp_rest'),
            'ajaxUrl'   => admin_url('admin-ajax.php'),
            'pluginUrl' => SSG_PLUGIN_URL,
            'isLoggedIn'=> is_user_logged_in(),
            'userId'    => get_current_user_id(),
        ]);
    }
    
    public static function allow_png_upload($mimes) {
        $mimes['png'] = 'image/png';
        return $mimes;
    }
    
    public static function handle_upload() {
        check_ajax_referer('ssg_upload_nonce', 'nonce');
        
        if (!current_user_can('upload_files')) {
            wp_send_json_error('Yetkisiz erişim');
        }
        
        if (empty($_FILES['asset'])) {
            wp_send_json_error('Dosya bulunamadı');
        }
        
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        $attachment_id = media_handle_upload('asset', 0);
        
        if (is_wp_error($attachment_id)) {
            wp_send_json_error($attachment_id->get_error_message());
        }
        
        $url = wp_get_attachment_url($attachment_id);
        
        wp_send_json_success([
            'attachment_id' => $attachment_id,
            'url'           => $url,
            'thumbnail'     => wp_get_attachment_image_url($attachment_id, 'thumbnail'),
        ]);
    }
    
    /**
     * PNG şeffaflık kontrolü ve boyut analizi
     */
    public static function analyze_png($attachment_id) {
        $file = get_attached_file($attachment_id);
        if (!$file || !file_exists($file)) return false;
        
        $info = getimagesize($file);
        if ($info['mime'] !== 'image/png') return false;
        
        $width  = $info[0];
        $height = $info[1];
        
        // PNG şeffaflık kontrolü
        $has_alpha = false;
        if (isset($info['bits']) && $info['bits'] == 32) {
            $has_alpha = true;
        }
        
        return [
            'width'     => $width,
            'height'    => $height,
            'has_alpha' => $has_alpha,
            'file_size' => filesize($file),
            'mime'      => $info['mime'],
        ];
    }
}