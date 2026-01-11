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

        // Message queue system - supports multiple stacked messages
        this.messageQueue = [];
        this.messageIdCounter = 0;
        this.maxVisibleMessages = 2;

        // Menu state
        this.activeMenu = false;
        this.menuOpen = false;

        // Click effects
        this.clickEffects = [];

        // Track project boundary states - track if character is currently inside each project's boundary
        this.projectBoundaryStates = new Map(); // Map<Project, boolean>
        // Track cooldown timers for project entry messages (10 second cooldown)
        this.projectMessageCooldowns = new Map(); // Map<Project, number> (timestamp)

        // Store reference to Experiment Alpha for menu auto-open (will be set in setupProjects)
        this.projectAlpha = null;
        
        // Track when star controls panel was manually closed (for cooldown)
        this.starControlsCloseTime = null;
        // Track if star controls panel has been manually positioned (dragged)
        this.starControlsManuallyPositioned = false;
        // Track if star controls panel was manually opened (not auto-opened)
        this.starControlsManuallyOpened = false;

        this.setupProjects();
        this.setupUI();
        this.setupInteraction();
        this.setupSettingsPanel();
        this.setupStarControlsPanel();

        // Make all menus draggable
        this.makeDraggable(document.getElementById('settings-panel'));
        this.makeDraggable(document.getElementById('star-controls-panel'));
        this.makeDraggable(document.getElementById('tutorial'));

        // Spawn character between the two stars
        // Project 1 is at (-250, -200), Project 2 is at (400, 200)
        const spawnX = (-250 + 400) / 2; // 75
        const spawnY = (-200 + 200) / 2; // 0
        this.character.x = spawnX;
        this.character.y = spawnY;
        this.character.targetX = spawnX;
        this.character.targetY = spawnY;

        // Center camera on character
        this.camera.x = this.character.x - this.camera.width / 2;
        this.camera.y = this.character.y - this.camera.height / 2;
    }

    setupProjects() {
        const project1 = new Project(-250, -200, {
            label: 'Experiment Alpha',
            shape: 'circle',
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-star-alpha-base').trim() || '#1a1f2e',      // Dark midnight bluish charcoal grey (dark star)
            colorBase1: '#FF8C00',  // Orange base for layer 1
            colorTip1: '#FF0000',   // Red tip for layer 1
            colorBase2: '#FFFF00',  // Yellow base for layer 2
            colorTip2: '#800080',   // Purple tip for layer 2
            size: 80,
            boundaryRadius: 250,   // Larger boundary
            modal: '<h2>Experiment Alpha</h2><p>This is a simple test project to demonstrate the interaction system.</p><p>In a real implementation, this would showcase actual work.</p>'
        });

        // Set Experiment Alpha default properties
        project1.spokeCount = 125;
        project1.spokeBaseWidth1 = 1.0;
        project1.spokeBaseWidth2 = 0.5;
        project1.spokeMinLength = 0.50;
        project1.spokeMaxLength = 1.50;
        project1.spokeWaviness1 = 0.1;
        project1.spokeWaviness2 = 1.3;
        project1.randomnessRatio = 0.80;
        project1.glowIntensity = 0.0;

        const project2 = new Project(400, 200, {
            label: 'Experiment Beta',
            shape: 'circle',
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-star-beta-base').trim() || '#f5f5f5',      // Almost white (light star)
            colorBase1: '#ff8844',  // Amber base for layer 1
            colorTip1: '#ffd4aa',   // Light amber tip for layer 1
            colorBase2: '#4a90e2',  // Blue base for layer 2
            colorTip2: '#aaddff',   // Light blue tip for layer 2
            size: 80,
            boundaryRadius: 250,   // Larger boundary
            modal: '<h2>Experiment Beta</h2><p>Another test project with a different shape and color.</p><p>Each project can have its own unique presentation style.</p>'
        });

        this.world.addProject(project1);
        this.world.addProject(project2);
        
        // Store reference to Experiment Alpha for auto-opening star controls
        this.projectAlpha = project1;
    }

    setupUI() {
        window.addEventListener('resize', () => {
            this.camera.resize(window.innerWidth, window.innerHeight);
        });

        // Menu toggle button
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        menuToggleBtn.addEventListener('click', () => {
            this.toggleMenu();
        });

        // Close menu button (X in corner)
        const menuCloseBtn = document.getElementById('menu-close-btn');
        menuCloseBtn.addEventListener('click', () => {
            this.toggleMenu(false);
        });

        // Close popups with Enter or Spacebar
        window.addEventListener('keydown', (e) => {
            // Don't handle if typing in input
            if (e.target.tagName === 'INPUT' && e.target.id === 'message-input') {
                if (e.key === 'Enter') {
                    // Send message on Enter in input
                    const sendBtn = document.getElementById('message-send-btn');
                    if (sendBtn) sendBtn.click();
                } else if (e.key === 'Escape') {
                    // Close on Escape
                    this.hideMenu();
                }
                return;
            }

            // Escape key closes menu
            if (e.key === 'Escape') {
                if (this.menuOpen) {
                    e.preventDefault();
                    this.toggleMenu(false);
                    return;
                }
                
                // Close message prompt
                if (this.activeMenu) {
                    e.preventDefault();
                    this.hideMenu();
                }
            }
            
            // Enter/Space for other interactions
            if (e.key === 'Enter' || e.key === ' ') {
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

        // Close button for settings panel
        const settingsCloseBtn = document.getElementById('settings-close-btn');
        settingsCloseBtn.addEventListener('click', () => {
            settingsPanel.classList.add('hidden');
            isOpen = false;
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
                
                // Get CSS custom property values
                const getCSSVar = (varName, fallback) => {
                    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
                };
                
                // Draw grid pattern
                ctx.fillStyle = getCSSVar('--color-gray-200', '#f8f8f8');
                ctx.fillRect(0, 0, 64, 64);
                
                ctx.strokeStyle = getCSSVar('--color-shadow-md', 'rgba(0, 0, 0, 0.1)');
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
    }

    setupStarControlsPanel() {
        const panel = document.getElementById('star-controls-panel');
        const toggleBtn = document.getElementById('star-controls-toggle-btn');
        const closeBtn = document.getElementById('star-controls-close-btn');
        const starSelector = document.getElementById('star-selector');
        
        // Initialize dragging state
        panel.dataset.dragging = 'false';
        
        // Position panel near selected star when opened
        const positionPanelNearStar = () => {
            // Don't reposition if manually positioned (dragged) or currently dragging
            if (panel.dataset.dragging === 'true' || this.starControlsManuallyPositioned) return;
            
            const selectedValue = starSelector.value;
            if (selectedValue !== 'all') {
                const project = this.world.getProjects()[parseInt(selectedValue)];
                if (project) {
                    const screenPos = this.camera.worldToScreen(project.x, project.y);
                    // Get panel width to calculate left position
                    const panelWidth = panel.offsetWidth || 640; // Fallback to max-width if not rendered yet
                    // Position to the left of the star, vertically centered, with extra 150px offset to avoid blocking star
                    panel.style.left = `${screenPos.x - panelWidth - 20 - 150}px`;
                    panel.style.top = `${screenPos.y}px`;
                    panel.style.transform = 'translateY(-50%)';
                    panel.style.position = 'fixed';
                }
            } else {
                // Default position if "All Stars" selected - center screen
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
            }
        };
        
        // Store positionPanelNearStar for use in update loop
        this.positionStarControlsPanel = positionPanelNearStar;
        
        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            const wasHidden = panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                // Panel was opened - mark as manually opened
                this.starControlsManuallyOpened = true;
                positionPanelNearStar();
            } else {
                // Panel was closed - reset flags
                this.starControlsManuallyOpened = false;
                this.starControlsCloseTime = Date.now(); // Record close time for cooldown
            }
        });
        
        // Close panel
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
            this.starControlsCloseTime = Date.now(); // Record close time for cooldown
            this.starControlsManuallyPositioned = false; // Reset manual positioning
            this.starControlsManuallyOpened = false; // Reset manual open flag
        });
        
        // Update position when star selection changes
        starSelector.addEventListener('change', () => {
            this.starControlsManuallyPositioned = false; // Reset when star changes
            if (!panel.classList.contains('hidden')) {
                positionPanelNearStar();
            }
        });
        
        // Get selected star(s)
        const getSelectedProjects = () => {
            const value = starSelector.value;
            if (value === 'all') {
                return this.world.getProjects();
            }
            return [this.world.getProjects()[parseInt(value)]];
        };
        
        // Color pickers for gradient controls
        const layer1BaseColorPicker = document.getElementById('layer1-base-color-picker');
        const layer1TipColorPicker = document.getElementById('layer1-tip-color-picker');
        const layer2BaseColorPicker = document.getElementById('layer2-base-color-picker');
        const layer2TipColorPicker = document.getElementById('layer2-tip-color-picker');

        layer1BaseColorPicker.addEventListener('input', (e) => {
            const baseColor = e.target.value;
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(1, baseColor, project.colorTip1);
            });
        });

        layer1TipColorPicker.addEventListener('input', (e) => {
            const tipColor = e.target.value;
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(1, project.colorBase1, tipColor);
            });
        });

        layer2BaseColorPicker.addEventListener('input', (e) => {
            const baseColor = e.target.value;
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(2, baseColor, project.colorTip2);
            });
        });

        layer2TipColorPicker.addEventListener('input', (e) => {
            const tipColor = e.target.value;
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(2, project.colorBase2, tipColor);
            });
        });
        
        // Spoke controls
        const spokeCountSlider = document.getElementById('spoke-count-slider');
        const spokeWidth1Slider = document.getElementById('spoke-width1-slider');
        const spokeWidth2Slider = document.getElementById('spoke-width2-slider');
        const spokeMinLengthSlider = document.getElementById('spoke-min-length-slider');
        const spokeMaxLengthSlider = document.getElementById('spoke-max-length-slider');
        const waviness1Slider = document.getElementById('waviness1-slider');
        const waviness2Slider = document.getElementById('waviness2-slider');
        const randomnessRatioSlider = document.getElementById('randomness-ratio-slider');

        // Update function that applies to selected project(s)
        const updateSpokeProperties = () => {
            const count = parseInt(spokeCountSlider.value);
            const width1 = parseFloat(spokeWidth1Slider.value);
            const width2 = parseFloat(spokeWidth2Slider.value);
            const minLength = parseFloat(spokeMinLengthSlider.value);
            const maxLength = parseFloat(spokeMaxLengthSlider.value);
            const startRadius = 0.35; // Fixed for now
            const waviness1 = parseFloat(waviness1Slider.value);
            const waviness2 = parseFloat(waviness2Slider.value);
            const randomnessRatio = parseFloat(randomnessRatioSlider.value);
            
            getSelectedProjects().forEach(project => {
                project.updateSpokeProperties(count, width1, width2, minLength, maxLength, startRadius, waviness1, waviness2, randomnessRatio);
            });
        };

        // Add listeners with value display updates
        spokeCountSlider.addEventListener('input', (e) => {
            document.getElementById('spoke-count-value').textContent = e.target.value;
            updateSpokeProperties();
        });

        spokeWidth1Slider.addEventListener('input', (e) => {
            document.getElementById('spoke-width1-value').textContent = parseFloat(e.target.value).toFixed(1);
            updateSpokeProperties();
        });

        spokeWidth2Slider.addEventListener('input', (e) => {
            document.getElementById('spoke-width2-value').textContent = parseFloat(e.target.value).toFixed(1);
            updateSpokeProperties();
        });

        spokeMinLengthSlider.addEventListener('input', (e) => {
            document.getElementById('spoke-min-length-value').textContent = parseFloat(e.target.value).toFixed(2);
            updateSpokeProperties();
        });

        spokeMaxLengthSlider.addEventListener('input', (e) => {
            document.getElementById('spoke-max-length-value').textContent = parseFloat(e.target.value).toFixed(2);
            updateSpokeProperties();
        });

        waviness1Slider.addEventListener('input', (e) => {
            document.getElementById('waviness1-value').textContent = parseFloat(e.target.value).toFixed(1);
            updateSpokeProperties();
        });

        waviness2Slider.addEventListener('input', (e) => {
            document.getElementById('waviness2-value').textContent = parseFloat(e.target.value).toFixed(1);
            updateSpokeProperties();
        });

        randomnessRatioSlider.addEventListener('input', (e) => {
            document.getElementById('randomness-ratio-value').textContent = parseFloat(e.target.value).toFixed(2);
            updateSpokeProperties();
        });

        // Glow intensity control
        const glowIntensitySlider = document.getElementById('glow-intensity-slider');
        
        glowIntensitySlider.addEventListener('input', (e) => {
            const intensity = parseFloat(e.target.value);
            document.getElementById('glow-intensity-value').textContent = intensity.toFixed(1);
            getSelectedProjects().forEach(project => {
                project.updateGlowIntensity(intensity);
            });
        });

        // Initialize color pickers with default values from Experiment Alpha
        const projects = this.world.getProjects();
        if (projects.length > 0) {
            const alphaProject = projects[0]; // Experiment Alpha is first
            layer1BaseColorPicker.value = alphaProject.colorBase1;
            layer1TipColorPicker.value = alphaProject.colorTip1;
            layer2BaseColorPicker.value = alphaProject.colorBase2;
            layer2TipColorPicker.value = alphaProject.colorTip2;
        }
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
        // Messages live for exactly 5 seconds
        duration = 5000;
        
        // Create unique message ID
        const messageId = this.messageIdCounter++;
        
        // Create message object
        const message = {
            id: messageId,
            text: text,
            timer: Date.now(),
            duration: duration,
            element: null,
            isExiting: false,
            lastX: null,
            lastY: null
        };
        
        // Create DOM element for this message
        const messageElement = document.createElement('div');
        messageElement.className = 'guide-message';
        messageElement.id = `guide-message-${messageId}`;
        messageElement.textContent = text;
        
        // Add to UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        uiOverlay.appendChild(messageElement);
        
        message.element = messageElement;
        
        // Add to queue
        this.messageQueue.push(message);
        
        // Limit visible messages
        if (this.messageQueue.length > this.maxVisibleMessages) {
            const oldestMessage = this.messageQueue.shift();
            this.removeMessage(oldestMessage);
        }
        
        // Trigger fade-in animation
        requestAnimationFrame(() => {
            messageElement.classList.add('message-entering');
            
            // Immediately position the message to avoid appearing in wrong location
            // Get character position and position message
            const charScreenPos = this.character.getScreenPosition(this.camera);
            const bubbleWidth = 280;
            const messageHeight = 100;
            const messageSpacing = 10;
            const characterSize = 48;
            const baseOffsetX = 60;
            const baseOffsetY = -80;
            const stackOffset = (this.messageQueue.length - 1) * (messageHeight + messageSpacing);
            
            let bubbleX = charScreenPos.x + baseOffsetX;
            let bubbleY = charScreenPos.y + baseOffsetY - stackOffset;
            
            // Keep bubble on screen
            if (bubbleX + bubbleWidth > this.camera.width) {
                bubbleX = charScreenPos.x - bubbleWidth - baseOffsetX;
            }
            if (bubbleX < 0) {
                bubbleX = 10;
            }
            if (bubbleY < 0) {
                bubbleY = charScreenPos.y + (characterSize / 2) + 20 + stackOffset;
            }
            
            messageElement.style.left = `${bubbleX}px`;
            messageElement.style.top = `${bubbleY}px`;
        });
    }

    updateMessageQueue() {
        const charScreenPos = this.character.getScreenPosition(this.camera);
        const bubbleWidth = 280;
        const messageHeight = 100; // Approximate height per message
        const messageSpacing = 10;
        
        // Process each message in queue
        const messagesToRemove = [];
        
        // First pass: identify messages to remove
        this.messageQueue.forEach((message) => {
            if (!message.element) return;
            
            // Check if message should expire
            if (Date.now() - message.timer > message.duration && !message.isExiting) {
                this.removeMessage(message);
                messagesToRemove.push(message);
                return;
            }
        });
        
        // Remove dismissed messages from queue BEFORE updating positions
        // This ensures remaining messages get correct indices for smooth transitions
        messagesToRemove.forEach(msg => {
            const index = this.messageQueue.indexOf(msg);
            if (index > -1) {
                this.messageQueue.splice(index, 1);
            }
        });
        
        // Second pass: update positions for remaining messages
        // Now indices are correct after removals, so messages will smoothly fall down
        this.messageQueue.forEach((message, index) => {
            if (!message.element || message.isExiting) return;
            
            // Update position - stack vertically, positioned to the side to avoid obscuring character
            // Position relative to character's center (character is rendered centered)
            const characterSize = 48; // Character size
            const baseOffsetX = 60; // To the right side of character
            const baseOffsetY = -80; // Above character center
            const stackOffset = index * (messageHeight + messageSpacing);
            
            // Calculate position relative to character's screen position
            // Character is centered, so we position relative to its center
            let bubbleX = charScreenPos.x + baseOffsetX;
            let bubbleY = charScreenPos.y + baseOffsetY - stackOffset;
            
            // Keep bubble on screen - if it would go off right edge, position to the left
            if (bubbleX + bubbleWidth > this.camera.width) {
                bubbleX = charScreenPos.x - bubbleWidth - baseOffsetX;
            }
            if (bubbleX < 0) {
                bubbleX = 10;
            }
            // If messages would go off top, position below character instead
            if (bubbleY < 0) {
                bubbleY = charScreenPos.y + (characterSize / 2) + 20 + stackOffset;
            }
            
            // Update position every frame to follow character smoothly
            // Always update to ensure messages stick to character
            message.element.style.left = `${bubbleX}px`;
            message.element.style.top = `${bubbleY}px`;
        });
    }
    
    removeMessage(message) {
        if (!message.element) return;
        
        message.isExiting = true;
        message.element.classList.add('message-exiting');
        
        // Remove element after animation completes
        setTimeout(() => {
            if (message.element && message.element.parentNode) {
                message.element.parentNode.removeChild(message.element);
            }
        }, 300); // Match CSS animation duration
    }

    hideThoughtBubble() {
        // Clear all messages
        this.messageQueue.forEach(message => {
            this.removeMessage(message);
        });
        this.messageQueue = [];
    }

    startGame() {
        // Legacy method - now just closes menu if open
        this.toggleMenu(false);
    }

    toggleMenu(forceState = null) {
        const menu = document.getElementById('tutorial'); // Keep id for now
        const controlsHint = document.getElementById('controls-hint');

        // Update controls hint based on input method
        if (this.input.isTouchEnabled()) {
            controlsHint.textContent = 'the joystick or tap to move';
        } else {
            controlsHint.textContent = 'arrow keys or WASD to move, or click';
        }

        // Toggle menu state
        if (forceState !== null) {
            this.menuOpen = forceState;
        } else {
            this.menuOpen = !this.menuOpen;
        }

        // Show or hide menu
        if (this.menuOpen) {
            menu.classList.remove('hidden');
            // Update position when opening
            this.updateMenuPosition();
        } else {
            menu.classList.add('hidden');
        }

        this.activeMenu = this.menuOpen;
    }

    makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Get initial position from computed style or default
        const rect = element.getBoundingClientRect();
        xOffset = rect.left;
        yOffset = rect.top;

        element.addEventListener('mousedown', (e) => {
            // Check if the clicked element is an interactive control
            const target = e.target;
            const isInteractive = target.tagName === 'BUTTON' ||
                                 target.tagName === 'INPUT' ||
                                 target.tagName === 'SELECT' ||
                                 target.tagName === 'LABEL' ||
                                 target.closest('button') ||
                                 target.closest('input') ||
                                 target.closest('select') ||
                                 target.closest('label') ||
                                 target.closest('.settings-option') ||
                                 target.closest('.slider-value');
            
            // Allow dragging from anywhere except interactive elements
            if (!isInteractive && element.contains(target)) {
                // Set dragging flag IMMEDIATELY to prevent positioning interference
                element.dataset.dragging = 'true';
                
                // Get current position from computed style (not from getBoundingClientRect which might be stale)
                const computedStyle = window.getComputedStyle(element);
                const currentLeft = parseFloat(computedStyle.left) || 0;
                const currentTop = parseFloat(computedStyle.top) || 0;
                
                // Account for transform if present
                let transformX = 0;
                let transformY = 0;
                const transform = computedStyle.transform;
                if (transform && transform !== 'none') {
                    const matrix = new DOMMatrix(transform);
                    transformX = matrix.e;
                    transformY = matrix.f;
                }
                
                xOffset = currentLeft + transformX;
                yOffset = currentTop + transformY;
                
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;

                isDragging = true;
                element.style.cursor = 'grabbing';
            }
        });

        const handleMouseMove = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.left = `${currentX}px`;
                element.style.top = `${currentY}px`;
                element.style.transform = 'none'; // Remove centering transform when dragging
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
                element.dataset.dragging = 'false';
                // Mark panel as manually positioned
                this.starControlsManuallyPositioned = true;
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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

                // Get CSS custom property for accent color
                const getCSSVar = (varName, fallback) => {
                    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
                };
                const accentColor = getCSSVar('--color-accent-indigo', '#6366f1');
                const hex = accentColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);

                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
                ctx.stroke();

                // Inner pixel burst
                if (ringProgress < 0.3) {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha * 0.8})`;
                    ctx.fillRect(-2, -2, 4, 4);
                }
            }

            ctx.restore();
        });
    }

    update() {
        // Disable movement when typing box is open
        if (!this.activeMenu) {
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

        // Update message queue
        this.updateMessageQueue();

        // Update menu position if open
        if (this.menuOpen) {
            this.updateMenuPosition();
        }

        // Update star controls panel position if open (only if not being dragged or manually positioned)
        const starControlsPanel = document.getElementById('star-controls-panel');
        if (starControlsPanel && !starControlsPanel.classList.contains('hidden') && this.positionStarControlsPanel) {
            const isDragging = starControlsPanel.dataset.dragging === 'true';
            if (!isDragging && !this.starControlsManuallyPositioned) {
                this.positionStarControlsPanel();
            }
        }

        // Update projects
        const nearbyProjects = this.getNearbyProjects(150);
        const charPos = this.character.getPosition();

        this.world.getProjects().forEach(project => {
            const distance = project.distanceTo(charPos.x, charPos.y);
            const isNearby = distance < 150;
            const isInBoundary = distance < project.boundaryRadius;
            
            project.update(isNearby, distance);

            // Track boundary state transitions - trigger message when entering boundary
            const wasInBoundary = this.projectBoundaryStates.get(project) || false;
            this.projectBoundaryStates.set(project, isInBoundary);
            
            // Auto-open star controls panel when standing on any star
            if (isInBoundary && distance < project.size) {
                const starControlsPanel = document.getElementById('star-controls-panel');
                
                // Check if cooldown period has passed (5 seconds)
                const now = Date.now();
                const cooldownPassed = !this.starControlsCloseTime || (now - this.starControlsCloseTime) >= 5000;
                
                if (starControlsPanel && starControlsPanel.classList.contains('hidden') && cooldownPassed) {
                    starControlsPanel.classList.remove('hidden');
                    this.starControlsManuallyPositioned = false; // Reset when auto-opening
                    this.starControlsManuallyOpened = false; // Mark as auto-opened
                    // Update star selector to match the star being stood on
                    const starSelector = document.getElementById('star-selector');
                    const projects = this.world.getProjects();
                    const starIndex = projects.indexOf(project);
                    if (starSelector && starIndex !== -1) {
                        starSelector.value = starIndex.toString();
                    }
                    // Position panel near the star
                    if (this.positionStarControlsPanel) {
                        this.positionStarControlsPanel();
                    }
                    // Reset cooldown when auto-opening
                    this.starControlsCloseTime = null;
                } else if (starControlsPanel && !starControlsPanel.classList.contains('hidden')) {
                    // Update star selector if standing on a different star
                    const starSelector = document.getElementById('star-selector');
                    const projects = this.world.getProjects();
                    const starIndex = projects.indexOf(project);
                    if (starSelector && starIndex !== -1 && starSelector.value !== starIndex.toString()) {
                        starSelector.value = starIndex.toString();
                    }
                    // Only update position if not manually positioned
                    if (!this.starControlsManuallyPositioned && this.positionStarControlsPanel) {
                        this.positionStarControlsPanel();
                    }
                }
            } else if (isInBoundary === false) {
                // Character left any star - only auto-close if panel was auto-opened (not manually opened)
                const starControlsPanel = document.getElementById('star-controls-panel');
                if (starControlsPanel && !starControlsPanel.classList.contains('hidden')) {
                    // Only auto-close if not manually opened and not being dragged
                    if (!this.starControlsManuallyOpened && starControlsPanel.dataset.dragging !== 'true') {
                        starControlsPanel.classList.add('hidden');
                    }
                }
            }
            
            // If character just entered the boundary (transitioned from outside to inside)
            if (isInBoundary && !wasInBoundary) {
                // Check cooldown - only trigger message if 10 seconds have passed since last message
                const lastMessageTime = this.projectMessageCooldowns.get(project) || 0;
                const currentTime = Date.now();
                const cooldownDuration = 15000; // 15 seconds
                
                if (currentTime - lastMessageTime >= cooldownDuration) {
                    // Update cooldown timer
                    this.projectMessageCooldowns.set(project, currentTime);
                    
                    // Force a comment when entering project boundary
                    this.guide.generateEntryComment(project, charPos).then(comment => {
                        if (comment) {
                            this.showThoughtBubble(comment, 5000);
                        }
                    });
                }
            }

            // Check for interaction
            if (isNearby && (this.input.keys[' '] || this.input.keys['enter'])) {
                project.interact();
                this.input.keys[' '] = false;
                this.input.keys['enter'] = false;
            }
        });

        // Occasional contextual comments - increased frequency
        if (nearbyProjects.length > 0) {
            if (Math.random() < 0.008) { // ~1 every 2-3 seconds when near projects
                const randomProject = nearbyProjects[Math.floor(Math.random() * nearbyProjects.length)];
                this.guide.generateContextComment(randomProject, charPos).then(comment => {
                    if (comment) {
                        this.showThoughtBubble(comment, 5000);
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
        // Start game immediately without showing tutorial
        this.isRunning = true;
        this.gameLoop();
        
        // Wait a bit for character to settle into position, then show welcome message
        setTimeout(() => {
            // Show welcome message
            this.showThoughtBubble("Welcome! I'm The Guide. Click on me to chat.", 5000);
        }, 1500);
    }
}
