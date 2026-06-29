<?php
/**
 * Admin Panel İşlevleri
 * Ayarlar sayfası ve admin arayüzü
 */

if (!defined('ABSPATH')) exit;

class SSG_Admin {
    
    public static function init() {
        add_action('admin_menu', [__CLASS__, 'add_menu_pages']);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_admin_assets']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
    }
    
    public static function add_menu_pages() {
        add_submenu_page(
            'edit.php?post_type=stardew_asset',
            'Ayarlar',
            'Ayarlar',
            'manage_options',
            'ssg-settings',
            [__CLASS__, 'render_settings_page']
        );
        
        add_submenu_page(
            'edit.php?post_type=stardew_asset',
            'Kullanıcı Kitaplıkları',
            'Kullanıcı Kitaplıkları',
            'manage_options',
            'ssg-libraries',
            [__CLASS__, 'render_libraries_page']
        );
    }
    
    public static function register_settings() {
        register_setting('ssg_settings', 'ssg_default_grid_width');
        register_setting('ssg_settings', 'ssg_default_grid_height');
        register_setting('ssg_settings', 'ssg_hd_scale_enabled');
        register_setting('ssg_settings', 'ssg_max_upload_size');
        
        add_settings_section('ssg_general', 'Genel Ayarlar', null, 'ssg-settings');
        
        add_settings_field('ssg_default_grid_width', 'Varsayılan Grid Genişliği (px)', function() {
            $val = get_option('ssg_default_grid_width', 16);
            echo '<input type="number" name="ssg_default_grid_width" value="' . esc_attr($val) . '">';
        }, 'ssg-settings', 'ssg_general');
        
        add_settings_field('ssg_default_grid_height', 'Varsayılan Grid Yüksekliği (px)', function() {
            $val = get_option('ssg_default_grid_height', 32);
            echo '<input type="number" name="ssg_default_grid_height" value="' . esc_attr($val) . '">';
        }, 'ssg-settings', 'ssg_general');
    }
    
    public static function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Stardew Sprite Generator - Ayarlar</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('ssg_settings');
                do_settings_sections('ssg-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    public static function render_libraries_page() {
        global $wpdb;
        
        // Tüm kullanıcı kitaplıklarını getir
        $results = $wpdb->get_results(
            "SELECT user_id, meta_value FROM {$wpdb->usermeta} WHERE meta_key = '_ssg_library'"
        );
        
        ?>
        <div class="wrap">
            <h1>Kullanıcı Kitaplıkları</h1>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Kullanıcı</th>
                        <th>Kayıtlı Sprite Sayısı</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($results as $row): 
                        $user = get_user_by('id', $row->user_id);
                        $items = maybe_unserialize($row->meta_value);
                        $count = is_array($items) ? count($items) : 0;
                    ?>
                    <tr>
                        <td><?php echo $user ? esc_html($user->display_name) : 'Bilinmeyen (#'.intval($row->user_id).')'; ?></td>
                        <td><?php echo intval($count); ?></td>
                        <td><a href="<?php echo admin_url('user-edit.php?user_id='.intval($row->user_id)); ?>">Profili Gör</a></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
    
    public static function enqueue_admin_assets($hook) {
        if (strpos($hook, 'stardew_asset') === false && strpos($hook, 'ssg-') === false) return;
        
        wp_enqueue_style('ssg-admin', SSG_PLUGIN_URL . 'admin/css/admin.css', [], SSG_VERSION);
        wp_enqueue_script('ssg-admin', SSG_PLUGIN_URL . 'admin/js/admin.js', ['jquery'], SSG_VERSION, true);
    }
}