<?php
/**
 * Plugin Name: Stardew Sprite Generator
 * Plugin URI:  https://github.com/Waifuhtr/stardew-sprite-generator
 * Description: Karakter ve Obje Sprite Sheet Oluşturucu & Piksel Editörü
 * Version:     1.0.0
 * Author:      Waifuhtr
 * License:     GPL-2.0+
 * Text Domain: stardew-sprite-generator
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SSG_VERSION', '1.0.0');
define('SSG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SSG_PLUGIN_URL', plugin_dir_url(__FILE__));

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'SSG_';
    if (strpos($class, $prefix) !== 0) return;
    
    $file = SSG_PLUGIN_DIR . 'includes/' . str_replace('_', '-', strtolower(substr($class, strlen($prefix)))) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Init
add_action('plugins_loaded', function () {
    SSG_CPT::init();
    SSG_REST_API::init();
    SSG_Asset_Manager::init();
    SSG_User_Library::init();
    SSG_Export::init();
    
    if (is_admin()) {
        SSG_Admin::init();
    }
});

// Activation hook
register_activation_hook(__FILE__, function () {
    require_once SSG_PLUGIN_DIR . 'includes/class-cpt.php';
    SSG_CPT::init();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});