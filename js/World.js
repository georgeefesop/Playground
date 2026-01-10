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
        if (this.currentBackground === 'grid') {
            // Grid background (default light)
            this.ctx.fillStyle = '#f8f8f8';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.currentBackground === 'space') {
            // Space background
            if (!this.backgroundImage || !this.backgroundImage.complete) {
                if (!this.backgroundImage) {
                    this.backgroundImage = new Image();
                    this.backgroundImage.src = 'assets/space.png';
                }
                // Fallback while loading
                this.ctx.fillStyle = '#0a0a0f';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Create pattern
                const pattern = this.ctx.createPattern(this.backgroundImage, 'repeat');
                if (pattern) {
                    this.ctx.fillStyle = pattern;
                    // Draw background covering visible area plus some buffer
                    const startX = Math.floor(camera.x / this.backgroundImage.width) * this.backgroundImage.width;
                    const startY = Math.floor(camera.y / this.backgroundImage.height) * this.backgroundImage.height;
                    const endX = camera.x + this.canvas.width + this.backgroundImage.width;
                    const endY = camera.y + this.canvas.height + this.backgroundImage.height;

                    this.ctx.fillRect(
                        startX - camera.x,
                        startY - camera.y,
                        endX - startX,
                        endY - startY
                    );
                } else {
                    // Fallback
                    this.ctx.fillStyle = '#0a0a0f';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            }
        } else {
            // Default fallback
            this.ctx.fillStyle = '#0a0a0f';
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
        // Draw background BEFORE camera transform (in screen space)
        this.drawBackground(camera);

        // Apply camera transform for world elements
        this.ctx.save();
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

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
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
