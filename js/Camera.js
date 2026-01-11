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

    follow(target, useDeadzone = false, deadzoneWidth = 0, deadzoneHeight = 0) {
        if (useDeadzone && deadzoneWidth > 0 && deadzoneHeight > 0) {
            // Deadzone mode: only move camera when character is near screen edges
            // Get character's screen position
            const screenPos = this.worldToScreen(target.x, target.y);
            const screenCenterX = this.width / 2;
            const screenCenterY = this.height / 2;
            
            // Calculate deadzone boundaries (centered on screen)
            const deadzoneLeft = screenCenterX - deadzoneWidth / 2;
            const deadzoneRight = screenCenterX + deadzoneWidth / 2;
            const deadzoneTop = screenCenterY - deadzoneHeight / 2;
            const deadzoneBottom = screenCenterY + deadzoneHeight / 2;
            
            // Calculate how far outside deadzone the character is
            let offsetX = 0;
            let offsetY = 0;
            
            if (screenPos.x < deadzoneLeft) {
                // Character is left of deadzone
                offsetX = screenPos.x - deadzoneLeft;
            } else if (screenPos.x > deadzoneRight) {
                // Character is right of deadzone
                offsetX = screenPos.x - deadzoneRight;
            }
            
            if (screenPos.y < deadzoneTop) {
                // Character is above deadzone
                offsetY = screenPos.y - deadzoneTop;
            } else if (screenPos.y > deadzoneBottom) {
                // Character is below deadzone
                offsetY = screenPos.y - deadzoneBottom;
            }
            
            // Convert screen offset to world offset and adjust camera
            if (offsetX !== 0 || offsetY !== 0) {
                const worldOffsetX = offsetX / this.zoom;
                const worldOffsetY = offsetY / this.zoom;
                
                this.x -= worldOffsetX * this.smoothing;
                this.y -= worldOffsetY * this.smoothing;
            }
        } else {
            // Center camera on target with smooth lerp (original behavior)
            const targetX = target.x - (this.width / 2) / this.zoom;
            const targetY = target.y - (this.height / 2) / this.zoom;

            this.x += (targetX - this.x) * this.smoothing;
            this.y += (targetY - this.y) * this.smoothing;
        }
        
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
