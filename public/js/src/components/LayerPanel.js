/**
 * Katman Paneli Bileşeni
 * Katman listesi, sıralama, görünürlük ve kilitleme kontrolleri
 */

import React from 'react';

export default function LayerPanel({
    layers,
    selectedLayerId,
    onSelectLayer,
    onMoveLayer,
    onToggleVisibility,
    onToggleLock,
    onRemoveLayer,
    onUpdateLayer,
}) {
    // Z-index'e göre sırala (ters - en üstteki en üstte görünsün)
    const sortedLayers = [...layers].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    
    const getCategoryIcon = (category) => {
        const icons = {
            body: '👤',
            skin: '🧴',
            eyes: '👁️',
            hair_front: '💇',
            hair_back: '💇',
            shirt: '👕',
            pants: '👖',
            shoes: '👟',
            hat: '🎩',
            accessory: '💎',
            furniture: '🪑',
            building: '🏠',
            tool: '🔨',
            weapon: '⚔️',
            animal: '🐔',
        };
        return icons[category] || '📦';
    };
    
    return (
        <div className="ssg-layer-panel">
            <div className="ssg-panel-header">
                <h3>Katmanlar ({layers.length})</h3>
            </div>
            
            <div className="ssg-layer-list">
                {sortedLayers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={`ssg-layer-item ${layer.id === selectedLayerId ? 'selected' : ''} ${!layer.visible ? 'hidden' : ''} ${layer.locked ? 'locked' : ''}`}
                        onClick={() => onSelectLayer(layer.id)}
                    >
                        <div className="ssg-layer-preview">
                            {layer.imageUrl ? (
                                <img src={layer.imageUrl} alt="" />
                            ) : (
                                <div className="ssg-layer-placeholder">{getCategoryIcon(layer.category)}</div>
                            )}
                        </div>
                        
                        <div className="ssg-layer-info">
                            <span className="ssg-layer-name">{layer.name}</span>
                            <span className="ssg-layer-zindex">z:{layer.zIndex || 0}</span>
                        </div>
                        
                        <div className="ssg-layer-controls">
                            <button
                                className={`ssg-btn-icon ${!layer.visible ? 'inactive' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                                title={layer.visible ? 'Gizle' : 'Göster'}
                            >
                                {layer.visible ? '👁️' : '🚫'}
                            </button>
                            
                            <button
                                className={`ssg-btn-icon ${layer.locked ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                                title={layer.locked ? 'Kilidi Aç' : 'Kilitle'}
                            >
                                {layer.locked ? '🔒' : '🔓'}
                            </button>
                            
                            <button
                                className="ssg-btn-icon"
                                onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                                title="Öne Taşı"
                            >
                                ⬆️
                            </button>
                            
                            <button
                                className="ssg-btn-icon"
                                onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                                title="Arkaya Taşı"
                            >
                                ⬇️
                            </button>
                            
                            <button
                                className="ssg-btn-icon ssg-btn-delete"
                                onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                                title="Sil"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
                
                {layers.length === 0 && (
                    <div className="ssg-empty-state">
                        <p>Henüz katman eklenmemiş</p>
                        <p>Asset browser'dan bir asset seçin</p>
                    </div>
                )}
            </div>
            
            {/* Seçili katman özellikleri */}
            {selectedLayerId && (() => {
                const layer = layers.find(l => l.id === selectedLayerId);
                if (!layer) return null;
                
                return (
                    <div className="ssg-layer-properties">
                        <h4>Katman Özellikleri</h4>
                        
                        <div className="ssg-prop-field">
                            <label>İsim:</label>
                            <input
                                type="text"
                                value={layer.name}
                                onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                            />
                        </div>
                        
                        <div className="ssg-prop-field">
                            <label>Z-Index:</label>
                            <input
                                type="number"
                                value={layer.zIndex || 0}
                                onChange={(e) => onUpdateLayer(layer.id, { zIndex: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        
                        <div className="ssg-prop-row">
                            <div className="ssg-prop-field">
                                <label>Offset X:</label>
                                <input
                                    type="number"
                                    value={layer.offsetX || 0}
                                    onChange={(e) => onUpdateLayer(layer.id, { offsetX: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            
                            <div className="ssg-prop-field">
                                <label>Offset Y:</label>
                                <input
                                    type="number"
                                    value={layer.offsetY || 0}
                                    onChange={(e) => onUpdateLayer(layer.id, { offsetY: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        
                        <div className="ssg-prop-field">
                            <label>Opaklık:</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={layer.opacity || 1}
                                onChange={(e) => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                            />
                            <span>{Math.round((layer.opacity || 1) * 100)}%</span>
                        </div>
                        
                        <div className="ssg-prop-field">
                            <label>Animasyon Kareleri:</label>
                            <input
                                type="number"
                                min="1"
                                max="16"
                                value={layer.animFrames || 1}
                                onChange={(e) => onUpdateLayer(layer.id, { animFrames: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}