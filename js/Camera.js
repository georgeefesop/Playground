export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.smoothing = 0.1; // Smooth camera follow
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomSpeed = 0.1;
    }

    follow(target) {
        // Center camera on target with smooth lerp
        const targetX = target.x - (this.width / 2) / this.zoom;
        const targetY = target.y - (this.height / 2) / this.zoom;

        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
        
        // Smooth zoom
        this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;
    }

    setZoom(zoom) {
        this.targetZoom = Math.max(0.5, Math.min(2.0, zoom));
    }

    getZoom() {
        return this.zoom;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
}
