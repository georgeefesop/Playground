export class World {
    constructor() {
        this.canvas = document.getElementById('world-canvas');
        this.ctx = this.canvas.getContext('2d');

        // World size (can be infinite, but we'll define a playable area)
        this.width = 3000;
        this.height = 2000;

        // Projects in the world
        this.projects = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    addProject(project) {
        this.projects.push(project);
    }

    render(camera, character) {
        // Clear canvas
        this.ctx.fillStyle = '#f8f8f8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw subtle grid for depth
        this.drawGrid(camera);

        // Draw projects
        this.projects.forEach(project => {
            project.render(this.ctx, camera);
        });

        // Draw character
        character.render(this.ctx, camera);
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
