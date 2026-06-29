/**
 * Toolbar Bileşeni
 * Ana navigasyon, zoom, undo/redo ve grid kontrolleri
 */

import React from 'react';

export default function Toolbar({
    activeTab,
    onTabChange,
    zoom,
    onZoomChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    hdScale,
    onHdScaleChange,
    showGrid,
    onToggleGrid,
}) {
    const tabs = [
        { id: 'compose', label: '🎨 Kompose', desc: 'Katmanları birleştir' },
        { id: 'pixel', label: '✏️ Piksel Editör', desc: 'Piksel piksel düzenle' },
        { id: 'animate', label: '🎬 Animasyon', desc: 'Animasyon önizleme' },
    ];
    
    const zoomLevels = [1, 2, 4, 8, 12, 16];
    
    return (
        <div className="ssg-toolbar">
            <div className="ssg-toolbar-left">
                {/* Logo / Başlık */}
                <div className="ssg-logo">
                    <span className="ssg-logo-icon">🌾</span>
                    <span className="ssg-logo-text">Stardew Sprite Generator</span>
                </div>
                
                {/* Sekme navigasyonu */}
                <nav className="ssg-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`ssg-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            title={tab.desc}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="ssg-toolbar-center">
                {/* Undo/Redo */}
                <div className="ssg-undo-redo">
                    <button
                        className="ssg-btn-icon"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Geri Al (Ctrl+Z)"
                    >
                        ↩️
                    </button>
                    <button
                        className="ssg-btn-icon"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="İleri Al (Ctrl+Y)"
                    >
                        ↪️
                    </button>
                </div>
                
                {/* Zoom kontrolleri */}
                <div className="ssg-zoom-controls">
                    <button
                        className="ssg-btn-icon"
                        onClick={() => {
                            const idx = zoomLevels.indexOf(zoom);
                            if (idx > 0) onZoomChange(zoomLevels[idx - 1]);
                        }}
                        disabled={zoom <= zoomLevels[0]}
                        title="Uzaklaştır"
                    >
                        🔍➖
                    </button>
                    
                    <select
                        value={zoom}
                        onChange={(e) => onZoomChange(parseInt(e.target.value))}
                        className="ssg-zoom-select"
                    >
                        {zoomLevels.map(z => (
                            <option key={z} value={z}>{z}x</option>
                        ))}
                    </select>
                    
                    <button
                        className="ssg-btn-icon"
                        onClick={() => {
                            const idx = zoomLevels.indexOf(zoom);
                            if (idx < zoomLevels.length - 1) onZoomChange(zoomLevels[idx + 1]);
                        }}
                        disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
                        title="Yakınlaştır"
                    >
                        🔍➕
                    </button>
                </div>
                
                {/* Grid toggle */}
                <button
                    className={`ssg-btn-icon ${showGrid ? 'active' : ''}`}
                    onClick={onToggleGrid}
                    title="Grid Göster/Gizle (G)"
                >
                    #️⃣
                </button>
            </div>
            
            <div className="ssg-toolbar-right">
                {/* HD Scale */}
                <div className="ssg-hd-control">
                    <label>HD:</label>
                    <select
                        value={hdScale}
                        onChange={(e) => onHdScaleChange(parseInt(e.target.value))}
                    >
                        <option value={1}>1x (16px)</option>
                        <option value={2}>2x (32px)</option>
                        <option value={4}>4x (64px)</option>
                    </select>
                </div>
                
                {/* Yardım */}
                <button
                    className="ssg-btn-icon"
                    onClick={() => alert(getHelpText())}
                    title="Yardım"
                >
                    ❓
                </button>
            </div>
        </div>
    );
}

function getHelpText() {
    return `
🌾 Stardew Sprite Generator - Kısayollar

Genel:
• Ctrl+Z: Geri Al
• Ctrl+Y: İleri Al
• G: Grid Göster/Gizle
• Mouse tekerleği: Pan
• Ctrl+Scroll: Zoom

Piksel Editör:
• Sol Tık: Çiz (Kalem) / Doldur (Boya)
• Sağ Tık: İkincil renk
• Alt+Sürükle: Kaydırma

Animasyon:
• Seçili karede yön değiştirmek için satır seçin
    `;
}