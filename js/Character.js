export class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 30;
        this.speed = 3;
        this.angle = 0; // Direction character is facing

        // Animation
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
        this.isMoving = false;

        // Interaction
        this.interactionRadius = 150;
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
            this.bobOffset = Math.sin(Date.now() * this.bobSpeed * 0.01) * 3;
        } else {
            this.isMoving = false;
            this.bobOffset = 0;
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY + this.bobOffset);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.4, this.size * 0.6, this.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (simple circle for now, can be enhanced later)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (gives character life and direction)
        const eyeOffset = 8;
        const eyeSize = 5;

        // Calculate eye position based on facing direction
        const lookX = Math.cos(this.angle) * 3;
        const lookY = Math.sin(this.angle) * 3;

        ctx.fillStyle = 'white';

        // Left eye
        ctx.beginPath();
        ctx.arc(-eyeOffset + lookX, -5 + lookY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeOffset + lookX, -5 + lookY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(-eyeOffset + lookX * 1.5, -5 + lookY * 1.5, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(eyeOffset + lookX * 1.5, -5 + lookY * 1.5, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (subtle smile)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0.2, Math.PI - 0.2);
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
}
