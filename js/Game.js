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

        // Follow mode state
        this.followMode = false;

        // Background dimming based on star proximity
        this.maxProximityValue = 0;

        // Track current star for panel updates
        this.currentStar = null;

        // Toggle state for activate all stars
        this.allStarsActivated = false;
        
        // Smooth menu positioning state
        this.panelTargetY = null;
        this.panelCurrentY = null;
        this.panelPositionRafId = null;
        
        // Track default presets loading
        this.defaultPresetsLoadStarted = false;
        
        // Animation state for activate all stars transition
        this.starsActivationAnimating = false;
        this.starsActivationStartTime = null;
        this.starsActivationDuration = 800; // 800ms transition
        this.starsActivationStartValues = new Map(); // Map<Project, number> - store starting proximityValue

        // Sporadic pulse system - one star pulses at a time for up to 3 seconds
        this.sporadicPulseActive = false;
        this.sporadicPulseProject = null;
        this.sporadicPulseStartTime = null;
        this.sporadicPulseDuration = 0; // Random duration up to 3 seconds
        this.sporadicPulseNextTime = null; // When to trigger next pulse
        this.sporadicPulseInterval = null; // Random interval between pulses (5-30 seconds)

        // Frame rate limiting for consistent performance
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;

        // Audio context for tick sounds (lazy initialization)
        this.audioContext = null;
        
        // SFX volume (persisted in localStorage)
        this.sfxVolume = this.loadSFXVolume();
        // Track previous slider values for tick detection
        this.sliderPreviousValues = new Map();
        
        // Preset search term for filtering
        this.presetSearchTerm = '';
        
        // Flag to prevent event cascades when updating controls programmatically
        this.updatingControlsFromProject = false;
        
        // Pitch mapping for each slider (in Hz) - each slider gets a unique pitch
        this.sliderPitches = new Map([
            ['speed-slider', 600],
            ['spoke-count-slider', 700],
            ['spoke-max-length-slider', 800],
            ['spoke-width1-slider', 900],
            ['spoke-width2-slider', 1000],
            ['waviness1-slider', 1100],
            ['waviness2-slider', 1200],
            ['randomness-ratio-slider', 1300],
            ['glow-intensity-slider', 1400],
            ['glow-size-slider', 1500],
            ['glow-opacity-slider', 1600],
            ['animation-speed-slider', 1700],
            ['zoom-slider', 1800]
        ]);

        // Load default presets if localStorage is empty
        this.loadDefaultPresetsIfNeeded();
        
        this.setupProjects();
        this.setupUI();
        this.setupInteraction();
        this.setupSettingsPanel();
        this.setupStarControlsPanel();

        // Make all menus draggable via title bar (except controls modal)
        const settingsPanel = document.getElementById('settings-panel');
        const starControlsPanel = document.getElementById('star-controls-panel');
        
        if (settingsPanel) {
            const settingsTitleBar = settingsPanel.querySelector('.menu-title-bar');
            if (settingsTitleBar) {
                this.makeDraggable(settingsPanel, settingsTitleBar);
                this.makeResizable(settingsPanel);
            }
        }
        if (starControlsPanel) {
            const starControlsTitleBar = starControlsPanel.querySelector('.menu-title-bar');
            if (starControlsTitleBar) {
                this.makeDraggable(starControlsPanel, starControlsTitleBar);
                this.makeResizable(starControlsPanel);
            }
        }
        // Controls is a modal popup, not draggable

        // Spawn character - on mobile, spawn on Experiment Alpha
        let spawnX, spawnY;
        if (this.input.isTouchDevice) {
            spawnX = -250; // Experiment Alpha x position
            spawnY = -200; // Experiment Alpha y position
        } else {
            // Desktop: spawn between the two stars
            spawnX = (-250 + 400) / 2; // 75
            spawnY = (-200 + 200) / 2; // 0
        }
        this.character.x = spawnX;
        this.character.y = spawnY;
        this.character.targetX = spawnX;
        this.character.targetY = spawnY;

        // Center camera on character
        this.camera.x = this.character.x - this.camera.width / 2;
        this.camera.y = this.character.y - this.camera.height / 2;
        
        // #region agent log
        setTimeout(() => {
            const settingsBtn = document.getElementById('settings-toggle-btn');
            const starControlsBtn = document.getElementById('star-controls-toggle-btn');
            const activateBtn = document.getElementById('activate-all-stars-ui-btn');
            const randomizeBtn = document.getElementById('randomize-stars-ui-btn');
            const btnData = {};
            if (settingsBtn) {
                const rect = settingsBtn.getBoundingClientRect();
                btnData.settings = {left:rect.left,top:rect.top,width:rect.width,height:rect.height,computedLeft:getComputedStyle(settingsBtn).left,computedTop:getComputedStyle(settingsBtn).top};
            }
            if (starControlsBtn) {
                const rect = starControlsBtn.getBoundingClientRect();
                btnData.starControls = {left:rect.left,top:rect.top,width:rect.width,height:rect.height,computedLeft:getComputedStyle(starControlsBtn).left,computedTop:getComputedStyle(starControlsBtn).top};
            }
            if (activateBtn) {
                const rect = activateBtn.getBoundingClientRect();
                btnData.activate = {left:rect.left,top:rect.top,width:rect.width,height:rect.height,computedLeft:getComputedStyle(activateBtn).left,computedTop:getComputedStyle(activateBtn).top};
            }
            if (randomizeBtn) {
                const rect = randomizeBtn.getBoundingClientRect();
                btnData.randomize = {left:rect.left,top:rect.top,width:rect.width,height:rect.height,computedLeft:getComputedStyle(randomizeBtn).left,computedTop:getComputedStyle(randomizeBtn).top};
            }
            fetch('http://127.0.0.1:7242/ingest/f54f7081-85c5-46b3-9791-73f1ba1b818e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:143',message:'button positions after init',data:{isTouchDevice:this.input.isTouchDevice,windowWidth:window.innerWidth,windowHeight:window.innerHeight,buttons:btnData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }, 500);
        // #endregion
        
        // Set default zoom on mobile
        if (this.input.isTouchDevice) {
            this.camera.setZoom(0.8);
            this.camera.zoom = 0.8; // Set immediately, not just target
        }
    }

    setupProjects() {
        // Scale star positions for mobile to bring them closer together
        const positionScale = this.input.isTouchDevice ? 0.5 : 1.0;
        
        const project1 = new Project(-200 * positionScale, -150 * positionScale, {
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

        const project2 = new Project(300 * positionScale, 150 * positionScale, {
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
        
        // Helper function to generate random value in range
        const randomInRange = (min, max, step = 1) => {
            const steps = Math.floor((max - min) / step) + 1;
            return min + Math.floor(Math.random() * steps) * step;
        };

        // Helper function to generate random hex color
        const randomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        };

        // Get available presets for random population
        const availablePresets = this.getAllPresets();
        const usedPresetIndices = new Set(); // Track which presets we've used to avoid duplicates

        // Function to apply random properties to a project
        const applyRandomProperties = (project) => {
            project.spokeCount = randomInRange(20, 200, 5);
            project.spokeBaseWidth1 = randomInRange(1.0, 5.0, 0.1);
            project.spokeBaseWidth2 = randomInRange(0.5, 4.0, 0.1);
            project.spokeMinLength = randomInRange(0.2, 1.0, 0.05);
            project.spokeMaxLength = randomInRange(0.5, 3.3, 0.05);
            project.spokeWaviness1 = randomInRange(0, 2, 0.1);
            project.spokeWaviness2 = randomInRange(0, 2, 0.1);
            project.randomnessRatio = randomInRange(0, 1, 0.05);
            project.glowIntensity = randomInRange(0, 10, 0.5);
        };

        // Function to apply a random preset to a project
        const applyRandomPreset = (project) => {
            if (availablePresets.length === 0) {
                // No presets available, use random instead
                applyRandomProperties(project);
                return;
            }

            // Find an unused preset index - ensure no duplicates
            let presetIndex;
            let attempts = 0;
            const maxAttempts = availablePresets.length * 2; // Allow some retries
            
            // If all presets have been used, reset the set to allow reuse
            if (usedPresetIndices.size >= availablePresets.length) {
                usedPresetIndices.clear();
            }
            
            do {
                presetIndex = Math.floor(Math.random() * availablePresets.length);
                attempts++;
                // If we've tried many times, just use any available preset
                if (attempts > maxAttempts) {
                    // Find first unused preset, or use any if all are used
                    for (let i = 0; i < availablePresets.length; i++) {
                        if (!usedPresetIndices.has(i)) {
                            presetIndex = i;
                            break;
                        }
                    }
                    break;
                }
            } while (usedPresetIndices.has(presetIndex));

            usedPresetIndices.add(presetIndex);
            const preset = availablePresets[presetIndex];
            this.applyStarPresetData(project, preset.data);
            // Ensure proximityValue is reset to 0 after applying preset (fixes random pulsing bug)
            project.proximityValue = 0;
        };

        // Projects 2-5: randomly mix presets and random configs
        const projectsToConfigure = [
            { project: project2, name: 'Experiment Beta', pos: { x: 400, y: 200 } }
        ];

        // Configure project2 (Experiment Beta)
            // Randomly decide: 50% chance for preset, 50% for random
            if (availablePresets.length > 0 && Math.random() < 0.5) {
                applyRandomPreset(project2);
            } else {
                applyRandomProperties(project2);
            }
            // Ensure proximityValue is reset to 0 (fixes random pulsing bug)
            project2.proximityValue = 0;
            this.world.addProject(project2);

        // Create 3 additional stars with randomized or preset properties
        const starNames = ['Experiment Gamma', 'Experiment Delta', 'Experiment Epsilon'];
        const starPositions = [
            { x: -300 * positionScale, y: 225 * positionScale },
            { x: 450 * positionScale, y: -225 * positionScale },
            { x: 0, y: 375 * positionScale }
        ];

        for (let i = 0; i < 3; i++) {
            const pos = starPositions[i];
            const project = new Project(pos.x, pos.y, {
                label: starNames[i],
                shape: 'circle',
                color: getComputedStyle(document.documentElement).getPropertyValue('--color-star-alpha-base').trim() || '#1a1f2e',
                colorBase1: randomColor(),
                colorTip1: randomColor(),
                colorBase2: randomColor(),
                colorTip2: randomColor(),
                size: 80,
                boundaryRadius: 250,
                modal: `<h2>${starNames[i]}</h2><p>This is a randomized star with unique properties.</p>`
            });

            // Randomly decide: 50% chance for preset, 50% for random
            if (availablePresets.length > 0 && Math.random() < 0.5) {
                applyRandomPreset(project);
            } else {
                applyRandomProperties(project);
            }
            // Ensure proximityValue is reset to 0 (fixes random pulsing bug)
            project.proximityValue = 0;

            this.world.addProject(project);
        }
        
        // Store reference to Experiment Alpha for auto-opening star controls
        this.projectAlpha = project1;
    }

    setupUI() {
        window.addEventListener('resize', () => {
            this.camera.resize(window.innerWidth, window.innerHeight);
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

        // Function to position panel avoiding UI buttons
        const positionSettingsPanel = () => {
            // On mobile, center the panel
            if (this.input.isTouchDevice) {
                settingsPanel.style.left = '50%';
                settingsPanel.style.right = 'auto';
                settingsPanel.style.top = '50%';
                settingsPanel.style.bottom = 'auto';
                settingsPanel.style.transform = 'translate(-50%, -50%)';
                settingsPanel.style.width = 'calc(100vw - 2rem)';
                settingsPanel.style.maxWidth = 'calc(100vw - 2rem)';
                settingsPanel.style.height = '70vh';
                settingsPanel.style.maxHeight = '70vh';
                return;
            }
            
            // Set default height to 70vh
            settingsPanel.style.height = '70vh';
            settingsPanel.style.maxHeight = '70vh';
            
            const gap = 20; // Gap between panel and buttons
            const panelHeight = window.innerHeight * 0.7; // 70vh
            
            // Get button positions
            const settingsBtn = document.getElementById('settings-toggle-btn');
            const starControlsBtn = document.getElementById('star-controls-toggle-btn');
            const logo = document.getElementById('logo');
            
            let topPosition = window.innerHeight / 2; // Default center
            const buttons = [];
            
            if (settingsBtn) {
                const btnRect = settingsBtn.getBoundingClientRect();
                buttons.push({ top: btnRect.top, bottom: btnRect.bottom, height: btnRect.height });
            }
            if (starControlsBtn) {
                const btnRect = starControlsBtn.getBoundingClientRect();
                buttons.push({ top: btnRect.top, bottom: btnRect.bottom, height: btnRect.height });
            }
            if (logo) {
                const logoRect = logo.getBoundingClientRect();
                buttons.push({ top: logoRect.top, bottom: logoRect.bottom, height: logoRect.height });
            }
            
            // Check if panel would overlap with any button
            const panelTop = topPosition - panelHeight / 2;
            const panelBottom = topPosition + panelHeight / 2;
            
            for (const btn of buttons) {
                // Check if panel overlaps button
                if ((panelTop < btn.bottom + gap && panelBottom > btn.top - gap)) {
                    // Panel would overlap, adjust position
                    if (panelBottom > btn.top - gap && topPosition > btn.bottom) {
                        // Panel is below button, move it up
                        topPosition = btn.bottom + gap + panelHeight / 2;
                    } else if (panelTop < btn.bottom + gap && topPosition < btn.top) {
                        // Panel is above button, move it down
                        topPosition = btn.top - gap - panelHeight / 2;
                    }
                }
            }
            
            // Ensure panel stays within viewport
            topPosition = Math.max(panelHeight / 2 + gap, Math.min(window.innerHeight - panelHeight / 2 - gap, topPosition));
            
            settingsPanel.style.left = '1rem';
            settingsPanel.style.top = `${topPosition}px`;
            settingsPanel.style.transform = 'translateY(-50%)';
        };

        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                settingsPanel.classList.remove('hidden');
                // Position panel avoiding buttons
                setTimeout(() => positionSettingsPanel(), 0);
                // Update controls hint based on input method
                const controlsHint = document.getElementById('controls-hint');
                if (controlsHint) {
                    if (this.input.isTouchEnabled()) {
                        controlsHint.textContent = 'the joystick or tap to move';
                    } else {
                        controlsHint.textContent = 'arrow keys or WASD to move, or click';
                    }
                }
            } else {
                settingsPanel.classList.add('hidden');
            }
        });
        
        // Reposition on window resize
        window.addEventListener('resize', () => {
            if (!settingsPanel.classList.contains('hidden')) {
                positionSettingsPanel();
            }
        });

        // Close button for settings panel
        const settingsCloseBtn = document.getElementById('settings-close-btn');
        settingsCloseBtn.addEventListener('click', () => {
            this.playHapticSound('click');
            settingsPanel.classList.add('hidden');
            isOpen = false;
        });

        // Export presets button
        const exportPresetsBtn = document.getElementById('export-presets-btn');
        if (exportPresetsBtn) {
            exportPresetsBtn.addEventListener('click', () => {
                this.playHapticSound('click');
                this.exportPresetsToFile();
            });
        }

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
                this.playHapticSound('click');
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
        // Helper function to add immediate haptic feedback on slider interaction start (for settings panel)
        const addSettingsSliderImmediateFeedback = (slider) => {
            if (!slider) return;
            const handleStart = () => {
                this.playHapticSound('click');
            };
            slider.addEventListener('mousedown', handleStart);
            slider.addEventListener('touchstart', handleStart, { passive: true });
        };

        const speedSlider = document.getElementById('speed-slider');
        // Initialize character speed to match slider value
        const initialSpeed = parseFloat(speedSlider.value);
        this.character.setSpeedMultiplier(initialSpeed);
        document.getElementById('speed-value').textContent = initialSpeed.toFixed(1);
        
        // Initialize previous value
        this.sliderPreviousValues.set('speed-slider', initialSpeed);
        speedSlider.addEventListener('input', (e) => {
            const speedMultiplier = parseFloat(e.target.value);
            this.handleSliderTick(e.target, speedMultiplier);
            this.character.setSpeedMultiplier(speedMultiplier);
            document.getElementById('speed-value').textContent = speedMultiplier.toFixed(1);
        });
        
        addSettingsSliderImmediateFeedback(speedSlider);
        // Setup min/max click-to-snap for speed slider
        const speedMin = document.querySelector('#speed-slider').closest('.settings-option').querySelector('.slider-min');
        const speedMax = document.querySelector('#speed-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(speedSlider, speedMin, speedMax);
        
        // SFX Volume control
        const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
        if (sfxVolumeSlider) {
            sfxVolumeSlider.value = this.sfxVolume;
            document.getElementById('sfx-volume-value').textContent = this.sfxVolume.toFixed(1);
            
            // Track previous value to avoid playing sound on initial load
            let previousVolume = this.sfxVolume;
            
            sfxVolumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                
                // Play haptic feedback at the new volume level (preview the volume)
                // Only play if volume actually changed
                if (Math.abs(volume - previousVolume) > 0.01) {
                    this.playHapticSoundAtVolume('click', volume);
                    previousVolume = volume;
                }
                
                this.setSFXVolume(volume);
                document.getElementById('sfx-volume-value').textContent = volume.toFixed(1);
            });
            addSettingsSliderImmediateFeedback(sfxVolumeSlider);
        }
    }
    
    loadSFXVolume() {
        try {
            const saved = localStorage.getItem('sfxVolume');
            if (saved !== null) {
                const volume = parseFloat(saved);
                return Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
            }
        } catch (e) {
            console.error('Error loading SFX volume:', e);
        }
        return 0.7; // Default to 0.7 volume
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        try {
            localStorage.setItem('sfxVolume', this.sfxVolume.toString());
        } catch (e) {
            console.error('Error saving SFX volume:', e);
        }
    }

    setupStarControlsPanel() {
        const panel = document.getElementById('star-controls-panel');
        const toggleBtn = document.getElementById('star-controls-toggle-btn');
        const closeBtn = document.getElementById('star-controls-close-btn');
        const starSelector = document.getElementById('star-selector');
        
        // Populate star selector dynamically
        const populateStarSelector = () => {
            starSelector.innerHTML = ''; // Clear existing options
            const projects = this.world.getProjects();
            projects.forEach((project, index) => {
                const option = document.createElement('option');
                option.value = index.toString();
                option.textContent = project.label;
                starSelector.appendChild(option);
            });
            // Add "All Stars" option
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Stars';
            starSelector.appendChild(allOption);
        };
        
        // Populate selector on initialization
        populateStarSelector();
        
        // Initialize dragging state
        panel.dataset.dragging = 'false';
        
        // Position panel sticky to right side of screen
        const positionPanelNearStar = () => {
            // On mobile, let CSS handle positioning (bottom: 0)
            if (this.input.isTouchDevice) {
                // Reset any JavaScript-set positioning to let CSS take over
                panel.style.top = 'auto';
                panel.style.bottom = '0';
                panel.style.left = '0';
                panel.style.right = '0';
                panel.style.transform = 'none';
                panel.style.position = 'fixed';
                return;
            }
            
            // Don't reposition if sticky, manually positioned (dragged) or currently dragging
            if (panel.dataset.sticky || panel.dataset.dragging === 'true' || this.starControlsManuallyPositioned) return;
            
            // Always position on right side, vertically centered
            const rightOffset = 16; // Small offset from right edge (1rem = 16px)
            const centerY = window.innerHeight / 2;
            
            // Set target position for smooth interpolation
            this.panelTargetY = centerY;
            
            // Initialize current position if not set
            if (this.panelCurrentY === null) {
                this.panelCurrentY = centerY;
                panel.style.right = `${rightOffset}px`;
                panel.style.top = `${centerY}px`;
                panel.style.transform = 'translateY(-50%)';
                panel.style.position = 'fixed';
            }
            
            // Start smooth animation if not already running
            if (this.panelPositionRafId === null) {
                const smoothUpdate = () => {
                    if (this.panelCurrentY === null || this.panelTargetY === null) {
                        this.panelPositionRafId = null;
                        return;
                    }
                    
                    // Smooth interpolation with easing
                    const diff = this.panelTargetY - this.panelCurrentY;
                    if (Math.abs(diff) < 0.5) {
                        // Close enough, snap to target
                        this.panelCurrentY = this.panelTargetY;
                        this.panelPositionRafId = null;
                    } else {
                        // Interpolate with easing (0.15 factor for smooth but responsive)
                        this.panelCurrentY += diff * 0.15;
                        this.panelPositionRafId = requestAnimationFrame(smoothUpdate);
                    }
                    
                    // Update panel position
                    panel.style.right = `${rightOffset}px`;
                    panel.style.top = `${this.panelCurrentY}px`;
                    panel.style.transform = 'translateY(-50%)';
                    panel.style.position = 'fixed';
                };
                this.panelPositionRafId = requestAnimationFrame(smoothUpdate);
            }
        };
        
        // Store positionPanelNearStar for use in update loop
        this.positionStarControlsPanel = positionPanelNearStar;
        
        // Reposition on window resize
        window.addEventListener('resize', () => {
            if (!panel.classList.contains('hidden') && !this.starControlsManuallyPositioned) {
                positionPanelNearStar();
            }
        });
        
        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            this.playHapticSound('click');
            const wasHidden = panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                // Panel was opened - mark as manually opened
                this.starControlsManuallyOpened = true;
                
                // On mobile, focus camera on nearest star
                if (this.input.isTouchDevice) {
                    const projects = this.world.getProjects();
                    const charPos = this.character.getPosition();
                    let nearestStar = null;
                    let nearestDistance = Infinity;
                    
                    projects.forEach(project => {
                        const distance = project.distanceTo(charPos.x, charPos.y);
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestStar = project;
                        }
                    });
                    
                    if (nearestStar) {
                        // Smoothly move camera to center on nearest star
                        const targetX = nearestStar.x - (this.camera.width / 2) / this.camera.zoom;
                        const targetY = nearestStar.y - (this.camera.height / 2) / this.camera.zoom;
                        
                        // Animate camera to star position
                        const startX = this.camera.x;
                        const startY = this.camera.y;
                        const duration = 500; // 500ms animation
                        const startTime = Date.now();
                        
                        const animateCamera = () => {
                            const elapsed = Date.now() - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // Ease-out cubic
                            const eased = 1 - Math.pow(1 - progress, 3);
                            
                            this.camera.x = startX + (targetX - startX) * eased;
                            this.camera.y = startY + (targetY - startY) * eased;
                            
                            if (progress < 1) {
                                requestAnimationFrame(animateCamera);
                            }
                        };
                        animateCamera();
                    }
                }
                
                setTimeout(() => positionPanelNearStar(), 0);
            } else {
                // Panel was closed - reset flags
                this.starControlsManuallyOpened = false;
                this.starControlsCloseTime = Date.now(); // Record close time for cooldown
            }
        });
        
        // Close panel
        closeBtn.addEventListener('click', () => {
            this.playHapticSound('click');
            panel.classList.add('hidden');
            this.starControlsCloseTime = Date.now(); // Record close time for cooldown
            this.starControlsManuallyPositioned = false; // Reset manual positioning
            this.starControlsManuallyOpened = false; // Reset manual open flag
        });

        
        // Update position and controls when star selection changes
        starSelector.addEventListener('change', () => {
            this.playHapticSound('select');
            this.starControlsManuallyPositioned = false; // Reset when star changes
            // Update controls to match selected star
            const selectedValue = starSelector.value;
            if (selectedValue !== 'all') {
                const selectedProject = this.world.getProjects()[parseInt(selectedValue)];
                if (selectedProject && this.updateControlsFromProject) {
                    this.updateControlsFromProject(selectedProject);
                }
            }
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
        const layer1GradientPreview = document.getElementById('layer1-gradient-preview');
        const layer1BaseOpacitySlider = document.getElementById('layer1-base-opacity-slider');
        const layer1TipOpacitySlider = document.getElementById('layer1-tip-opacity-slider');
        const layer1BaseOpacityValue = document.getElementById('layer1-base-opacity-value');
        const layer1TipOpacityValue = document.getElementById('layer1-tip-opacity-value');
        
        const layer2BaseColorPicker = document.getElementById('layer2-base-color-picker');
        const layer2TipColorPicker = document.getElementById('layer2-tip-color-picker');
        const layer2GradientPreview = document.getElementById('layer2-gradient-preview');
        const layer2BaseOpacitySlider = document.getElementById('layer2-base-opacity-slider');
        const layer2TipOpacitySlider = document.getElementById('layer2-tip-opacity-slider');
        const layer2BaseOpacityValue = document.getElementById('layer2-base-opacity-value');
        const layer2TipOpacityValue = document.getElementById('layer2-tip-opacity-value');

        // Helper function to convert hex to rgb
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Function to update gradient preview with opacity
        const updateGradientPreview = (preview, baseColor, tipColor, baseOpacity = 1.0, tipOpacity = 1.0) => {
            const baseRgb = hexToRgb(baseColor);
            const tipRgb = hexToRgb(tipColor);
            
            if (baseRgb && tipRgb) {
                const baseRgba = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${baseOpacity})`;
                const tipRgba = `rgba(${tipRgb.r}, ${tipRgb.g}, ${tipRgb.b}, ${tipOpacity})`;
                preview.style.background = `linear-gradient(to right, ${baseRgba}, ${tipRgba})`;
            } else {
                // Fallback to original if conversion fails
                preview.style.background = `linear-gradient(to right, ${baseColor}, ${tipColor})`;
            }
        };

        // Helper to get opacity from slider (0-100 to 0.0-1.0)
        const getOpacity = (slider) => parseFloat(slider.value) / 100;
        
        // Update preview helper for layer 1
        const updateLayer1Preview = () => {
            const baseOpacity = getOpacity(layer1BaseOpacitySlider);
            const tipOpacity = getOpacity(layer1TipOpacitySlider);
            updateGradientPreview(layer1GradientPreview, layer1BaseColorPicker.value, layer1TipColorPicker.value, baseOpacity, tipOpacity);
        };
        
        // Update preview helper for layer 2
        const updateLayer2Preview = () => {
            const baseOpacity = getOpacity(layer2BaseOpacitySlider);
            const tipOpacity = getOpacity(layer2TipOpacitySlider);
            updateGradientPreview(layer2GradientPreview, layer2BaseColorPicker.value, layer2TipColorPicker.value, baseOpacity, tipOpacity);
        };
        
        layer1BaseColorPicker.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            this.playHapticSound('color');
            const baseColor = e.target.value;
            updateLayer1Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(1, baseColor, project.colorTip1);
            });
        });

        layer1TipColorPicker.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            this.playHapticSound('color');
            const tipColor = e.target.value;
            updateLayer1Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(1, project.colorBase1, tipColor);
            });
        });
        
        layer1BaseOpacitySlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const opacity = getOpacity(e.target);
            layer1BaseOpacityValue.textContent = Math.round(parseFloat(e.target.value)) + '%';
            updateLayer1Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColorOpacity(1, opacity, project.colorTip1Opacity);
            });
            // Play synth-like haptic feedback
            this.playSynthSound(opacity);
        });
        
        layer1TipOpacitySlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const opacity = getOpacity(e.target);
            layer1TipOpacityValue.textContent = Math.round(parseFloat(e.target.value)) + '%';
            updateLayer1Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColorOpacity(1, project.colorBase1Opacity, opacity);
            });
            // Play synth-like haptic feedback
            this.playSynthSound(opacity);
        });

        layer2BaseColorPicker.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            this.playHapticSound('color');
            const baseColor = e.target.value;
            updateLayer2Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(2, baseColor, project.colorTip2);
            });
        });

        layer2TipColorPicker.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            this.playHapticSound('color');
            const tipColor = e.target.value;
            updateLayer2Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColors(2, project.colorBase2, tipColor);
            });
        });
        
        layer2BaseOpacitySlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const opacity = getOpacity(e.target);
            layer2BaseOpacityValue.textContent = Math.round(parseFloat(e.target.value)) + '%';
            updateLayer2Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColorOpacity(2, opacity, project.colorTip2Opacity);
            });
            // Play synth-like haptic feedback
            this.playSynthSound(opacity);
        });
        
        layer2TipOpacitySlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const opacity = getOpacity(e.target);
            layer2TipOpacityValue.textContent = Math.round(parseFloat(e.target.value)) + '%';
            updateLayer2Preview();
            getSelectedProjects().forEach(project => {
                project.updateLayerColorOpacity(2, project.colorBase2Opacity, opacity);
            });
            // Play synth-like haptic feedback
            this.playSynthSound(opacity);
        });

        // Initialize gradient previews
        // Initialize gradient previews with opacity
        if (layer1BaseOpacitySlider && layer1TipOpacitySlider) {
            updateGradientPreview(layer1GradientPreview, layer1BaseColorPicker.value, layer1TipColorPicker.value, getOpacity(layer1BaseOpacitySlider), getOpacity(layer1TipOpacitySlider));
        }
        if (layer2BaseOpacitySlider && layer2TipOpacitySlider) {
            updateGradientPreview(layer2GradientPreview, layer2BaseColorPicker.value, layer2TipColorPicker.value, getOpacity(layer2BaseOpacitySlider), getOpacity(layer2TipOpacitySlider));
        }
        
        // Spoke controls
        const spokeCountSlider = document.getElementById('spoke-count-slider');
        const spokeMaxLengthSlider = document.getElementById('spoke-max-length-slider');
        const spokeWidth1Slider = document.getElementById('spoke-width1-slider');
        const spokeWidth2Slider = document.getElementById('spoke-width2-slider');
        const waviness1Slider = document.getElementById('waviness1-slider');
        const waviness2Slider = document.getElementById('waviness2-slider');
        const randomnessRatioSlider = document.getElementById('randomness-ratio-slider');

        // Update function that applies to selected project(s)
        const updateSpokeProperties = () => {
            const count = parseInt(spokeCountSlider.value);
            const maxLength = parseFloat(spokeMaxLengthSlider.value);
            const width1 = parseFloat(spokeWidth1Slider.value);
            const width2 = parseFloat(spokeWidth2Slider.value);
            const startRadius = 0.35; // Fixed for now
            const waviness1 = parseFloat(waviness1Slider.value);
            const waviness2 = parseFloat(waviness2Slider.value);
            const randomnessRatio = parseFloat(randomnessRatioSlider.value);
            const minLength = 0.2; // Fixed default value
            const tipRatio = 0.1; // Fixed pointyness value
            
            getSelectedProjects().forEach(project => {
                project.updateSpokeProperties(count, width1, width2, minLength, maxLength, startRadius, waviness1, waviness2, randomnessRatio);
                project.updateSpokeTipRatio(tipRatio);
            });
        };

        // Initialize previous values for all sliders
        this.sliderPreviousValues.set('spoke-count-slider', parseInt(spokeCountSlider.value));
        this.sliderPreviousValues.set('spoke-max-length-slider', parseFloat(spokeMaxLengthSlider.value));
        this.sliderPreviousValues.set('spoke-width1-slider', parseFloat(spokeWidth1Slider.value));
        this.sliderPreviousValues.set('spoke-width2-slider', parseFloat(spokeWidth2Slider.value));
        this.sliderPreviousValues.set('waviness1-slider', parseFloat(waviness1Slider.value));
        this.sliderPreviousValues.set('waviness2-slider', parseFloat(waviness2Slider.value));
        this.sliderPreviousValues.set('randomness-ratio-slider', parseFloat(randomnessRatioSlider.value));

        // Helper function to add immediate haptic feedback on slider interaction start
        const addSliderImmediateFeedback = (slider) => {
            if (!slider) return;
            const handleStart = () => {
                if (!this.updatingControlsFromProject) {
                    this.playHapticSound('click');
                }
            };
            slider.addEventListener('mousedown', handleStart);
            slider.addEventListener('touchstart', handleStart, { passive: true });
        };

        // Add listeners with value display updates (ordered to match HTML)
        spokeCountSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseInt(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('spoke-count-value').textContent = value;
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(spokeCountSlider);
        // Setup click-to-snap for min/max
        const spokeCountMin = document.querySelector('#spoke-count-slider').closest('.settings-option').querySelector('.slider-min');
        const spokeCountMax = document.querySelector('#spoke-count-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(spokeCountSlider, spokeCountMin, spokeCountMax);

        spokeMaxLengthSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('spoke-max-length-value').textContent = value.toFixed(2);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(spokeMaxLengthSlider);
        const spokeMaxLengthMin = document.querySelector('#spoke-max-length-slider').closest('.settings-option').querySelector('.slider-min');
        const spokeMaxLengthMax = document.querySelector('#spoke-max-length-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(spokeMaxLengthSlider, spokeMaxLengthMin, spokeMaxLengthMax);

        spokeWidth1Slider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('spoke-width1-value').textContent = value.toFixed(1);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(spokeWidth1Slider);
        const spokeWidth1Min = document.querySelector('#spoke-width1-slider').closest('.settings-option').querySelector('.slider-min');
        const spokeWidth1Max = document.querySelector('#spoke-width1-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(spokeWidth1Slider, spokeWidth1Min, spokeWidth1Max);

        spokeWidth2Slider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('spoke-width2-value').textContent = value.toFixed(1);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(spokeWidth2Slider);
        const spokeWidth2Min = document.querySelector('#spoke-width2-slider').closest('.settings-option').querySelector('.slider-min');
        const spokeWidth2Max = document.querySelector('#spoke-width2-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(spokeWidth2Slider, spokeWidth2Min, spokeWidth2Max);

        waviness1Slider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('waviness1-value').textContent = value.toFixed(2);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(waviness1Slider);
        const waviness1Min = document.querySelector('#waviness1-slider').closest('.settings-option').querySelector('.slider-min');
        const waviness1Max = document.querySelector('#waviness1-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(waviness1Slider, waviness1Min, waviness1Max);

        waviness2Slider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('waviness2-value').textContent = value.toFixed(2);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(waviness2Slider);
        const waviness2Min = document.querySelector('#waviness2-slider').closest('.settings-option').querySelector('.slider-min');
        const waviness2Max = document.querySelector('#waviness2-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(waviness2Slider, waviness2Min, waviness2Max);

        randomnessRatioSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const value = parseFloat(e.target.value);
            this.handleSliderTick(e.target, value);
            document.getElementById('randomness-ratio-value').textContent = value.toFixed(2);
            updateSpokeProperties();
        });
        addSliderImmediateFeedback(randomnessRatioSlider);
        const randomnessRatioMin = document.querySelector('#randomness-ratio-slider').closest('.settings-option').querySelector('.slider-min');
        const randomnessRatioMax = document.querySelector('#randomness-ratio-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(randomnessRatioSlider, randomnessRatioMin, randomnessRatioMax);

        // Animation speed control
        const animationSpeedSlider = document.getElementById('animation-speed-slider');
        this.sliderPreviousValues.set('animation-speed-slider', parseFloat(animationSpeedSlider.value));
        animationSpeedSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const speed = parseFloat(e.target.value);
            this.handleSliderTick(e.target, speed);
            document.getElementById('animation-speed-value').textContent = speed.toFixed(1);
            getSelectedProjects().forEach(project => {
                project.updateAnimationSpeed(speed);
            });
        });
        addSliderImmediateFeedback(animationSpeedSlider);
        const animationSpeedMin = document.querySelector('#animation-speed-slider').closest('.settings-option').querySelector('.slider-min');
        const animationSpeedMax = document.querySelector('#animation-speed-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(animationSpeedSlider, animationSpeedMin, animationSpeedMax);

        // Nucleus controls
        const nucleusSizeSlider = document.getElementById('nucleus-size-slider');
        this.sliderPreviousValues.set('nucleus-size-slider', parseFloat(nucleusSizeSlider.value));
        nucleusSizeSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const size = parseFloat(e.target.value);
            this.handleSliderTick(e.target, size);
            document.getElementById('nucleus-size-value').textContent = size.toFixed(2);
            getSelectedProjects().forEach(project => {
                project.updateNucleusSize(size);
            });
        });
        addSliderImmediateFeedback(nucleusSizeSlider);
        const nucleusSizeMin = document.querySelector('#nucleus-size-slider').closest('.settings-option').querySelector('.slider-min');
        const nucleusSizeMax = document.querySelector('#nucleus-size-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(nucleusSizeSlider, nucleusSizeMin, nucleusSizeMax);

        const nucleusBlurSlider = document.getElementById('nucleus-blur-slider');
        this.sliderPreviousValues.set('nucleus-blur-slider', parseFloat(nucleusBlurSlider.value));
        nucleusBlurSlider.addEventListener('input', (e) => {
            if (this.updatingControlsFromProject) return; // Skip if programmatic update
            const blur = parseFloat(e.target.value);
            this.handleSliderTick(e.target, blur);
            document.getElementById('nucleus-blur-value').textContent = blur.toFixed(0);
            getSelectedProjects().forEach(project => {
                project.updateNucleusBlur(blur);
            });
        });
        addSliderImmediateFeedback(nucleusBlurSlider);
        const nucleusBlurMin = document.querySelector('#nucleus-blur-slider').closest('.settings-option').querySelector('.slider-min');
        const nucleusBlurMax = document.querySelector('#nucleus-blur-slider').closest('.settings-option').querySelector('.slider-max');
        this.setupSliderMinMaxClick(nucleusBlurSlider, nucleusBlurMin, nucleusBlurMax);

        // Helper function to generate random value in range
        const randomInRange = (min, max, step = 1) => {
            const steps = Math.floor((max - min) / step) + 1;
            return min + Math.floor(Math.random() * steps) * step;
        };

        // Helper function to generate random hex color
        const randomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        };

        // Randomize settings button
        const randomizeBtn = document.getElementById('randomize-settings-btn');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.playHapticSound('click');
                const selectedProjects = getSelectedProjects();
                if (selectedProjects.length === 0) return;

                selectedProjects.forEach(project => {
                    // Generate random values
                    const spokeCount = randomInRange(20, 200, 5);
                    const spokeMaxLength = randomInRange(0.5, 3.3, 0.05);
                    const spokeBaseWidth1 = randomInRange(1.0, 5.0, 0.1);
                    const spokeBaseWidth2 = randomInRange(0.5, 4.0, 0.1);
                    const waviness1 = randomInRange(0, 2, 0.1);
                    const waviness2 = randomInRange(0, 2, 0.1);
                    const randomnessRatio = randomInRange(0, 1, 0.05);
                    const colorBase1 = randomColor();
                    const colorTip1 = randomColor();
                    const colorBase2 = randomColor();
                    const colorTip2 = randomColor();

                    // Update project properties
                    const spokeMinLength = 0.2; // Fixed default
                    const tipRatio = 0.1; // Fixed pointyness
                    project.updateSpokeProperties(spokeCount, spokeBaseWidth1, spokeBaseWidth2, spokeMinLength, spokeMaxLength, 0.35, waviness1, waviness2, randomnessRatio);
                    project.updateSpokeTipRatio(tipRatio);
                    project.updateLayerColors(1, colorBase1, colorTip1);
                    project.updateLayerColors(2, colorBase2, colorTip2);
                    project.updateAnimationSpeed(randomInRange(0, 2.0, 0.1));
                    project.updateNucleusSize(randomInRange(0.1, 1.0, 0.01));
                });

                // Update UI controls to reflect randomized values (use first selected project)
                const firstProject = selectedProjects[0];
                spokeCountSlider.value = firstProject.spokeCount;
                document.getElementById('spoke-count-value').textContent = firstProject.spokeCount;
                spokeMaxLengthSlider.value = firstProject.spokeMaxLength;
                document.getElementById('spoke-max-length-value').textContent = firstProject.spokeMaxLength.toFixed(2);
                spokeWidth1Slider.value = firstProject.spokeBaseWidth1;
                document.getElementById('spoke-width1-value').textContent = firstProject.spokeBaseWidth1.toFixed(1);
                spokeWidth2Slider.value = firstProject.spokeBaseWidth2;
                document.getElementById('spoke-width2-value').textContent = firstProject.spokeBaseWidth2.toFixed(1);
                waviness1Slider.value = firstProject.spokeWaviness1;
                document.getElementById('waviness1-value').textContent = firstProject.spokeWaviness1.toFixed(1);
                waviness2Slider.value = firstProject.spokeWaviness2;
                document.getElementById('waviness2-value').textContent = firstProject.spokeWaviness2.toFixed(1);
                randomnessRatioSlider.value = firstProject.randomnessRatio;
                document.getElementById('randomness-ratio-value').textContent = firstProject.randomnessRatio.toFixed(2);
                layer1BaseColorPicker.value = firstProject.colorBase1;
                layer1TipColorPicker.value = firstProject.colorTip1;
                layer2BaseColorPicker.value = firstProject.colorBase2;
                layer2TipColorPicker.value = firstProject.colorTip2;
                animationSpeedSlider.value = firstProject.animationSpeed;
                document.getElementById('animation-speed-value').textContent = firstProject.animationSpeed.toFixed(1);
                nucleusSizeSlider.value = firstProject.nucleusSize;
                document.getElementById('nucleus-size-value').textContent = firstProject.nucleusSize.toFixed(2);
                nucleusBlurSlider.value = firstProject.nucleusBlur;
                document.getElementById('nucleus-blur-value').textContent = firstProject.nucleusBlur.toFixed(0);
            });
        }

        // Function to update all controls from a project's values
        const updateControlsFromProject = (project) => {
            if (!project) return;
            
            // Set flag to prevent event listeners from firing during programmatic update
            this.updatingControlsFromProject = true;
            
            // Don't play haptic sound during initialization (AudioContext requires user gesture)
            // Only play if audio context is already active (user has interacted)
            if (this.audioContext && this.audioContext.state === 'running') {
                this.playHapticSound('select');
            }
            
            // Update spoke controls
            spokeCountSlider.value = project.spokeCount;
            document.getElementById('spoke-count-value').textContent = project.spokeCount;
            spokeMaxLengthSlider.value = project.spokeMaxLength;
            document.getElementById('spoke-max-length-value').textContent = project.spokeMaxLength.toFixed(2);
            spokeWidth1Slider.value = project.spokeBaseWidth1;
            document.getElementById('spoke-width1-value').textContent = project.spokeBaseWidth1.toFixed(1);
            spokeWidth2Slider.value = project.spokeBaseWidth2;
            document.getElementById('spoke-width2-value').textContent = project.spokeBaseWidth2.toFixed(1);
            waviness1Slider.value = project.spokeWaviness1;
            document.getElementById('waviness1-value').textContent = project.spokeWaviness1.toFixed(1);
            waviness2Slider.value = project.spokeWaviness2;
            document.getElementById('waviness2-value').textContent = project.spokeWaviness2.toFixed(1);
            randomnessRatioSlider.value = project.randomnessRatio;
            document.getElementById('randomness-ratio-value').textContent = project.randomnessRatio.toFixed(2);
            
            // Update color pickers and gradient previews
            layer1BaseColorPicker.value = project.colorBase1;
            layer1TipColorPicker.value = project.colorTip1;
            if (layer1BaseOpacitySlider && layer1TipOpacitySlider) {
                layer1BaseOpacitySlider.value = Math.round(project.colorBase1Opacity * 100);
                layer1TipOpacitySlider.value = Math.round(project.colorTip1Opacity * 100);
                layer1BaseOpacityValue.textContent = Math.round(project.colorBase1Opacity * 100) + '%';
                layer1TipOpacityValue.textContent = Math.round(project.colorTip1Opacity * 100) + '%';
                updateGradientPreview(layer1GradientPreview, project.colorBase1, project.colorTip1, project.colorBase1Opacity, project.colorTip1Opacity);
            }
            layer2BaseColorPicker.value = project.colorBase2;
            layer2TipColorPicker.value = project.colorTip2;
            if (layer2BaseOpacitySlider && layer2TipOpacitySlider) {
                layer2BaseOpacitySlider.value = Math.round(project.colorBase2Opacity * 100);
                layer2TipOpacitySlider.value = Math.round(project.colorTip2Opacity * 100);
                layer2BaseOpacityValue.textContent = Math.round(project.colorBase2Opacity * 100) + '%';
                layer2TipOpacityValue.textContent = Math.round(project.colorTip2Opacity * 100) + '%';
                updateGradientPreview(layer2GradientPreview, project.colorBase2, project.colorTip2, project.colorBase2Opacity, project.colorTip2Opacity);
            }
            
            // Update animation speed
            animationSpeedSlider.value = project.animationSpeed;
            document.getElementById('animation-speed-value').textContent = project.animationSpeed.toFixed(1);
            
            // Update nucleus controls
            nucleusSizeSlider.value = project.nucleusSize;
            document.getElementById('nucleus-size-value').textContent = project.nucleusSize.toFixed(2);
            nucleusBlurSlider.value = project.nucleusBlur;
            document.getElementById('nucleus-blur-value').textContent = project.nucleusBlur.toFixed(0);
            
            // Clear flag after all updates complete
            this.updatingControlsFromProject = false;
        };
        
        // Store function for use in update loop
        this.updateControlsFromProject = updateControlsFromProject;

        // Initialize controls with default values from Experiment Alpha
        const projects = this.world.getProjects();
        if (projects.length > 0) {
            const alphaProject = projects[0]; // Experiment Alpha is first
            updateControlsFromProject(alphaProject);
        }

        // Setup preset system
        this.setupPresetSystem();
        
        // Setup zoom control
        this.setupZoomControl();
        
        // Setup activate all stars button
        this.setupActivateAllStars();

        // Setup live spoke previews
        this.setupSpokePreviews();
    }

    setupSpokePreviews() {
        const layer1Canvas = document.getElementById('layer1-spoke-preview');
        const layer2Canvas = document.getElementById('layer2-spoke-preview');
        
        if (!layer1Canvas || !layer2Canvas) return;

        // Set canvas dimensions with device pixel ratio for sharp rendering
        const previewWidth = 200;
        const previewHeight = 80;
        const dpr = window.devicePixelRatio || 1;
        
        // Set internal resolution higher for sharpness
        layer1Canvas.width = previewWidth * dpr;
        layer1Canvas.height = previewHeight * dpr;
        layer2Canvas.width = previewWidth * dpr;
        layer2Canvas.height = previewHeight * dpr;
        
        // Set CSS size to maintain visual size
        layer1Canvas.style.width = previewWidth + 'px';
        layer1Canvas.style.height = previewHeight + 'px';
        layer2Canvas.style.width = previewWidth + 'px';
        layer2Canvas.style.height = previewHeight + 'px';

        // Animation state
        let animationTime = 0;
        let animationFrameId = null;

        // Helper to get current slider values
        const getLayer1Values = () => {
            const widthSlider = document.getElementById('spoke-width1-slider');
            const wavinessSlider = document.getElementById('waviness1-slider');
            const baseColorPicker = document.getElementById('layer1-base-color-picker');
            const tipColorPicker = document.getElementById('layer1-tip-color-picker');
            const baseOpacitySlider = document.getElementById('layer1-base-opacity-slider');
            const tipOpacitySlider = document.getElementById('layer1-tip-opacity-slider');
            const spokeCountSlider = document.getElementById('spoke-count-slider');
            const spokeMaxLengthSlider = document.getElementById('spoke-max-length-slider');
            
            return {
                width: widthSlider ? parseFloat(widthSlider.value) : 1.0,
                waviness: wavinessSlider ? parseFloat(wavinessSlider.value) : 0.1,
                baseColor: baseColorPicker ? baseColorPicker.value : '#FF8C00',
                tipColor: tipColorPicker ? tipColorPicker.value : '#FF0000',
                baseOpacity: baseOpacitySlider ? parseFloat(baseOpacitySlider.value) / 100 : 1.0,
                tipOpacity: tipOpacitySlider ? parseFloat(tipOpacitySlider.value) / 100 : 1.0,
                spokeCount: spokeCountSlider ? parseInt(spokeCountSlider.value) : 125,
                spokeMaxLength: spokeMaxLengthSlider ? parseFloat(spokeMaxLengthSlider.value) : 1.5
            };
        };

        const getLayer2Values = () => {
            const widthSlider = document.getElementById('spoke-width2-slider');
            const wavinessSlider = document.getElementById('waviness2-slider');
            const baseColorPicker = document.getElementById('layer2-base-color-picker');
            const tipColorPicker = document.getElementById('layer2-tip-color-picker');
            const baseOpacitySlider = document.getElementById('layer2-base-opacity-slider');
            const tipOpacitySlider = document.getElementById('layer2-tip-opacity-slider');
            const spokeCountSlider = document.getElementById('spoke-count-slider');
            const spokeMaxLengthSlider = document.getElementById('spoke-max-length-slider');
            
            return {
                width: widthSlider ? parseFloat(widthSlider.value) : 0.5,
                waviness: wavinessSlider ? parseFloat(wavinessSlider.value) : 1.3,
                baseColor: baseColorPicker ? baseColorPicker.value : '#FFFF00',
                tipColor: tipColorPicker ? tipColorPicker.value : '#800080',
                baseOpacity: baseOpacitySlider ? parseFloat(baseOpacitySlider.value) / 100 : 1.0,
                tipOpacity: tipOpacitySlider ? parseFloat(tipOpacitySlider.value) / 100 : 1.0,
                spokeCount: spokeCountSlider ? parseInt(spokeCountSlider.value) : 125,
                spokeMaxLength: spokeMaxLengthSlider ? parseFloat(spokeMaxLengthSlider.value) : 1.5
            };
        };

        // Helper to convert hex to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        // Render single spoke preview for layer 1
        const renderLayer1Preview = () => {
            const ctx = layer1Canvas.getContext('2d');
            ctx.clearRect(0, 0, previewWidth * dpr, previewHeight * dpr);
            
            // Scale context to match device pixel ratio
            ctx.scale(dpr, dpr);
            
            // Disable image smoothing for crisp, pixelated rendering
            ctx.imageSmoothingEnabled = false;
            
            const values = getLayer1Values();
            
            // Use a reference size for scaling (match actual star rendering)
            // Use previewHeight as the reference "size" to maintain aspect ratio
            const referenceSize = previewHeight * 0.6; // Scale to fit nicely in preview
            
            // Match exact calculations from Project.js
            const spokeStartRadius = 0.35; // Fixed value from Project.js
            const spokeTipRatio = 0.1; // Fixed value from Project.js
            const startRadius = referenceSize * spokeStartRadius;
            // Always show preview at maximum length for better visualization (regardless of actual setting)
            const maxSpokeLength = 3.3; // Maximum value from slider range
            const rayLength = referenceSize * maxSpokeLength; // Always at max for preview
            
            // Calculate baseWidth exactly as in Project.js
            const numRays = values.spokeCount;
            const baseWidth = (Math.PI * 2 * referenceSize * spokeStartRadius) / numRays * values.width;
            const tipWidth = baseWidth * spokeTipRatio;
            
            // Position spoke starting from left edge (2% margin)
            const leftMargin = previewWidth * 0.02;
            const centerY = previewHeight / 2;
            
            ctx.save();
            ctx.translate(leftMargin, centerY);
            
            // Add subtle rotation animation
            const rotation = Math.sin(animationTime * 0.001) * 0.2;
            ctx.rotate(rotation);
            
            // Create gradient
            const baseRgb = hexToRgb(values.baseColor);
            const tipRgb = hexToRgb(values.tipColor);
            
            if (baseRgb && tipRgb) {
                const baseOpacity = values.baseOpacity >= 0.99 ? 1.0 : values.baseOpacity;
                const tipOpacity = values.tipOpacity >= 0.99 ? 0.5 : values.tipOpacity * 0.5;
                
                const gradient = ctx.createLinearGradient(startRadius, 0, rayLength, 0);
                gradient.addColorStop(0, `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${baseOpacity})`);
                gradient.addColorStop(1, `rgba(${tipRgb.r}, ${tipRgb.g}, ${tipRgb.b}, ${tipOpacity})`);
                
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 4;
                ctx.shadowColor = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${baseOpacity * 0.5})`;
            } else {
                ctx.fillStyle = '#FF8C00';
            }
            
            ctx.beginPath();
            
            // Draw spoke with waviness (exact match to Project.js)
            if (values.waviness > 0) {
                const segments = 10;
                const length = rayLength - startRadius;
                const waveScale = values.waviness * baseWidth;
                const pi4 = Math.PI * 4;
                
                // Top edge with waviness
                for (let s = 0; s <= segments; s++) {
                    const progress = s / segments;
                    const x = startRadius + length * progress;
                    const baseY = -baseWidth / 2 + (tipWidth / 2 - baseWidth / 2) * progress;
                    const waveOffset = Math.sin(progress * pi4) * waveScale;
                    const y = baseY + waveOffset;
                    
                    if (s === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                // Bottom edge with waviness
                for (let s = segments; s >= 0; s--) {
                    const progress = s / segments;
                    const x = startRadius + length * progress;
                    const baseY = baseWidth / 2 - (baseWidth / 2 - tipWidth / 2) * progress;
                    const waveOffset = Math.sin(progress * pi4) * waveScale;
                    const y = baseY - waveOffset;
                    ctx.lineTo(x, y);
                }
            } else {
                // Straight triangle: wide base at start (star edge), narrow tip at end
                ctx.moveTo(startRadius, -baseWidth / 2); // Top of base
                ctx.lineTo(rayLength, -tipWidth / 2); // Top of tip
                ctx.lineTo(rayLength, tipWidth / 2); // Bottom of tip
                ctx.lineTo(startRadius, baseWidth / 2); // Bottom of base
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        // Render single spoke preview for layer 2
        const renderLayer2Preview = () => {
            const ctx = layer2Canvas.getContext('2d');
            ctx.clearRect(0, 0, previewWidth * dpr, previewHeight * dpr);
            
            // Scale context to match device pixel ratio
            ctx.scale(dpr, dpr);
            
            // Disable image smoothing for crisp, pixelated rendering
            ctx.imageSmoothingEnabled = false;
            
            const values = getLayer2Values();
            
            // Use a reference size for scaling (match actual star rendering)
            // Use previewHeight as the reference "size" to maintain aspect ratio
            const referenceSize = previewHeight * 0.6; // Scale to fit nicely in preview
            
            // Match exact calculations from Project.js
            const spokeStartRadius = 0.35; // Fixed value from Project.js
            const spokeTipRatio = 0.1; // Fixed value from Project.js
            const startRadius = referenceSize * spokeStartRadius;
            // Always show preview at maximum length for better visualization (regardless of actual setting)
            const maxSpokeLength = 3.3; // Maximum value from slider range
            const rayLength = referenceSize * maxSpokeLength; // Always at max for preview
            
            // Calculate baseWidth exactly as in Project.js (using spokeBaseWidth2)
            const numRays = values.spokeCount;
            const baseWidth = (Math.PI * 2 * referenceSize * spokeStartRadius) / numRays * values.width;
            const tipWidth = baseWidth * spokeTipRatio;
            
            // Position spoke starting from left edge (2% margin)
            const leftMargin = previewWidth * 0.02;
            const centerY = previewHeight / 2;
            
            ctx.save();
            ctx.translate(leftMargin, centerY);
            
            // Add subtle rotation animation (different phase)
            const rotation = Math.sin(animationTime * 0.001 + Math.PI * 0.5) * 0.2;
            ctx.rotate(rotation);
            
            // Create gradient
            const baseRgb = hexToRgb(values.baseColor);
            const tipRgb = hexToRgb(values.tipColor);
            
            if (baseRgb && tipRgb) {
                const baseOpacity = values.baseOpacity >= 0.99 ? 1.0 : values.baseOpacity;
                const tipOpacity = values.tipOpacity >= 0.99 ? 0.5 : values.tipOpacity * 0.5;
                
                const gradient = ctx.createLinearGradient(startRadius, 0, rayLength, 0);
                gradient.addColorStop(0, `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${baseOpacity})`);
                gradient.addColorStop(1, `rgba(${tipRgb.r}, ${tipRgb.g}, ${tipRgb.b}, ${tipOpacity})`);
                
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 3;
                ctx.shadowColor = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${baseOpacity * 0.5})`;
            } else {
                ctx.fillStyle = '#FFFF00';
            }
            
            ctx.beginPath();
            
            // Draw spoke with waviness (exact match to Project.js)
            if (values.waviness > 0) {
                const segments = 10;
                const length = rayLength - startRadius;
                const waveScale = values.waviness * baseWidth;
                const pi4 = Math.PI * 4;
                
                // Top edge with waviness
                for (let s = 0; s <= segments; s++) {
                    const progress = s / segments;
                    const x = startRadius + length * progress;
                    const baseY = -baseWidth / 2 + (tipWidth / 2 - baseWidth / 2) * progress;
                    const waveOffset = Math.sin(progress * pi4) * waveScale;
                    const y = baseY + waveOffset;
                    
                    if (s === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                // Bottom edge with waviness
                for (let s = segments; s >= 0; s--) {
                    const progress = s / segments;
                    const x = startRadius + length * progress;
                    const baseY = baseWidth / 2 - (baseWidth / 2 - tipWidth / 2) * progress;
                    const waveOffset = Math.sin(progress * pi4) * waveScale;
                    const y = baseY - waveOffset;
                    ctx.lineTo(x, y);
                }
            } else {
                // Straight triangle: wide base at start (star edge), narrow tip at end
                ctx.moveTo(startRadius, -baseWidth / 2); // Top of base
                ctx.lineTo(rayLength, -tipWidth / 2); // Top of tip
                ctx.lineTo(rayLength, tipWidth / 2); // Bottom of tip
                ctx.lineTo(startRadius, baseWidth / 2); // Bottom of base
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        // Animation loop
        const animate = () => {
            animationTime = Date.now();
            renderLayer1Preview();
            renderLayer2Preview();
            animationFrameId = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        // Store animation frame ID for cleanup if needed
        this.spokePreviewAnimationId = animationFrameId;

        // Update previews when sliders change
        const updatePreviews = () => {
            // Previews update automatically in animation loop, but we can force immediate update
            renderLayer1Preview();
            renderLayer2Preview();
        };

        // Wire up to slider events
        const layer1Sliders = [
            document.getElementById('spoke-width1-slider'),
            document.getElementById('waviness1-slider'),
            document.getElementById('layer1-base-color-picker'),
            document.getElementById('layer1-tip-color-picker'),
            document.getElementById('layer1-base-opacity-slider'),
            document.getElementById('layer1-tip-opacity-slider'),
            document.getElementById('spoke-count-slider'),
            document.getElementById('spoke-max-length-slider')
        ];

        const layer2Sliders = [
            document.getElementById('spoke-width2-slider'),
            document.getElementById('waviness2-slider'),
            document.getElementById('layer2-base-color-picker'),
            document.getElementById('layer2-tip-color-picker'),
            document.getElementById('layer2-base-opacity-slider'),
            document.getElementById('layer2-tip-opacity-slider'),
            document.getElementById('spoke-count-slider'),
            document.getElementById('spoke-max-length-slider')
        ];

        layer1Sliders.forEach(slider => {
            if (slider) {
                slider.addEventListener('input', updatePreviews);
            }
        });

        layer2Sliders.forEach(slider => {
            if (slider) {
                slider.addEventListener('input', updatePreviews);
            }
        });
    }

    // Preset System Methods
    getStarPresetData(project) {
        if (!project) return null;
        
        return {
            // Layer colors
            colorBase1: project.colorBase1,
            colorTip1: project.colorTip1,
            colorBase2: project.colorBase2,
            colorTip2: project.colorTip2,
            
            // Layer color opacity
            colorBase1Opacity: project.colorBase1Opacity,
            colorTip1Opacity: project.colorTip1Opacity,
            colorBase2Opacity: project.colorBase2Opacity,
            colorTip2Opacity: project.colorTip2Opacity,
            
            // Spoke properties
            spokeCount: project.spokeCount,
            spokeBaseWidth1: project.spokeBaseWidth1,
            spokeBaseWidth2: project.spokeBaseWidth2,
            spokeMinLength: project.spokeMinLength,
            spokeMaxLength: project.spokeMaxLength,
            spokeStartRadius: project.spokeStartRadius,
            spokeWaviness1: project.spokeWaviness1,
            spokeWaviness2: project.spokeWaviness2,
            randomnessRatio: project.randomnessRatio,
            spokeTipRatio: project.spokeTipRatio,
            
            // Glow properties
            glowIntensity: project.glowIntensity,
            glowColor: project.glowColor,
            glowSize: project.glowSize,
            glowOpacity: project.glowOpacity,
            
            // Animation
            animationSpeed: project.animationSpeed,
            
            // Nucleus properties
            nucleusSize: project.nucleusSize,
            nucleusBlur: project.nucleusBlur
        };
    }

    applyStarPresetData(project, presetData) {
        if (!project || !presetData) return;
        
        // Apply layer colors
        if (presetData.colorBase1 !== undefined && presetData.colorTip1 !== undefined) {
            project.updateLayerColors(1, presetData.colorBase1, presetData.colorTip1);
        }
        if (presetData.colorBase2 !== undefined && presetData.colorTip2 !== undefined) {
            project.updateLayerColors(2, presetData.colorBase2, presetData.colorTip2);
        }
        
        // Apply layer color opacity
        if (presetData.colorBase1Opacity !== undefined || presetData.colorTip1Opacity !== undefined) {
            project.updateLayerColorOpacity(
                1,
                presetData.colorBase1Opacity !== undefined ? presetData.colorBase1Opacity : project.colorBase1Opacity,
                presetData.colorTip1Opacity !== undefined ? presetData.colorTip1Opacity : project.colorTip1Opacity
            );
        }
        if (presetData.colorBase2Opacity !== undefined || presetData.colorTip2Opacity !== undefined) {
            project.updateLayerColorOpacity(
                2,
                presetData.colorBase2Opacity !== undefined ? presetData.colorBase2Opacity : project.colorBase2Opacity,
                presetData.colorTip2Opacity !== undefined ? presetData.colorTip2Opacity : project.colorTip2Opacity
            );
        }
        
        // Apply spoke properties
        const spokeCount = presetData.spokeCount ?? project.spokeCount;
        const baseWidth1 = presetData.spokeBaseWidth1 ?? project.spokeBaseWidth1;
        const baseWidth2 = presetData.spokeBaseWidth2 ?? project.spokeBaseWidth2;
        const minLength = presetData.spokeMinLength ?? project.spokeMinLength;
        const maxLength = presetData.spokeMaxLength ?? project.spokeMaxLength;
        const startRadius = presetData.spokeStartRadius ?? project.spokeStartRadius;
        const waviness1 = presetData.spokeWaviness1 ?? project.spokeWaviness1;
        const waviness2 = presetData.spokeWaviness2 ?? project.spokeWaviness2;
        const randomnessRatio = presetData.randomnessRatio ?? project.randomnessRatio;
        
        project.updateSpokeProperties(
            spokeCount, baseWidth1, baseWidth2, minLength, maxLength,
            startRadius, waviness1, waviness2, randomnessRatio
        );
        
        if (presetData.spokeTipRatio !== undefined) {
            project.updateSpokeTipRatio(presetData.spokeTipRatio);
        }
        
        // Apply glow properties
        if (presetData.glowIntensity !== undefined) {
            project.updateGlowIntensity(presetData.glowIntensity);
        }
        if (presetData.glowColor !== undefined) {
            project.updateGlowColor(presetData.glowColor);
        }
        if (presetData.glowSize !== undefined) {
            project.updateGlowSize(presetData.glowSize);
        }
        if (presetData.glowOpacity !== undefined) {
            project.updateGlowOpacity(presetData.glowOpacity);
        }
        
        // Apply animation speed
        if (presetData.animationSpeed !== undefined) {
            project.updateAnimationSpeed(presetData.animationSpeed);
        }
        
        // Apply nucleus properties
        if (presetData.nucleusSize !== undefined) {
            project.updateNucleusSize(presetData.nucleusSize);
        }
        if (presetData.nucleusBlur !== undefined) {
            project.updateNucleusBlur(presetData.nucleusBlur);
        }
    }

    async loadDefaultPresetsIfNeeded() {
        // Check if localStorage has presets
        const existingPresets = localStorage.getItem('starPresets');
        if (existingPresets) {
            return; // Already have presets, don't load defaults
        }
        
        // Load default presets from file
        try {
            const response = await fetch('data/default-presets.json');
            if (response.ok) {
                const defaultPresets = await response.json();
                if (Array.isArray(defaultPresets) && defaultPresets.length > 0) {
                    // Save defaults to localStorage
                    try {
                        localStorage.setItem('starPresets', JSON.stringify(defaultPresets));
                        console.log(`Loaded ${defaultPresets.length} default presets`);
                    } catch (e) {
                        console.warn('Could not save default presets to localStorage:', e);
                    }
                }
            }
        } catch (e) {
            // File doesn't exist or error - that's okay, will start with empty presets
        }
    }

    getAllPresets() {
        // Start async load if not already started and localStorage is empty
        if (!this.defaultPresetsLoadStarted && !localStorage.getItem('starPresets')) {
            this.defaultPresetsLoadStarted = true;
            this.loadDefaultPresetsIfNeeded();
        }
        
        // Return current localStorage presets (may be empty initially)
        try {
            const presetsJson = localStorage.getItem('starPresets');
            if (!presetsJson) {
                return [];
            }
            const presets = JSON.parse(presetsJson);
            // Validate that it's an array
            if (!Array.isArray(presets)) {
                console.warn('Presets data is not an array, resetting');
                localStorage.removeItem('starPresets');
                return [];
            }
            return presets;
        } catch (e) {
            console.error('Error loading presets:', e);
            // If corrupted, clear it
            try {
                localStorage.removeItem('starPresets');
            } catch (clearError) {
                console.error('Error clearing corrupted presets:', clearError);
            }
            return [];
        }
    }

    // Helper method to export current presets (call from browser console: game.exportPresets())
    exportPresets() {
        const presets = this.getAllPresets();
        const json = JSON.stringify(presets, null, 2);
        console.log('Copy this JSON to data/default-presets.json:');
        console.log(json);
        // Also copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(json).then(() => {
                console.log('Presets copied to clipboard!');
            }).catch(() => {
                console.log('Could not copy to clipboard, see console output above');
            });
        }
        return json;
    }

    exportPresetsToFile() {
        try {
            const presets = this.getAllPresets();
            
            if (presets.length === 0) {
                alert('No presets to export. Save some presets first!');
                return;
            }
            
            // Format JSON with indentation
            const json = JSON.stringify(presets, null, 2);
            
            // Create blob and download
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `star-presets-${timestamp}.json`;
            
            // Create temporary download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Exported ${presets.length} preset(s) to ${filename}`);
        } catch (e) {
            console.error('Error exporting presets to file:', e);
            alert('Error exporting presets. Check console for details.');
        }
    }

    savePreset(name, project) {
        if (!name || !name.trim()) {
            console.error('savePreset: Invalid name');
            return false;
        }
        if (!project) {
            console.error('savePreset: No project provided');
            return false;
        }
        
        const presetData = this.getStarPresetData(project);
        if (!presetData) {
            console.error('savePreset: Failed to get preset data from project');
            return false;
        }
        
        const presets = this.getAllPresets();
        const newPreset = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            screenshot: null, // Will be set after screenshot capture
            data: presetData,
            createdAt: Date.now()
        };
        
        presets.push(newPreset);
        
        try {
            const jsonData = JSON.stringify(presets);
            localStorage.setItem('starPresets', jsonData);
            console.log('Preset saved successfully:', newPreset.id, newPreset.name);
            return newPreset.id;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Error saving preset: localStorage quota exceeded');
            } else {
                console.error('Error saving preset:', e);
            }
            return false;
        }
    }

    loadPreset(presetId) {
        const presets = this.getAllPresets();
        const preset = presets.find(p => p.id === presetId);
        if (!preset) return false;
        
        // Get currently selected star
        const starSelector = document.getElementById('star-selector');
        if (!starSelector) return false;
        
        const selectedValue = starSelector.value;
        if (selectedValue === 'all') {
            // Apply to all stars
            const projects = this.world.getProjects();
            projects.forEach(project => {
                this.applyStarPresetData(project, preset.data);
            });
            // Update UI from first project
            if (projects.length > 0 && this.updateControlsFromProject) {
                this.updateControlsFromProject(projects[0]);
            }
        } else {
            // Apply to selected star
            const project = this.world.getProjects()[parseInt(selectedValue)];
            if (project) {
                this.applyStarPresetData(project, preset.data);
                if (this.updateControlsFromProject) {
                    this.updateControlsFromProject(project);
                }
            }
        }
        
        return true;
    }

    deletePreset(presetId) {
        const presets = this.getAllPresets();
        const filtered = presets.filter(p => p.id !== presetId);
        
        try {
            localStorage.setItem('starPresets', JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error('Error deleting preset:', e);
            return false;
        }
    }

    updatePresetScreenshot(presetId, screenshot) {
        if (!presetId) {
            console.error('updatePresetScreenshot: No presetId provided');
            return false;
        }
        if (!screenshot) {
            console.error('updatePresetScreenshot: No screenshot data provided');
            return false;
        }
        
        const presets = this.getAllPresets();
        const preset = presets.find(p => p.id === presetId);
        if (!preset) {
            console.error('updatePresetScreenshot: Preset not found:', presetId);
            return false;
        }
        
        preset.screenshot = screenshot;
        
        try {
            const jsonData = JSON.stringify(presets);
            localStorage.setItem('starPresets', jsonData);
            console.log('Preset screenshot updated successfully:', presetId);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Error updating preset screenshot: localStorage quota exceeded');
            } else {
                console.error('Error updating preset screenshot:', e);
            }
            return false;
        }
    }

    async regenerateAllPresetScreenshots() {
        const presets = this.getAllPresets();
        if (presets.length === 0) {
            console.log('No presets to regenerate');
            return;
        }
        
        console.log(`Regenerating screenshots for ${presets.length} presets...`);
        
        const projects = this.world.getProjects();
        let regenerated = 0;
        let failed = 0;
        
        for (const preset of presets) {
            // Try to find matching project by comparing preset data with current project states
            // We'll match by finding the project that most closely matches the preset's data
            let bestMatch = null;
            let bestMatchScore = 0;
            
            for (const project of projects) {
                // Calculate a match score based on how many properties match
                let score = 0;
                const presetData = preset.data;
                
                // Compare key properties (colors, spoke count, etc.)
                if (presetData.colorBase1 === project.colorBase1) score += 2;
                if (presetData.colorTip1 === project.colorTip1) score += 2;
                if (presetData.colorBase2 === project.colorBase2) score += 2;
                if (presetData.colorTip2 === project.colorTip2) score += 2;
                if (presetData.spokeCount === project.spokeCount) score += 1;
                if (Math.abs((presetData.spokeMaxLength || 0) - project.spokeMaxLength) < 0.01) score += 1;
                
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatch = project;
                }
            }
            
            if (bestMatch && bestMatchScore >= 3) {
                // Apply preset data to project temporarily to get exact match
                this.applyStarPresetData(bestMatch, preset.data);
                
                // Activate the star by setting proximityValue to 1.0 (fully active)
                const originalProximityValue = bestMatch.proximityValue;
                bestMatch.proximityValue = 1.0;
                
                // Wait multiple frames for animations to settle and star to fully render
                // Increased wait time to ensure star is fully active and rendered
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay for full render
                
                // Capture screenshot while star is active
                const screenshot = await this.captureStarScreenshot(bestMatch);
                
                // Restore original proximity value
                bestMatch.proximityValue = originalProximityValue;
                
                if (screenshot) {
                    const updated = this.updatePresetScreenshot(preset.id, screenshot);
                    if (updated) {
                        regenerated++;
                        console.log(`Regenerated screenshot for preset: ${preset.name}`);
                    } else {
                        failed++;
                        console.error(`Failed to update screenshot for preset: ${preset.name}`);
                    }
                } else {
                    failed++;
                    console.error(`Failed to capture screenshot for preset: ${preset.name}`);
                }
            } else {
                failed++;
                console.warn(`Could not find matching project for preset: ${preset.name}`);
            }
        }
        
        console.log(`Screenshot regeneration complete: ${regenerated} succeeded, ${failed} failed`);
        
        // Refresh gallery to show new screenshots
        this.renderPresetGallery();
        
        return { regenerated, failed };
    }

    async captureStarScreenshot(project) {
        if (!project) {
            console.error('captureStarScreenshot: No project provided');
            return null;
        }
        
        // Activate the star by setting proximityValue to 1.0 (fully active) for screenshot
        const originalProximityValue = project.proximityValue;
        project.proximityValue = 1.0;
        
        // Wait multiple frames for animations to settle and star to fully render
        // Increased wait time to ensure star is fully active and rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay for full render
        
        // Create temporary off-screen canvas (completely isolated from main canvas)
        // Use 600x600px for high-quality thumbnails (3x resolution from previous 200x200px)
        const screenshotSize = 600;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = screenshotSize;
        tempCanvas.height = screenshotSize;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Explicitly clear the temp canvas
        tempCtx.clearRect(0, 0, screenshotSize, screenshotSize);
        
        // Create temporary camera centered on the star with zoomed out view
        // Camera x,y represent top-left corner of viewport in world space
        const tempCamera = new Camera(screenshotSize, screenshotSize);
        const zoomLevel = 0.65 * 1.3 * 1.3; // Zoom in by 60% total (1.0985) for closer screenshots
        tempCamera.x = project.x - (screenshotSize / 2) / zoomLevel;
        tempCamera.y = project.y - (screenshotSize / 2) / zoomLevel;
        tempCamera.zoom = zoomLevel;
        
        // Render background to temp canvas (no dimming, no grid)
        this.world.drawBackground(tempCamera, 0, tempCtx, tempCanvas);
        
        // Apply zoom transform for world elements
        tempCtx.save();
        tempCtx.scale(tempCamera.zoom, tempCamera.zoom);
        tempCtx.translate(-tempCamera.x, -tempCamera.y);
        
        // Render ONLY the target project (not all projects) without nametag
        project.render(tempCtx, tempCamera, false);
        
        tempCtx.restore();
        
        // Restore original proximity value
        project.proximityValue = originalProximityValue;
        
        // Get image data from temp canvas
        try {
            const dataUrl = tempCanvas.toDataURL('image/png');
            console.log('Screenshot captured successfully, size:', dataUrl.length, 'bytes');
            return dataUrl;
        } catch (e) {
            console.error('Error converting canvas to data URL:', e);
            return null;
        }
    }

    renderPresetGallery() {
        const gallery = document.getElementById('preset-gallery');
        if (!gallery) return;
        
        let presets = this.getAllPresets();
        
        // Sort presets by createdAt descending (newest first)
        presets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        // Filter presets by search term if active
        if (this.presetSearchTerm && this.presetSearchTerm.trim()) {
            const searchLower = this.presetSearchTerm.toLowerCase().trim();
            presets = presets.filter(p => p.name.toLowerCase().includes(searchLower));
        }
        
        gallery.innerHTML = '';
        
        if (presets.length === 0) {
            const emptyMsg = document.createElement('div');
            if (this.presetSearchTerm && this.presetSearchTerm.trim()) {
                emptyMsg.textContent = 'No presets match your search';
            } else {
                emptyMsg.textContent = 'No presets saved yet';
            }
            emptyMsg.style.cssText = 'text-align: center; color: var(--color-offwhite-300); padding: 1rem; font-size: 0.875rem;';
            gallery.appendChild(emptyMsg);
            return;
        }
        
        presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            
            // Make entire item clickable to load preset
            item.addEventListener('click', (e) => {
                // Don't load if clicking on delete button
                if (e.target.closest('.preset-delete-btn')) {
                    return; // Let delete button handle its own click
                }
                this.playHapticSound('click');
                this.loadPreset(preset.id);
            });
            
            // Thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.className = 'preset-thumbnail';
            if (preset.screenshot) {
                thumbnail.src = preset.screenshot;
            } else {
                thumbnail.style.display = 'none';
            }
            thumbnail.alt = preset.name;
            
            // Info section
            const info = document.createElement('div');
            info.className = 'preset-item-info';
            
            const name = document.createElement('div');
            name.className = 'preset-item-name';
            name.textContent = preset.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'preset-delete-btn';
            deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            deleteBtn.title = 'Delete preset';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete preset "${preset.name}"?`)) {
                    this.playHapticSound('click');
                    this.deletePreset(preset.id);
                    this.renderPresetGallery();
                }
            });
            
            info.appendChild(name);
            item.appendChild(deleteBtn);
            
            item.appendChild(thumbnail);
            item.appendChild(info);
            
            gallery.appendChild(item);
        });
    }

    setupPresetSystem() {
        const saveBtn = document.getElementById('save-preset-btn');
        const nameInput = document.getElementById('preset-name-input');
        const starControlsPanel = document.getElementById('star-controls-panel');
        
        if (!saveBtn || !nameInput) return;
        
        // Save preset handler
        saveBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a preset name');
                return;
            }
            
            // Get currently selected star
            const starSelector = document.getElementById('star-selector');
            if (!starSelector) {
                console.error('Star selector not found');
                alert('Error: Star selector not found');
                return;
            }
            
            const selectedValue = starSelector.value;
            if (selectedValue === 'all') {
                alert('Please select a specific star to save a preset');
                return;
            }
            
            const project = this.world.getProjects()[parseInt(selectedValue)];
            if (!project) {
                console.error('No project found for selected value:', selectedValue);
                alert('No star selected');
                return;
            }
            
            // Disable button during save
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            try {
                // Save preset data first
                console.log('Saving preset:', name);
                const presetId = this.savePreset(name, project);
                if (!presetId) {
                    console.error('Failed to save preset data');
                    alert('Failed to save preset. Check console for details.');
                    return;
                }
                
                console.log('Preset data saved, capturing screenshot...');
                // Capture screenshot
                const screenshot = await this.captureStarScreenshot(project);
                if (screenshot) {
                    console.log('Screenshot captured, updating preset...');
                    const updated = this.updatePresetScreenshot(presetId, screenshot);
                    if (!updated) {
                        console.warn('Failed to update preset screenshot, but preset data was saved');
                    }
                } else {
                    console.warn('Screenshot capture failed, but preset data was saved');
                }
                
                // Clear input, search term, and refresh gallery
                nameInput.value = '';
                this.presetSearchTerm = '';
                // Ensure input field is visually updated and filter is deactivated
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.renderPresetGallery();
                this.playHapticSound('click');
                console.log('Preset saved successfully!');
            } catch (e) {
                console.error('Error saving preset:', e);
                alert('Error saving preset: ' + (e.message || 'Unknown error'));
            } finally {
                // Restore proper button state based on star selection
                updateSaveButtonState();
            }
        });
        
        // Allow Enter key to save
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
        
        // Search functionality - filter presets as user types
        nameInput.addEventListener('input', (e) => {
            this.presetSearchTerm = e.target.value;
            this.renderPresetGallery();
        });
        
        // Update save button state based on star selection
        const updateSaveButtonState = () => {
            const starSelector = document.getElementById('star-selector');
            if (!starSelector) return;
            
            const selectedValue = starSelector.value;
            const shouldDisable = selectedValue === 'all';
            saveBtn.disabled = shouldDisable;
            saveBtn.textContent = 'Save Preset';
        };
        
        // Store as method on Game instance so it can be called from update loop
        this.updateSaveButtonState = updateSaveButtonState;
        
        // Watch for star selector changes
        const starSelector = document.getElementById('star-selector');
        if (starSelector) {
            starSelector.addEventListener('change', updateSaveButtonState);
        }
        
        // Initial state
        updateSaveButtonState();
        
        // Render gallery when panel opens
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!starControlsPanel.classList.contains('hidden')) {
                        this.renderPresetGallery();
                    }
                }
            });
        });
        
        if (starControlsPanel) {
            observer.observe(starControlsPanel, { attributes: true });
            // Initial render if panel is already open
            if (!starControlsPanel.classList.contains('hidden')) {
                this.renderPresetGallery();
            }
        }
        
        // Setup gallery viewer
        this.setupGalleryViewer();
        
        // Auto-regenerate screenshots disabled - only regenerate when explicitly requested
        // Screenshots will only be regenerated if the user manually triggers it
    }
    
    setupGalleryViewer() {
        const viewGalleryBtn = document.getElementById('view-gallery-btn');
        const galleryViewer = document.getElementById('gallery-viewer');
        const galleryCloseBtn = document.getElementById('gallery-close-btn');
        const galleryPrevBtn = document.getElementById('gallery-prev-btn');
        const galleryNextBtn = document.getElementById('gallery-next-btn');
        const galleryLoadBtn = document.getElementById('gallery-load-btn');
        const galleryImage = document.getElementById('gallery-viewer-image');
        const galleryPresetName = document.getElementById('gallery-preset-name');
        const galleryCounter = document.getElementById('gallery-counter');
        
        if (!viewGalleryBtn || !galleryViewer) return;
        
        let currentPresetIndex = 0;
        let presets = [];
        
        const updateGalleryView = () => {
            if (presets.length === 0) {
                galleryViewer.classList.add('hidden');
                return;
            }
            
            const preset = presets[currentPresetIndex];
            if (preset.screenshot) {
                galleryImage.src = preset.screenshot;
                galleryImage.style.display = 'block';
            } else {
                galleryImage.style.display = 'none';
            }
            
            galleryPresetName.textContent = preset.name;
            galleryCounter.textContent = `${currentPresetIndex + 1} / ${presets.length}`;
            
            // Update navigation button states
            galleryPrevBtn.style.opacity = currentPresetIndex === 0 ? '0.5' : '1';
            galleryPrevBtn.style.pointerEvents = currentPresetIndex === 0 ? 'none' : 'auto';
            galleryNextBtn.style.opacity = currentPresetIndex === presets.length - 1 ? '0.5' : '1';
            galleryNextBtn.style.pointerEvents = currentPresetIndex === presets.length - 1 ? 'none' : 'auto';
        };
        
        const openGallery = () => {
            presets = this.getAllPresets();
            if (presets.length === 0) {
                alert('No presets to view');
                return;
            }
            
            currentPresetIndex = 0;
            updateGalleryView();
            galleryViewer.classList.remove('hidden');
            this.playHapticSound('click');
        };
        
        const closeGallery = () => {
            galleryViewer.classList.add('hidden');
            this.playHapticSound('click');
        };
        
        const navigatePrev = () => {
            if (currentPresetIndex > 0) {
                currentPresetIndex--;
                updateGalleryView();
                this.playHapticSound('select');
            }
        };
        
        const navigateNext = () => {
            if (currentPresetIndex < presets.length - 1) {
                currentPresetIndex++;
                updateGalleryView();
                this.playHapticSound('select');
            }
        };
        
        const loadCurrentPreset = () => {
            if (presets.length > 0) {
                const preset = presets[currentPresetIndex];
                this.loadPreset(preset.id);
                closeGallery();
            }
        };
        
        viewGalleryBtn.addEventListener('click', openGallery);
        galleryCloseBtn.addEventListener('click', closeGallery);
        galleryPrevBtn.addEventListener('click', navigatePrev);
        galleryNextBtn.addEventListener('click', navigateNext);
        galleryLoadBtn.addEventListener('click', loadCurrentPreset);
        
        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (galleryViewer.classList.contains('hidden')) return;
            
            if (e.key === 'Escape') {
                closeGallery();
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                navigatePrev();
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
                e.preventDefault();
            }
        });
    }

    setupZoomControl() {
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomValue = document.getElementById('zoom-value');
        
        if (!zoomSlider || !zoomValue) return;
        
        // Initialize slider value from current camera zoom
        const currentZoom = this.camera.getZoom();
        zoomSlider.value = currentZoom;
        zoomValue.textContent = currentZoom.toFixed(1) + 'x';
        
        // Track previous value for tick detection
        this.sliderPreviousValues.set('zoom-slider', currentZoom);
        
        // Handle slider input (smooth zoom)
        zoomSlider.addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            this.camera.setZoom(zoom);
            zoomValue.textContent = zoom.toFixed(1) + 'x';
            
            // Play tick sound when crossing step boundaries
            this.handleSliderTick(e.target, zoom);
        });
        
        // Add immediate feedback for zoom slider
        const addZoomSliderImmediateFeedback = (slider) => {
            if (!slider) return;
            const handleStart = () => {
                this.playHapticSound('click');
            };
            slider.addEventListener('mousedown', handleStart);
            slider.addEventListener('touchstart', handleStart, { passive: true });
        };
        addZoomSliderImmediateFeedback(zoomSlider);
        
        // Setup click-to-snap for min/max
        const zoomMin = document.querySelector('#zoom-slider').closest('.zoom-control').querySelector('.slider-min');
        const zoomMax = document.querySelector('#zoom-slider').closest('.zoom-control').querySelector('.slider-max');
        this.setupSliderMinMaxClick(zoomSlider, zoomMin, zoomMax);
    }

    updateStarNameDisplay(project = null) {
        const starNameElement = document.getElementById('current-star-name');
        const starControlsPanel = document.getElementById('star-controls-panel');
        
        if (!starNameElement) return;
        
        // Use provided project or current star
        const targetProject = project || this.currentStar;
        
        if (!targetProject) {
            starNameElement.textContent = '';
            return;
        }
        
        // Check if panel is snapped to side
        const isSnapped = starControlsPanel && 
            (starControlsPanel.classList.contains('sticky-left') || 
             starControlsPanel.classList.contains('sticky-right'));
        
        // If snapped, show name without dash, otherwise with dash
        starNameElement.textContent = isSnapped ? targetProject.label : ` - ${targetProject.label}`;
    }

    activateAllStars() {
        // Toggle state
        this.allStarsActivated = !this.allStarsActivated;
        
        const projects = this.world.getProjects();
        
        // Start animation
        this.starsActivationAnimating = true;
        this.starsActivationStartTime = Date.now();
        
        // Store starting values for each project
        projects.forEach(project => {
            this.starsActivationStartValues.set(project, project.proximityValue);
        });
        
        if (this.allStarsActivated) {
            console.log('All stars activating (animated)');
        } else {
            console.log('All stars deactivating (animated)');
        }
        
        // Update button text and styling
        this.updateActivateStarsButton();
    }

    updateActivateStarsButton() {
        const activateBtn = document.getElementById('activate-all-stars-btn');
        const activateUiBtn = document.getElementById('activate-all-stars-ui-btn');
        
        const buttonText = this.allStarsActivated ? 'Deactivate All Stars' : 'Activate All Stars';
        const buttonClass = this.allStarsActivated ? 'active' : '';
        
        // Update panel button (has SVG icon, so update span text)
        if (activateBtn) {
            const span = activateBtn.querySelector('span');
            if (span) {
                span.textContent = buttonText;
            } else {
                // Fallback if structure changes
                activateBtn.textContent = buttonText;
            }
            if (this.allStarsActivated) {
                activateBtn.classList.add('active');
            } else {
                activateBtn.classList.remove('active');
            }
        }
        
        // Update UI overlay button
        if (activateUiBtn) {
            activateUiBtn.textContent = `⭐ ${buttonText}`;
            if (this.allStarsActivated) {
                activateUiBtn.classList.add('active');
            } else {
                activateUiBtn.classList.remove('active');
            }
        }
    }

    setupActivateAllStars() {
        const activateBtn = document.getElementById('activate-all-stars-btn');
        const activateUiBtn = document.getElementById('activate-all-stars-ui-btn');
        const randomizeStarsUiBtn = document.getElementById('randomize-stars-ui-btn');
        
        // Initialize button state for both buttons
        this.updateActivateStarsButton();
        
        // Add click listener to panel button
        if (activateBtn) {
            activateBtn.addEventListener('click', () => {
                this.playHapticSound('click');
                this.activateAllStars();
            });
        }
        
        // Add click listener to UI overlay button
        if (activateUiBtn) {
            activateUiBtn.addEventListener('click', () => {
                this.playHapticSound('click');
                this.activateAllStars();
            });
        }
        
        // Add click listener to randomize stars UI overlay button
        if (randomizeStarsUiBtn) {
            randomizeStarsUiBtn.addEventListener('click', () => {
                this.playHapticSound('click');
                this.randomizeAllStars();
            });
        }
    }
    
    randomizeAllStars() {
        const projects = this.world.getProjects();
        if (projects.length === 0) return;
        
        // Helper function to generate random value in range
        const randomInRange = (min, max, step = 1) => {
            const steps = Math.floor((max - min) / step) + 1;
            return min + Math.floor(Math.random() * steps) * step;
        };
        
        // Helper function to generate random hex color
        const randomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        };
        
        // Get available presets
        const availablePresets = this.getAllPresets();
        const usedPresetIndices = new Set();
        
        // Function to apply random properties to a project
        const applyRandomProperties = (project) => {
            project.spokeCount = randomInRange(20, 200, 5);
            project.spokeBaseWidth1 = randomInRange(1.0, 5.0, 0.1);
            project.spokeBaseWidth2 = randomInRange(0.5, 4.0, 0.1);
            project.spokeMinLength = randomInRange(0.2, 1.0, 0.05);
            project.spokeMaxLength = randomInRange(0.5, 3.3, 0.05);
            project.spokeWaviness1 = randomInRange(0, 2, 0.1);
            project.spokeWaviness2 = randomInRange(0, 2, 0.1);
            project.randomnessRatio = randomInRange(0, 1, 0.05);
            project.glowIntensity = randomInRange(0, 10, 0.5);
            project.updateLayerColors(1, randomColor(), randomColor());
            project.updateLayerColors(2, randomColor(), randomColor());
            project.updateAnimationSpeed(randomInRange(0, 2.0, 0.1));
            project.updateNucleusSize(randomInRange(0.1, 1.0, 0.01));
            project.updateNucleusBlur(randomInRange(0, 100, 1));
            project.proximityValue = 0;
        };
        
        // Function to apply a random preset to a project (ensuring no duplicates)
        const applyRandomPreset = (project) => {
            if (availablePresets.length === 0) {
                applyRandomProperties(project);
                return;
            }
            
            // Find an unused preset index - ensure no duplicates
            let presetIndex;
            let attempts = 0;
            const maxAttempts = availablePresets.length * 2;
            
            // If all presets have been used, reset the set to allow reuse
            if (usedPresetIndices.size >= availablePresets.length) {
                usedPresetIndices.clear();
            }
            
            do {
                presetIndex = Math.floor(Math.random() * availablePresets.length);
                attempts++;
                if (attempts > maxAttempts) {
                    // Find first unused preset, or use any if all are used
                    for (let i = 0; i < availablePresets.length; i++) {
                        if (!usedPresetIndices.has(i)) {
                            presetIndex = i;
                            break;
                        }
                    }
                    break;
                }
            } while (usedPresetIndices.has(presetIndex));
            
            usedPresetIndices.add(presetIndex);
            const preset = availablePresets[presetIndex];
            this.applyStarPresetData(project, preset.data);
            project.proximityValue = 0;
        };
        
        // Randomize each star (50% chance for preset, 50% for random)
        projects.forEach(project => {
            if (availablePresets.length > 0 && Math.random() < 0.5) {
                applyRandomPreset(project);
            } else {
                applyRandomProperties(project);
            }
        });
        
        // Update UI controls if panel is open and a star is selected
        const starSelector = document.getElementById('star-selector');
        if (starSelector && starSelector.value !== 'all') {
            const selectedIndex = parseInt(starSelector.value);
            if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < projects.length) {
                const selectedProject = projects[selectedIndex];
                if (this.updateControlsFromProject) {
                    this.updateControlsFromProject(selectedProject);
                }
            }
        }
        
        console.log(`Randomized ${projects.length} star(s)`);
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

            // Check if clicked on nameplate (entire nameplate is clickable) - open star controls panel
            if (this.currentStar && this.currentStar.containsNameplatePoint(worldPos.x, worldPos.y)) {
                e.preventDefault();
                this.playHapticSound('click');
                
                // Open star controls panel
                const panel = document.getElementById('star-controls-panel');
                const starSelector = document.getElementById('star-selector');
                
                if (panel) {
                    // Check if panel is already open and snapped
                    const isOpen = !panel.classList.contains('hidden');
                    const isSnapped = panel.classList.contains('sticky-left') || panel.classList.contains('sticky-right');
                    
                    // If panel is open and snapped, snap it back to top
                    if (isOpen && isSnapped) {
                        // Remove sticky classes
                        panel.classList.remove('sticky-left', 'sticky-right');
                        panel.dataset.sticky = '';
                        
                        // Reset positioning to allow normal positioning
                        panel.style.left = '';
                        panel.style.right = '';
                        panel.style.top = '';
                        panel.style.bottom = '';
                        panel.style.height = '';
                        panel.style.maxHeight = '';
                        panel.style.transform = '';
                        
                        // Reset manual positioning flag
                        this.starControlsManuallyPositioned = false;
                        
                        // Position panel on right side (top)
                        if (this.positionStarControlsPanel) {
                            setTimeout(() => this.positionStarControlsPanel(), 0);
                        }
                    } else {
                        // Set current star in selector
                        const starIndex = this.world.getProjects().indexOf(this.currentStar);
                        if (starSelector && starIndex !== -1) {
                            starSelector.value = starIndex.toString();
                            // Update save button state
                            if (this.updateSaveButtonState) {
                                this.updateSaveButtonState();
                            }
                        }
                        
                        // Update all controls to match the star's current values
                        if (this.updateControlsFromProject) {
                            this.updateControlsFromProject(this.currentStar);
                        }
                        
                        // Open panel
                        panel.classList.remove('hidden');
                        this.starControlsManuallyOpened = true;
                        
                        // Position panel on right side
                        if (this.positionStarControlsPanel) {
                            setTimeout(() => this.positionStarControlsPanel(), 0);
                        }
                    }
                }
                return;
            }

            // Check if clicked on character - skip on mobile
            if (this.character.containsPoint(worldPos.x, worldPos.y) && !this.input.isTouchDevice) {
                e.preventDefault();
                this.showMessagePrompt();
            }
        });

        // Prevent right-click menu
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse hover effect and cursor management
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.camera.screenToWorld(screenX, screenY);
            
            // Check if mouse is over a clickable nameplate
            let isOverNameplate = false;
            if (this.currentStar && this.currentStar.containsNameplatePoint(worldPos.x, worldPos.y)) {
                isOverNameplate = true;
            }
            
            // Check character hover state
            const isHovered = this.character.containsPoint(worldPos.x, worldPos.y);
            this.character.setHovered(isHovered);
            
            // Update cursor based on hover state (nameplate takes priority over character)
            if (isOverNameplate) {
                canvas.style.cursor = 'pointer';
            } else if (isHovered) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
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
            this.playHapticSound('click');
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
            this.playHapticSound('click');
            this.hideMenu();
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        };
    }

    showThoughtBubble(text, duration = 5000) {
        // Skip on mobile devices
        if (this.input.isTouchDevice) {
            return;
        }
        
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
        // Legacy method - no longer needed
    }

    updateMenuPosition() {
        // Menu positioning is handled by makeDraggable, this is a placeholder
        // for any future positioning logic
    }


    makeDraggable(element, dragHandle) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Use dragHandle if provided, otherwise use element
        const handle = dragHandle || element;

        // Get initial position from computed style or default
        const rect = element.getBoundingClientRect();
        xOffset = rect.left;
        yOffset = rect.top;

        const startDrag = (clientX, clientY) => {
            // If panel is sticky, unclip it before dragging
            if ((element.id === 'star-controls-panel' || element.id === 'settings-panel') && 
                (element.classList.contains('sticky-left') || element.classList.contains('sticky-right'))) {
                // Remove sticky classes
                element.classList.remove('sticky-left', 'sticky-right');
                element.dataset.sticky = '';
                
                // Reset positioning to allow normal dragging
                element.style.left = '';
                element.style.right = '';
                element.style.top = '';
                element.style.bottom = '';
                element.style.height = '';
                element.style.maxHeight = '';
                element.style.transform = '';
                
                // Get current position from getBoundingClientRect for accurate starting position
                const rect = element.getBoundingClientRect();
                xOffset = rect.left;
                yOffset = rect.top;
            } else {
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
            }
            
            initialX = clientX - xOffset;
            initialY = clientY - yOffset;

            isDragging = true;
            element.style.cursor = 'grabbing';
            if (handle) handle.style.cursor = 'grabbing';
        };

        handle.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on interactive elements (inputs, buttons, etc.)
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'SELECT' ||
                e.target.closest('input') ||
                e.target.closest('button') ||
                e.target.closest('select') ||
                e.target.classList.contains('menu-close-btn')) {
                return; // Let the element handle its own events
            }
            
            // Set dragging flag IMMEDIATELY to prevent positioning interference
            element.dataset.dragging = 'true';
            
            startDrag(e.clientX, e.clientY);
        });

        // Add touch event support for mobile
        handle.addEventListener('touchstart', (e) => {
            // Don't drag if touching interactive elements (inputs, buttons, etc.)
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'SELECT' ||
                e.target.closest('input') ||
                e.target.closest('button') ||
                e.target.closest('select') ||
                e.target.classList.contains('menu-close-btn')) {
                return; // Let the element handle its own events
            }
            
            // Set dragging flag IMMEDIATELY to prevent positioning interference
            element.dataset.dragging = 'true';
            
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
            e.preventDefault(); // Prevent scrolling
        });

        const checkCollapse = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 500) {
                element.classList.add('collapsed');
            } else {
                element.classList.remove('collapsed');
            }
        };

        const handleMove = (clientX, clientY) => {
            if (isDragging) {
                currentX = clientX - initialX;
                currentY = clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.left = `${currentX}px`;
                element.style.top = `${currentY}px`;
                element.style.transform = 'none'; // Remove centering transform when dragging
                
                // Check collapse state while dragging (for star controls panel)
                if (element.id === 'star-controls-panel') {
                    checkCollapse();
                }
            }
        };

        const handleMouseMove = (e) => {
            // Only prevent default and handle move when actually dragging
            if (isDragging) {
                e.preventDefault();
                handleMove(e.clientX, e.clientY);
            }
        };

        const handleTouchMove = (e) => {
            if (isDragging && e.touches.length > 0) {
                e.preventDefault(); // Prevent scrolling
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };

        const handleUp = () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
                if (handle) handle.style.cursor = '';
                element.dataset.dragging = 'false';
                // Mark panel as manually positioned
                if (element.id === 'star-controls-panel') {
                    this.starControlsManuallyPositioned = true;
                    // Check if panel should be collapsed
                    checkCollapse();
                    
                    // Check if near screen edges for sticky snapping
                    const rect = element.getBoundingClientRect();
                    const edgeThreshold = 50; // pixels from edge
                    
                    // Check left edge
                    if (rect.left < edgeThreshold) {
                        element.style.left = '0';
                        element.style.right = 'auto';
                        element.classList.add('sticky-left', 'collapsed');
                        element.dataset.sticky = 'left';
                        // Update star name display format
                        this.updateStarNameDisplay();
                    }
                    // Check right edge
                    else if (rect.right > window.innerWidth - edgeThreshold) {
                        element.style.right = '0';
                        element.style.left = 'auto';
                        element.classList.add('sticky-right', 'collapsed');
                        element.dataset.sticky = 'right';
                        // Update star name display format
                        this.updateStarNameDisplay();
                    }
                    // Not near edge - remove sticky
                    else {
                        element.classList.remove('sticky-left', 'sticky-right');
                        element.dataset.sticky = '';
                        // Remove collapsed class when not snapped (but keep if width < 500)
                        if (rect.width >= 500) {
                            element.classList.remove('collapsed');
                        }
                        // Update star name display format
                        this.updateStarNameDisplay();
                    }
                } else if (element.id === 'settings-panel') {
                    // Check if near screen edges for sticky snapping
                    const rect = element.getBoundingClientRect();
                    const edgeThreshold = 50; // pixels from edge
                    
                    // Check left edge
                    if (rect.left < edgeThreshold) {
                        element.style.left = '0';
                        element.style.right = 'auto';
                        element.classList.add('sticky-left');
                        element.dataset.sticky = 'left';
                    }
                    // Check right edge
                    else if (rect.right > window.innerWidth - edgeThreshold) {
                        element.style.right = '0';
                        element.style.left = 'auto';
                        element.classList.add('sticky-right');
                        element.dataset.sticky = 'right';
                    }
                    // Not near edge - remove sticky
                    else {
                        element.classList.remove('sticky-left', 'sticky-right');
                        element.dataset.sticky = '';
                    }
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleUp, { passive: true });
    }

    makeResizable(element) {
        const cornerHandle = element.querySelector('.resize-handle-corner');
        const topHandle = element.querySelector('.resize-handle-top');
        const rightHandle = element.querySelector('.resize-handle-right');
        const bottomHandle = element.querySelector('.resize-handle-bottom');
        const leftHandle = element.querySelector('.resize-handle-left');
        
        if (!cornerHandle && !topHandle && !rightHandle && !bottomHandle && !leftHandle) return;

        let isResizing = false;
        let resizeType = null; // 'corner', 'top', 'right', 'bottom', 'left'
        let startX, startY, startWidth, startHeight, startTop, startLeft;
        
        // Function to check if panel should be collapsed (1 column layout)
        const checkCollapse = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 500) {
                element.classList.add('collapsed');
            } else {
                element.classList.remove('collapsed');
            }
        };

        const startResize = (e, type) => {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            resizeType = type;
            startX = e.clientX;
            startY = e.clientY;
            
            // Get current dimensions and position
            const computedStyle = window.getComputedStyle(element);
            startWidth = parseInt(computedStyle.width, 10);
            startHeight = parseInt(computedStyle.height, 10);
            startTop = parseInt(computedStyle.top, 10) || element.getBoundingClientRect().top;
            startLeft = parseInt(computedStyle.left, 10) || element.getBoundingClientRect().left;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        };

        // Attach event listeners to all handles
        if (cornerHandle) {
            cornerHandle.addEventListener('mousedown', (e) => startResize(e, 'corner'));
        }
        if (topHandle) {
            topHandle.addEventListener('mousedown', (e) => startResize(e, 'top'));
        }
        if (rightHandle) {
            rightHandle.addEventListener('mousedown', (e) => startResize(e, 'right'));
        }
        if (bottomHandle) {
            bottomHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
        }
        if (leftHandle) {
            leftHandle.addEventListener('mousedown', (e) => startResize(e, 'left'));
        }

        const handleResize = (e) => {
            if (!isResizing || !resizeType) return;
            
            const isSticky = element.classList.contains('sticky-left') || element.classList.contains('sticky-right');
            const isStickyLeft = element.classList.contains('sticky-left');
            const isStickyRight = element.classList.contains('sticky-right');
            
            // Calculate new dimensions based on resize type
            let width = startWidth;
            let height = startHeight;
            let newTop = startTop;
            let newLeft = startLeft;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            switch (resizeType) {
                case 'corner':
                    width = startWidth + deltaX;
                    height = startHeight + deltaY;
                    break;
                case 'top':
                    height = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'right':
                    width = startWidth + deltaX;
                    break;
                case 'bottom':
                    height = startHeight + deltaY;
                    break;
                case 'left':
                    width = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                    break;
            }
            
            // Apply min/max constraints
            const minWidth = 280;
            const maxWidth = 800;
            const minHeight = 300;
            const maxHeight = window.innerHeight * 0.9;
            
            const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, width));
            const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, height));
            
            // Adjust top/left if resizing from top or left
            if (resizeType === 'top') {
                const heightDiff = constrainedHeight - startHeight;
                newTop = startTop - heightDiff;
            } else if (resizeType === 'left') {
                const widthDiff = constrainedWidth - startWidth;
                newLeft = startLeft - widthDiff;
            }
            
            // If sticky and resizing, maintain sticky state while adjusting dimensions
            if (isSticky && (resizeType === 'corner' || resizeType === 'right' || resizeType === 'left' || resizeType === 'top' || resizeType === 'bottom')) {
                // Allow width/height adjustment while maintaining sticky state
                if (resizeType === 'corner' || resizeType === 'right' || resizeType === 'left') {
                    element.style.width = `${constrainedWidth}px`;
                }
                if (resizeType === 'corner' || resizeType === 'bottom' || resizeType === 'top') {
                    element.style.height = `${constrainedHeight}px`;
                }
                
                // Update layout based on new width
                if (element.id === 'star-controls-panel') {
                    checkCollapse();
                }
            } else {
                // Normal resize
                element.style.width = `${constrainedWidth}px`;
                if (resizeType === 'corner' || resizeType === 'bottom' || resizeType === 'top') {
                    element.style.height = `${constrainedHeight}px`;
                }
                element.style.maxWidth = 'none';
                element.style.maxHeight = 'none';
                
                // Adjust position for top/left resizing
                if (resizeType === 'top') {
                    element.style.top = `${newTop}px`;
                } else if (resizeType === 'left') {
                    element.style.left = `${newLeft}px`;
                }
                
                // Update layout based on new width
                if (element.id === 'star-controls-panel') {
                    checkCollapse();
                }
            }
        };

        const stopResize = () => {
            isResizing = false;
            resizeType = null;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    getNearbyProjects(radius) {
        const projects = this.world.getProjects();
        const charPos = this.character.getPosition();

        return projects.filter(project => {
            return project.distanceTo(charPos.x, charPos.y) < radius;
        });
    }

    playTickSound(frequency = 1000) {
        // Lazy initialization of audio context (must be created after user interaction)
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // Audio context not supported or not available
                return;
            }
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            // Try to resume, but don't wait - let it resume on next user interaction
            this.audioContext.resume().catch(() => {});
            // Don't proceed if context is still suspended (requires user gesture)
            return;
        }
        
        // Only play if context is running (user has interacted)
        if (this.audioContext.state !== 'running') {
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Create a satisfying tick sound with specified frequency
            oscillator.frequency.value = frequency; // Hz - crisp tick sound
            oscillator.type = 'sine';
            
            // Quick attack and decay for a sharp tick
            const now = this.audioContext.currentTime;
            const adjustedGain = 0.15 * this.sfxVolume; // Apply volume multiplier
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedGain, now + 0.001); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08); // Quick decay
            
            oscillator.start(now);
            oscillator.stop(now + 0.08); // Short duration (~80ms)
        } catch (e) {
            // Silently fail if audio playback fails
        }
    }

    playHapticSound(type = 'click') {
        // Lazy initialization of audio context (must be created after user interaction)
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // Audio context not supported or not available
                return;
            }
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            // Try to resume, but don't wait - let it resume on next user interaction
            this.audioContext.resume().catch(() => {
                // Silently fail if resume fails
            });
            // Don't proceed if context is still suspended (requires user gesture)
            return;
        }
        
        // Only play if context is running (user has interacted)
        if (this.audioContext.state !== 'running') {
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different sound types for different interactions
            let frequency, duration, gain;
            switch (type) {
                case 'click':
                    // Soft click sound for buttons
                    frequency = 400;
                    duration = 0.05;
                    gain = 0.1;
                    break;
                case 'select':
                    // Slightly higher for dropdowns/selects
                    frequency = 500;
                    duration = 0.06;
                    gain = 0.12;
                    break;
                case 'color':
                    // Mid-range for color pickers
                    frequency = 450;
                    duration = 0.05;
                    gain = 0.1;
                    break;
                default:
                    frequency = 400;
                    duration = 0.05;
                    gain = 0.1;
            }
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const now = this.audioContext.currentTime;
            const adjustedGain = gain * this.sfxVolume; // Apply volume multiplier
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedGain, now + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            // Silently fail if audio playback fails
        }
    }
    
    playHapticSoundAtVolume(type = 'click', volumeOverride) {
        // Lazy initialization of audio context (must be created after user interaction)
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // Audio context not supported or not available
                return;
            }
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            // Try to resume, but don't wait - let it resume on next user interaction
            this.audioContext.resume().catch(() => {
                // Silently fail if resume fails
            });
            // Don't proceed if context is still suspended (requires user gesture)
            return;
        }
        
        // Only play if context is running (user has interacted)
        if (this.audioContext.state !== 'running') {
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different sound types for different interactions
            let frequency, duration, gain;
            switch (type) {
                case 'click':
                    // Soft click sound for buttons
                    frequency = 400;
                    duration = 0.05;
                    gain = 0.1;
                    break;
                case 'select':
                    // Slightly higher for dropdowns/selects
                    frequency = 500;
                    duration = 0.06;
                    gain = 0.12;
                    break;
                case 'color':
                    // Mid-range for color pickers
                    frequency = 450;
                    duration = 0.05;
                    gain = 0.1;
                    break;
                default:
                    frequency = 400;
                    duration = 0.05;
                    gain = 0.1;
            }
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const now = this.audioContext.currentTime;
            // Use volumeOverride instead of this.sfxVolume for preview
            const adjustedGain = gain * (volumeOverride !== undefined ? volumeOverride : this.sfxVolume);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedGain, now + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            // Silently fail if audio playback fails
        }
    }
    
    playSynthSound(opacity) {
        // Safety check
        if (opacity === undefined || opacity === null || isNaN(opacity)) {
            return;
        }
        
        // Lazy initialization of audio context (must be created after user interaction)
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // Audio context not supported or not available
                return;
            }
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            // Try to resume, but don't wait - let it resume on next user interaction
            this.audioContext.resume().catch(() => {
                // Silently fail if resume fails
            });
            // Don't proceed if context is still suspended (requires user gesture)
            return;
        }
        
        // Only play if context is running (user has interacted)
        if (this.audioContext.state !== 'running') {
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Elegant sound: frequency varies smoothly with opacity (300-600 Hz range)
            // Higher opacity = higher pitch, but in a more refined range
            const frequency = 300 + (opacity * 300); // 300Hz at 0%, 600Hz at 100%
            
            // Use a sine wave for a smooth, elegant tone
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            // Smooth, elegant envelope: gentle attack and release
            const now = this.audioContext.currentTime;
            const duration = 0.12; // Slightly longer for elegance
            const gain = 0.15 * this.sfxVolume; // Match volume with other sliders
            
            // Smooth attack and release curves
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(gain, now + 0.02); // Gentle attack
            gainNode.gain.setValueAtTime(gain, now + 0.06); // Sustain
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Smooth release
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            // Silently fail if audio playback fails
        }
    }

    // Helper function to handle slider tick detection and sound
    handleSliderTick(sliderElement, currentValue) {
        const step = parseFloat(sliderElement.step) || 1;
        const sliderId = sliderElement.id;
        const previousValue = this.sliderPreviousValues.get(sliderId);
        
        // Initialize if first time
        if (previousValue === undefined) {
            this.sliderPreviousValues.set(sliderId, currentValue);
            return;
        }
        
        // Calculate step boundaries
        const previousStep = Math.round(previousValue / step);
        const currentStep = Math.round(currentValue / step);
        
        // Play sound if crossed a step boundary with unique pitch for this slider
        if (previousStep !== currentStep) {
            const pitch = this.sliderPitches.get(sliderId) || 1000; // Default to 1000Hz if not found
            this.playTickSound(pitch);
        }
        
        // Update previous value
        this.sliderPreviousValues.set(sliderId, currentValue);
    }

    setupSliderMinMaxClick(sliderElement, minElement, maxElement) {
        if (!sliderElement || !minElement || !maxElement) return;
        
        const minValue = parseFloat(sliderElement.min);
        const maxValue = parseFloat(sliderElement.max);
        
        // Click on min value to snap to minimum
        minElement.addEventListener('click', () => {
            this.playHapticSound('click');
            sliderElement.value = minValue;
            // Trigger input event to fire all existing handlers
            sliderElement.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        // Click on max value to snap to maximum
        maxElement.addEventListener('click', () => {
            this.playHapticSound('click');
            sliderElement.value = maxValue;
            // Trigger input event to fire all existing handlers
            sliderElement.dispatchEvent(new Event('input', { bubbles: true }));
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
            // Use camera.worldToScreen() to properly account for zoom
            const screenPos = camera.worldToScreen(effect.x, effect.y);
            const screenX = screenPos.x;
            const screenY = screenPos.y;
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
            // Follow mode - character follows mouse
            if (this.followMode) {
                const mousePos = this.input.getMouseWorldPosition();
                // Only follow if mouse has moved over canvas
                // If mouse hasn't moved yet, use character position to prevent freezing
                if (!this.input.mouseHasMoved) {
                    const charPos = this.character.getPosition();
                    this.input.mouseWorldPos = { x: charPos.x, y: charPos.y };
                    this.character.setTarget(charPos.x, charPos.y);
                } else {
                    this.character.setTarget(mousePos.x, mousePos.y);
                }
            } else {
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
        }

        // Update character
        this.character.update();

        // Update camera
        // On mobile, always center character. On desktop, use deadzone
        if (this.input.isTouchDevice) {
            // Mobile: center character (no deadzone)
            this.camera.follow(this.character, false);
        } else {
            // Desktop: use deadzone (character can move in center, camera moves when near edges)
            // Deadzone is 60% of screen width and height
            const deadzoneWidth = this.camera.width * 0.6;
            const deadzoneHeight = this.camera.height * 0.6;
            this.camera.follow(this.character, true, deadzoneWidth, deadzoneHeight);
        }

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

        // Track maximum proximity value for background dimming
        let maxProximity = 0;
        
        // Cache projects array to avoid repeated getProjects() calls
        const projects = this.world.getProjects();

        // Handle activate all stars animation
        if (this.starsActivationAnimating) {
            const elapsed = Date.now() - this.starsActivationStartTime;
            const progress = Math.min(elapsed / this.starsActivationDuration, 1.0);
            
            // Ease-out cubic easing: 1 - (1-t)^3
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const targetValue = this.allStarsActivated ? 1.0 : 0.0;
            
            projects.forEach(project => {
                const startValue = this.starsActivationStartValues.get(project) || 0;
                project.proximityValue = startValue + (targetValue - startValue) * easedProgress;
            });
            
            // Animation complete
            if (progress >= 1.0) {
                this.starsActivationAnimating = false;
                this.starsActivationStartValues.clear();
                // Ensure final values are set
                if (this.allStarsActivated) {
                    projects.forEach(project => {
                        project.proximityValue = 1.0;
                    });
                }
            }
        }

        // Sporadic pulse system - one star pulses at a time for up to 3 seconds
        const now = Date.now();
        
        if (this.sporadicPulseActive && this.sporadicPulseProject) {
            // Check if pulse duration has elapsed
            const elapsed = now - this.sporadicPulseStartTime;
            if (elapsed >= this.sporadicPulseDuration) {
                // Pulse complete, reset star and schedule next pulse
                this.sporadicPulseProject.proximityValue = 0;
                this.sporadicPulseActive = false;
                this.sporadicPulseProject = null;
                // Schedule next pulse in 5-30 seconds
                this.sporadicPulseInterval = 5000 + Math.random() * 25000; // 5-30 seconds
                this.sporadicPulseNextTime = now + this.sporadicPulseInterval;
            } else {
                // Pulse is active, animate proximityValue with smooth sine wave
                // Pulse goes from 0 -> 1 -> 0 over the duration
                const progress = elapsed / this.sporadicPulseDuration;
                // Use sine wave for smooth pulse: sin(0) = 0, sin(π/2) = 1, sin(π) = 0
                const pulseValue = Math.sin(progress * Math.PI);
                this.sporadicPulseProject.proximityValue = pulseValue;
            }
        } else if (!this.sporadicPulseActive && projects.length > 0) {
            // No pulse active, check if it's time to start a new one
            if (this.sporadicPulseNextTime === null || now >= this.sporadicPulseNextTime) {
                // Time to start a new pulse
                // Randomly select a star that's not currently being interacted with
                const availableProjects = projects.filter(p => {
                    const distance = p.distanceTo(charPos.x, charPos.y);
                    // Only pulse stars that are far from the character (not in boundary)
                    return distance >= p.boundaryRadius;
                });
                
                if (availableProjects.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableProjects.length);
                    this.sporadicPulseProject = availableProjects[randomIndex];
                    this.sporadicPulseStartTime = now;
                    this.sporadicPulseDuration = 1000 + Math.random() * 2000; // 1-3 seconds
                    this.sporadicPulseActive = true;
                } else {
                    // No available stars, schedule next check in 5 seconds
                    this.sporadicPulseNextTime = now + 5000;
                }
            }
        }
        
        projects.forEach(project => {
            const distance = project.distanceTo(charPos.x, charPos.y);
            const isNearby = distance < 150;
            const isInBoundary = distance < project.boundaryRadius;
            
            // Skip normal update if this star is currently being sporadically pulsed
            if (this.sporadicPulseActive && this.sporadicPulseProject === project) {
                // If character enters boundary, cancel the pulse and use normal interaction
                if (isInBoundary) {
                    // Cancel sporadic pulse
                    this.sporadicPulseActive = false;
                    this.sporadicPulseProject = null;
                    // Use normal update
                    const forceActive = this.allStarsActivated && !this.starsActivationAnimating;
                    project.update(isNearby, distance, forceActive);
                } else {
                    // Star is being pulsed and character is far, skip normal update to preserve pulse value
                    // Still update hover scale and other non-proximity effects
                    const targetScale = isNearby ? 1.1 : 1;
                    project.hoverScale += (targetScale - project.hoverScale) * 0.2;
                }
            } else {
                // Only use forceActive if not animating (during animation, we manually set proximityValue)
                const forceActive = this.allStarsActivated && !this.starsActivationAnimating;
                project.update(isNearby, distance, forceActive);
            }
            
            // Update max proximity for background dimming (use proximityValue which tracks boundary entry)
            // proximityValue is 1 when on star, 0 when outside boundary
            // We want to dim when inside boundary, so we use a value based on boundary distance
            if (isInBoundary) {
                // Calculate proximity within boundary (0 at edge, 1 at center/on star)
                const boundaryProximity = Math.max(0, 1 - (distance / project.boundaryRadius));
                maxProximity = Math.max(maxProximity, boundaryProximity);
            }

            // Track boundary state transitions - trigger message when entering boundary
            const wasInBoundary = this.projectBoundaryStates.get(project) || false;
            this.projectBoundaryStates.set(project, isInBoundary);
            
            // Update panel when entering star boundary (whether panel is open or closed)
            if (isInBoundary && !wasInBoundary) {
                // Update current star
                this.currentStar = project;
                
                // Update star name in title bar
                this.updateStarNameDisplay(project);
                
                const starControlsPanel = document.getElementById('star-controls-panel');
                const starSelector = document.getElementById('star-selector');
                const starIndex = projects.indexOf(project);
                
                // Update star selector to match the star being entered
                if (starSelector && starIndex !== -1) {
                    starSelector.value = starIndex.toString();
                    // Update save button state after programmatic selector change
                    if (this.updateSaveButtonState) {
                        this.updateSaveButtonState();
                    }
                }
                
                // Update all controls to match the star's current values
                if (this.updateControlsFromProject) {
                    this.updateControlsFromProject(project);
                }
            }
            
            // Clear current star when leaving boundary
            if (!isInBoundary && wasInBoundary && this.currentStar === project) {
                this.currentStar = null;
                // Clear star name in title bar
                const starNameElement = document.getElementById('current-star-name');
                if (starNameElement) {
                    starNameElement.textContent = '';
                }
            }
            
            // Auto-close removed - panel stays open once opened
            
            // If character just entered the boundary (transitioned from outside to inside)
            if (isInBoundary && !wasInBoundary) {
                // Check cooldown - only trigger message if 15 seconds have passed since last message
                const lastMessageTime = this.projectMessageCooldowns.get(project) || 0;
                const currentTime = Date.now();
                const cooldownDuration = 15000; // 15 seconds
                
                if (currentTime - lastMessageTime >= cooldownDuration) {
                    // Update cooldown timer
                    this.projectMessageCooldowns.set(project, currentTime);
                    
                    // Force a comment when entering project boundary
                    // Don't await - let it run asynchronously
                    this.guide.generateEntryComment(project, charPos).then(comment => {
                        if (comment) {
                            this.showThoughtBubble(comment, 5000);
                        }
                    }).catch(error => {
                        console.error('Error generating entry comment:', error);
                        // Don't let errors freeze the game
                    });
                }
            }

            // Enter/Spacebar interaction with stars is disabled - keys are cleared to prevent any interactions
            if (isNearby) {
                // Immediately clear Enter and Spacebar keys when near a star to prevent modal popup
                this.input.keys[' '] = false;
                this.input.keys['enter'] = false;
                this.input.keys['Enter'] = false;
                this.input.keys['Space'] = false;
            }
        });
        
        // Update maxProximityValue for background dimming
        this.maxProximityValue = maxProximity;

        // Occasional contextual comments - reduced frequency for performance
        if (nearbyProjects.length > 0) {
            // Reduce frequency slightly to improve performance
            if (Math.random() < 0.005) { // ~1 every 3-4 seconds when near projects
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
        // Hide nametags on mobile
        const renderNametags = !this.input.isTouchDevice;
        // #region agent log
        if (!this._renderLogged) {
            const canvas = this.world.getCanvas();
            fetch('http://127.0.0.1:7242/ingest/f54f7081-85c5-46b3-9791-73f1ba1b818e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:4206',message:'render entry',data:{isTouchDevice:this.input.isTouchDevice,canvasWidth:canvas.width,canvasHeight:canvas.height,projectsCount:this.world.projects.length,characterX:this.character.x,characterY:this.character.y,characterSpriteLoaded:this.character.spriteLoaded},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            this._renderLogged = true;
        }
        // #endregion
        // Pass currentStar to show modify text in nameplate when in boundary
        this.world.render(this.camera, this.character, this.maxProximityValue, true, true, null, null, renderNametags, this.currentStar);
        // Render click effects on top
        const ctx = this.world.getCanvas().getContext('2d');
        this.renderClickEffects(ctx, this.camera);
    }

    gameLoop(timestamp = 0) {
        if (!this.isRunning) return;

        // Initialize lastFrameTime on first call if not set - ensure first frame always renders
        const isFirstFrame = this.lastFrameTime === 0;
        if (isFirstFrame) {
            // Force first frame to render by setting lastFrameTime to a value that ensures deltaTime >= frameInterval
            this.lastFrameTime = timestamp > 0 ? timestamp - this.frameInterval : 0;
        }

        const deltaTime = timestamp - this.lastFrameTime;
        const shouldRender = isFirstFrame || deltaTime >= this.frameInterval;
        
        // Only update/render if enough time has passed (frame rate limiting) OR if it's the first frame
        if (shouldRender) {
            this.update();
            this.render();
            this.lastFrameTime = timestamp > 0 ? timestamp : performance.now();
        }
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    start() {
        this.isRunning = true;
        this.lastFrameTime = 0; // Will be initialized in gameLoop
        requestAnimationFrame((ts) => this.gameLoop(ts));
        
        // Wait a bit for character to settle into position, then show welcome message
        setTimeout(() => {
            // Show welcome message
            this.showThoughtBubble("Welcome! I'm The Guide. Click on me to chat.", 5000);
        }, 1500);
    }
}
