/**
 * Katman Yönetimi Hook'u
 * Katman CRUD, sıralama, görünürlük ve kilitleme işlemleri
 * Undo/Redo desteği ile
 */

import { useState, useCallback, useRef } from 'react';

const Z_INDEX_DEFAULTS = {
    body: 1,
    skin: 2,
    eyes: 3,
    nose: 4,
    mouth: 5,
    undershirt: 6,
    shirt: 10,
    sleeves: 12,
    pants: 15,
    shoes: 18,
    hair_back: 20,
    accessory_neck: 22,
    accessory_face: 24,
    hair_front: 26,
    hat_back: 28,
    hat: 30,
    hat_front: 32,
    glasses: 34,
};

export function useLayers(config) {
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    
    // Undo/Redo history
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const MAX_HISTORY = 50;
    
    const saveToHistory = useCallback((newLayers) => {
        // Geçmişi kırp (sonraki adımları sil)
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        
        // Yeni durumu ekle
        historyRef.current.push(JSON.parse(JSON.stringify(newLayers)));
        
        // Maksimum geçmiş sınırını koru
        if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
        } else {
            historyIndexRef.current++;
        }
    }, []);
    
    const addLayer = useCallback((layerData) => {
        const category = layerData.category || 'general';
        const newLayer = {
            id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: layerData.name || 'Yeni Katman',
            imageUrl: layerData.imageUrl || null,
            image: null, // Canvas Image objesi (runtime'da yüklenir)
            zIndex: layerData.zIndex ?? Z_INDEX_DEFAULTS[category] ?? 10,
            offsetX: layerData.offsetX || 0,
            offsetY: layerData.offsetY || 0,
            frameWidth: layerData.frameWidth || config.gridW,
            frameHeight: layerData.frameHeight || config.gridH,
            animFrames: layerData.animFrames || 1,
            opacity: 1,
            visible: true,
            locked: false,
            category: category,
            blendMode: 'source-over',
            pixelData: null, // Piksel editör için
        };
        
        setLayers(prev => {
            const newLayers = [...prev, newLayer];
            saveToHistory(newLayers);
            return newLayers;
        });
        
        setSelectedLayerId(newLayer.id);
        return newLayer.id;
    }, [config, saveToHistory]);
    
    const removeLayer = useCallback((layerId) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== layerId);
            saveToHistory(newLayers);
            return newLayers;
        });
        
        if (selectedLayerId === layerId) {
            setSelectedLayerId(null);
        }
    }, [selectedLayerId, saveToHistory]);
    
    const updateLayer = useCallback((layerId, updates) => {
        setLayers(prev => {
            const newLayers = prev.map(l =>
                l.id === layerId ? { ...l, ...updates } : l
            );
            saveToHistory(newLayers);
            return newLayers;
        });
    }, [saveToHistory]);
    
    const moveLayer = useCallback((layerId, direction) => {
        setLayers(prev => {
            const idx = prev.findIndex(l => l.id === layerId);
            if (idx === -1) return prev;
            
            const newLayers = [...prev];
            if (direction === 'up' && idx < newLayers.length - 1) {
                // Z-index artır (görsel olarak yukarı taşı - öne getir)
                newLayers[idx] = { ...newLayers[idx], zIndex: (newLayers[idx].zIndex || 0) + 1 };
            } else if (direction === 'down' && idx > 0) {
                // Z-index azalt (görsel olarak aşağı taşı - arkaya gönder)
                newLayers[idx] = { ...newLayers[idx], zIndex: Math.max(0, (newLayers[idx].zIndex || 0) - 1) };
            } else if (direction === 'top') {
                // En üste taşı
                const maxZ = Math.max(...newLayers.map(l => l.zIndex || 0));
                newLayers[idx] = { ...newLayers[idx], zIndex: maxZ + 1 };
            } else if (direction === 'bottom') {
                // En alta taşı
                const minZ = Math.min(...newLayers.map(l => l.zIndex || 0));
                newLayers[idx] = { ...newLayers[idx], zIndex: Math.max(0, minZ - 1) };
            }
            
            saveToHistory(newLayers);
            return newLayers;
        });
    }, [saveToHistory]);
    
    const toggleLayerVisibility = useCallback((layerId) => {
        setLayers(prev => {
            const newLayers = prev.map(l =>
                l.id === layerId ? { ...l, visible: !l.visible } : l
            );
            saveToHistory(newLayers);
            return newLayers;
        });
    }, [saveToHistory]);
    
    const toggleLayerLock = useCallback((layerId) => {
        setLayers(prev => prev.map(l =>
            l.id === layerId ? { ...l, locked: !l.locked } : l
        ));
    }, []);
    
    const setLayerImage = useCallback((layerId, image) => {
        setLayers(prev => prev.map(l =>
            l.id === layerId ? { ...l, image } : l
        ));
    }, []);
    
    const undo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const historicalLayers = JSON.parse(
                JSON.stringify(historyRef.current[historyIndexRef.current])
            );
            setLayers(historicalLayers);
        }
    }, []);
    
    const redo = useCallback(() => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const historicalLayers = JSON.parse(
                JSON.stringify(historyRef.current[historyIndexRef.current])
            );
            setLayers(historicalLayers);
        }
    }, []);
    
    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;
    
    const getMergedCanvas = useCallback(() => {
        // Tüm katmanları birleştir ve canvas döndür
        const sorted = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const canvas = document.createElement('canvas');
        canvas.width = config.gridW * config.maxFrames;
        canvas.height = config.gridH * config.rows;
        const ctx = canvas.getContext('2d');
        
        sorted.forEach(layer => {
            if (!layer.visible || !layer.image) return;
            ctx.globalAlpha = layer.opacity || 1;
            ctx.drawImage(layer.image, 0, 0);
        });
        
        ctx.globalAlpha = 1;
        return canvas;
    }, [layers, config]);
    
    return {
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
    };
}