export class World {
    constructor() {
        this.canvas = document.getElementById('world-canvas');
        this.ctx = this.canvas.getContext('2d');

        // World size (can be infinite, but we'll define a playable area)
        this.width = 3000;
        this.height = 2000;

        // Projects in the world
        this.projects = [];

        // Background settings
        this.currentBackground = 'space';
        this.backgroundImage = null;
        this.showGrid = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    drawBackground(camera) {
        // Get CSS custom property values
        const getCSSVar = (varName) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };

        if (this.currentBackground === 'grid') {
            // Grid background (default light)
            this.ctx.fillStyle = getCSSVar('--color-gray-200') || '#f8f8f8';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.currentBackground === 'space') {
            // Space background - draw in screen space
            if (!this.backgroundImage || !this.backgroundImage.complete) {
                if (!this.backgroundImage) {
                    this.backgroundImage = new Image();
                    this.backgroundImage.src = 'assets/space.png';
                }
                // Fallback while loading
                this.ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Create pattern and fill entire screen
                const pattern = this.ctx.createPattern(this.backgroundImage, 'repeat');
                if (pattern) {
                    this.ctx.fillStyle = pattern;
                    // Fill entire canvas with pattern
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                } else {
                    // Fallback
                    this.ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            }
        } else {
            // Default fallback
            this.ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    addProject(project) {
        this.projects.push(project);
    }

    setBackground(backgroundId, imagePath) {
        this.currentBackground = backgroundId;
        if (imagePath) {
            this.backgroundImage = new Image();
            this.backgroundImage.src = imagePath;
        } else {
            this.backgroundImage = null;
        }
    }

    setShowGrid(show) {
        this.showGrid = show;
    }

    render(camera, character) {
        // Draw background in screen space (before transform)
        this.drawBackground(camera);

        // Apply zoom transform for world elements
        this.ctx.save();
        this.ctx.scale(camera.zoom, camera.zoom);
        this.ctx.translate(-camera.x, -camera.y);

        // Draw subtle grid for depth
        if (this.showGrid) {
            this.drawGrid(camera);
        }

        // Draw projects
        this.projects.forEach(project => {
            project.render(this.ctx, camera);
        });

        // Draw character
        character.render(this.ctx, camera);
        
        this.ctx.restore();
    }

    drawGrid(camera) {
        const gridSize = 100;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endX = camera.x + this.canvas.width;
        const endY = camera.y + this.canvas.height;

        // Get CSS custom property for grid color
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--color-grid-line').trim() || 'rgba(0, 0, 0, 0.03)';
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = x - camera.x;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = y - camera.y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getProjects() {
        return this.projects;
    }
}
