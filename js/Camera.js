export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.smoothing = 0.1; // Smooth camera follow
    }

    follow(target) {
        // Center camera on target with smooth lerp
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;

        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}
