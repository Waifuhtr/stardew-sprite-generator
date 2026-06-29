<?php
/**
 * Export Sistemi
 * PNG Sprite Sheet ve ZIP (content.json) üretimi
 */

if (!defined('ABSPATH')) exit;

class SSG_Export {
    
    private static $export_dir;
    private static $export_url;
    
    public static function init() {
        self::$export_dir = WP_CONTENT_DIR . '/uploads/ssg-exports/';
        self::$export_url = content_url('/uploads/ssg-exports/');
        
        if (!file_exists(self::$export_dir)) {
            wp_mkdir_p(self::$export_dir);
        }
    }
    
    /**
     * PNG Sprite Sheet oluştur
     * Katmanları birleştirerek şeffaf arka planlı PNG üretir
     */
    public static function generate_png_sprite_sheet($layers, $config = []) {
        if (!extension_loaded('gd')) {
            return new WP_Error('gd_missing', 'GD kütüphanesi gerekli', ['status' => 500]);
        }
        
        $grid_w     = $config['grid_width']  ?? 16;
        $grid_h     = $config['grid_height'] ?? 32;
        $total_rows = $config['total_rows']  ?? 8;
        $max_frames = $config['max_frames']  ?? 8;
        
        $sheet_width  = $grid_w * $max_frames;
        $sheet_height = $grid_h * $total_rows;
        
        // HD modu desteği
        $scale = !empty($config['hd_scale']) ? intval($config['hd_scale']) : 1;
        if ($scale > 1) {
            $sheet_width  *= $scale;
            $sheet_height *= $scale;
            $grid_w       *= $scale;
            $grid_h       *= $scale;
        }
        
        // Şeffaf canvas oluştur
        $canvas = imagecreatetruecolor($sheet_width, $sheet_height);
        imagesavealpha($canvas, true);
        imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        
        // Katmanları Z-index sırasına göre sırala
        usort($layers, function($a, $b) {
            $z_a = $a['z_index'] ?? 10;
            $z_b = $b['z_index'] ?? 10;
            return $z_a <=> $z_b;
        });
        
        // Her katmanı canvas'a çiz
        foreach ($layers as $layer) {
            if (empty($layer['image_url'])) continue;
            
            $layer_image = self::load_image_from_url($layer['image_url']);
            if (!$layer_image) continue;
            
            $offset_x = ($layer['offset_x'] ?? 0) * $scale;
            $offset_y = ($layer['offset_y'] ?? 0) * $scale;
            
            // Animasyon kareleri için döngü
            $frames = $layer['anim_frames'] ?? 1;
            $layer_w = imagesx($layer_image);
            $layer_h = imagesy($layer_image);
            
            // Her satır ve her kare için çizim
            for ($row = 0; $row < $total_rows; $row++) {
                for ($frame = 0; $frame < $max_frames; $frame++) {
                    $src_x = ($frame % $frames) * ($layer_w / $frames);
                    $src_y = $row * $layer_h;
                    
                    // Kaynak koordinat kontrolü
                    if ($src_x + ($layer_w / $frames) > $layer_w) continue;
                    if ($src_y + $layer_h > $layer_h * ceil($layer_h / $grid_h)) continue;
                    
                    $dst_x = $frame * $grid_w + $offset_x;
                    $dst_y = $row * $grid_h + $offset_y;
                    
                    // Kopyala (alpha blending ile)
                    imagecopy($canvas, $layer_image, $dst_x, $dst_y, $src_x, 0, $layer_w / $frames, $layer_h);
                }
            }
            
            imagedestroy($layer_image);
        }
        
        // PNG olarak kaydet
        $filename = 'stardew-sprite-' . uniqid() . '.png';
        $filepath = self::$export_dir . $filename;
        
        imagepng($canvas, $filepath, 0);
        imagedestroy($canvas);
        
        return [
            'filename' => $filename,
            'url'      => self::$export_url . $filename,
            'path'     => $filepath,
        ];
    }
    
