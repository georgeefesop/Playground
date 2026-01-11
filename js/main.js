import { Game } from './Game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(); // Make globally accessible for preset export
    game.start();
    
    // Also add a direct export function for convenience
    window.exportPresets = () => {
        try {
            const presetsJson = localStorage.getItem('starPresets');
            if (!presetsJson) {
                console.log('No presets found in localStorage');
                return '[]';
            }
            const presets = JSON.parse(presetsJson);
            const json = JSON.stringify(presets, null, 2);
            console.log('Copy this JSON to data/default-presets.json:');
            console.log(json);
            // Also copy to clipboard if possible
            if (navigator.clipboard) {
                navigator.clipboard.writeText(json).then(() => {
                    console.log('Presets copied to clipboard!');
                }).catch(() => {
                    console.log('Could not copy to clipboard, see console output above');
                });
            }
            return json;
        } catch (e) {
            console.error('Error exporting presets:', e);
            return '[]';
        }
    };
});
