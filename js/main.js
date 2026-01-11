import { Game } from './Game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(); // Make globally accessible for preset export
    game.start();
});
