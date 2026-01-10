export class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 40; // Increased size for better sprite
        this.speed = 3;
        this.angle = 0; // Direction character is facing

        // Animation
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
        this.isMoving = false;
        this.walkCycle = 0;

        // Interaction
        this.interactionRadius = 150;
        this.isHovered = false;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.isMoving = true;

            // Calculate angle for facing direction
            this.angle = Math.atan2(dy, dx);

            // Move towards target
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;

            this.x += moveX;
            this.y += moveY;

            // Bob animation when moving
            this.bobOffset = Math.sin(Date.now() * this.bobSpeed * 0.01) * 2;
            this.walkCycle += 0.15;
        } else {
            this.isMoving = false;
            this.bobOffset = 0;
            this.walkCycle = 0;
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY + this.bobOffset);

        // Shadow (soft, realistic)
        const shadowGradient = ctx.createRadialGradient(0, this.size * 0.8, 0, 0, this.size * 0.8, this.size * 0.7);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.8, this.size * 0.7, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hover glow effect
        if (this.isHovered) {
            const glowGradient = ctx.createRadialGradient(0, 0, this.size * 0.8, 0, 0, this.size * 1.3);
            glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
            glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body - gradient for depth
        const bodyGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, this.size);
        bodyGradient.addColorStop(0, '#2a2a2a');
        bodyGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Subtle outline for definition
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head (slightly offset for character look)
        const headGradient = ctx.createRadialGradient(-3, -this.size * 0.3, 0, 0, -this.size * 0.25, this.size * 0.5);
        headGradient.addColorStop(0, '#3a3a3a');
        headGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.25, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyes - responsive to movement direction
        const eyeOffset = this.size * 0.2;
        const eyeSize = this.size * 0.12;

        // Calculate eye position based on facing direction
        const lookX = Math.cos(this.angle) * 2;
        const lookY = Math.sin(this.angle) * 2;

        // Eye whites
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-eyeOffset + lookX, -this.size * 0.3 + lookY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOffset + lookX, -this.size * 0.3 + lookY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils with subtle gradient
        const pupilGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize * 0.5);
        pupilGradient.addColorStop(0, '#4a4a4a');
        pupilGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = pupilGradient;
        ctx.beginPath();
        ctx.arc(-eyeOffset + lookX * 1.5, -this.size * 0.3 + lookY * 1.5, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOffset + lookX * 1.5, -this.size * 0.3 + lookY * 1.5, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (subtle, calm expression)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.1, this.size * 0.25, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Accent detail (adds character personality)
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.95, Math.PI * 0.1, Math.PI * 0.3);
        ctx.stroke();

        ctx.restore();
    }

    distanceTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isNear(x, y) {
        return this.distanceTo(x, y) < this.interactionRadius;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getScreenPosition(camera) {
        return {
            x: this.x - camera.x,
            y: this.y - camera.y
        };
    }

    containsPoint(x, y) {
        return this.distanceTo(x, y) < this.size;
    }

    setHovered(hovered) {
        this.isHovered = hovered;
    }
}
