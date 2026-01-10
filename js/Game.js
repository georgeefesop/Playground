import { World } from './World.js';
import { Character } from './Character.js';
import { Camera } from './Camera.js';
import { Input } from './Input.js';
import { Guide } from './Guide.js';
import { Project } from './Project.js';

export class Game {
    constructor() {
        this.world = new World();
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.character = new Character(0, 0);
        this.input = new Input(this.world.getCanvas(), this.camera);
        this.guide = new Guide();

        this.isRunning = false;

        // Thought bubble state
        this.thoughtBubble = {
            active: false,
            text: '',
            timer: 0,
            duration: 5000
        };

        // Menu state
        this.activeMenu = false;

        // Click effects
        this.clickEffects = [];

        this.setupProjects();
        this.setupUI();
        this.setupInteraction();
        this.setupSettingsPanel();

        // Center camera on character
        this.camera.x = this.character.x - this.camera.width / 2;
        this.camera.y = this.character.y - this.camera.height / 2;
    }


    setupProjects() {
        const project1 = new Project(300, -200, {
            label: 'Test Project Alpha',
            shape: 'circle',
            color: '#1a1f2e',      // Dark midnight bluish charcoal grey
            colorNear: '#ff4444',  // Glowing red when near
            size: 80,
            boundaryRadius: 250,   // Larger boundary
            modal: '<h2>Test Project Alpha</h2><p>This is a simple test project to demonstrate the interaction system.</p><p>In a real implementation, this would showcase actual work.</p>'
        });

        const project2 = new Project(-250, 200, {
            label: 'Experiment Beta',
            shape: 'circle',
            color: '#1e2329',      // Dark charcoal grey (slightly different value)
            colorNear: '#ff8844',  // Glowing orange when near
            size: 80,
            boundaryRadius: 250,   // Larger boundary
            modal: '<h2>Experiment Beta</h2><p>Another test project with a different shape and color.</p><p>Each project can have its own unique presentation style.</p>'
        });

        this.world.addProject(project1);
        this.world.addProject(project2);
    }

