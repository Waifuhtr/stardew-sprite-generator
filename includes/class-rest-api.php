<?php
/**
 * REST API Endpoints
 * Frontend-Backend haberleşmesi için tüm API route'ları
 */

if (!defined('ABSPATH')) exit;

class SSG_REST_API {
    
    private static $namespace = 'ssg/v1';
    
    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }
    
    public static function register_routes() {
        // Asset Listesi - Tüm assetleri veya filtrelı getir
        register_rest_route(self::$namespace, '/assets', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_assets'],
            'permission_callback' => '__return_true',
            'args'     => [
                'category' => ['type' => 'string'],
                'type'     => ['type' => 'string'],
                'gender'   => ['type' => 'string'],
                'hd'       => ['type' => 'boolean'],
            ],
        ]);
        
        // Tekil Asset
        register_rest_route(self::$namespace, '/assets/(?P<id>\d+)', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_asset'],
            'permission_callback' => '__return_true',
        ]);
        
        // Asset Yükleme (Admin/Editor only)
        register_rest_route(self::$namespace, '/assets', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'create_asset'],
            'permission_callback' => function() {
                return current_user_can('upload_files') && current_user_can('publish_posts');
            },
        ]);
        
        // Asset Silme
        register_rest_route(self::$namespace, '/assets/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [__CLASS__, 'delete_asset'],
            'permission_callback' => function() {
                return current_user_can('delete_posts');
            },
        ]);
        
        // Kullanıcı Kütüphanesi - Kayıtlı karakter/objeler
        register_rest_route(self::$namespace, '/library', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_library'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);
        
        register_rest_route(self::$namespace, '/library', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'save_to_library'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);
        
        register_rest_route(self::$namespace, '/library/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [__CLASS__, 'delete_from_library'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);
        
        // Export - PNG sprite sheet üretimi
        register_rest_route(self::$namespace, '/export/png', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'export_png'],
            'permission_callback' => '__return_true',
        ]);
        
        // Export - ZIP (PNG + content.json)
        register_rest_route(self::$namespace, '/export/zip', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'export_zip'],
            'permission_callback' => '__return_true',
        ]);
        
        // Kategoriler ve Tipler
        register_rest_route(self::$namespace, '/categories', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_categories'],
            'permission_callback' => '__return_true',
        ]);
        
        // Sprite Sheet Yapılandırması (JSON meta)
        register_rest_route(self::$namespace, '/config/sprite-structure', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_sprite_structure'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    // ========== CALLBACKS ==========
    
    public static function get_assets($request) {
        $args = [
            'post_type'      => 'stardew_asset',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
        ];
        
        $tax_query = [];
        
        if ($request->get_param('category')) {
            $tax_query[] = [
                'taxonomy' => 'asset_category',
                'field'    => 'slug',
                'terms'    => sanitize_text_field($request->get_param('category')),
            ];
        }
        
        if ($request->get_param('type')) {
            $tax_query[] = [
                'taxonomy' => 'asset_type',
                'field'    => 'slug',
                'terms'    => sanitize_text_field($request->get_param('type')),
            ];
        }
        
        if (!empty($tax_query)) {
            $args['tax_query'] = $tax_query;
        }
        
        $meta_query = [];
        
        if ($request->get_param('gender')) {
            $meta_query[] = [
                'key'     => '_ssg_gender',
                'value'   => ['unisex', sanitize_text_field($request->get_param('gender'))],
                'compare' => 'IN',
            ];
        }
        
        if ($request->get_param('hd') !== null) {
            $meta_query[] = [
                'key'   => '_ssg_is_hd',
                'value' => $request->get_param('hd') ? '1' : '0',
            ];
        }
        
        if (!empty($meta_query)) {
            $args['meta_query'] = $meta_query;
        }
        
        $query = new WP_Query($args);
        $assets = [];
        
        while ($query->have_posts()) {
            $query->the_post();
            $id = get_the_ID();
            $assets[] = self::format_asset($id);
        }
        wp_reset_postdata();
        
        return rest_ensure_response($assets);
    }
    
    public static function get_asset($request) {
        $id = intval($request->get_param('id'));
        $asset = self::format_asset($id);
        
        if (!$asset) {
            return new WP_Error('not_found', 'Asset bulunamadı', ['status' => 404]);
        }
        
        return rest_ensure_response($asset);
    }
    
    private static function format_asset($post_id) {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'stardew_asset') return null;
        
        $thumbnail = get_the_post_thumbnail_url($post_id, 'full');
        $categories = get_the_terms($post_id, 'asset_category');
        $types = get_the_terms($post_id, 'asset_type');
        
        return [
            'id'          => $post_id,
            'title'       => $post->post_title,
            'thumbnail'   => $thumbnail,
            'image_url'   => $thumbnail,
            'z_index'     => intval(get_post_meta($post_id, '_ssg_z_index', true)),
            'offset_x'    => intval(get_post_meta($post_id, '_ssg_offset_x', true)),
            'offset_y'    => intval(get_post_meta($post_id, '_ssg_offset_y', true)),
            'grid_width'  => intval(get_post_meta($post_id, '_ssg_grid_width', true)),
            'grid_height' => intval(get_post_meta($post_id, '_ssg_grid_height', true)),
            'anim_frames' => intval(get_post_meta($post_id, '_ssg_anim_frames', true)),
            'gender'      => get_post_meta($post_id, '_ssg_gender', true) ?: 'unisex',
            'base_color'  => get_post_meta($post_id, '_ssg_base_color', true),
            'is_hd'       => (bool) get_post_meta($post_id, '_ssg_is_hd', true),
            'categories'  => $categories ? array_map(function($t) { return $t->slug; }, $categories) : [],
            'types'       => $types ? array_map(function($t) { return $t->slug; }, $types) : [],
            'date'        => $post->post_date,
        ];
    }
    
    public static function create_asset($request) {
        $params = $request->get_json_params();
        
        if (empty($params['title'])) {
            return new WP_Error('missing_title', 'Asset başlığı gerekli', ['status' => 400]);
        }
        
        $post_id = wp_insert_post([
            'post_title'  => sanitize_text_field($params['title']),
            'post_type'   => 'stardew_asset',
            'post_status' => 'publish',
        ]);
        
        if (is_wp_error($post_id)) {
            return $post_id;
        }
        
        // Meta alanları kaydet
        $meta_fields = ['z_index', 'offset_x', 'offset_y', 'grid_width', 'grid_height', 'anim_frames', 'gender', 'base_color', 'is_hd'];
        foreach ($meta_fields as $field) {
            if (isset($params[$field])) {
                update_post_meta($post_id, '_ssg_' . $field, sanitize_text_field($params[$field]));
            }
        }
        
        return rest_ensure_response(self::format_asset($post_id));
    }
    
    public static function delete_asset($request) {
        $id = intval($request->get_param('id'));
        $result = wp_delete_post($id, true);
        
        if (!$result) {
            return new WP_Error('delete_failed', 'Silme işlemi başarısız', ['status' => 500]);
        }
        
        return rest_ensure_response(['success' => true, 'deleted' => $id]);
    }
    
    // ========== KULLANICI KÜTÜPHANESİ ==========
    
    public static function auth_check() {
        return is_user_logged_in();
    }
    
    public static function get_library($request) {
        $user_id = get_current_user_id();
        
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items)) $items = [];
        
        return rest_ensure_response(array_reverse($items));
    }
    
    public static function save_to_library($request) {
        $user_id = get_current_user_id();
        $params = $request->get_json_params();
        
        if (empty($params['name']) || empty($params['layers'])) {
            return new WP_Error('missing_data', 'İsim ve katman verisi gerekli', ['status' => 400]);
        }
        
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items)) $items = [];
        
        $item = [
            'id'        => uniqid('ssg_'),
            'name'      => sanitize_text_field($params['name']),
            'type'      => sanitize_text_field($params['type'] ?? 'character'),
            'layers'    => $params['layers'],
            'config'    => $params['config'] ?? [],
            'created'   => current_time('mysql'),
            'modified'  => current_time('mysql'),
        ];
        
        $items[] = $item;
        update_user_meta($user_id, '_ssg_library', $items);
        
        return rest_ensure_response($item);
    }
    
    public static function delete_from_library($request) {
        $user_id = get_current_user_id();
        $index = intval($request->get_param('id'));
        
        $items = get_user_meta($user_id, '_ssg_library', true);
        if (!is_array($items) || !isset($items[$index])) {
            return new WP_Error('not_found', 'Öğe bulunamadı', ['status' => 404]);
        }
        
        array_splice($items, $index, 1);
        update_user_meta($user_id, '_ssg_library', $items);
        
        return rest_ensure_response(['success' => true]);
    }
    
    // ========== EXPORT ==========
    
    public static function export_png($request) {
        $params = $request->get_json_params();
        
        if (empty($params['layers'])) {
            return new WP_Error('missing_layers', 'Katman verisi gerekli', ['status' => 400]);
        }
        
        $result = SSG_Export::generate_png_sprite_sheet($params['layers'], $params['config'] ?? []);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response([
            'success' => true,
            'download_url' => $result['url'],
            'file_name'    => $result['filename'],
        ]);
    }
    
    public static function export_zip($request) {
        $params = $request->get_json_params();
        
        if (empty($params['layers'])) {
            return new WP_Error('missing_layers', 'Katman verisi gerekli', ['status' => 400]);
        }
        
        $result = SSG_Export::generate_zip_with_content_json($params['layers'], $params['config'] ?? []);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response([
            'success'      => true,
            'download_url' => $result['url'],
            'file_name'    => $result['filename'],
        ]);
    }
    
    // ========== KATEGORİLER & YAPILANDIRMA ==========
    
    public static function get_categories($request) {
        $categories = get_terms(['taxonomy' => 'asset_category', 'hide_empty' => false]);
        $types = get_terms(['taxonomy' => 'asset_type', 'hide_empty' => false]);
        
        return rest_ensure_response([
            'categories' => $categories ?: [],
            'types'      => $types ?: [],
        ]);
    }
    
    public static function get_sprite_structure($request) {
        $structure = [
            'character' => [
                'name'   => 'Karakter (Farmer)',
                'width'  => 16,
                'height' => 32,
                'animations' => [
                    'idle_down'  => ['row' => 0, 'frames' => 1, 'desc' => 'Durma - Aşağı'],
                    'idle_right' => ['row' => 1, 'frames' => 1, 'desc' => 'Durma - Sağ'],
                    'idle_up'    => ['row' => 2, 'frames' => 1, 'desc' => 'Durma - Yukarı'],
                    'idle_left'  => ['row' => 3, 'frames' => 1, 'desc' => 'Durma - Sol'],
                    'walk_down'  => ['row' => 0, 'frames' => 4, 'desc' => 'Yürüme - Aşağı', 'frame_indices' => [0,1,2,3]],
                    'walk_right' => ['row' => 1, 'frames' => 4, 'desc' => 'Yürüme - Sağ', 'frame_indices' => [0,1,2,3]],
                    'walk_up'    => ['row' => 2, 'frames' => 4, 'desc' => 'Yürüme - Yukarı', 'frame_indices' => [0,1,2,3]],
                    'walk_left'  => ['row' => 3, 'frames' => 4, 'desc' => 'Yürüme - Sol', 'frame_indices' => [0,1,2,3]],
                    'run_down'   => ['row' => 4, 'frames' => 8, 'desc' => 'Koşma - Aşağı'],
                    'run_right'  => ['row' => 5, 'frames' => 8, 'desc' => 'Koşma - Sağ'],
                    'run_up'     => ['row' => 6, 'frames' => 8, 'desc' => 'Koşma - Yukarı'],
                    'run_left'   => ['row' => 7, 'frames' => 8, 'desc' => 'Koşma - Sol'],
                ],
                'total_rows' => 8,
                'frame_width'  => 16,
                'frame_height' => 32,
            ],
            'tool_use' => [
                'name'   => 'Alet Kullanımı',
                'width'  => 16,
                'height' => 32,
                'animations' => [
                    'swing_down'  => ['row' => 0, 'frames' => 6, 'desc' => 'Sallama - Aşağı'],
                    'swing_right' => ['row' => 1, 'frames' => 6, 'desc' => 'Sallama - Sağ'],
                    'swing_up'    => ['row' => 2, 'frames' => 6, 'desc' => 'Sallama - Yukarı'],
                    'swing_left'  => ['row' => 3, 'frames' => 6, 'desc' => 'Sallama - Sol'],
                ],
                'total_rows' => 4,
                'frame_width'  => 16,
                'frame_height' => 32,
            ],
            'furniture' => [
                'name'   => 'Mobilya',
                'width'  => 16,
                'height' => 32,
                'animations' => [
                    'default' => ['row' => 0, 'frames' => 1, 'desc' => 'Varsayılan'],
                ],
                'total_rows' => 1,
                'frame_width'  => 16,
                'frame_height' => 32,
            ],
            'building' => [
                'name'   => 'Bina',
                'width'  => 64,
                'height' => 96,
                'animations' => [
                    'default' => ['row' => 0, 'frames' => 1, 'desc' => 'Varsayılan'],
                ],
                'total_rows' => 1,
                'frame_width'  => 64,
                'frame_height' => 96,
            ],
        ];
        
        return rest_ensure_response($structure);
    }
}