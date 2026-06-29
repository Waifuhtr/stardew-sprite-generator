/**
 * Animasyon Önizleme Bileşeni
 * Sprite sheet'teki animasyonları oynatma ve önizleme
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function AnimationPreview({ canvasRef, config, layers, hdScale, zoom }) {
    const previewCanvasRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [currentRow, setCurrentRow] = useState(0);
    const [fps, setFps] = useState(8);
    const [selectedAnimation, setSelectedAnimation] = useState('walk_down');
    const animationRef = useRef(null);
    
    const frameW = config.gridW * hdScale;
    const frameH = config.gridH * hdScale;
    
    // Animasyon satır bilgileri
    const animationOptions = [
        { value: 'idle_down', label: 'Durma - Aşağı', row: 0, frames: 1 },
        { value: 'idle_right', label: 'Durma - Sağ', row: 1, frames: 1 },
        { value: 'idle_up', label: 'Durma - Yukarı', row: 2, frames: 1 },
        { value: 'idle_left', label: 'Durma - Sol', row: 3, frames: 1 },
        { value: 'walk_down', label: 'Yürüme - Aşağı', row: 0, frames: 4 },
        { value: 'walk_right', label: 'Yürüme - Sağ', row: 1, frames: 4 },
        { value: 'walk_up', label: 'Yürüme - Yukarı', row: 2, frames: 4 },
        { value: 'walk_left', label: 'Yürüme - Sol', row: 3, frames: 4 },
        { value: 'run_down', label: 'Koşma - Aşağı', row: 4, frames: 8 },
        { value: 'run_right', label: 'Koşma - Sağ', row: 5, frames: 8 },
        { value: 'run_up', label: 'Koşma - Yukarı', row: 6, frames: 8 },
        { value: 'run_left', label: 'Koşma - Sol', row: 7, frames: 8 },
    ];
    
    // Animasyon oynatma
    useEffect(() => {
        if (isPlaying) {
            const frameInterval = 1000 / fps;
            const anim = animationOptions.find(a => a.value === selectedAnimation);
            const totalFrames = anim ? anim.frames : 4;
            
            animationRef.current = setInterval(() => {
                setCurrentFrame(prev => (prev + 1) % totalFrames);
            }, frameInterval);
        } else {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        }
        
        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        };
    }, [isPlaying, fps, selectedAnimation]);
    
    // Seçili animasyon değiştiğinde satırı güncelle
    useEffect(() => {
        const anim = animationOptions.find(a => a.value === selectedAnimation);
        if (anim) {
            setCurrentRow(anim.row);
            setCurrentFrame(0);
        }
    }, [selectedAnimation]);
    
    // Canvas'ı çiz
    useEffect(() => {
        const preview = previewCanvasRef.current;
        const source = canvasRef?.current;
        if (!preview || !source) return;
        
        const ctx = preview.getContext('2d');
        const displaySize = Math.max(frameW, frameH) * 6;
        
        preview.width = displaySize;
        preview.height = displaySize;
        
        ctx.clearRect(0, 0, displaySize, displaySize);
        
        // Şeffaf arka plan
        drawCheckerboard(ctx, displaySize, displaySize, 16);
        
        // Frame'i ortala
        const offsetX = (displaySize - frameW * 6) / 2;
        const offsetY = (displaySize - frameH * 6) / 2;
        
        // Kaynak koordinatlar
        const srcX = currentFrame * frameW;
        const srcY = currentRow * frameH;
        
        ctx.imageSmoothingEnabled = false;
        try {
            ctx.drawImage(
                source,
                srcX, srcY, frameW, frameH,
                offsetX, offsetY, frameW * 6, frameH * 6
            );
        } catch (e) {
            // Kaynak canvas hazır değilse bekle
        }
        
        // Frame bilgisi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, displaySize - 30, displaySize, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `Kare: ${currentFrame + 1} | Satır: ${currentRow + 1} | FPS: ${fps}`,
            displaySize / 2,
            displaySize - 10
        );
    }, [currentFrame, currentRow, frameW, frameH, canvasRef]);
    
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };
    
    const resetAnimation = () => {
        setIsPlaying(false);
        setCurrentFrame(0);
    };
    
    return (
        <div className="ssg-animation-preview">
            <div className="ssg-anim-header">
                <h3>Animasyon Önizleme</h3>
            </div>
            
            <div className="ssg-anim-canvas-wrapper">
                <canvas
                    ref={previewCanvasRef}
                    className="ssg-anim-canvas"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
            
            <div className="ssg-anim-controls">
                <div className="ssg-anim-control-row">
                    <button
                        className="ssg-btn-play"
                        onClick={togglePlay}
                    >
                        {isPlaying ? '⏸️ Durdur' : '▶️ Oynat'}
                    </button>
                    
                    <button
                        className="ssg-btn-reset"
                        onClick={resetAnimation}
                    >
                        ⏹️ Sıfırla
                    </button>
                </div>
                
                <div className="ssg-anim-control-row">
                    <label>Animasyon:</label>
                    <select
                        value={selectedAnimation}
                        onChange={(e) => setSelectedAnimation(e.target.value)}
                    >
                        {animationOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.frames} kare)
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="ssg-anim-control-row">
                    <label>Hız (FPS):</label>
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                    />
                    <span>{fps}</span>
                </div>
                
                <div className="ssg-anim-control-row">
                    <label>Kare:</label>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, (animationOptions.find(a => a.value === selectedAnimation)?.frames || 4) - 1)}
                        value={currentFrame}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setCurrentFrame(parseInt(e.target.value));
                        }}
                    />
                    <span>{currentFrame + 1}</span>
                </div>
                
                <div className="ssg-anim-info">
                    <p>
                        <strong>Yön:</strong> {
                            selectedAnimation.includes('down') ? 'Aşağı ⬇️' :
                            selectedAnimation.includes('up') ? 'Yukarı ⬆️' :
                            selectedAnimation.includes('left') ? 'Sol ⬅️' : 'Sağ ➡️'
                        }
                    </p>
                    <p>
                        <strong>Tür:</strong> {
                            selectedAnimation.includes('run') ? 'Koşma 🏃' :
                            selectedAnimation.includes('walk') ? 'Yürüme 🚶' : 'Durma 🧍'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}

function drawCheckerboard(ctx, w, h, size) {
    for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
            const isEven = ((x / size) + (y / size)) % 2 === 0;
            ctx.fillStyle = isEven ? '#2a2a2a' : '#333333';
            ctx.fillRect(x, y, size, size);
        }
    }
}