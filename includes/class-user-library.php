<?php
/**
 * Kullanıcı Kütüphanesi Yönetimi
 * Kayıtlı karakter/objelerin CRUD işlemleri
 */

if (!defined('ABSPATH')) exit;

class SSG_User_Library {
    
    public static function init() {
        add_action('init', [__CLASS__, 'register_shortcodes']);
    }
    
    public static function register_shortcodes() {
        add_shortcode('stardew_sprite_generator', [__CLASS__, 'render_app']);
        add_shortcode('stardew_user_library', [__CLASS__, 'render_library']);
    }
    
    public static function render_app($atts) {
        $atts = shortcode_atts([
            'type' => 'character', // character, furniture, building, animal
        ], $atts);
        
        ob_start();
        ?>
        <div id="stardew-sprite-generator" data-type="<?php echo esc_attr($atts['type']); ?>">
            <div class="ssg-loading">
                <div class="ssg-spinner"></div>
                <p>Sprite Editörü yükleniyor...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public static function render_library($atts) {
        if (!is_user_logged_in()) {
            return '<p>Kitaplığınızı görüntülemek için lütfen giriş yapın.</p>';
        }
        
        ob_start();
        ?>
        <div id="stardew-user-library">
            <h2>Sprite Kitaplığım</h2>
            <div class="ssg-library-loading">Yükleniyor...</div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Kullanıcının kitaplığına öğe ekle
     */
    public static function add_item($user_id, $item_data) {
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items)) $items = [];
        
        $item = [
            'id'         => uniqid('ssg_item_'),
            'user_id'    => $user_id,
            'name'       => sanitize_text_field($item_data['name']),
            'type'       => sanitize_text_field($item_data['type'] ?? 'character'),
            'layers'     => $item_data['layers'],
            'config'     => $item_data['config'] ?? [],
            'thumbnail'  => $item_data['thumbnail'] ?? '',
            'created'    => current_time('mysql'),
            'modified'   => current_time('mysql'),
        ];
        
        $items[] = $item;
        update_user_meta($user_id, '_ssg_library', $items);
        
        return $item;
    }
    
    /**
     * Kullanıcının kitaplığından öğe getir
     */
    public static function get_items($user_id) {
        $items = get_user_meta($user_id, '_ssg_library', true);
        return is_array($items) ? $items : [];
    }
    
    /**
     * Öğe sil
     */
    public static function delete_item($user_id, $item_id) {
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items)) return false;
        
        $items = array_filter($items, function($item) use ($item_id) {
            return $item['id'] !== $item_id;
        });
        
        update_user_meta($user_id, '_ssg_library', array_values($items));
        return true;
    }
    
    /**
     * Öğe güncelle
     */
    public static function update_item($user_id, $item_id, $data) {
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items)) return false;
        
        foreach ($items as &$item) {
            if ($item['id'] === $item_id) {
                $item['name']     = sanitize_text_field($data['name'] ?? $item['name']);
                $item['layers']   = $data['layers'] ?? $item['layers'];
                $item['config']   = $data['config'] ?? $item['config'];
                $item['modified'] = current_time('mysql');
                break;
            }
        }
        
        update_user_meta($user_id, '_ssg_library', $items);
        return true;
    }
}