# 🌾 Stardew Sprite Generator

**Stardew Valley Karakter ve Obje Sprite Sheet Oluşturucu & Piksel Editörü**

WordPress üzerinde çalışan, Stardew Valley mod geliştiricileri ve topluluğu için tasarlanmış kapsamlı bir sprite editörü ve sheet üretici eklentisi.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Waifuhtr/stardew-sprite-generator)
[![WordPress](https://img.shields.io/badge/WordPress-5.8%2B-green.svg)](https://wordpress.org/)
[![License](https://img.shields.io/badge/license-GPL--2.0%2B-red.svg)](https://www.gnu.org/licenses/gpl-2.0.html)

---

## ✨ Özellikler

### 🎨 Frontend: Katmanlı Render ve Sprite Sheet Üreticisi
- **Tam Sprite Sheet Üretimi**: Sadece duran hal değil, tüm animasyon karelerini (yürüme, koşma, alet kullanma, sulama) destekler
- **Katmanlama Sistemi**: Vücut → Cilt → Gözler → Saç → Kıyafet → Şapka gibi Z-index tabanlı otomatik sıralama
- **Genişletilmiş Nesne Desteği**: Karakter, mobilya, bina, hayvan, alet modülleri
- **HD/Custom Çözünürlük**: 1x (16px), 2x (32px), 4x (64px) ölçek desteği
- **Dinamik Grid Sistemi**: Piksel-perfect grid hizalama

### ✏️ Entegre Piksel Editörü
- **Kalem (Pencil)**: Piksel piksel çizim
- **Silgi (Eraser)**: Şeffaf piksel silme
- **Renk Seçici (Eyedropper)**: Mevcut piksel rengini alma
- **Boya Kovası (Flood Fill)**: Alan doldurma
- **Geri Al / İleri Al (Undo/Redo)**: 50 adımlık geçmiş
- **Zoom & Pan**: Kolay navigasyon
- **Renk Paleti**: Ön ayarlı renkler ve hex girişi

### 🗄️ Backend: Asset Yönetim Sistemi
- **Custom Post Type**: `stardew_asset` ile organize asset yapısı
- **Taksonomiler**: `asset_category` ve `asset_type` ile filtreleme
- **Metadata Sistemi**: Z-index, offset, grid boyutu, animasyon kare sayısı, cinsiyet kısıtlaması
- **REST API Endpointleri**: Tam CRUD işlemleri
- **Kullanıcı Kitaplığı**: Kayıtlı kullanıcıların sprite'larını kaydetme ve düzenleme

### 📦 İhracat (Export) Sistemi
- **PNG Sprite Sheet**: Şeffaf arka plan, SMAPI/Content Patcher uyumlu
- **ZIP Paketi**: PNG + `content.json` + `manifest.json`
- **Content Patcher Entegrasyonu**: Hazır mod yapısı

---

## 🚀 Kurulum

### Gereksinimler
- WordPress 5.8+
- PHP 7.4+
- GD kütüphanesi (PHP)
- ZIP eklentisi (PHP) - ZIP export için

### Adımlar

1. Repoyu klonlayın veya ZIP olarak indirin:
```bash
git clone https://github.com/Waifuhtr/stardew-sprite-generator.git
```

2. WordPress eklentiler dizinine kopyalayın:
```bash
cp -r stardew-sprite-generator /var/www/html/wp-content/plugins/
```

3. WordPress Admin Paneli → Eklentiler → "Stardew Sprite Generator" etkinleştirin.

4. Sayfa oluşturun ve shortcode ekleyin:
```
[stardew_sprite_generator type="character"]
```

### Shortcode Parametreleri

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `type` | Sprite türü: `character`, `furniture`, `building`, `animal`, `tool` | `character` |

---

## 🏗️ Mimari

### Dosya Yapısı

```
stardew-sprite-generator/
├── stardew-sprite-generator.php    # Ana eklenti dosyası
├── includes/
│   ├── class-cpt.php               # Custom Post Types & Taxonomies
│   ├── class-rest-api.php          # REST API Endpointleri
│   ├── class-asset-manager.php     # Asset Yönetimi & Enqueue
│   ├── class-user-library.php      # Kullanıcı Kitaplığı & Shortcodes
│   ├── class-export.php            # PNG/ZIP Export Sistemi
│   └── class-admin.php             # Admin Paneli
├── admin/
│   ├── css/
│   │   └── admin.css               # Admin stilleri
│   └── js/
│       └── admin.js                # Admin JavaScript
├── public/
│   ├── js/
│   │   ├── dist/                   # Build edilmiş bundle
│   │   └── src/                    # Kaynak kodlar
│   │       ├── index.js            # Entry point
│   │       ├── App.js              # Ana bileşen
│   │       ├── components/
│   │       │   ├── CanvasRenderer.js    # Canvas render motoru
│   │       │   ├── LayerPanel.js        # Katman yönetimi
│   │       │   ├── AssetBrowser.js      # Asset kütüphanesi
│   │       │   ├── PixelEditor.js       # Piksel editörü
│   │       │   ├── AnimationPreview.js  # Animasyon önizleme
│   │       │   ├── ExportPanel.js       # Export paneli
│   │       │   └── Toolbar.js           # Toolbar
│   │       ├── hooks/
│   │       │   ├── useLayers.js    # Katman yönetimi hook'u
│   │       │   └── useCanvas.js    # Canvas yönetimi hook'u
│   │       └── utils/
│   │           ├── spriteMath.js   # Sprite matematiği & offset hesaplamaları
│   │           └── colorUtils.js   # Renk işleme & dönüşümler
│   └── css/
│       └── style.css               # Ana stiller
└── README.md
```

---

## 🔌 REST API Endpoints

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/wp-json/ssg/v1/assets` | GET | Tüm assetleri listele (filtre destekli) |
| `/wp-json/ssg/v1/assets` | POST | Yeni asset oluştur |
| `/wp-json/ssg/v1/assets/{id}` | GET | Tekil asset getir |
| `/wp-json/ssg/v1/assets/{id}` | DELETE | Asset sil |
| `/wp-json/ssg/v1/library` | GET | Kullanıcı kitaplığını getir |
| `/wp-json/ssg/v1/library` | POST | Kitaplığa kaydet |
| `/wp-json/ssg/v1/library/{id}` | DELETE | Kitaplıktan sil |
| `/wp-json/ssg/v1/export/png` | POST | PNG sprite sheet üret |
| `/wp-json/ssg/v1/export/zip` | POST | ZIP (PNG + content.json) üret |
| `/wp-json/ssg/v1/categories` | GET | Kategoriler ve tipler |
| `/wp-json/ssg/v1/config/sprite-structure` | GET | Sprite yapılandırması |

---

## 🧮 Katmanlama (Layering) Algoritması

Stardew Valley karakter sprite'larında katmanlar şu Z-index sırasına göre render edilir:

```
Z-Index | Katman       | Açıklama
--------|--------------|------------------
1       | body         | Vücut (base)
2       | skin         | Cilt tonu
3       | eyes         | Gözler
5       | nose         | Burun
6       | mouth        | Ağız
10      | shirt        | Gömlek/Kazak
12      | sleeves      | Kolluklar
15      | pants        | Pantolon
18      | shoes        | Ayakkabılar
20      | hair_back    | Saç (arka)
25      | accessory    | Aksesuarlar
26      | hair_front   | Saç (ön)
30      | hat          | Şapka
35      | hat_front    | Şapka (ön detay)
```

Her asset'in metadata'sında `z_index`, `offset_x`, `offset_y` değerleri bulunur. Canvas render döngüsü bu değerlere göre her kareyi (frame) ayrı ayrı pozisyonlar.

### Offset Hesaplama
```
dstX = (frameIndex × gridWidth × hdScale) + (offsetX × hdScale)
dstY = (rowIndex × gridHeight × hdScale) + (offsetY × hdScale)
```

---

## 📝 Changelog

### v1.0.0
- İlk sürüm
- Karakter, mobilya, bina, hayvan, alet sprite desteği
- Katmanlı render sistemi
- Piksel editör (Kalem, Silgi, Renk Seçici, Boya Kovası)
- Animasyon önizleme (yürüme, koşma, alet kullanma)
- PNG ve ZIP export
- Content Patcher entegrasyonu
- Kullanıcı kitaplığı
- HD ölçeklendirme (1x, 2x, 4x)

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Commit yapın (`git commit -am 'Yeni özellik eklendi'`)
4. Push yapın (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje GPL-2.0+ lisansı altında dağıtılmaktadır.

Stardew Valley © ConcernedApe. Bu proje resmi bir ürün değildir ve ConcernedApe ile bağlantılı değildir.

---

## 🙏 Teşekkürler

- [Stardew Valley](https://www.stardewvalley.net/) - ConcernedApe
- [SMAPI](https://smapi.io/) - Stardew Modding API
- [Content Patcher](https://www.nexusmods.com/stardewvalley/mods/1915) - Pathoschild
- [stardew-dressup](https://github.com/lybell-art/stardew-dressup) - İlham kaynağı
- [Spriters Resource](https://www.spriters-resource.com/) - Sprite referansları