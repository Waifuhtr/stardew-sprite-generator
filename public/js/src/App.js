/**
 * Ana Uygulama Bileşeni
 * Karakter tipine göre editörü başlatır
 */

import React, { useState, useCallback } from 'react';
import CanvasRenderer from './components/CanvasRenderer';
import LayerPanel from './components/LayerPanel';
import AssetBrowser from './components/AssetBrowser';
import PixelEditor from './components/PixelEditor';
import AnimationPreview from './components/AnimationPreview';
import ExportPanel from './components/ExportPanel';
import Toolbar from './components/Toolbar';
import { useLayers } from './hooks/useLayers';
import { useCanvas } from './hooks/useCanvas';

const SPRITE_CONFIGS = {
    character: { gridW: 16, gridH: 32, rows: 8, maxFrames: 8, name: 'Karakter' },
    furniture: { gridW: 16, gridH: 32, rows: 1, maxFrames: 1, name: 'Mobilya' },
    building:  { gridW: 64, gridH: 96, rows: 1, maxFrames: 1, name: 'Bina' },
    animal:    { gridW: 32, gridH: 32, rows: 4, maxFrames: 4, name: 'Hayvan' },
    tool:      { gridW: 16, gridH: 32, rows: 4, maxFrames: 6, name: 'Alet' },
};

