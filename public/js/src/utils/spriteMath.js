/**
 * Sprite Matematik ve Koordinat Hesaplama Modülü
 * Stardew Valley'nin sprite sheet yapısına uygun offset ve grid hesaplamaları
 */

/**
 * Standart Stardew Valley karakter sprite sheet yapısı:
 * - Her bir kare (frame) 16x32 piksel
 * - 4 yön (Aşağı, Sağ, Yukarı, Sol) x 4 satır
 * - Her animasyon 4-8 kare içerir
 * - Tool use: 4 satır x 6 kare (sallama animasyonu)
 * 
 * Sheet düzeni (8 satır):
 * Row 0: Aşağı yürüme (4 kare) + koşma (4 kare) = 8 kare
 * Row 1: Sağ yürüme + koşma
 * Row 2: Yukarı yürüme + koşma
 * Row 3: Sol yürüme + koşma
 * Row 4-7: Ekstra animasyonlar (sulama, alet kullanma, vb.)
 */

// Stardew Valley standart frame boyutları
export const STANDARD_FRAME = {
    width: 16,
    height: 32,
};

// Animasyon satır mappingleri
export const ANIMATION_ROWS = {
    idle_down:  { row: 0, frames: 1, desc: 'Durma - Aşağı' },
    walk_down:  { row: 0, frames: 4, desc: 'Yürüme - Aşağı' },
    run_down:   { row: 0, frames: 8, desc: 'Koşma - Aşağı', startFrame: 4 },
    idle_right: { row: 1, frames: 1, desc: 'Durma - Sağ' },
    walk_right: { row: 1, frames: 4, desc: 'Yürüme - Sağ' },
    run_right:  { row: 1, frames: 8, desc: 'Koşma - Sağ', startFrame: 4 },
    idle_up:    { row: 2, frames: 1, desc: 'Durma - Yukarı' },
    walk_up:    { row: 2, frames: 4, desc: 'Yürüme - Yukarı' },
    run_up:     { row: 2, frames: 8, desc: 'Koşma - Yukarı', startFrame: 4 },
    idle_left:  { row: 3, frames: 1, desc: 'Durma - Sol' },
    walk_left:  { row: 3, frames: 4, desc: 'Yürüme - Sol' },
    run_left:   { row: 3, frames: 8, desc: 'Koşma - Sol', startFrame: 4 },
    tool_down:  { row: 4, frames: 6, desc: 'Alet - Aşağı' },
    tool_right: { row: 5, frames: 6, desc: 'Alet - Sağ' },
    tool_up:    { row: 6, frames: 6, desc: 'Alet - Yukarı' },
    tool_left:  { row: 7, frames: 6, desc: 'Alet - Sol' },
};

/**
 * Belirli bir animasyonun sheet üzerindeki koordinatlarını hesapla
 * @param {string} animName - Animasyon adı (örn: 'walk_down')
 * @param {number} frameIndex - Kare indeksi
 * @param {number} gridW - Grid genişliği
 * @param {number} gridH - Grid yüksekliği
 * @returns {{x: number, y: number}} Koordinatlar
 */
export function getFramePosition(animName, frameIndex = 0, gridW = 16, gridH = 32) {
    const anim = ANIMATION_ROWS[animName];
    if (!anim) return { x: 0, y: 0 };
    
    const row = anim.row;
    const startFrame = anim.startFrame || 0;
    const actualFrame = startFrame + frameIndex;
    
    return {
        x: actualFrame * gridW,
        y: row * gridH,
    };
}

/**
 * Bir layer'in tüm animasyon kareleri için konumunu hesapla
 * Z-index, offset ve layer tipine göre pozisyon belirlenir
 * 
 * @param {Object} layer - Katman objesi
 * @param {number} frameIndex - Kare indeksi
 * @param {number} rowIndex - Satır indeksi
 * @param {Object} config - Sprite yapılandırması
 * @returns {{srcX, srcY, dstX, dstY, frameW, frameH}} Koordinatlar
 */
