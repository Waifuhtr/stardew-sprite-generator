/**
 * Asset Browser Bileşeni
 * WordPress'ten çekilen assetleri kategorilere göre listeleme
 */

import React, { useState, useEffect } from 'react';

const CATEGORY_LABELS = {
    'body': 'Vücut',
    'hair': 'Saç',
    'shirt': 'Gömlek',
    'pants': 'Pantolon',
    'shoes': 'Ayakkabı',
    'hat': 'Şapka',
    'accessory': 'Aksesuar',
    'furniture': 'Mobilya',
    'building': 'Bina',
    'tool': 'Alet',
    'weapon': 'Silah',
    'animal': 'Hayvan',
};

export default function AssetBrowser({ onAssetSelect, assetType = 'character' }) {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [gender, setGender] = useState('unisex');
    
    // Assetleri WordPress REST API'den çek
    useEffect(() => {
        fetchAssets();
        fetchCategories();
    }, []);
    
    const fetchAssets = async () => {
        try {
            const response = await fetch(`${window.ssgConfig.restUrl}assets`, {
                headers: {
                    'X-WP-Nonce': window.ssgConfig.nonce,
                },
            });
            
            if (!response.ok) throw new Error('Assetler yüklenemedi');
            
            const data = await response.json();
            setAssets(data);
            setLoading(false);
        } catch (error) {
            console.error('Asset yükleme hatası:', error);
            // Demo verileri göster
            setAssets(getDemoAssets());
            setLoading(false);
        }
    };
    
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${window.ssgConfig.restUrl}categories`, {
                headers: {
                    'X-WP-Nonce': window.ssgConfig.nonce,
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Kategori yükleme hatası:', error);
        }
    };
    
    // Filtreleme
    const filteredAssets = assets.filter(asset => {
        const matchCategory = activeCategory === 'all' || asset.categories.includes(activeCategory);
        const matchSearch = !searchQuery || asset.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchGender = asset.gender === 'unisex' || asset.gender === gender || gender === 'unisex';
        return matchCategory && matchSearch && matchGender;
    });
    
    const groupedByCategory = filteredAssets.reduce((acc, asset) => {
        const cat = asset.categories[0] || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(asset);
        return acc;
    }, {});
    
    if (loading) {
        return <div className="ssg-asset-browser"><div className="ssg-loading">Assetler yükleniyor...</div></div>;
    }
    
    return (
        <div className="ssg-asset-browser">
            <div className="ssg-panel-header">
                <h3>Asset Kütüphanesi</h3>
            </div>
            
            {/* Arama */}
            <div className="ssg-search-bar">
                <input
                    type="text"
                    placeholder="Asset ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* Cinsiyet filtresi */}
            <div className="ssg-gender-filter">
                <button
                    className={gender === 'unisex' ? 'active' : ''}
                    onClick={() => setGender('unisex')}
                >
                    🧑 Tümü
                </button>
                <button
                    className={gender === 'male' ? 'active' : ''}
                    onClick={() => setGender('male')}
                >
                    👨 Erkek
                </button>
                <button
                    className={gender === 'female' ? 'active' : ''}
                    onClick={() => setGender('female')}
                >
                    👩 Kadın
                </button>
            </div>
            
            {/* Kategori filtreleri */}
            <div className="ssg-category-tabs">
                <button
                    className={activeCategory === 'all' ? 'active' : ''}
                    onClick={() => setActiveCategory('all')}
                >
                    Tümü
                </button>
                {Object.keys(CATEGORY_LABELS).map(cat => (
                    <button
                        key={cat}
                        className={activeCategory === cat ? 'active' : ''}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>
            
            {/* Asset listesi */}
            <div className="ssg-asset-list">
                {activeCategory === 'all' ? (
                    // Tüm kategorileri göster
                    Object.entries(groupedByCategory).map(([cat, catAssets]) => (
                        <div key={cat} className="ssg-asset-group">
                            <h4 className="ssg-asset-group-title">
                                {CATEGORY_LABELS[cat] || cat} ({catAssets.length})
                            </h4>
                            <div className="ssg-asset-grid">
                                {catAssets.map(asset => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onClick={() => onAssetSelect(asset)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // Tek kategori
                    <div className="ssg-asset-grid">
                        {filteredAssets.map(asset => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onClick={() => onAssetSelect(asset)}
                            />
                        ))}
                    </div>
                )}
                
                {filteredAssets.length === 0 && (
                    <div className="ssg-empty-state">
                        <p>Eşleşen asset bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function AssetCard({ asset, onClick }) {
    return (
        <div className="ssg-asset-card" onClick={onClick} title={asset.title}>
            <div className="ssg-asset-thumb">
                {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt={asset.title} loading="lazy" />
                ) : (
                    <div className="ssg-asset-placeholder">📦</div>
                )}
            </div>
            <span className="ssg-asset-title">{asset.title}</span>
        </div>
    );
}

// Demo verileri (API bağlantısı yoksa)
function getDemoAssets() {
    return [
        { id: 1, title: 'Temel Vücut', thumbnail: '', image_url: '', categories: ['body'], z_index: 1, offset_x: 0, offset_y: 0, anim_frames: 4, gender: 'unisex' },
        { id: 2, title: 'Kahverengi Saç', thumbnail: '', image_url: '', categories: ['hair'], z_index: 20, offset_x: 0, offset_y: -4, anim_frames: 4, gender: 'unisex' },
        { id: 3, title: 'Mavi Gömlek', thumbnail: '', image_url: '', categories: ['shirt'], z_index: 10, offset_x: 0, offset_y: 0, anim_frames: 4, gender: 'unisex' },
        { id: 4, title: 'Kot Pantolon', thumbnail: '', image_url: '', categories: ['pants'], z_index: 15, offset_x: 0, offset_y: 0, anim_frames: 4, gender: 'unisex' },
        { id: 5, title: 'Şapka', thumbnail: '', image_url: '', categories: ['hat'], z_index: 30, offset_x: 0, offset_y: -6, anim_frames: 4, gender: 'unisex' },
        { id: 6, title: 'Kahverengi Bot', thumbnail: '', image_url: '', categories: ['shoes'], z_index: 18, offset_x: 0, offset_y: 0, anim_frames: 4, gender: 'unisex' },
        { id: 7, title: 'Gözlük', thumbnail: '', image_url: '', categories: ['accessory'], z_index: 25, offset_x: 0, offset_y: -2, anim_frames: 1, gender: 'unisex' },
    ];
}