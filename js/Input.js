export class Input {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;

        // Keyboard
        this.keys = {};

        // Mouse/Touch
        this.clickTarget = null;
        this.isTouchDevice = 'ontouchstart' in window;

        // Virtual joystick for mobile
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            element: null
        };

        this.setupListeners();
    }

    setupListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Prevent arrow key scrolling
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse click to move
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const worldPos = this.camera.screenToWorld(screenX, screenY);
            this.clickTarget = worldPos;
        });

        // Touch controls
        if (this.isTouchDevice) {
            this.setupVirtualJoystick();
        }
    }

    setupVirtualJoystick() {
        // Create joystick UI
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'virtual-joystick';
        joystickContainer.innerHTML = `
            <div id="joystick-base">
                <div id="joystick-stick"></div>
            </div>
        `;
        document.getElementById('ui-overlay').appendChild(joystickContainer);

        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');

        const handleStart = (e) => {
            this.joystick.active = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = base.getBoundingClientRect();
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;
        };

        const handleMove = (e) => {
            if (!this.joystick.active) return;

            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - this.joystick.startX;
            const dy = touch.clientY - this.joystick.startY;

            // Limit to joystick radius
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 40;

            if (distance > maxDistance) {
                this.joystick.currentX = (dx / distance) * maxDistance;
                this.joystick.currentY = (dy / distance) * maxDistance;
            } else {
                this.joystick.currentX = dx;
                this.joystick.currentY = dy;
            }

            // Update visual
            stick.style.transform = `translate(calc(-50% + ${this.joystick.currentX}px), calc(-50% + ${this.joystick.currentY}px))`;

            e.preventDefault();
        };

        const handleEnd = () => {
            this.joystick.active = false;
            this.joystick.currentX = 0;
            this.joystick.currentY = 0;
            stick.style.transform = 'translate(-50%, -50%)';
        };

        base.addEventListener('touchstart', handleStart, { passive: false });
        base.addEventListener('mousedown', handleStart);

        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mousemove', handleMove);

        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mouseup', handleEnd);
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        // Keyboard input
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        // Joystick input
        if (this.joystick.active) {
            dx += this.joystick.currentX / 40;
            dy += this.joystick.currentY / 40;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        return { dx, dy };
    }

    consumeClickTarget() {
        const target = this.clickTarget;
        this.clickTarget = null;
        return target;
    }

    isTouchEnabled() {
        return this.isTouchDevice;
    }
}