export function calculateLayerPosition(layer, frameIndex, rowIndex, config) {
    const gridW = config.gridW;
    const gridH = config.gridH;
    const scale = config.hdScale || 1;
    
    // Katmanın kendi boyutları
    const layerFrameW = (layer.frameWidth || gridW);
    const layerFrameH = (layer.frameHeight || gridH);
    
    // Animasyon frame sayısı
    const animFrames = layer.animFrames || 1;
    const actualFrame = animFrames > 1 ? (frameIndex % animFrames) : 0;
    
    // Kaynak koordinatlar (layer image üzerinde)
    const srcX = actualFrame * layerFrameW;
    const srcY = 0; // Tek satırlı layer varsayımı
    
    // Hedef koordinatlar (canvas üzerinde)
    const offsetX = (layer.offsetX || 0) * scale;
    const offsetY = (layer.offsetY || 0) * scale;
    const dstX = (frameIndex * gridW * scale) + offsetX;
    const dstY = (rowIndex * gridH * scale) + offsetY;
    
    return {
        srcX,
        srcY,
        dstX,
        dstY,
        frameW: layerFrameW,
        frameH: layerFrameH,
    };
}

/**
 * Z-index değerine göre katmanları sırala
 * Düşük z-index = arka plan, Yüksek z-index = ön plan
 * 
 * @param {Array} layers - Katman dizisi
 * @returns {Array} Sıralanmış katmanlar
 */
export function sortLayersByZIndex(layers) {
    const zIndexMap = {
        body: 1,
        skin: 2,
        eyes: 3,
        undershirt: 4,
        shirt: 5,
        pants: 8,
        shoes: 10,
        hair_back: 15,
        accessory: 18,
        hair_front: 20,
        hat_back: 25,
        hat: 30,
        hat_front: 35,
    };
    
    return [...layers].sort((a, b) => {
        const zA = a.zIndex ?? zIndexMap[a.category] ?? 10;
        const zB = b.zIndex ?? zIndexMap[b.category] ?? 10;
        return zA - zB;
    });
}

/**
 * Grid çizgileri için koordinat hesapla
 * @param {number} width - Canvas genişliği
 * @param {number} height - Canvas yüksekliği
 * @param {number} gridW - Grid hücre genişliği
 * @param {number} gridH - Grid hücre yüksekliği
 * @param {number} scale - Zoom/ölçek
 * @returns {Array<{x1,y1,x2,y2}>} Çizgi koordinatları
 */
export function calculateGridLines(width, height, gridW, gridH, scale = 1) {
    const lines = [];
    const cellW = gridW * scale;
    const cellH = gridH * scale;
    
    // Dikey çizgiler
    for (let x = 0; x <= width; x += cellW) {
        lines.push({ x1: x, y1: 0, x2: x, y2: height });
    }
    
    // Yatay çizgiler
    for (let y = 0; y <= height; y += cellH) {
        lines.push({ x1: 0, y1: y, x2: width, y2: y });
    }
    
    return lines;
}

/**
 * HD ölçeklendirme faktörü hesapla
 * @param {boolean} isHD - HD modu aktif mi
 * @param {number} customScale - Özel ölçek değeri
 * @returns {number} Ölçek faktörü
 */
export function calculateHDScale(isHD, customScale = 2) {
    return isHD ? Math.max(1, customScale) : 1;
}

/**
 * Sprite sheet toplam boyutunu hesapla
 * @param {Object} config - Sprite yapılandırması
 * @param {number} hdScale - HD ölçeği
 * @returns {{width: number, height: number}} Boyutlar
 */
export function calculateSheetDimensions(config, hdScale = 1) {
    const frameW = config.gridW * hdScale;
    const frameH = config.gridH * hdScale;
    const totalFrames = config.maxFrames;
    const totalRows = config.rows;
    
    return {
        width: frameW * totalFrames,
        height: frameH * totalRows,
    };
}

