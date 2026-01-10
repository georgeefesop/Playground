export class Project {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.size = config.size || 80;
        this.shape = config.shape || 'circle';
        this.color = config.color || '#1a1a1a';
        this.colorNear = config.colorNear || this.color;
        this.label = config.label || 'Project';
        this.boundaryRadius = config.boundaryRadius || 250; // Boundary for triggers

        // Animation
        this.hoverScale = 1;
        this.proximityValue = 0; // 0 = far, 1 = near
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(isNearby, distance) {
        // Hover effect when character is nearby
        const targetScale = isNearby ? 1.1 : 1;
        this.hoverScale += (targetScale - this.hoverScale) * 0.1;

        // Calculate proximity value for color gradient (0-1)
        // Use boundaryRadius for gradient effect
        const normalizedDistance = Math.min(distance / this.boundaryRadius, 1);
        const targetProximity = 1 - normalizedDistance;

        // Smooth transition
        this.proximityValue += (targetProximity - this.proximityValue) * 0.1;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    getCurrentColor() {
        return this.interpolateColor(this.color, this.colorNear, this.proximityValue);
    }

    render(ctx, camera) {
        // Only render if on screen (accounting for zoom)
        const screenPos = camera.worldToScreen(this.x, this.y);
        if (screenPos.x < -this.size || screenPos.x > camera.width + this.size ||
            screenPos.y < -this.size || screenPos.y > camera.height + this.size) {
            return;
        }

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.scale(this.hoverScale, this.hoverScale);
        ctx.imageSmoothingEnabled = false; // Pixel art style

        // Subtle pulse animation
        const pulse = Math.sin(Date.now() * 0.001 + this.pulseOffset) * 0.05 + 1;

        // Get current color based on proximity
        const currentColor = this.getCurrentColor();
        const colorRgb = this.hexToRgb(currentColor);
        const nearColorRgb = this.hexToRgb(this.colorNear);

        // Bright glowing gradient radiating from projects when nearby
        if (this.proximityValue > 0.1 && nearColorRgb) {
            const gradientRadius = this.boundaryRadius * this.proximityValue;
            const emanationGradient = ctx.createRadialGradient(0, 0, this.size * 0.5, 0, 0, gradientRadius);
            
            // Bright glowing gradient matching the near color - more intense
            const glowIntensity = this.proximityValue;
            // Make it brighter and more visible
            emanationGradient.addColorStop(0, `rgba(${nearColorRgb.r}, ${nearColorRgb.g}, ${nearColorRgb.b}, ${glowIntensity * 0.8})`);
            emanationGradient.addColorStop(0.2, `rgba(${nearColorRgb.r}, ${nearColorRgb.g}, ${nearColorRgb.b}, ${glowIntensity * 0.6})`);
            emanationGradient.addColorStop(0.4, `rgba(${nearColorRgb.r}, ${nearColorRgb.g}, ${nearColorRgb.b}, ${glowIntensity * 0.4})`);
            emanationGradient.addColorStop(0.7, `rgba(${nearColorRgb.r}, ${nearColorRgb.g}, ${nearColorRgb.b}, ${glowIntensity * 0.2})`);
            emanationGradient.addColorStop(1, `rgba(${nearColorRgb.r}, ${nearColorRgb.g}, ${nearColorRgb.b}, 0)`);

            ctx.fillStyle = emanationGradient;
            ctx.beginPath();
            ctx.arc(0, 0, gradientRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(2, 2, this.size * 0.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Gradient fill
        const gradient = ctx.createRadialGradient(-this.size * 0.15, -this.size * 0.15, 0, 0, 0, this.size * 0.5 * pulse);

        // Lighter center
        if (colorRgb) {
            gradient.addColorStop(0, `rgba(${colorRgb.r + 40}, ${colorRgb.g + 40}, ${colorRgb.b + 40}, 1)`);
            gradient.addColorStop(1, currentColor);
        } else {
            gradient.addColorStop(0, currentColor);
            gradient.addColorStop(1, currentColor);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect when nearby
        if (this.proximityValue > 0.3) {
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = this.proximityValue * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, (this.size * 0.5 + 8) * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Boundary circle (drawn in world space, not scaled)
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.imageSmoothingEnabled = false;

        // Show boundary at 20% opacity with current color
        if (colorRgb) {
            ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.2)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line
            ctx.beginPath();
            ctx.arc(0, 0, this.boundaryRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
        }

        // Pixel art style nametag
        ctx.restore();
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.imageSmoothingEnabled = false;

        // Calculate nametag dimensions
        ctx.font = 'bold 14px "Courier New", "Consolas", monospace';
        const textMetrics = ctx.measureText(this.label);
        const textWidth = textMetrics.width;
        const textHeight = 16;
        const padding = 8;
        const tagWidth = textWidth + padding * 2;
        const tagHeight = textHeight + padding * 2;
        const tagY = this.size * 0.5 + 20;

        // Draw nametag background
        ctx.fillStyle = '#000';
        ctx.fillRect(-tagWidth / 2 - 1, tagY - 1, tagWidth + 2, tagHeight + 2);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-tagWidth / 2, tagY, tagWidth, tagHeight);

        // Draw nametag border (pixel style)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-tagWidth / 2, tagY, tagWidth, tagHeight);

        // Draw text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px "Courier New", "Consolas", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, 0, tagY + tagHeight / 2);

        ctx.restore();
    }

    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    interact() {
        // Handle project interaction
        if (this.config.onClick) {
            this.config.onClick();
        } else if (this.config.url) {
            window.open(this.config.url, '_blank');
        } else if (this.config.modal) {
            // Show modal content
            this.showModal(this.config.modal);
        }
    }

    showModal(content) {
        // Create a modal to display project content - Pixel style
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 1.5rem;
            border-radius: 0;
            box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
            border: 3px solid #000;
            max-width: 500px;
            max-height: 80vh;
            overflow: auto;
            z-index: 1000;
            font-family: 'Courier New', 'Consolas', monospace;
            image-rendering: crisp-edges;
        `;
        modal.innerHTML = content + '<br><button onclick="this.parentElement.remove(); document.getElementById(\'modal-backdrop\').remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #000; color: white; border: 2px solid #000; border-radius: 0; cursor: pointer; font-family: \'Courier New\', \'Consolas\', monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem;">Close</button>';

        const backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;
        backdrop.onclick = () => {
            modal.remove();
            backdrop.remove();
        };

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    }
}