    /**
     * ZIP dosyası oluştur (PNG + content.json)
     * Content Patcher uyumlu
     */
    public static function generate_zip_with_content_json($layers, $config = []) {
        $png_result = self::generate_png_sprite_sheet($layers, $config);
        
        if (is_wp_error($png_result)) {
            return $png_result;
        }
        
        // content.json oluştur
        $content_json = self::generate_content_json($config);
        
        $zip_filename = 'stardew-mod-' . uniqid() . '.zip';
        $zip_filepath = self::$export_dir . $zip_filename;
        
        $zip = new ZipArchive();
        if ($zip->open($zip_filepath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return new WP_Error('zip_failed', 'ZIP oluşturma başarısız', ['status' => 500]);
        }
        
        // PNG ekle
        $zip->addFile($png_result['path'], 'assets/spritesheet.png');
        
        // content.json ekle
        $zip->addFromString('content.json', json_encode($content_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        // manifest.json (SMAPI için)
        $manifest = [
            'Name'        => $config['mod_name'] ?? 'Stardew Custom Sprite',
            'Author'      => $config['mod_author'] ?? 'Sprite Generator',
            'Version'     => '1.0.0',
            'Description' => $config['mod_description'] ?? 'Custom Stardew Valley sprite generated with Stardew Sprite Generator',
            'UniqueID'    => 'spritegenerator.' . uniqid(),
            'ContentPackFor' => [
                'UniqueID' => 'Pathoschild.ContentPatcher'
            ],
        ];
        $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        $zip->close();
        
        // Geçici PNG'yi temizle
        @unlink($png_result['path']);
        
        return [
            'filename' => $zip_filename,
            'url'      => self::$export_url . $zip_filename,
            'path'     => $zip_filepath,
        ];
    }
    
    /**
     * Content Patcher için content.json oluştur
     */
    private static function generate_content_json($config = []) {
        $sprite_type = $config['sprite_type'] ?? 'character';
        $target_path = 'Characters/Farmer/' . ($config['file_name'] ?? 'farmer_sprite');
        
        $changes = [];
        
        if ($sprite_type === 'character') {
            $changes[] = [
                'Action'    => 'EditImage',
                'Target'    => 'Characters/Farmer/farmer_base',
                'FromFile'  => 'assets/spritesheet.png',
                'ToArea'    => ['X' => 0, 'Y' => 0, 'Width' => 128, 'Height' => 288],
            ];
            
            // Animasyon bazlı değişiklikler
            $changes[] = [
                'Action'    => 'EditImage',
                'Target'    => 'Characters/Farmer/farmer_base_bald',
                'FromFile'  => 'assets/spritesheet.png',
                'ToArea'    => ['X' => 0, 'Y' => 0, 'Width' => 128, 'Height' => 288],
            ];
        } elseif ($sprite_type === 'furniture') {
            $changes[] = [
                'Action'    => 'EditImage',
                'Target'    => 'TileSheets/furniture',
                'FromFile'  => 'assets/spritesheet.png',
                'ToArea'    => ['X' => 0, 'Y' => 0, 'Width' => 16, 'Height' => 32],
            ];
        } elseif ($sprite_type === 'building') {
            $changes[] = [
                'Action'    => 'EditImage',
                'Target'    => 'Buildings/' . ($config['building_name'] ?? 'CustomBuilding'),
                'FromFile'  => 'assets/spritesheet.png',
            ];
        }
        
        return [
            'Format'  => '1.30.0',
            'Changes' => $changes,
        ];
    }
    
    /**
     * URL'den GD image resource yükle
     */
    private static function load_image_from_url($url) {
        $upload_dir = wp_upload_dir();
        $file_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $url);
        
        if (!file_exists($file_path)) {
            // Harici URL ise indir
            $response = wp_remote_get($url);
            if (is_wp_error($response)) return false;
            
            $image_data = wp_remote_retrieve_body($response);
            $file_path = tempnam(sys_get_temp_dir(), 'ssg_');
            file_put_contents($file_path, $image_data);
            $temp_file = true;
        }
        
        $info = getimagesize($file_path);
        if (!$info) return false;
        
        $image = null;
        switch ($info['mime']) {
            case 'image/png':
                $image = imagecreatefrompng($file_path);
                break;
            case 'image/jpeg':
                $image = imagecreatefromjpeg($file_path);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($file_path);
                break;
        }
        
        if (isset($temp_file)) {
            @unlink($file_path);
        }
        
        return $image;
    }
}