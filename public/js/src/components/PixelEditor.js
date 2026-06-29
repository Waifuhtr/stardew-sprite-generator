/**
 * Piksel Editör Bileşeni
 * Aseprite/Piskel benzeri mini piksel editör
 * Kalem, silgi, renk seçici, boya kovası araçları
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { floodFillGetPixels } from '../utils/spriteMath';
import { hexToRgb } from '../utils/colorUtils';

const PixelEditor = forwardRef(({
    config,
    layers,
    selectedLayerId,
    tool,
    primaryColor,
    secondaryColor,
    zoom,
    onPixelChange,
    onFloodFill,
    onColorPick,
}, ref) => {
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [previewCanvas, setPreviewCanvas] = useState(null);
    
    const pixelScale = zoom * 4; // Piksel editörde daha büyük çalış
    const gridW = config.gridW;
    const gridH = config.gridH;
    const displayW = gridW * pixelScale;
    const displayH = gridH * pixelScale;
    
    // Seçili layer'in piksel verisini yükle
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = gridW;
        canvas.height = gridH;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, gridW, gridH);
        
        // Layer'ın mevcut görüntüsünü yükle
        if (selectedLayerId) {
            const layer = layers.find(l => l.id === selectedLayerId);
            if (layer && layer.imageUrl) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Sadece ilk kareyi yükle
                    const frameW = layer.frameWidth || gridW;
                    ctx.drawImage(img, 0, 0, frameW, layer.frameHeight || gridH, 0, 0, gridW, gridH);
                };
                img.src = layer.imageUrl;
            }
        }
        
        // Grid çiz
        drawPixelGrid();
    }, [selectedLayerId, layers, gridW, gridH]);
    
    // Piksel grid çiz
    const drawPixelGrid = () => {
        const overlay = overlayCanvasRef.current;
        if (!overlay) return;
        
        overlay.width = displayW;
        overlay.height = displayH;
        
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, displayW, displayH);
        
        // Piksel grid çizgileri
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= displayW; x += pixelScale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, displayH);
            ctx.stroke();
        }
        
        for (let y = 0; y <= displayH; y += pixelScale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(displayW, y);
            ctx.stroke();
        }
        
        // Hover vurgusu
        if (cursorPos.x >= 0 && cursorPos.x < gridW && cursorPos.y >= 0 && cursorPos.y < gridH) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(
                cursorPos.x * pixelScale,
                cursorPos.y * pixelScale,
                pixelScale,
                pixelScale
            );
        }
    };
    
    // Mouse koordinatlarını piksel koordinatlarına çevir
    const getPixelCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: -1, y: -1 };
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = gridW / rect.width;
        const scaleY = gridH / rect.height;
        
        return {
            x: Math.floor((e.clientX - rect.left) * scaleX),
            y: Math.floor((e.clientY - rect.top) * scaleY),
        };
    };
    
    const handleMouseDown = (e) => {
        if (!selectedLayerId) return;
        
        const { x, y } = getPixelCoords(e);
        if (x < 0 || x >= gridW || y < 0 || y >= gridH) return;
        
        setIsDrawing(true);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const color = e.button === 2 ? secondaryColor : primaryColor;
        
        switch (tool) {
            case 'pencil':
                drawPixel(ctx, x, y, color);
                break;
                
            case 'eraser':
                erasePixel(ctx, x, y);
                break;
                
            case 'eyedropper':
                pickColor(ctx, x, y);
                break;
                
            case 'fill':
                performFloodFill(ctx, x, y, color);
                break;
                
            case 'line':
            case 'rectangle':
            case 'circle':
                // Şekil çizimi için başlangıç noktasını kaydet
                setPreviewCanvas({ startX: x, startY: y });
                break;
                
            default:
                drawPixel(ctx, x, y, color);
        }
        
        // Canvas değişikliğini parent'a bildir
        if (onPixelChange) {
            const imageData = ctx.getImageData(0, 0, gridW, gridH);
            onPixelChange(imageData, 0, 0);
        }
    };
    
    const handleMouseMove = (e) => {
        const { x, y } = getPixelCoords(e);
        setCursorPos({ x, y });
        
        if (!isDrawing || !selectedLayerId) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const color = e.buttons === 2 ? secondaryColor : primaryColor;
        
        if (tool === 'pencil' || tool === 'eraser') {
            if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
                if (tool === 'pencil') {
                    drawPixel(ctx, x, y, color);
                } else {
                    erasePixel(ctx, x, y);
                }
                
                if (onPixelChange) {
                    const imageData = ctx.getImageData(0, 0, gridW, gridH);
                    onPixelChange(imageData, 0, 0);
                }
            }
        }
    };
    
    const handleMouseUp = () => {
        setIsDrawing(false);
        setPreviewCanvas(null);
    };
    
    const drawPixel = (ctx, x, y, color) => {
        const rgb = hexToRgb(color);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    };
    
    const erasePixel = (ctx, x, y) => {
        ctx.clearRect(x, y, 1, 1);
    };
    
    const pickColor = (ctx, x, y) => {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] > 0) {
            const hex = '#' + [pixel[0], pixel[1], pixel[2]]
                .map(v => v.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();
            onColorPick(hex);
        }
    };
    
    const performFloodFill = (ctx, x, y, color) => {
        const imageData = ctx.getImageData(0, 0, gridW, gridH);
        const rgb = hexToRgb(color);
        const fillRgba = [rgb.r, rgb.g, rgb.b, 255];
        
        const pixels = floodFillGetPixels(imageData, x, y, fillRgba);
        
        pixels.forEach(p => {
            const idx = (p.y * gridW + p.x) * 4;
            imageData.data[idx] = rgb.r;
            imageData.data[idx + 1] = rgb.g;
            imageData.data[idx + 2] = rgb.b;
            imageData.data[idx + 3] = 255;
        });
        
        ctx.putImageData(imageData, 0, 0);
    };
    
    // Sağ tık menüsünü engelle
    const handleContextMenu = (e) => {
        e.preventDefault();
    };
    
    // Cursor stilini belirle
    const getCursorStyle = () => {
        switch (tool) {
            case 'eyedropper': return 'crosshair';
            case 'fill': return 'pointer';
            default: return 'cell';
        }
    };
    
    return (
        <div className="ssg-pixel-editor">
            <div className="ssg-pixel-editor-header">
                <h3>Piksel Editör</h3>
                {!selectedLayerId && (
                    <p className="ssg-pixel-editor-hint">Düzenlemek için bir katman seçin</p>
                )}
                <span className="ssg-pixel-coords">
                    X: {cursorPos.x}, Y: {cursorPos.y}
                </span>
            </div>
            
            <div className="ssg-pixel-canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    className="ssg-pixel-canvas"
                    style={{
                        width: displayW,
                        height: displayH,
                        imageRendering: 'pixelated',
                        cursor: getCursorStyle(),
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onContextMenu={handleContextMenu}
                />
                <canvas
                    ref={overlayCanvasRef}
                    className="ssg-pixel-overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: displayW,
                        height: displayH,
                        pointerEvents: 'none',
                        imageRendering: 'pixelated',
                    }}
                />
            </div>
            
            <div className="ssg-pixel-editor-tools">
                <div className="ssg-tool-size">
                    <label>Fırça Boyutu: 1px</label>
                </div>
                <p className="ssg-pixel-tip">
                    <kbd>Sol Tık</kbd> {tool === 'pencil' ? 'Çiz' : tool === 'eraser' ? 'Sil' : 'Uygula'} | 
                    <kbd>Sağ Tık</kbd> İkincil Renk | 
                    <kbd>Alt</kbd>+Sürükle Kaydır
                </p>
            </div>
        </div>
    );
});

PixelEditor.displayName = 'PixelEditor';
export default PixelEditor;