<?php
/**
 * Custom Post Types & Taxonomies
 * stardew_asset CPT: PNG assetlerin saklandığı ana veri yapısı
 */

if (!defined('ABSPATH')) exit;

class SSG_CPT {
    
    public static function init() {
        add_action('init', [__CLASS__, 'register_cpt']);
        add_action('init', [__CLASS__, 'register_taxonomies']);
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post', [__CLASS__, 'save_meta']);
    }
    
    public static function register_cpt() {
        $labels = [
            'name'                  => 'Stardew Assetler',
            'singular_name'         => 'Stardew Asset',
            'add_new'               => 'Yeni Asset Ekle',
            'add_new_item'          => 'Yeni Asset Ekle',
            'edit_item'             => 'Asseti Düzenle',
            'new_item'              => 'Yeni Asset',
            'view_item'             => 'Asseti Görüntüle',
            'search_items'          => 'Asset Ara',
            'not_found'             => 'Asset bulunamadı',
            'menu_name'             => 'Sprite Generator',
        ];
        
        $args = [
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 30,
            'menu_icon'          => 'dashicons-art',
            'supports'           => ['title', 'thumbnail'],
            'show_in_rest'       => true,
            'rest_base'          => 'stardew_assets',
        ];
        
        register_post_type('stardew_asset', $args);
    }
    
    public static function register_taxonomies() {
        // Asset Kategorisi (Şapka, Kıyafet, Mobilya, vb.)
        register_taxonomy('asset_category', 'stardew_asset', [
            'labels' => [
                'name'          => 'Asset Kategorileri',
                'singular_name' => 'Asset Kategorisi',
                'add_new_item'  => 'Yeni Kategori Ekle',
            ],
            'hierarchical'      => true,
            'show_ui'           => true,
            'show_in_rest'      => true,
            'rest_base'         => 'asset_categories',
        ]);
        
        // Asset Tipi (Karakter parçası, obje, bina, hayvan, silah)
        register_taxonomy('asset_type', 'stardew_asset', [
            'labels' => [
                'name'          => 'Asset Tipleri',
                'singular_name' => 'Asset Tipi',
            ],
            'hierarchical'      => false,
            'show_ui'           => true,
            'show_in_rest'      => true,
            'rest_base'         => 'asset_types',
        ]);
    }
    
    public static function add_meta_boxes() {
        add_meta_box(
            'ssg_asset_meta',
            'Asset Metadata (Sprite Konfigürasyonu)',
            [__CLASS__, 'render_meta_box'],
            'stardew_asset',
            'normal',
            'high'
        );
    }
    
    public static function render_meta_box($post) {
        wp_nonce_field('ssg_save_meta', 'ssg_meta_nonce');
        
        $z_index    = get_post_meta($post->ID, '_ssg_z_index', true) ?: '10';
        $offset_x   = get_post_meta($post->ID, '_ssg_offset_x', true) ?: '0';
        $offset_y   = get_post_meta($post->ID, '_ssg_offset_y', true) ?: '0';
        $grid_w     = get_post_meta($post->ID, '_ssg_grid_width', true) ?: '16';
        $grid_h     = get_post_meta($post->ID, '_ssg_grid_height', true) ?: '32';
        $anim_frames= get_post_meta($post->ID, '_ssg_anim_frames', true) ?: '1';
        $gender     = get_post_meta($post->ID, '_ssg_gender', true) ?: 'unisex';
        $base_color = get_post_meta($post->ID, '_ssg_base_color', true) ?: '';
        $is_hd      = get_post_meta($post->ID, '_ssg_is_hd', true) ?: '0';
        
        ?>
        <table class="form-table">
            <tr>
                <th><label>Z-Index (Katman Sırası)</label></th>
                <td>
                    <input type="number" name="ssg_z_index" value="<?php echo esc_attr($z_index); ?>" class="small-text">
                    <p class="description">Düşük değer = arka planda, Yüksek değer = ön planda. Vücut=1, Gömlek=5, Pantolon=8, Saç=20, Şapka=30</p>
                </td>
            </tr>
            <tr>
                <th><label>Offset X (Yatay Kaydırma)</label></th>
                <td>
                    <input type="number" name="ssg_offset_x" value="<?php echo esc_attr($offset_x); ?>" class="small-text"> px
                    <p class="description">Sprite'ın grid üzerindeki yatay konum ayarı</p>
                </td>
            </tr>
            <tr>
                <th><label>Offset Y (Dikey Kaydırma)</label></th>
                <td>
                    <input type="number" name="ssg_offset_y" value="<?php echo esc_attr($offset_y); ?>" class="small-text"> px
                    <p class="description">Sprite'ın grid üzerindeki dikey konum ayarı</p>
                </td>
            </tr>
            <tr>
                <th><label>Grid Boyutu (Varsayılan)</label></th>
                <td>
                    <input type="number" name="ssg_grid_width" value="<?php echo esc_attr($grid_w); ?>" class="small-text"> x
                    <input type="number" name="ssg_grid_height" value="<?php echo esc_attr($grid_h); ?>" class="small-text"> px
                </td>
            </tr>
            <tr>
                <th><label>Animasyon Kare Sayısı</label></th>
                <td>
                    <input type="number" name="ssg_anim_frames" value="<?php echo esc_attr($anim_frames); ?>" class="small-text">
                    <p class="description">Bu assetin kaç animasyon karesi içerdiği (1 = statik)</p>
                </td>
            </tr>
            <tr>
                <th><label>Cinsiyet Kısıtlaması</label></th>
                <td>
                    <select name="ssg_gender">
                        <option value="unisex" <?php selected($gender, 'unisex'); ?>>Unisex</option>
                        <option value="male" <?php selected($gender, 'male'); ?>>Erkek</option>
                        <option value="female" <?php selected($gender, 'female'); ?>>Kadın</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label>Baz Renk (Hex)</label></th>
                <td>
                    <input type="text" name="ssg_base_color" value="<?php echo esc_attr($base_color); ?>" placeholder="#FFCC99">
                    <p class="description">Renk değiştirme özelliği için baz renk (opsiyonel)</p>
                </td>
            </tr>
            <tr>
                <th><label>HD Asset mi?</label></th>
                <td>
                    <input type="checkbox" name="ssg_is_hd" value="1" <?php checked($is_hd, '1'); ?>>
                    <p class="description">Yüksek çözünürlüklü sprite ise işaretleyin</p>
                </td>
            </tr>
        </table>
        <?php
    }
    
    public static function save_meta($post_id) {
        if (!isset($_POST['ssg_meta_nonce']) || !wp_verify_nonce($_POST['ssg_meta_nonce'], 'ssg_save_meta')) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;
        
        $fields = ['ssg_z_index', 'ssg_offset_x', 'ssg_offset_y', 'ssg_grid_width', 'ssg_grid_height', 'ssg_anim_frames', 'ssg_gender', 'ssg_base_color'];
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }
        
        update_post_meta($post_id, '_ssg_is_hd', isset($_POST['ssg_is_hd']) ? '1' : '0');
    }
}