export default function App({ type = 'character' }) {
    const config = SPRITE_CONFIGS[type] || SPRITE_CONFIGS.character;
    
    const [activeTab, setActiveTab] = useState('compose'); // compose | pixel | animate
    const [selectedTool, setSelectedTool] = useState('brush');
    const [zoom, setZoom] = useState(4);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [currentRow, setCurrentRow] = useState(0);
    const [primaryColor, setPrimaryColor] = useState('#4CAF50');
    const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
    const [hdScale, setHdScale] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    
    const {
        layers,
        addLayer,
        removeLayer,
        updateLayer,
        moveLayer,
        toggleLayerVisibility,
        toggleLayerLock,
        setLayerImage,
        selectedLayerId,
        setSelectedLayerId,
        getMergedCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useLayers(config);
    
    const {
        canvasRef,
        pixelCanvasRef,
        renderLayers,
        exportCanvas,
        getPixelData,
        setPixelData,
        floodFill,
    } = useCanvas(config, layers, hdScale);
    
    const handleExportPng = useCallback(() => {
        exportCanvas('png');
    }, [exportCanvas]);
    
    const handleExportZip = useCallback(() => {
        exportCanvas('zip');
    }, [exportCanvas]);
    
    return (
        <div className="ssg-app">
            {/* Üst Toolbar */}
            <Toolbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                zoom={zoom}
                onZoomChange={setZoom}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                hdScale={hdScale}
                onHdScaleChange={setHdScale}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
            />
            
            <div className="ssg-main-layout">
                {/* Sol Panel - Asset Browser veya Katmanlar */}
                <div className="ssg-left-panel">
                    {activeTab === 'compose' && (
                        <>
                            <AssetBrowser
                                onAssetSelect={(asset) => {
                                    addLayer({
                                        name: asset.title,
                                        imageUrl: asset.image_url,
                                        zIndex: asset.z_index,
                                        offsetX: asset.offset_x,
                                        offsetY: asset.offset_y,
                                        animFrames: asset.anim_frames,
                                        category: asset.categories[0] || 'general',
                                    });
                                }}
                                assetType={type}
                            />
                            <LayerPanel
                                layers={layers}
                                selectedLayerId={selectedLayerId}
                                onSelectLayer={setSelectedLayerId}
                                onMoveLayer={moveLayer}
                                onToggleVisibility={toggleLayerVisibility}
                                onToggleLock={toggleLayerLock}
                                onRemoveLayer={removeLayer}
                                onUpdateLayer={updateLayer}
                            />
                        </>
                    )}
                    
                    {activeTab === 'pixel' && (
                        <div className="ssg-tool-panel">
                            <h3>Piksel Araçları</h3>
                            <div className="ssg-tools-grid">
                                {[
                                    { id: 'pencil', icon: '✏️', label: 'Kalem' },
                                    { id: 'eraser', icon: '🧹', label: 'Silgi' },
                                    { id: 'eyedropper', icon: '💧', label: 'Renk Seçici' },
                                    { id: 'fill', icon: '🪣', label: 'Boya Kovası' },
                                    { id: 'line', icon: '📏', label: 'Çizgi' },
                                    { id: 'rectangle', icon: '⬜', label: 'Dikdörtgen' },
                                    { id: 'circle', icon: '⭕', label: 'Daire' },
                                    { id: 'select', icon: '🔲', label: 'Seçim' },
                                ].map(tool => (
                                    <button
                                        key={tool.id}
                                        className={`ssg-tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
                                        onClick={() => setSelectedTool(tool.id)}
                                        title={tool.label}
                                    >
                                        <span>{tool.icon}</span>
                                        <small>{tool.label}</small>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="ssg-color-palette">
                                <h4>Renkler</h4>
                                <div className="ssg-color-row">
                                    <label>Birincil:</label>
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                </div>
                                <div className="ssg-color-row">
                                    <label>İkincil:</label>
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                    />
                                </div>
                                <div className="ssg-presets">
                                    {['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#FFA500','#800080','#FFC0CB','#A52A2A','#808080','#C0C0C0','#FFD700','#4CAF50'].map(c => (
                                        <button
                                            key={c}
                                            className="ssg-color-swatch"
                                            style={{ backgroundColor: c }}
                                            onClick={() => setPrimaryColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Orta - Canvas Alanı */}
                <div className="ssg-canvas-area">
                    {activeTab === 'compose' && (
                        <CanvasRenderer
                            ref={canvasRef}
                            config={config}
                            layers={layers}
                            zoom={zoom}
                            showGrid={showGrid}
                            hdScale={hdScale}
                            currentFrame={currentFrame}
                            currentRow={currentRow}
                            onRender={renderLayers}
                        />
                    )}
                    
                    {activeTab === 'pixel' && (
                        <PixelEditor
                            ref={pixelCanvasRef}
                            config={config}
                            layers={layers}
                            selectedLayerId={selectedLayerId}
                            tool={selectedTool}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            zoom={zoom}
                            onPixelChange={setPixelData}
                            onFloodFill={floodFill}
                            onColorPick={(color) => setPrimaryColor(color)}
                        />
                    )}
                    
                    {activeTab === 'animate' && (
                        <AnimationPreview
                            canvasRef={canvasRef}
                            config={config}
                            layers={layers}
                            hdScale={hdScale}
                            zoom={zoom}
                        />
                    )}
                </div>
                
                {/* Sağ Panel - Export ve Bilgiler */}
                <div className="ssg-right-panel">
                    <ExportPanel
                        config={config}
                        layers={layers}
                        onExportPng={handleExportPng}
                        onExportZip={handleExportZip}
                        hdScale={hdScale}
                    />
                    
                    <div className="ssg-info-panel">
                        <h4>Sprite Bilgileri</h4>
                        <p><strong>Tür:</strong> {config.name}</p>
                        <p><strong>Grid:</strong> {config.gridW}x{config.gridH}px</p>
                        <p><strong>Animasyon Satırı:</strong> {config.rows}</p>
                        <p><strong>Max Kare:</strong> {config.maxFrames}</p>
                        <p><strong>HD Ölçek:</strong> {hdScale}x</p>
                        <p><strong>Katman Sayısı:</strong> {layers.length}</p>
                    </div>
                    
                    <div className="ssg-anim-controls">
                        <h4>Animasyon Kontrolü</h4>
                        <div className="ssg-frame-control">
                            <label>Kare: {currentFrame + 1}</label>
                            <input
                                type="range"
                                min={0}
                                max={config.maxFrames - 1}
                                value={currentFrame}
                                onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="ssg-row-control">
                            <label>Satır: {currentRow + 1}</label>
                            <input
                                type="range"
                                min={0}
                                max={config.rows - 1}
                                value={currentRow}
                                onChange={(e) => setCurrentRow(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}