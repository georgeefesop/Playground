export class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 48;
        this.baseSpeed = 5.0; // Doubled from 2.5
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
        // Animation speed - cycles per second, scaled by movement speed
        this.baseAnimationSpeed = 0.2; // Base animation speed multiplier

        // Direction: 0=down, 1=left, 2=right, 3=up
        this.direction = 0;

        // Interaction
        this.interactionRadius = 150;
        this.isHovered = false;

        // Sprite
        this.sprite = new Image();
        this.sprite.src = 'assets/character-sprite.png';
        this.spriteLoaded = false;
        // #region agent log
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            fetch('http://127.0.0.1:7242/ingest/f54f7081-85c5-46b3-9791-73f1ba1b818e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Character.js:34',message:'sprite onload',data:{spriteWidth:this.sprite.width,spriteHeight:this.sprite.height,isTouchDevice:window.innerWidth<=768},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        };
        this.sprite.onerror = () => {
            fetch('http://127.0.0.1:7242/ingest/f54f7081-85c5-46b3-9791-73f1ba1b818e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Character.js:34',message:'sprite onerror',data:{src:this.sprite.src,isTouchDevice:window.innerWidth<=768},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        };
        // #endregion

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

        if (distance > 1) {
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

            // Move directly towards target - no sliding
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;

            // Clamp movement to not overshoot target
            if (Math.abs(moveX) > Math.abs(dx)) {
                this.x = this.targetX;
            } else {
                this.x += moveX;
            }

            if (Math.abs(moveY) > Math.abs(dy)) {
                this.y = this.targetY;
            } else {
                this.y += moveY;
            }

            // Animate walk cycle - speed-based animation that scales smoothly with movement speed
            // Animation speed scales with character speed to keep it synchronized
            const speedRatio = this.speed / (this.baseSpeed * 1.5); // Normalize to default speed
            this.walkCycle += this.baseAnimationSpeed * speedRatio;
            this.animationFrame = Math.floor(this.walkCycle) % this.framesPerDirection;
        } else {
            // Stop immediately when close enough
            this.x = this.targetX;
            this.y = this.targetY;
            this.velocityX = 0;
            this.velocityY = 0;
            this.isMoving = false;
            this.walkCycle = 0;
            this.animationFrame = 1; // Middle frame when idle
        }
    }

    render(ctx, camera) {
        // Character is rendered inside the world transform context
        // So we use world coordinates directly
        ctx.save();
        ctx.translate(this.x, this.y);

        // Get CSS custom property values
        const getCSSVar = (varName, fallback) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
        };

        // Soft shadow
        ctx.fillStyle = getCSSVar('--color-shadow-xl', 'rgba(0, 0, 0, 0.2)');
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.4, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hover glow effect
        if (this.isHovered) {
            const accentColor = getCSSVar('--color-accent-indigo', '#6366f1');
            // Convert hex to rgba
            const hex = accentColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.shadowBlur = 20;
        }

        // Draw sprite if loaded, otherwise don't render (sprite loads quickly)
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
        }
        // No fallback - sprite loads quickly, so we just don't render until it's ready

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
        // Calculate screen position - worldToScreen already accounts for camera position
        // When camera is centered on character, this returns approximately (width/2, height/2)
        return camera.worldToScreen(this.x, this.y);
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
