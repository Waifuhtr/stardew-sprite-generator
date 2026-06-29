/**
 * Ana Canvas Renderer Bileşeni
 * Katmanlı sprite sheet render döngüsü ve grid gösterimi
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { calculateGridLines } from '../utils/spriteMath';

const CanvasRenderer = forwardRef(({
    config,
    layers,
    zoom,
    showGrid,
    hdScale,
    currentFrame,
    currentRow,
    onRender,
}, ref) => {
    const canvasRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef({ x: 0, y: 0 });
    
    const frameW = config.gridW * hdScale;
    const frameH = config.gridH * hdScale;
    const totalW = frameW * config.maxFrames;
    const totalH = frameH * config.rows;
    
    const displayW = totalW * zoom;
    const displayH = totalH * zoom;
    
    // Katmanları canvas'a çiz
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = totalW;
        canvas.height = totalH;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, totalW, totalH);
        
        // Şeffaf arka plan (checkerboard)
        drawCheckerboard(ctx, totalW, totalH, 8);
        
        // Katmanları Z-index sırasına göre sırala
        const sorted = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        sorted.forEach(layer => {
            if (!layer.visible || !layer.imageUrl) return;
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                for (let row = 0; row < config.rows; row++) {
                    for (let frame = 0; frame < config.maxFrames; frame++) {
                        const animFrames = layer.animFrames || 1;
                        const srcFrame = animFrames > 1 ? (frame % animFrames) : 0;
                        
                        const srcX = srcFrame * (layer.frameWidth || config.gridW);
                        const srcW = layer.frameWidth || config.gridW;
                        const srcH = layer.frameHeight || config.gridH;
                        
                        const dstX = (frame * frameW) + ((layer.offsetX || 0) * hdScale);
                        const dstY = (row * frameH) + ((layer.offsetY || 0) * hdScale);
                        
                        ctx.globalAlpha = layer.opacity || 1;
                        ctx.imageSmoothingEnabled = false;
                        
                        try {
                            ctx.drawImage(
                                img,
                                srcX, 0, srcW, srcH,
                                dstX, dstY, frameW, frameH
                            );
                        } catch (e) {
                            // Hata durumunda devam et
                        }
                    }
                }
                ctx.globalAlpha = 1;
            };
            
            img.src = layer.imageUrl;
        });
    }, [layers, config, hdScale, totalW, totalH, frameW, frameH]);
    
    // Grid çiz
    useEffect(() => {
        const gridCanvas = gridCanvasRef.current;
        if (!gridCanvas || !showGrid) return;
        
        gridCanvas.width = totalW;
        gridCanvas.height = totalH;
        
        const ctx = gridCanvas.getContext('2d');
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;
        
        // Grid çizgileri
        for (let x = 0; x <= totalW; x += frameW) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, totalH);
            ctx.stroke();
        }
        
        for (let y = 0; y <= totalH; y += frameH) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(totalW, y);
            ctx.stroke();
        }
        
        // Mevcut frame vurgusu
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            currentFrame * frameW,
            currentRow * frameH,
            frameW,
            frameH
        );
    }, [showGrid, totalW, totalH, frameW, frameH, currentFrame, currentRow]);
    
    // Pan işlemleri
    const handleMouseDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }
    };
    
    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Zoom davranışı - parent'a iletilir
        } else {
            // Scroll = pan
            setPan(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
            }));
        }
    };
    
    return (
        <div
            ref={containerRef}
            className="ssg-canvas-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        >
            <div
                className="ssg-canvas-wrapper"
                style={{
                    width: displayW,
                    height: displayH,
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                    imageRendering: 'pixelated',
                }}
            >
                <canvas
                    ref={canvasRef}
                    className="ssg-main-canvas"
                    style={{
                        width: displayW,
                        height: displayH,
                        imageRendering: 'pixelated',
                    }}
                />
                {showGrid && (
                    <canvas
                        ref={gridCanvasRef}
                        className="ssg-grid-canvas"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: displayW,
                            height: displayH,
                            imageRendering: 'pixelated',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
            
            {/* Zoom/Pan bilgisi */}
            <div className="ssg-canvas-info">
                <span>Zoom: {zoom}x</span>
                <span> | </span>
                <span>{totalW}x{totalH}px</span>
                <span> | </span>
                <span>Kare: {currentFrame + 1}/{config.maxFrames}</span>
                <span> | </span>
                <span>Satır: {currentRow + 1}/{config.rows}</span>
            </div>
        </div>
    );
});

function drawCheckerboard(ctx, w, h, size) {
    for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
            const isEven = ((x / size) + (y / size)) % 2 === 0;
            ctx.fillStyle = isEven ? '#2a2a2a' : '#333333';
            ctx.fillRect(x, y, size, size);
        }
    }
}

CanvasRenderer.displayName = 'CanvasRenderer';
export default CanvasRenderer;