/**
 * PNG export için tüm katmanları düzleştir (flatten)
 * Alpha blending ile katmanları birleştir
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} layers - Katman dizisi
 * @param {Object} config - Yapılandırma
 * @param {HTMLCanvasElement} tempCanvas - Geçici canvas
 */
export function flattenLayers(ctx, layers, config, tempCanvas) {
    const sorted = sortLayersByZIndex(layers);
    const tempCtx = tempCanvas.getContext('2d');
    
    sorted.forEach(layer => {
        if (!layer.visible || !layer.image) return;
        
        const img = layer.image;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(img, 0, 0);
        
        ctx.globalAlpha = layer.opacity || 1;
        ctx.globalCompositeOperation = layer.blendMode || 'source-over';
        ctx.drawImage(tempCanvas, 0, 0);
    });
    
    // Reset
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Belirli bir pikselin hangi katmana ait olduğunu bul
 * (Piksel editörde tıklanan noktayı belirlemek için)
 * 
 * @param {number} x - Tıklanan X koordinatı
 * @param {number} y - Tıklanan Y koordinatı
 * @param {Array} layers - Katmanlar
 * @param {number} scale - Zoom ölçeği
 * @returns {Object|null} Bulunan katman
 */
export function hitTestPixel(x, y, layers, scale = 1) {
    // Z-index'e göre ters sırala (ön plandaki katmanları önce kontrol et)
    const sorted = sortLayersByZIndex(layers).reverse();
    
    for (const layer of sorted) {
        if (!layer.visible) continue;
        
        const lx = (layer.x || 0) * scale;
        const ly = (layer.y || 0) * scale;
        const lw = (layer.width || 16) * scale;
        const lh = (layer.height || 32) * scale;
        
        if (x >= lx && x < lx + lw && y >= ly && y < ly + lh) {
            // Pikselin alpha değerini kontrol et
            if (layer.pixelData) {
                const px = Math.floor((x - lx) / scale);
                const py = Math.floor((y - ly) / scale);
                const idx = (py * layer.width + px) * 4;
                if (layer.pixelData[idx + 3] > 0) {
                    return layer;
                }
            } else {
                return layer;
            }
        }
    }
    
    return null;
}

/**
 * Flood Fill algoritması (Boya Kovası) için komşu pikselleri bul
 * @param {ImageData} imageData - Görüntü verisi
 * @param {number} startX - Başlangıç X
 * @param {number} startY - Başlangıç Y
 * @param {Uint8ClampedArray} targetColor - Hedef renk [R,G,B,A]
 * @returns {Array<{x,y}>} Doldurulacak piksel koordinatları
 */
export function floodFillGetPixels(imageData, startX, startY, targetColor) {
    const { width, height, data } = imageData;
    const pixels = [];
    const visited = new Set();
    
    // Başlangıç rengi
    const startIdx = (startY * width + startX) * 4;
    const startColor = [
        data[startIdx],
        data[startIdx + 1],
        data[startIdx + 2],
        data[startIdx + 3],
    ];
    
    // Aynı renge tıklandıysa çık
    if (colorsEqual(startColor, targetColor)) return pixels;
    
    const stack = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const key = `${x},${y}`;
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (visited.has(key)) continue;
        
        const idx = (y * width + x) * 4;
        const currentColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
        
        if (!colorsEqual(currentColor, startColor)) continue;
        
        visited.add(key);
        pixels.push({ x, y });
        
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
    }
    
    return pixels;
}

function colorsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

export default {
    getFramePosition,
    calculateLayerPosition,
    sortLayersByZIndex,
    calculateGridLines,
    calculateHDScale,
    calculateSheetDimensions,
    flattenLayers,
    hitTestPixel,
    floodFillGetPixels,
    ANIMATION_ROWS,
    STANDARD_FRAME,
};