    setupUI() {
        window.addEventListener('resize', () => {
            this.camera.resize(window.innerWidth, window.innerHeight);
        });

        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.startGame();
        });

        // Close tutorial with Enter or Spacebar
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const tutorial = document.getElementById('tutorial');
                if (!tutorial.classList.contains('hidden')) {
                    e.preventDefault();
                    this.startGame();
                }
                
                // Close message prompt
                if (this.activeMenu) {
                    e.preventDefault();
                    this.hideMenu();
                }
            }
        });
    }

    setupSettingsPanel() {
        const toggleBtn = document.getElementById('settings-toggle-btn');
        const settingsPanel = document.getElementById('settings-panel');
        let isOpen = false;

        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                settingsPanel.classList.remove('hidden');
            } else {
                settingsPanel.classList.add('hidden');
            }
        });

        // Background library
        const backgrounds = [
            { name: 'Space', image: 'assets/space.png', id: 'space' },
            { name: 'Grid', image: null, id: 'grid' }
        ];

        const backgroundLibrary = document.getElementById('background-library');
        backgrounds.forEach(bg => {
            const item = document.createElement('div');
            item.className = 'background-item';
            item.dataset.backgroundId = bg.id;
            
            // Create preview tile
            const preview = document.createElement('div');
            preview.className = 'background-preview';
            
            if (bg.image) {
                // Image background - create img element
                const img = document.createElement('img');
                img.src = bg.image;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.imageRendering = 'pixelated';
                preview.appendChild(img);
            } else {
                // Grid background - create canvas to draw grid pattern
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                
                // Draw grid pattern
                ctx.fillStyle = '#f8f8f8';
                ctx.fillRect(0, 0, 64, 64);
                
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;
                
                // Draw grid lines
                for (let x = 0; x <= 64; x += 8) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, 64);
                    ctx.stroke();
                }
                for (let y = 0; y <= 64; y += 8) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(64, y);
                    ctx.stroke();
                }
                
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                preview.appendChild(canvas);
            }
            
            // Create label
            const label = document.createElement('div');
            label.className = 'background-label';
            label.textContent = bg.name;
            
            item.appendChild(preview);
            item.appendChild(label);
            
            if (bg.id === 'space') {
                item.classList.add('active');
            }

            item.addEventListener('click', () => {
                // Remove active from all
                backgroundLibrary.querySelectorAll('.background-item').forEach(el => {
                    el.classList.remove('active');
                });
                item.classList.add('active');
                this.world.setBackground(bg.id, bg.image);
            });

            backgroundLibrary.appendChild(item);
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            const speedMultiplier = parseFloat(e.target.value);
            this.character.setSpeedMultiplier(speedMultiplier);
        });

        // Grid toggle
        const gridToggle = document.getElementById('grid-toggle');
        gridToggle.addEventListener('change', (e) => {
            this.world.setShowGrid(e.target.checked);
        });
    }

    setupSettingsPanel() {
        const toggleBtn = document.getElementById('settings-toggle-btn');
        const settingsPanel = document.getElementById('settings-panel');
        let isOpen = false;

        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                settingsPanel.classList.remove('hidden');
            } else {
                settingsPanel.classList.add('hidden');
            }
        });

        // Background library
        const backgrounds = [
            { name: 'Space', image: 'assets/space.png', id: 'space' },
            { name: 'Grid', image: null, id: 'grid' }
        ];

        const backgroundLibrary = document.getElementById('background-library');
        backgrounds.forEach(bg => {
            const item = document.createElement('div');
            item.className = 'background-item';
            item.textContent = bg.name;
            item.dataset.backgroundId = bg.id;
            
            if (bg.id === 'space') {
                item.classList.add('active');
            }

            item.addEventListener('click', () => {
                // Remove active from all
                backgroundLibrary.querySelectorAll('.background-item').forEach(el => {
                    el.classList.remove('active');
                });
                item.classList.add('active');
                this.world.setBackground(bg.id, bg.image);
            });

            backgroundLibrary.appendChild(item);
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            const speedMultiplier = parseFloat(e.target.value);
            this.character.setSpeedMultiplier(speedMultiplier);
        });

        // Grid toggle
        const gridToggle = document.getElementById('grid-toggle');
        gridToggle.addEventListener('change', (e) => {
            this.world.setShowGrid(e.target.checked);
        });
    }

    setupInteraction() {
        const canvas = this.world.getCanvas();

        // Click on character to send message
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.camera.screenToWorld(screenX, screenY);

            // Add click effect
            this.addClickEffect(worldPos.x, worldPos.y);

            // Close menu if clicking elsewhere
            if (this.activeMenu) {
                this.hideMenu();
                return;
            }

            // Check if clicked on character
            if (this.character.containsPoint(worldPos.x, worldPos.y)) {
                e.preventDefault();
                this.showMessagePrompt();
            }
        });

        // Prevent right-click menu
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse hover effect
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.camera.screenToWorld(screenX, screenY);

            const isHovered = this.character.containsPoint(worldPos.x, worldPos.y);
            this.character.setHovered(isHovered);
            canvas.style.cursor = isHovered ? 'pointer' : 'default';
        });
    }

    hideMenu() {
        this.activeMenu = false;
        document.getElementById('message-prompt').classList.add('hidden');
    }

    showMessagePrompt() {
        this.activeMenu = true;

        const prompt = document.getElementById('message-prompt');
        const input = document.getElementById('message-input');

        // Position to the right of the character
        const charScreenPos = this.character.getScreenPosition(this.camera);
        prompt.style.left = `${charScreenPos.x + 80}px`; // 80px to the right
        prompt.style.top = `${charScreenPos.y - 60}px`; // Slightly above center
        prompt.style.transform = 'none';

        prompt.classList.remove('hidden');
        input.value = '';
        input.focus();

        const sendBtn = document.getElementById('message-send-btn');
        const cancelBtn = document.getElementById('message-cancel-btn');

        sendBtn.onclick = async () => {
            const message = input.value.trim();
            if (message) {
                this.hideMenu();
                this.showThoughtBubble('...');

                const nearbyProjects = this.getNearbyProjects(200);
                const response = await this.guide.sendMessage(message, { nearbyProjects });

                this.showThoughtBubble(response);
            }
        };

        cancelBtn.onclick = () => {
            this.hideMenu();
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        };
    }

    showThoughtBubble(text, duration = 5000) {
        this.thoughtBubble = {
            active: true,
            text,
            timer: Date.now(),
            duration
        };
    }

    updateThoughtBubble() {
        if (!this.thoughtBubble.active) return;

        // Check if bubble should expire
        if (Date.now() - this.thoughtBubble.timer > this.thoughtBubble.duration) {
            this.thoughtBubble.active = false;
            return;
        }

        // Position bubble near character - LEFT SIDE
        const charScreenPos = this.character.getScreenPosition(this.camera);
        const bubble = document.getElementById('guide-comment');

        bubble.textContent = this.thoughtBubble.text;
        bubble.classList.remove('hidden');

        // Position above head, slightly to the right
        bubble.style.left = `${charScreenPos.x + 20}px`; // Slightly right of center
        bubble.style.top = `${charScreenPos.y - 80}px`; // Above head
        bubble.style.transform = 'translateX(0)';
    }

    hideThoughtBubble() {
        const bubble = document.getElementById('guide-comment');
        bubble.classList.add('hidden');
    }

    startGame() {
        const tutorial = document.getElementById('tutorial');
        tutorial.classList.add('hidden');

        setTimeout(() => {
            this.showThoughtBubble("Welcome! I'm The Guide. Click on me to chat.");
        }, 500);

        this.isRunning = true;
        this.gameLoop();
    }

    showTutorial() {
        const tutorial = document.getElementById('tutorial');
        const controlsHint = document.getElementById('controls-hint');

        if (this.input.isTouchEnabled()) {
            controlsHint.textContent = 'the joystick or tap to move';
        } else {
            controlsHint.textContent = 'arrow keys or WASD to move, or click';
        }

        tutorial.classList.remove('hidden');
    }

    getNearbyProjects(radius) {
        const projects = this.world.getProjects();
        const charPos = this.character.getPosition();

        return projects.filter(project => {
            return project.distanceTo(charPos.x, charPos.y) < radius;
        });
    }

    addClickEffect(x, y) {
        this.clickEffects.push({
            x,
            y,
            timer: 0,
            duration: 30, // frames (about 0.5 seconds at 60fps)
            size: 0,
            maxSize: 40
        });
    }

    updateClickEffects() {
        this.clickEffects = this.clickEffects.filter(effect => {
            effect.timer += 1; // Increment frame counter
            const progress = effect.timer / effect.duration;
            effect.size = progress * effect.maxSize;
            return effect.timer < effect.duration;
        });
    }

    renderClickEffects(ctx, camera) {
        this.clickEffects.forEach(effect => {
            const screenX = effect.x - camera.x;
            const screenY = effect.y - camera.y;
            const progress = effect.timer / effect.duration;
            const alpha = 1 - progress;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.imageSmoothingEnabled = false;

            // Pixel art style click effect - expanding rings
            const ringCount = 3;
            for (let i = 0; i < ringCount; i++) {
                const ringProgress = (progress + i * 0.2) % 1;
                const ringSize = ringProgress * effect.maxSize;
                const ringAlpha = alpha * (1 - ringProgress);

                ctx.strokeStyle = `rgba(99, 102, 241, ${ringAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
                ctx.stroke();

                // Inner pixel burst
                if (ringProgress < 0.3) {
                    ctx.fillStyle = `rgba(99, 102, 241, ${ringAlpha * 0.8})`;
                    ctx.fillRect(-2, -2, 4, 4);
                }
            }

            ctx.restore();
        });
    }

    update() {
        // Handle input
        const movement = this.input.getMovementVector();

        if (movement.dx !== 0 || movement.dy !== 0) {
            // Reduced from 200 to 50 for more responsive control
            this.character.setTarget(
                this.character.x + movement.dx * 50,
                this.character.y + movement.dy * 50
            );
        }

        // Handle click to move (only if no menu is active)
        if (!this.activeMenu) {
            const clickTarget = this.input.consumeClickTarget();
            if (clickTarget) {
                if (!this.character.containsPoint(clickTarget.x, clickTarget.y)) {
                    this.character.setTarget(clickTarget.x, clickTarget.y);
                }
            }
        }

        // Update character
        this.character.update();

        // Update camera
        this.camera.follow(this.character);

        // Update click effects
        this.updateClickEffects();

        // Update thought bubble
        if (this.thoughtBubble.active) {
            this.updateThoughtBubble();
        } else {
            this.hideThoughtBubble();
        }

        // Update projects
        const nearbyProjects = this.getNearbyProjects(150);
        const charPos = this.character.getPosition();

        this.world.getProjects().forEach(project => {
            const distance = project.distanceTo(charPos.x, charPos.y);
            const isNearby = distance < 150;
            project.update(isNearby, distance);

            // Check for interaction
            if (isNearby && (this.input.keys[' '] || this.input.keys['enter'])) {
                project.interact();
                this.input.keys[' '] = false;
                this.input.keys['enter'] = false;
            }
        });

        // Occasional contextual comments - increased frequency
        if (nearbyProjects.length > 0 && !this.thoughtBubble.active) {
            if (Math.random() < 0.008) { // ~1 every 2-3 seconds when near projects
                const randomProject = nearbyProjects[Math.floor(Math.random() * nearbyProjects.length)];
                this.guide.generateContextComment(randomProject, charPos).then(comment => {
                    if (comment) {
                        this.showThoughtBubble(comment, 4000);
                    }
                });
            }
        }
    }

    render() {
        this.world.render(this.camera, this.character);
        // Render click effects on top
        const ctx = this.world.getCanvas().getContext('2d');
        this.renderClickEffects(ctx, this.camera);
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.showTutorial();
    }
}
