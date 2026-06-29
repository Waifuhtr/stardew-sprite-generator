/**
 * Renk İşleme ve Dönüştürme Yardımcıları
 * Hex <-> RGB <-> HSL dönüşümleri ve renk manipülasyonları
 */

/**
 * Hex string'i RGB objesine dönüştür
 * @param {string} hex - #RRGGBB veya #RGB formatında
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        // 3 karakterli hex (#RGB)
        const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
        if (short) {
            return {
                r: parseInt(short[1] + short[1], 16),
                g: parseInt(short[2] + short[2], 16),
                b: parseInt(short[3] + short[3], 16),
            };
        }
        return { r: 0, g: 0, b: 0 };
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

/**
 * RGB objesini hex string'e dönüştür
 * @param {number} r - Kırmızı (0-255)
 * @param {number} g - Yeşil (0-255)
 * @param {number} b - Mavi (0-255)
 * @returns {string} #RRGGBB formatında
 */
export function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.max(0, Math.min(255, n)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * RGB'den HSL'ye dönüşüm
 * @param {number} r - Kırmızı (0-255)
 * @param {number} g - Yeşil (0-255)
 * @param {number} b - Mavi (0-255)
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return { h: h * 360, s, l };
}

/**
 * HSL'den RGB'ye dönüşüm
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(h, s, l) {
    h /= 360;
    
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

/**
 * Renk hue'sını kaydır (renk değiştirme efekti için)
 * @param {string} hexColor - Orijinal renk
 * @param {number} hueShift - Hue kaydırma derecesi (-180 ile 180)
 * @returns {string} Yeni hex renk
 */
export function shiftHue(hexColor, hueShift) {
    const rgb = hexToRgb(hexColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + hueShift) % 360;
    if (hsl.h < 0) hsl.h += 360;
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Renk doygunluğunu ayarla
 * @param {string} hexColor - Orijinal renk
 * @param {number} saturation - Yeni doygunluk (0-1)
 * @returns {string} Yeni hex renk
 */
export function adjustSaturation(hexColor, saturation) {
    const rgb = hexToRgb(hexColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.s = Math.max(0, Math.min(1, saturation));
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Renk parlaklığını ayarla
 * @param {string} hexColor - Orijinal renk
 * @param {number} lightness - Yeni parlaklık (0-1)
 * @returns {string} Yeni hex renk
 */
export function adjustLightness(hexColor, lightness) {
    const rgb = hexToRgb(hexColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, Math.min(1, lightness));
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * İki renk arasında interpolasyon (geçiş)
 * @param {string} color1 - Başlangıç rengi
 * @param {string} color2 - Bitiş rengi
 * @param {number} factor - Geçiş faktörü (0-1)
 * @returns {string} Ara renk
 */
export function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return rgbToHex(r, g, b);
}

/**
 * Palette'e en yakın rengi bul
 * @param {string} targetColor - Hedef renk
 * @param {Array<string>} palette - Renk paleti
 * @returns {string} En yakın renk
 */
export function findNearestColor(targetColor, palette) {
    const targetRgb = hexToRgb(targetColor);
    let nearest = palette[0];
    let minDist = Infinity;
    
    for (const color of palette) {
        const rgb = hexToRgb(color);
        const dist = Math.sqrt(
            Math.pow(targetRgb.r - rgb.r, 2) +
            Math.pow(targetRgb.g - rgb.g, 2) +
            Math.pow(targetRgb.b - rgb.b, 2)
        );
        
        if (dist < minDist) {
            minDist = dist;
            nearest = color;
        }
    }
    
    return nearest;
}

/**
 * Stardew Valley tarzı sınırlı palet oluştur
 * @param {number} colorCount - Palet renk sayısı
 * @returns {Array<string>} Hex renk dizisi
 */
export function generateStardewPalette(colorCount = 16) {
    const palette = [];
    const goldenRatio = 0.618033988749895;
    let hue = Math.random();
    
    for (let i = 0; i < colorCount; i++) {
        hue += goldenRatio;
        hue %= 1;
        const rgb = hslToRgb(hue * 360, 0.5, 0.5);
        palette.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    
    return palette;
}

/**
 * Asset'in baz rengini hedef renge dönüştür
 * (Saç, kıyafet rengi değiştirme için)
 * @param {ImageData} imageData - Orijinal görüntü verisi
 * @param {string} baseColor - Orijinal baz renk
 * @param {string} targetColor - Hedef renk
 * @param {number} tolerance - Tolerans (0-255)
 * @returns {ImageData} Değiştirilmiş görüntü verisi
 */
export function recolorAsset(imageData, baseColor, targetColor, tolerance = 30) {
    const { data, width, height } = imageData;
    const baseRgb = hexToRgb(baseColor);
    const targetRgb = hexToRgb(targetColor);
    
    // RGB fark oranını hesapla
    const ratioR = targetRgb.r / Math.max(baseRgb.r, 1);
    const ratioG = targetRgb.g / Math.max(baseRgb.g, 1);
    const ratioB = targetRgb.b / Math.max(baseRgb.b, 1);
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a === 0) continue; // Şeffaf piksel
        
        // Baz renge yakınlık kontrolü
        const dist = Math.sqrt(
            Math.pow(r - baseRgb.r, 2) +
            Math.pow(g - baseRgb.g, 2) +
            Math.pow(b - baseRgb.b, 2)
        );
        
        if (dist <= tolerance) {
            // Gri tonlama faktörü (renk tonunu koru ama parlaklığı ayarla)
            const grayFactor = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            
            data[i]     = Math.min(255, Math.round(targetRgb.r * grayFactor));
            data[i + 1] = Math.min(255, Math.round(targetRgb.g * grayFactor));
            data[i + 2] = Math.min(255, Math.round(targetRgb.b * grayFactor));
        }
    }
    
    return imageData;
}

/**
 * Canvas piksel verisinden belirli bir bölgeyi kırp
 * @param {ImageData} imageData - Tam görüntü verisi
 * @param {number} x - Başlangıç X
 * @param {number} y - Başlangıç Y
 * @param {number} w - Genişlik
 * @param {number} h - Yükseklik
 * @returns {ImageData} Kırpılmış görüntü verisi
 */
export function cropImageData(imageData, x, y, w, h) {
    const { data, width } = imageData;
    const cropped = new ImageData(w, h);
    
    for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
            const srcIdx = ((y + row) * width + (x + col)) * 4;
            const dstIdx = (row * w + col) * 4;
            
            cropped.data[dstIdx]     = data[srcIdx];
            cropped.data[dstIdx + 1] = data[srcIdx + 1];
            cropped.data[dstIdx + 2] = data[srcIdx + 2];
            cropped.data[dstIdx + 3] = data[srcIdx + 3];
        }
    }
    
    return cropped;
}

/**
 * Canvas'ı ölçekle
 * @param {HTMLCanvasElement} canvas - Orijinal canvas
 * @param {number} scaleX - X ölçeği
 * @param {number} scaleY - Y ölçeği
 * @returns {HTMLCanvasElement} Ölçeklenmiş canvas
 */
export function scaleCanvas(canvas, scaleX, scaleY) {
    const scaled = document.createElement('canvas');
    scaled.width = canvas.width * scaleX;
    scaled.height = canvas.height * scaleY;
    
    const ctx = scaled.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Piksel art için keskin kenarlar
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    
    return scaled;
}

export default {
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    shiftHue,
    adjustSaturation,
    adjustLightness,
    interpolateColor,
    findNearestColor,
    generateStardewPalette,
    recolorAsset,
    cropImageData,
    scaleCanvas,
};