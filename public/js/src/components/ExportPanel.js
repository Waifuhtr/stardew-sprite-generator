/**
 * Export Panel Bileşeni
 * PNG ve ZIP (Content Patcher) dışa aktarma kontrolleri
 */

import React, { useState } from 'react';

export default function ExportPanel({ config, layers, onExportPng, onExportZip, hdScale }) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('png');
    const [modName, setModName] = useState('Custom Stardew Sprite');
    const [modAuthor, setModAuthor] = useState('Sprite Generator');
    const [modDescription, setModDescription] = useState('');
    const [spriteType, setSpriteType] = useState('character');
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const dimensions = {
        width: config.gridW * config.maxFrames * hdScale,
        height: config.gridH * config.rows * hdScale,
    };
    
    const handleExport = async () => {
        if (layers.length === 0) {
            alert('Dışa aktarılacak katman yok!');
            return;
        }
        
        setIsExporting(true);
        
        try {
            if (exportFormat === 'png') {
                await onExportPng();
            } else {
                await onExportZip();
            }
        } catch (error) {
            console.error('Export hatası:', error);
            alert('Export sırasında bir hata oluştu.');
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleSaveToLibrary = async () => {
        if (!window.ssgConfig.isLoggedIn) {
            alert('Kitaplığa kaydetmek için giriş yapmalısınız.');
            return;
        }
        
        const name = prompt('Sprite için bir isim girin:', 'Yeni Sprite');
        if (!name) return;
        
        try {
            const response = await fetch(`${window.ssgConfig.restUrl}library`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.ssgConfig.nonce,
                },
                body: JSON.stringify({
                    name: name,
                    type: spriteType,
                    layers: layers.map(l => ({
                        name: l.name,
                        image_url: l.imageUrl,
                        z_index: l.zIndex,
                        offset_x: l.offsetX,
                        offset_y: l.offsetY,
                        anim_frames: l.animFrames,
                        category: l.category,
                    })),
                    config: {
                        grid_width: config.gridW,
                        grid_height: config.gridH,
                        total_rows: config.rows,
                        max_frames: config.maxFrames,
                        hd_scale: hdScale,
                    },
                }),
            });
            
            if (response.ok) {
                alert('Sprite kitaplığa kaydedildi!');
            } else {
                throw new Error('Kaydetme başarısız');
            }
        } catch (error) {
            console.error('Kitaplık hatası:', error);
            alert('Kitaplığa kaydedilemedi.');
        }
    };
    
    return (
        <div className="ssg-export-panel">
            <h3>Dışa Aktar</h3>
            
            {/* Format seçimi */}
            <div className="ssg-export-format">
                <label>Format:</label>
                <div className="ssg-format-buttons">
                    <button
                        className={exportFormat === 'png' ? 'active' : ''}
                        onClick={() => setExportFormat('png')}
                    >
                        📷 PNG Sprite Sheet
                    </button>
                    <button
                        className={exportFormat === 'zip' ? 'active' : ''}
                        onClick={() => setExportFormat('zip')}
                    >
                        📦 ZIP (Content Patcher)
                    </button>
                </div>
            </div>
            
            {/* Boyut bilgisi */}
            <div className="ssg-export-info">
                <p><strong>Boyut:</strong> {dimensions.width}x{dimensions.height}px</p>
                <p><strong>Katman:</strong> {layers.length}</p>
                <p><strong>HD Ölçek:</strong> {hdScale}x</p>
                <p><strong>Format:</strong> PNG (Alpha kanallı)</p>
            </div>
            
            {/* Gelişmiş ayarlar */}
            <button
                className="ssg-btn-toggle-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                {showAdvanced ? '▼' : '▶'} Gelişmiş Ayarlar
            </button>
            
            {showAdvanced && (
                <div className="ssg-advanced-options">
                    <div className="ssg-field">
                        <label>Sprite Türü:</label>
                        <select value={spriteType} onChange={(e) => setSpriteType(e.target.value)}>
                            <option value="character">Karakter (Farmer)</option>
                            <option value="furniture">Mobilya</option>
                            <option value="building">Bina</option>
                            <option value="animal">Hayvan</option>
                            <option value="tool">Alet</option>
                        </select>
                    </div>
                    
                    {exportFormat === 'zip' && (
                        <>
                            <div className="ssg-field">
                                <label>Mod İsmi:</label>
                                <input
                                    type="text"
                                    value={modName}
                                    onChange={(e) => setModName(e.target.value)}
                                />
                            </div>
                            
                            <div className="ssg-field">
                                <label>Yazar:</label>
                                <input
                                    type="text"
                                    value={modAuthor}
                                    onChange={(e) => setModAuthor(e.target.value)}
                                />
                            </div>
                            
                            <div className="ssg-field">
                                <label>Açıklama:</label>
                                <textarea
                                    value={modDescription}
                                    onChange={(e) => setModDescription(e.target.value)}
                                    rows="2"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* Export butonu */}
            <button
                className="ssg-btn-export"
                onClick={handleExport}
                disabled={isExporting || layers.length === 0}
            >
                {isExporting ? '⏳ İşleniyor...' : exportFormat === 'png' ? '⬇️ PNG İndir' : '⬇️ ZIP İndir'}
            </button>
            
            {/* Kitaplığa kaydet */}
            <button
                className="ssg-btn-save-library"
                onClick={handleSaveToLibrary}
                disabled={layers.length === 0}
            >
                💾 Kitaplığa Kaydet
            </button>
            
            {exportFormat === 'zip' && (
                <div className="ssg-export-note">
                    <p>📦 ZIP dosyası şunları içerir:</p>
                    <ul>
                        <li>assets/spritesheet.png - Sprite sheet</li>
                        <li>content.json - Content Patcher konfigürasyonu</li>
                        <li>manifest.json - SMAPI mod manifesti</li>
                    </ul>
                    <p className="ssg-export-hint">
                        Dosyayı Mods klasörüne çıkarın ve Stardew Valley'i SMAPI ile başlatın.
                    </p>
                </div>
            )}
        </div>
    );
}