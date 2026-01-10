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

        this.setupProjects();
        this.setupUI();
        this.setupInteraction();

        // Center camera on character
        this.camera.x = this.character.x - this.camera.width / 2;
        this.camera.y = this.character.y - this.camera.height / 2;
    }

    setupProjects() {
        const project1 = new Project(300, -200, {
            label: 'Test Project Alpha',
            shape: 'circle',
            color: '#6366f1',
            size: 80,
            modal: '<h2>Test Project Alpha</h2><p>This is a simple test project to demonstrate the interaction system.</p><p>In a real implementation, this would showcase actual work.</p>'
        });

        const project2 = new Project(-250, 200, {
            label: 'Experiment Beta',
            shape: 'square',
            color: '#ec4899',
            size: 90,
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
    }

    setupInteraction() {
        const canvas = this.world.getCanvas();

        // Click on character to send message
        canvas.addEventListener('click', (e) => {
            // Close menu if clicking elsewhere
            if (this.activeMenu) {
                this.hideMenu();
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.camera.screenToWorld(screenX, screenY);

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

                const nearbyProjects = this.getNearbyProjects(150);
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

        // Position bubble near character
        const charScreenPos = this.character.getScreenPosition(this.camera);
        const bubble = document.getElementById('guide-comment');

        bubble.textContent = this.thoughtBubble.text;
        bubble.classList.remove('hidden');

        // Position above and to the side of character
        bubble.style.left = `${charScreenPos.x + 60}px`;
        bubble.style.top = `${charScreenPos.y - 60}px`;
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

    update() {
        // Handle input
        const movement = this.input.getMovementVector();

        if (movement.dx !== 0 || movement.dy !== 0) {
            this.character.setTarget(
                this.character.x + movement.dx * 200,
                this.character.y + movement.dy * 200
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
            const isNearby = project.distanceTo(charPos.x, charPos.y) < 150;
            project.update(isNearby);

            // Check for interaction
            if (isNearby && (this.input.keys[' '] || this.input.keys['enter'])) {
                project.interact();
                this.input.keys[' '] = false;
                this.input.keys['enter'] = false;
            }
        });

        // Occasional contextual comments
        if (nearbyProjects.length > 0 && !this.character.isMoving && !this.thoughtBubble.active) {
            if (Math.random() < 0.005) {
                const randomProject = nearbyProjects[Math.floor(Math.random() * nearbyProjects.length)];
                this.guide.generateContextComment(randomProject, charPos).then(comment => {
                    if (comment) {
                        this.showThoughtBubble(comment);
                    }
                });
            }
        }
    }

    render() {
        this.world.render(this.camera, this.character);
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
