export class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 48;
        this.baseSpeed = 2.5;
        this.speedMultiplier = 1.5; // Default 1.5x
        this.speed = this.baseSpeed * this.speedMultiplier;
        this.angle = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.friction = 0.85; // Add friction to stop quickly

        // Animation
        this.isMoving = false;
        this.walkCycle = 0;
        this.animationFrame = 0;
        this.animationSpeed = 0.15;

        // Direction: 0=down, 1=left, 2=right, 3=up
        this.direction = 0;

        // Interaction
        this.interactionRadius = 150;
        this.isHovered = false;

        // Sprite
        this.sprite = new Image();
        this.sprite.src = 'assets/character-sprite.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Sprite sheet layout (4 rows x 3 columns)
        this.spriteWidth = 16;
        this.spriteHeight = 16;
        this.framesPerDirection = 3;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 3) {
            this.isMoving = true;

            // Calculate angle and determine direction
            this.angle = Math.atan2(dy, dx);

            // Determine sprite direction based on angle
            // Sprite sheet layout: Row 0=Down, Row 1=Up, Row 2=Left, Row 3=Right
            const angleDeg = (this.angle * 180 / Math.PI + 360) % 360;
            if (angleDeg >= 45 && angleDeg < 135) {
                this.direction = 0; // Down
            } else if (angleDeg >= 135 && angleDeg < 225) {
                this.direction = 2; // Left (row 2)
            } else if (angleDeg >= 225 && angleDeg < 315) {
                this.direction = 1; // Up (row 1)
            } else {
                this.direction = 3; // Right (row 3)
            }

            // Apply velocity towards target
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;

            this.velocityX = moveX;
            this.velocityY = moveY;

            // Move
            this.x += this.velocityX;
            this.y += this.velocityY;

            // Animate walk cycle
            this.walkCycle += this.animationSpeed;
            this.animationFrame = Math.floor(this.walkCycle) % this.framesPerDirection;
        } else {
            // Apply friction when stopped
            this.velocityX *= this.friction;
            this.velocityY *= this.friction;

            if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
            if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;

            this.isMoving = false;
            this.walkCycle = 0;
            this.animationFrame = 1; // Middle frame when idle
        }
    }

    render(ctx, camera) {
        const screenX = this.x;
        const screenY = this.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Soft shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.4, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hover glow effect
        if (this.isHovered) {
            ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
            ctx.shadowBlur = 20;
        }

        // Draw sprite if loaded, otherwise fallback
        if (this.spriteLoaded) {
            // Calculate source position in sprite sheet
            const srcX = this.animationFrame * this.spriteWidth;
            const srcY = this.direction * this.spriteHeight;

            // Draw sprite scaled up 3x (16x16 -> 48x48)
            ctx.imageSmoothingEnabled = false; // Crisp pixels
            ctx.drawImage(
                this.sprite,
                srcX, srcY,
                this.spriteWidth, this.spriteHeight,
                -this.size / 2, -this.size / 2,
                this.size, this.size
            );
        } else {
            // Fallback: simple circle while loading
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

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
        return this.distanceTo(x, y) < this.size / 2;
    }

    setHovered(hovered) {
        this.isHovered = hovered;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }
}
