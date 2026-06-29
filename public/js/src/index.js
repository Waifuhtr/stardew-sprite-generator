/**
 * Stardew Sprite Generator - React Entry Point
 * WordPress shortcode ile mount edilir
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('stardew-sprite-generator');
if (container) {
    const type = container.dataset.type || 'character';
    const root = createRoot(container);
    root.render(<App type={type} />);
}