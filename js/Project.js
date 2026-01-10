export class Project {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.size = config.size || 80;
        this.shape = config.shape || 'circle'; // circle, square, portal
        this.color = config.color || '#1a1a1a';
        this.label = config.label || 'Project';

        // Animation
        this.hoverScale = 1;
        this.pulseOffset = Math.random() * Math.PI * 2; // Random phase for pulse
    }

    update(isNearby) {
        // Hover effect when character is nearby
        const targetScale = isNearby ? 1.1 : 1;
        this.hoverScale += (targetScale - this.hoverScale) * 0.1;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX < -this.size || screenX > camera.width + this.size ||
            screenY < -this.size || screenY > camera.height + this.size) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(this.hoverScale, this.hoverScale);

        // Subtle pulse animation
        const pulse = Math.sin(Date.now() * 0.001 + this.pulseOffset) * 0.05 + 1;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        if (this.shape === 'circle') {
            ctx.arc(2, 2, this.size * 0.5 * pulse, 0, Math.PI * 2);
        } else {
            ctx.rect(-this.size * 0.5 * pulse + 2, -this.size * 0.5 * pulse + 2,
                     this.size * pulse, this.size * pulse);
        }
        ctx.fill();

        // Main shape
        ctx.fillStyle = this.color;
        ctx.beginPath();

        if (this.shape === 'circle') {
            ctx.arc(0, 0, this.size * 0.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.rect(-this.size * 0.5 * pulse, -this.size * 0.5 * pulse,
                     this.size * pulse, this.size * pulse);
            ctx.fill();
        } else if (this.shape === 'portal') {
            // Portal effect - concentric circles
            for (let i = 3; i > 0; i--) {
                ctx.globalAlpha = 0.3 * i;
                ctx.arc(0, 0, (this.size * 0.5 * pulse) * (i / 3), 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
            }
            ctx.globalAlpha = 1;
        }

        // Interaction hint (small glow when nearby)
        if (this.hoverScale > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(0, 0, (this.size * 0.5 + 10) * pulse, 0, Math.PI * 2);
            } else {
                const halfSize = this.size * 0.5 + 10;
                ctx.rect(-halfSize * pulse, -halfSize * pulse, halfSize * 2 * pulse, halfSize * 2 * pulse);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.label, 0, this.size * 0.5 + 15);

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
        // Create a modal to display project content
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            max-height: 80vh;
            overflow: auto;
            z-index: 1000;
        `;
        modal.innerHTML = content + '<br><button onclick="this.parentElement.remove(); document.getElementById(\'modal-backdrop\').remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1a1a1a; color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>';

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
