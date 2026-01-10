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
        this.character = new Character(0, 0); // Start at origin
        this.input = new Input(this.world.getCanvas(), this.camera);
        this.guide = new Guide();

        this.isRunning = false;
        this.tutorialShown = false;

        this.setupProjects();
        this.setupUI();
        this.setupChat();

        // Center camera on character initially
        this.camera.x = this.character.x - this.camera.width / 2;
        this.camera.y = this.character.y - this.camera.height / 2;
    }

    setupProjects() {
        // Add a couple of simple test projects
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
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.resize(window.innerWidth, window.innerHeight);
        });

        // Start button
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.startGame();
        });
    }

    setupChat() {
        const chatToggle = document.getElementById('chat-toggle');
        const chatInterface = document.getElementById('chat-interface');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceBtn = document.getElementById('voice-btn');

        // Toggle chat
        chatToggle.addEventListener('click', () => {
            const isHidden = chatInterface.classList.contains('hidden');
            if (isHidden) {
                chatInterface.classList.remove('hidden');
                chatToggle.style.display = 'none';
                chatInput.focus();
            } else {
                chatInterface.classList.add('hidden');
                chatToggle.style.display = 'block';
            }
        });

        // Send message
        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            // Clear input
            chatInput.value = '';

            // Add user message to chat
            this.addChatMessage(message, 'user');

            // Get nearby projects for context
            const nearbyProjects = this.getNearbyProjects(150);

            // Get response from Guide
            const response = await this.guide.sendMessage(message, { nearbyProjects });

            // Add guide response to chat
            this.addChatMessage(response, 'guide');
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Voice input (simplified - full implementation would use Web Speech API)
        voiceBtn.addEventListener('click', () => {
            this.addChatMessage('Voice input coming soon!', 'guide');
        });
    }

    addChatMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        const label = sender === 'user' ? 'You' : 'The Guide';
        messageDiv.innerHTML = `
            <div class="label">${label}</div>
            <div class="bubble">${text}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    startGame() {
        const tutorial = document.getElementById('tutorial');
        tutorial.classList.add('hidden');

        // Show initial greeting from The Guide
        setTimeout(() => {
            this.showGuideComment("Welcome! I'm The Guide. Feel free to explore - I'll be here if you need me.");
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

    showGuideComment(text, duration = 5000) {
        const commentEl = document.getElementById('guide-comment');
        commentEl.textContent = text;
        commentEl.classList.remove('hidden');

        // Position above character
        const charScreenPos = this.camera.worldToScreen(this.character.x, this.character.y);
        commentEl.style.left = `${charScreenPos.x}px`;
        commentEl.style.top = `${charScreenPos.y - 80}px`;
        commentEl.style.transform = 'translateX(-50%)';

        // Hide after duration
        setTimeout(() => {
            commentEl.classList.add('hidden');
        }, duration);
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
            // Move character based on input
            this.character.setTarget(
                this.character.x + movement.dx * 200,
                this.character.y + movement.dy * 200
            );
        }

        // Handle click to move
        const clickTarget = this.input.consumeClickTarget();
        if (clickTarget) {
            this.character.setTarget(clickTarget.x, clickTarget.y);
        }

        // Update character
        this.character.update();

        // Update camera to follow character
        this.camera.follow(this.character);

        // Update projects (check proximity)
        const nearbyProjects = this.getNearbyProjects(150);
        const charPos = this.character.getPosition();

        this.world.getProjects().forEach(project => {
            const isNearby = project.distanceTo(charPos.x, charPos.y) < 150;
            project.update(isNearby);

            // Check for interaction (spacebar or Enter when near)
            if (isNearby && (this.input.keys[' '] || this.input.keys['enter'])) {
                project.interact();
                // Reset keys to prevent repeated triggers
                this.input.keys[' '] = false;
                this.input.keys['enter'] = false;
            }
        });

        // Generate contextual comments from The Guide
        if (nearbyProjects.length > 0 && !this.character.isMoving) {
            // Occasionally comment on nearby projects
            if (Math.random() < 0.01) { // 1% chance per frame when stationary
                const randomProject = nearbyProjects[Math.floor(Math.random() * nearbyProjects.length)];
                this.guide.generateContextComment(randomProject, charPos).then(comment => {
                    if (comment) {
                        this.showGuideComment(comment);
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
        // Show tutorial first
        this.showTutorial();
    }
}
