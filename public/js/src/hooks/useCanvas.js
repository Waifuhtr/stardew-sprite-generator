/**
 * Canvas Yönetim Hook'u
 * Render döngüsü, export, piksel işlemleri
 */

import { useRef, useCallback, useEffect } from 'react';
import { sortLayersByZIndex } from '../utils/spriteMath';

export function useCanvas(config, layers, hdScale = 1) {
    const canvasRef = useRef(null);
    const pixelCanvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const isRenderingRef = useRef(false);
    
    const getCanvasSize = useCallback(() => {
        return {
            width: config.gridW * config.maxFrames * hdScale,
            height: config.gridH * config.rows * hdScale,
        };
    }, [config, hdScale]);
    
    /**
     * Tüm katmanları canvas'a çiz
     */
    const renderLayers = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || isRenderingRef.current) return;
        
        isRenderingRef.current = true;
        const ctx = canvas.getContext('2d');
        const { width, height } = getCanvasSize();
        
        canvas.width = width;
        canvas.height = height;
        
        // Şeffaf arka plan
        ctx.clearRect(0, 0, width, height);
        
        // Katmanları Z-index sırasına göre sırala ve çiz
        const sorted = sortLayersByZIndex(layers);
        
        sorted.forEach(layer => {
            if (!layer.visible) return;
            
            // Resim yükleme
            if (layer.imageUrl && !layer.image) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    layer.image = img;
                    layer.width = img.width;
                    layer.height = img.height;
                    renderLayers();
                };
                img.src = layer.imageUrl;
                return;
            }
            
            if (!layer.image) return;
            
            const scale = hdScale;
            const gridW = config.gridW * scale;
            const gridH = config.gridH * scale;
            
            // Her satır ve her kare için çiz
            for (let row = 0; row < config.rows; row++) {
                for (let frame = 0; frame < config.maxFrames; frame++) {
                    const animFrames = layer.animFrames || 1;
                    const srcFrame = animFrames > 1 ? (frame % animFrames) : 0;
                    
                    const srcX = srcFrame * (layer.frameWidth || config.gridW);
                    const srcY = 0; // Tek satırlı layer
                    const srcW = layer.frameWidth || config.gridW;
                    const srcH = layer.frameHeight || config.gridH;
                    
                    const dstX = (frame * gridW) + ((layer.offsetX || 0) * scale);
                    const dstY = (row * gridH) + ((layer.offsetY || 0) * scale);
                    const dstW = gridW;
                    const dstH = gridH;
                    
                    try {
                        ctx.globalAlpha = layer.opacity || 1;
                        ctx.imageSmoothingEnabled = false; // Piksel art için
                        ctx.drawImage(
                            layer.image,
                            srcX, srcY, srcW, srcH,
                            dstX, dstY, dstW, dstH
                        );
                    } catch (e) {
                        // Resim henüz yüklenmemiş olabilir
                    }
                }
            }
        });
        
        ctx.globalAlpha = 1;
        isRenderingRef.current = false;
    }, [layers, config, hdScale, getCanvasSize]);
    
    /**
     * Canvas'ı PNG veya ZIP olarak dışa aktar
     */
    const exportCanvas = useCallback(async (format = 'png') => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        if (format === 'png') {
            canvas.toBlob(async (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stardew-sprite-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        } else if (format === 'zip') {
            // ZIP export için backend API'ye gönder
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const base64 = await blobToBase64(blob);
            
            try {
                const response = await fetch(`${window.ssgConfig.restUrl}export/zip`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.ssgConfig.nonce,
                    },
                    body: JSON.stringify({
                        layers: layers.map(l => ({
                            image_url: l.imageUrl,
                            z_index: l.zIndex,
                            offset_x: l.offsetX,
                            offset_y: l.offsetY,
                            anim_frames: l.animFrames,
                        })),
                        config: {
                            grid_width: config.gridW,
                            grid_height: config.gridH,
                            total_rows: config.rows,
                            max_frames: config.maxFrames,
                            hd_scale: hdScale,
                            mod_name: 'Custom Stardew Sprite',
                        },
                    }),
                });
                
                const data = await response.json();
                if (data.success && data.download_url) {
                    const a = document.createElement('a');
                    a.href = data.download_url;
                    a.download = data.file_name;
                    a.click();
                }
            } catch (error) {
                console.error('ZIP export hatası:', error);
                // Client-side fallback
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `stardew-sprite-${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }, 'image/png');
            }
        }
    }, [layers, config, hdScale]);
    
    /**
     * Belirli bir bölgedeki piksel verisini getir
     */
    const getPixelData = useCallback((x, y, w, h) => {
        const canvas = pixelCanvasRef.current || canvasRef.current;
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(x, y, w, h);
    }, []);
    
    /**
     * Piksel verisini belirli bir bölgeye yaz
     */
    const setPixelData = useCallback((imageData, x, y) => {
        const canvas = pixelCanvasRef.current || canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, x, y);
    }, []);
    
    /**
     * Flood fill (Boya Kovası) işlemi
     */
    const floodFill = useCallback((x, y, fillColor) => {
        const canvas = pixelCanvasRef.current || canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        
        const targetIdx = (y * width + x) * 4;
        const targetColor = [
            data[targetIdx],
            data[targetIdx + 1],
            data[targetIdx + 2],
            data[targetIdx + 3],
        ];
        
        const fillRgb = hexToRgb(fillColor);
        const fillRgba = [fillRgb.r, fillRgb.g, fillRgb.b, 255];
        
        // Aynı renkse çık
        if (colorsEqual(targetColor, fillRgba)) return;
        
        const stack = [[x, y]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
            if (visited.has(key)) continue;
            
            const idx = (cy * width + cx) * 4;
            const current = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            
            if (!colorsEqual(current, targetColor)) continue;
            
            visited.add(key);
            data[idx] = fillRgb.r;
            data[idx + 1] = fillRgb.g;
            data[idx + 2] = fillRgb.b;
            data[idx + 3] = 255;
            
            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }, []);
    
    // İlk render
    useEffect(() => {
        renderLayers();
    }, [layers, hdScale, renderLayers]);
    
    return {
        canvasRef,
        pixelCanvasRef,
        renderLayers,
        exportCanvas,
        getPixelData,
        setPixelData,
        floodFill,
    };
}

// Yardımcı fonksiyonlar
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
}

function colorsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}