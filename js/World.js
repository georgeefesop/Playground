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

    drawBackground(camera, dimFactor = 0, targetCtx = null, targetCanvas = null) {
        const ctx = targetCtx || this.ctx;
        const canvas = targetCanvas || this.canvas;
        
        // Get CSS custom property values
        const getCSSVar = (varName) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };

        if (this.currentBackground === 'grid') {
            // Grid background (default light)
            ctx.fillStyle = getCSSVar('--color-gray-200') || '#f8f8f8';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (this.currentBackground === 'space') {
            // Space background - draw in screen space
            if (!this.backgroundImage || !this.backgroundImage.complete) {
                if (!this.backgroundImage) {
                    this.backgroundImage = new Image();
                    this.backgroundImage.src = 'assets/space.png';
                }
                // Fallback while loading
                ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                // Create pattern and fill entire screen
                const pattern = ctx.createPattern(this.backgroundImage, 'repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    // Fill entire canvas with pattern
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else {
                    // Fallback
                    ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        } else {
            // Default fallback
            ctx.fillStyle = getCSSVar('--color-space-bg') || '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Apply dimming overlay based on star proximity (dimFactor: 0 = no dim, 1 = fully dimmed)
        if (dimFactor > 0) {
            // Draw a dark overlay that increases opacity as dimFactor increases
            // dimFactor of 1.0 = 35% opacity dark overlay (reduced by 50% from original 70%)
            const overlayOpacity = dimFactor * 0.35;
            ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    render(camera, character, dimFactor = 0, renderCharacter = true, renderGrid = true, targetCtx = null, targetCanvas = null, renderNametags = true) {
        const ctx = targetCtx || this.ctx;
        const canvas = targetCanvas || this.canvas;
        
        // Draw background in screen space (before transform)
        this.drawBackground(camera, dimFactor, targetCtx, targetCanvas);

        // Apply zoom transform for world elements
        ctx.save();
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        // Draw subtle grid for depth
        if (this.showGrid && renderGrid) {
            this.drawGrid(camera, targetCtx, targetCanvas);
        }

        // Draw projects
        this.projects.forEach(project => {
            project.render(ctx, camera, renderNametags);
        });

        // Draw character
        if (renderCharacter && character) {
            character.render(ctx, camera);
        }
        
        ctx.restore();
    }

    drawGrid(camera, targetCtx = null, targetCanvas = null) {
        const ctx = targetCtx || this.ctx;
        const canvas = targetCanvas || this.canvas;
        
        const gridSize = 100;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endX = camera.x + canvas.width;
        const endY = camera.y + canvas.height;

        // Get CSS custom property for grid color
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--color-shadow-xs').trim() || 'rgba(0, 0, 0, 0.03)';
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = x - camera.x;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = y - camera.y;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvas.width, screenY);
            ctx.stroke();
        }
    }


    getCanvas() {
        return this.canvas;
    }

    getProjects() {
        return this.projects;
    }
}
