export class Project {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.size = config.size || 80;
        this.shape = config.shape || 'circle';
        this.color = config.color || '#1a1a1a';
        this.colorNear = config.colorNear || this.color;
        this.label = config.label || 'Project';
        this.boundaryRadius = config.boundaryRadius || 250; // Boundary for triggers

        // Animation
        this.hoverScale = 1;
        this.proximityValue = 0; // 0 = far, 1 = near
        this.pulseOffset = Math.random() * Math.PI * 2;

        // Spoke properties (configurable)
        this.spokeCount = 150; // Max limit is 150
        this.spokeBaseWidth1 = 2.8;
        this.spokeBaseWidth2 = 0.8;
        this.spokeMinLength = 0.20;
        this.spokeMaxLength = 1.50;
        this.spokeStartRadius = 0.35;
        this.spokeWaviness1 = 0.6;
        this.spokeWaviness2 = 0.3;
        this.randomnessRatio = 1.0;
        this.spokeRotationOffset = 0.5; // Offset in spoke fractions (0.5 = half a spoke) - fixed value
        this.spokeTipRatio = 0.1; // Tip width ratio (0.05 to 0.5) - how narrow the tip is compared to base
        this.glowIntensity = 1.0; // 0.0 to 10.0, default 1.0
        this.glowColor = config.glowColor || config.colorBase1 || '#FFFFFF'; // Glow color, default to colorBase1 or white
        this.glowSize = config.glowSize || 1.0; // Glow size multiplier, default 1.0
        this.glowOpacity = config.glowOpacity || 1.0; // Glow opacity, 0.0 to 1.0, default 1.0
        this.animationSpeed = config.animationSpeed || 1.0; // Animation speed multiplier, 0.0 to 5.0, default 1.0
        this.nucleusSize = config.nucleusSize || 0.425; // Nucleus size multiplier (0.0 to 1.0), default 0.425
        this.nucleusBlur = config.nucleusBlur || 8; // Nucleus blur amount, default 8

        // Gradient colors for each layer (base to tip)
        this.colorBase1 = config.colorBase1 || '#ff8844'; // Default amber base
        this.colorTip1 = config.colorTip1 || '#ffd4aa';   // Default amber tip
        this.colorBase2 = config.colorBase2 || '#4a90e2'; // Default blue base
        this.colorTip2 = config.colorTip2 || '#aaddff';   // Default blue tip
        
        // Opacity for each gradient color (0.0 to 1.0)
        this.colorBase1Opacity = config.colorBase1Opacity !== undefined ? config.colorBase1Opacity : 1.0;
        this.colorTip1Opacity = config.colorTip1Opacity !== undefined ? config.colorTip1Opacity : 1.0;
        this.colorBase2Opacity = config.colorBase2Opacity !== undefined ? config.colorBase2Opacity : 1.0;
        this.colorTip2Opacity = config.colorTip2Opacity !== undefined ? config.colorTip2Opacity : 1.0;
    }

    updateSpokeProperties(count, baseWidth1, baseWidth2, minLength, maxLength, startRadius, waviness1, waviness2, randomnessRatio, rotationOffset) {
        this.spokeCount = count;
        this.spokeBaseWidth1 = baseWidth1;
        this.spokeBaseWidth2 = baseWidth2;
        this.spokeMinLength = minLength;
        this.spokeMaxLength = maxLength;
        this.spokeStartRadius = startRadius;
        this.spokeWaviness1 = waviness1 !== undefined ? waviness1 : this.spokeWaviness1;
        this.spokeWaviness2 = waviness2 !== undefined ? waviness2 : this.spokeWaviness2;
        this.randomnessRatio = randomnessRatio !== undefined ? randomnessRatio : this.randomnessRatio;
        this.spokeRotationOffset = rotationOffset !== undefined ? rotationOffset : this.spokeRotationOffset;
    }

    updateLayerColors(layer, baseColor, tipColor) {
        if (layer === 1) {
            this.colorBase1 = baseColor;
            this.colorTip1 = tipColor;
        } else if (layer === 2) {
            this.colorBase2 = baseColor;
            this.colorTip2 = tipColor;
        }
    }
    
    updateLayerColorOpacity(layer, baseOpacity, tipOpacity) {
        if (layer === 1) {
            this.colorBase1Opacity = baseOpacity;
            this.colorTip1Opacity = tipOpacity;
        } else if (layer === 2) {
            this.colorBase2Opacity = baseOpacity;
            this.colorTip2Opacity = tipOpacity;
        }
    }

    updateGlowIntensity(intensity) {
        this.glowIntensity = intensity;
    }

    updateGlowColor(color) {
        this.glowColor = color;
    }

    updateGlowSize(size) {
        this.glowSize = size;
    }

    updateGlowOpacity(opacity) {
        this.glowOpacity = opacity;
    }

    updateAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    updateSpokeTipRatio(ratio) {
        this.spokeTipRatio = ratio;
    }

    updateNucleusSize(size) {
        this.nucleusSize = size;
    }

    updateNucleusBlur(blur) {
        this.nucleusBlur = blur;
    }

    update(isNearby, distance, forceActive = false) {
        // If force active, set proximity to maximum and skip normal calculation
        if (forceActive) {
            this.proximityValue = 1.0;
            // Still update hover scale
            const targetScale = isNearby ? 1.1 : 1;
            this.hoverScale += (targetScale - this.hoverScale) * 0.1;
            return;
        }

        // Hover effect when character is nearby - smoother interpolation
        const targetScale = isNearby ? 1.1 : 1;
        this.hoverScale += (targetScale - this.hoverScale) * 0.2; // Increased from 0.1 to 0.2 for smoother, faster response

        // Calculate proximity value for color gradient (0-1)
        // Check if character is standing on the star itself (middle circle), not the outer boundary
        const isOnStar = distance < this.size;
        
        // Color change when stepping onto the star - full color when on star, base color when off
        const targetProximity = isOnStar ? 1 : 0;

        // Slower transition with easing curve (starts slow, speeds up)
        // Calculate distance to target (0 = at target, 1 = far away)
        const distanceToTarget = Math.abs(targetProximity - this.proximityValue);
        
        // Apply ease-out cubic curve: starts slow, accelerates as it approaches target
        // When far (distanceToTarget = 1), use slower speed
        // When close (distanceToTarget = 0), use faster speed
        const baseSpeed = 0.15; // Slower base speed
        const easedFactor = 1 - Math.pow(1 - distanceToTarget, 3); // Ease-out cubic: 1 - (1-t)^3
        const easedSpeed = baseSpeed * (0.2 + easedFactor * 0.8); // Range from 0.2x to 1.0x base speed
        
        // Update proximity with eased speed
        this.proximityValue += (targetProximity - this.proximityValue) * easedSpeed;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    getCurrentColor() {
        return this.interpolateColor(this.color, this.colorNear, this.proximityValue);
    }

    render(ctx, camera, renderNametag = true, showModify = false, uiVisible = true) {
        // Projects are rendered inside the world transform context
        // So we use world coordinates directly
        // Check if on screen using world coordinates
        // Account for maximum spoke length, not just star size
        const maxSpokeLength = this.size * this.spokeMaxLength;
        const maxRenderRadius = Math.max(this.size, maxSpokeLength);
        const screenPos = camera.worldToScreen(this.x, this.y);
        if (screenPos.x < -maxRenderRadius || screenPos.x > camera.width + maxRenderRadius ||
            screenPos.y < -maxRenderRadius || screenPos.y > camera.height + maxRenderRadius) {
            return;
        }

        // Cache time-based calculations once per frame
        const now = Date.now();
        const timeBase = now * 0.001 * this.animationSpeed;
        const timeBase2 = now * 0.002 * this.animationSpeed;
        const timeBase3 = now * 0.0001 * this.animationSpeed;
        const timeBase4 = now * 0.00015 * this.animationSpeed;
        const timeBase5 = now * 0.00003 * this.animationSpeed;
        const timeBase6 = now * 0.0008 * this.animationSpeed;
        const timeBase7 = now * 0.003 * this.animationSpeed;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.hoverScale, this.hoverScale);
        ctx.imageSmoothingEnabled = false; // Pixel art style
        
        // Add shadow to entire star
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Subtle pulse animation
        const pulse = Math.sin(timeBase + this.pulseOffset) * 0.05 + 1;

        // Get CSS custom property values (cache getComputedStyle call)
        const docStyle = document.documentElement.style;
        const getCSSVar = (varName, fallback) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
        };

        // Get current color based on proximity (for glow effects)
        const currentColor = this.getCurrentColor();
        const colorRgb = this.hexToRgb(currentColor);
        // For glow effects, use glowColor property
        // Ensure glowColor is valid hex color, fallback to white if not
        const glowColorHex = this.glowColor && this.glowColor.startsWith('#') ? this.glowColor : '#FFFFFF';
        const glowColorRgb = this.hexToRgb(glowColorHex);

        // Pulsating glow effect - separate from star pulse
        const glowPulse = Math.sin(timeBase2 + this.pulseOffset) * 0.3 + 0.7; // Pulse between 0.4 and 1.0

        // ===== LAYERED GLOW SYSTEM =====
        // Inner circles (corona and core) are always visible, outer halo only when nearby
        if (glowColorRgb) {
            // 2. Corona - medium-sized, medium opacity glow - uses glowColor
            const coronaSizeVariation = Math.sin(timeBase6 + this.pulseOffset * 2) * 0.15 + 1; // ±15% size variation
            const coronaRadius = this.size * 0.35 * coronaSizeVariation * this.glowSize; // Apply glowSize multiplier
            const coronaGradient = ctx.createRadialGradient(0, 0, this.size * 0.2, 0, 0, coronaRadius);
            const coronaIntensity = 0.6 * glowPulse * this.glowOpacity; // Apply glowOpacity multiplier
            coronaGradient.addColorStop(0, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coronaIntensity * 0.8})`);
            coronaGradient.addColorStop(0.4, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coronaIntensity * 0.5})`);
            coronaGradient.addColorStop(0.8, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coronaIntensity * 0.2})`);
            coronaGradient.addColorStop(1, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, 0)`);
            // Preserve main shadow, add glow blur
            const savedShadowBlur2 = ctx.shadowBlur;
            const savedShadowColor2 = ctx.shadowColor;
            const savedShadowOffsetX2 = ctx.shadowOffsetX;
            const savedShadowOffsetY2 = ctx.shadowOffsetY;
            ctx.shadowBlur = 6;
            ctx.shadowColor = `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coronaIntensity * 0.5})`;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = coronaGradient;
            ctx.beginPath();
            ctx.arc(0, 0, coronaRadius, 0, Math.PI * 2);
            ctx.fill();
            // Restore main shadow
            ctx.shadowBlur = savedShadowBlur2;
            ctx.shadowColor = savedShadowColor2;
            ctx.shadowOffsetX = savedShadowOffsetX2;
            ctx.shadowOffsetY = savedShadowOffsetY2;

            // 3. Core - small, intense glow at center - uses glowColor
            const coreSizeVariation = Math.sin(timeBase + this.pulseOffset * 3) * 0.2 + 1; // ±20% size variation, different phase
            const coreRadius = this.size * 0.12 * coreSizeVariation * this.glowSize; // Apply glowSize multiplier
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
            const coreIntensity = 0.9 * glowPulse * this.glowIntensity * this.glowOpacity; // Apply glowOpacity multiplier
            coreGradient.addColorStop(0, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coreIntensity})`);
            coreGradient.addColorStop(0.5, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coreIntensity * 0.6})`);
            coreGradient.addColorStop(1, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, 0)`);
            // Preserve main shadow, add glow blur
            const savedShadowBlur3 = ctx.shadowBlur;
            const savedShadowColor3 = ctx.shadowColor;
            const savedShadowOffsetX3 = ctx.shadowOffsetX;
            const savedShadowOffsetY3 = ctx.shadowOffsetY;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${coreIntensity * 0.7})`;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
            ctx.fill();
            // Restore main shadow
            ctx.shadowBlur = savedShadowBlur3;
            ctx.shadowColor = savedShadowColor3;
            ctx.shadowOffsetX = savedShadowOffsetX3;
            ctx.shadowOffsetY = savedShadowOffsetY3;
        }
        
        if (this.proximityValue > 0.1 && glowColorRgb) {
            // 1. Outer Halo - largest, faintest glow - uses glowColor and glowSize
            const outerHaloRadius = this.boundaryRadius * this.proximityValue * 0.5 * this.glowSize; // Apply glowSize multiplier
            const outerHaloGradient = ctx.createRadialGradient(0, 0, this.size * 0.5, 0, 0, outerHaloRadius);
            const outerHaloIntensity = this.proximityValue * glowPulse * 0.2 * this.glowIntensity * this.glowOpacity; // Apply glowOpacity multiplier
            outerHaloGradient.addColorStop(0, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${outerHaloIntensity * 0.4})`);
            outerHaloGradient.addColorStop(0.3, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${outerHaloIntensity * 0.2})`);
            outerHaloGradient.addColorStop(0.7, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${outerHaloIntensity * 0.1})`);
            outerHaloGradient.addColorStop(1, `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, 0)`);
            // Preserve main shadow, add glow blur
            const savedShadowBlur = ctx.shadowBlur;
            const savedShadowColor = ctx.shadowColor;
            const savedShadowOffsetX = ctx.shadowOffsetX;
            const savedShadowOffsetY = ctx.shadowOffsetY;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${glowColorRgb.r}, ${glowColorRgb.g}, ${glowColorRgb.b}, ${outerHaloIntensity * 0.3})`;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = outerHaloGradient;
            ctx.beginPath();
            ctx.arc(0, 0, outerHaloRadius, 0, Math.PI * 2);
            ctx.fill();
            // Restore main shadow
            ctx.shadowBlur = savedShadowBlur;
            ctx.shadowColor = savedShadowColor;
            ctx.shadowOffsetX = savedShadowOffsetX;
            ctx.shadowOffsetY = savedShadowOffsetY;
        }

        // ===== STAR RAYS/POINTS =====
        if (this.proximityValue > 0.1) {
            const rotation = timeBase5 + this.pulseOffset; // Very slow rotation to prevent jolting
            const numRays = this.spokeCount;
            const rayBaseLength = this.size * this.spokeMinLength;
            const rayMaxLength = this.size * this.spokeMaxLength;
            const baseRayLength = rayBaseLength + (rayMaxLength - rayBaseLength) * this.proximityValue;
            
            // Calculate base width - allow for overlap between spokes
            const baseWidth = (Math.PI * 2 * this.size * this.spokeStartRadius) / numRays * this.spokeBaseWidth1;
            const tipWidth = baseWidth * this.spokeTipRatio; // Narrow tip (configurable pointyness)
            
            // Pre-calculate angle step
            const angleStep = Math.PI * 2 / numRays;
            
            // Cache RGB values
            const base1Rgb = this.hexToRgb(this.colorBase1);
            const tip1Rgb = this.hexToRgb(this.colorTip1);
            const rayOpacity = this.proximityValue * 1.0; // Full opacity multiplier for maximum intensity
            const startRadius = this.size * this.spokeStartRadius;
            
            ctx.save();
            ctx.rotate(rotation);
            
            for (let i = 0; i < numRays; i++) {
                const angle = angleStep * i;
                ctx.save();
                ctx.rotate(angle);
                
                // Random length variation for each ray - more random, less sinusoidal
                // Use time-based variation for smooth random-like behavior
                const seed = (i * 137.5 + timeBase3);
                // Use sine with large period for smooth pseudo-random variation
                const randomValue = (Math.sin(seed) + Math.sin(seed * 2.3) + Math.sin(seed * 3.7)) / 3; // Combine multiple frequencies for random-like but smooth
                // Small sine wave component for subtle rhythm
                const sineComponent = Math.sin(timeBase2 + this.pulseOffset + i * 0.5) * 0.35; // ±35% sine wave variation
                // Combine random and sine wave using configurable ratio
                const lengthVariation = (randomValue * this.randomnessRatio + sineComponent * (1 - this.randomnessRatio)) * 0.35; // ±35% total variation
                const rayLength = baseRayLength * (1 + lengthVariation);
                
                // Create gradient from base to tip using user-selected colors with opacity
                const rayGradient = ctx.createLinearGradient(startRadius, 0, rayLength, 0);
                if (base1Rgb && tip1Rgb) {
                    // When opacity is 100% (1.0 or very close), use it directly. For lower values, multiply by rayOpacity for proximity-based fading
                    const baseOpacity = this.colorBase1Opacity >= 0.99 ? 1.0 : rayOpacity * this.colorBase1Opacity;
                    const tipOpacity = this.colorTip1Opacity >= 0.99 ? 0.5 : rayOpacity * 0.5 * this.colorTip1Opacity;
                    rayGradient.addColorStop(0, `rgba(${base1Rgb.r}, ${base1Rgb.g}, ${base1Rgb.b}, ${baseOpacity})`); // Base color with opacity
                    rayGradient.addColorStop(1, `rgba(${tip1Rgb.r}, ${tip1Rgb.g}, ${tip1Rgb.b}, ${tipOpacity})`); // Tip color with opacity and fade
                    
                    // Apply blur effect to rays - use base color for shadow
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = `rgba(${base1Rgb.r}, ${base1Rgb.g}, ${base1Rgb.b}, ${baseOpacity})`;
                } else {
                    // Fallback if color conversion fails
                    rayGradient.addColorStop(0, `rgba(255, 140, 0, ${rayOpacity})`);
                    rayGradient.addColorStop(1, `rgba(255, 0, 0, ${rayOpacity * 0.3})`);
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = `rgba(255, 140, 0, ${rayOpacity})`;
                }
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                ctx.fillStyle = rayGradient;
                ctx.beginPath();
                
                // Draw triangle with optional waviness: wide base at start (star edge), narrow tip at end
                if (this.spokeWaviness1 > 0) {
                    // Draw wavy path using quadratic curves
                    // Reduce segments for better performance (10 instead of 20)
                    const segments = 10;
                    const length = rayLength - startRadius;
                    const waveScale = this.spokeWaviness1 * baseWidth;
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
                    // Draw straight triangle: wide base at start (star edge), narrow tip at end
                    ctx.moveTo(startRadius, -baseWidth / 2); // Top of base
                    ctx.lineTo(rayLength, -tipWidth / 2); // Top of tip
                    ctx.lineTo(rayLength, tipWidth / 2); // Bottom of tip
                    ctx.lineTo(startRadius, baseWidth / 2); // Bottom of base
                }
                ctx.closePath();
                ctx.fill();
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                ctx.restore();
            }
            
            ctx.restore();
        }

        // ===== SECOND LAYER OF SPOKES (Lighter, Brighter, Thinner) =====
        if (this.proximityValue > 0.1) {
            const numRays = this.spokeCount;
            const rotationOffset = (Math.PI * 2 / numRays) * this.spokeRotationOffset; // Configurable offset in radians
            const rotation = timeBase5 + this.pulseOffset + rotationOffset; // Very slow rotation to prevent jolting
            const rayBaseLength = this.size * this.spokeMinLength;
            const rayMaxLength = this.size * this.spokeMaxLength;
            const baseRayLength = rayBaseLength + (rayMaxLength - rayBaseLength) * this.proximityValue;
            
            // Thinner base width for second layer but still with overlap
            const baseWidth = (Math.PI * 2 * this.size * this.spokeStartRadius) / numRays * this.spokeBaseWidth2;
            const tipWidth = baseWidth * this.spokeTipRatio; // Narrow tip (configurable pointyness)
            
            // Pre-calculate angle step
            const angleStep = Math.PI * 2 / numRays;
            
            // Cache RGB values and opacity
            const base2Rgb = this.hexToRgb(this.colorBase2);
            const tip2Rgb = this.hexToRgb(this.colorTip2);
            const rayOpacity = this.proximityValue * 1.0; // Full opacity for brightness
            const startRadius = this.size * this.spokeStartRadius;
            
            ctx.save();
            ctx.rotate(rotation);
            
            for (let i = 0; i < numRays; i++) {
                const angle = angleStep * i;
                ctx.save();
                ctx.rotate(angle);
                
                // Different length variation for second layer - much more distinct from first layer
                const seed2 = (i * 211.3 + timeBase4 * 1.5); // Very different seed multiplier and time scaling
                const randomValue2 = (Math.sin(seed2) + Math.sin(seed2 * 3.1) + Math.sin(seed2 * 4.5)) / 3; // Very different frequency multipliers
                const sineComponent2 = Math.sin(timeBase7 + this.pulseOffset * 2.1 + i * 1.2) * 0.4; // Different speed, phase, and variation amount
                const lengthVariation2 = (randomValue2 * this.randomnessRatio + sineComponent2 * (1 - this.randomnessRatio)) * 0.4; // Use configurable ratio
                const rayLength = baseRayLength * (1 + lengthVariation2);
                
                // Create gradient from base to tip using user-selected colors with opacity
                const rayGradient = ctx.createLinearGradient(startRadius, 0, rayLength, 0);
                if (base2Rgb && tip2Rgb) {
                    // When opacity is 100% (1.0 or very close), use it directly. For lower values, multiply by rayOpacity for proximity-based fading
                    const baseOpacity = this.colorBase2Opacity >= 0.99 ? 1.0 : rayOpacity * this.colorBase2Opacity;
                    const tipOpacity = this.colorTip2Opacity >= 0.99 ? 0.5 : rayOpacity * 0.5 * this.colorTip2Opacity;
                    rayGradient.addColorStop(0, `rgba(${base2Rgb.r}, ${base2Rgb.g}, ${base2Rgb.b}, ${baseOpacity})`); // Base color with opacity
                    rayGradient.addColorStop(1, `rgba(${tip2Rgb.r}, ${tip2Rgb.g}, ${tip2Rgb.b}, ${tipOpacity})`); // Tip color with opacity and fade
                    
                    // Lighter blur for second layer
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = `rgba(${base2Rgb.r}, ${base2Rgb.g}, ${base2Rgb.b}, ${baseOpacity * 0.5})`;
                } else {
                    // Fallback if color conversion fails
                    rayGradient.addColorStop(0, `rgba(74, 144, 226, ${rayOpacity})`);
                    rayGradient.addColorStop(1, `rgba(170, 221, 255, ${rayOpacity * 0.3})`);
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = `rgba(74, 144, 226, ${rayOpacity * 0.5})`;
                }
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                ctx.fillStyle = rayGradient;
                ctx.beginPath();
                
                // Draw triangle with optional waviness for second layer
                if (this.spokeWaviness2 > 0) {
                    // Draw wavy path using quadratic curves
                    // Reduce segments for better performance (10 instead of 20)
                    const segments = 10;
                    const length = rayLength - startRadius;
                    const waveScale = this.spokeWaviness2 * baseWidth;
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
                    // Draw thinner triangle
                    ctx.moveTo(startRadius, -baseWidth / 2);
                    ctx.lineTo(rayLength, -tipWidth / 2);
                    ctx.lineTo(rayLength, tipWidth / 2);
                    ctx.lineTo(startRadius, baseWidth / 2);
                }
                ctx.closePath();
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
            }
            
            ctx.restore();
        }

        // ===== 3D SPHERE WITH LIGHTING =====
        // 3D sphere with highlight and shadow - always off-white
        const highlightX = -this.size * 0.2;
        const highlightY = -this.size * 0.2;
        const sphereRadius = this.size * this.nucleusSize; // Use configurable nucleus size
        
        // Create 3D sphere gradient with offset highlight - off-white color
        const offWhiteRgb = { r: 245, g: 245, b: 240 }; // Off-white color (matches --color-offwhite-200)
        const sphereGradient = ctx.createRadialGradient(
            highlightX, highlightY, 0,
            0, 0, sphereRadius
        );

        // Bright highlight at top-left (light source) - lighter off-white
        const highlightBrightness = 20;
        sphereGradient.addColorStop(0, `rgba(${Math.min(255, offWhiteRgb.r + highlightBrightness)}, ${Math.min(255, offWhiteRgb.g + highlightBrightness)}, ${Math.min(255, offWhiteRgb.b + highlightBrightness)}, 1)`);
        // Mid-tone - off-white
        sphereGradient.addColorStop(0.4, `rgba(${offWhiteRgb.r}, ${offWhiteRgb.g}, ${offWhiteRgb.b}, 1)`);
        // Darker shadow at bottom-right - slightly darker off-white
        const shadowDarkness = 15;
        sphereGradient.addColorStop(0.8, `rgba(${Math.max(0, offWhiteRgb.r - shadowDarkness)}, ${Math.max(0, offWhiteRgb.g - shadowDarkness)}, ${Math.max(0, offWhiteRgb.b - shadowDarkness)}, 1)`);
        // Edge shadow - darker off-white
        sphereGradient.addColorStop(1, `rgba(${Math.max(0, offWhiteRgb.r - shadowDarkness * 1.5)}, ${Math.max(0, offWhiteRgb.g - shadowDarkness * 1.5)}, ${Math.max(0, offWhiteRgb.b - shadowDarkness * 1.5)}, 1)`);

        // Preserve main shadow, add glow blur - configurable blur for white sphere
        const savedShadowBlur4 = ctx.shadowBlur;
        const savedShadowColor4 = ctx.shadowColor;
        const savedShadowOffsetX4 = ctx.shadowOffsetX;
        const savedShadowOffsetY4 = ctx.shadowOffsetY;
        ctx.shadowBlur = this.nucleusBlur; // Use configurable nucleus blur
        ctx.shadowColor = `rgba(245, 245, 240, 0.8)`; // Off-white shadow color
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = sphereGradient;
        ctx.beginPath();
        ctx.arc(0, 0, sphereRadius, 0, Math.PI * 2);
        ctx.fill();
        // Restore main shadow
        ctx.shadowBlur = savedShadowBlur4;
        ctx.shadowColor = savedShadowColor4;
        ctx.shadowOffsetX = savedShadowOffsetX4;
        ctx.shadowOffsetY = savedShadowOffsetY4;

        // Glow effect when nearby
        if (this.proximityValue > 0.3) {
            // Preserve main shadow, add glow blur
            const savedShadowBlur5 = ctx.shadowBlur;
            const savedShadowColor5 = ctx.shadowColor;
            const savedShadowOffsetX5 = ctx.shadowOffsetX;
            const savedShadowOffsetY5 = ctx.shadowOffsetY;
            ctx.shadowBlur = 5;
            ctx.shadowColor = currentColor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = this.proximityValue * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, (this.size * 0.5 + 8) * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            // Restore main shadow
            ctx.shadowBlur = savedShadowBlur5;
            ctx.shadowColor = savedShadowColor5;
            ctx.shadowOffsetX = savedShadowOffsetX5;
            ctx.shadowOffsetY = savedShadowOffsetY5;
        }
        
        // Reset shadow after entire star is drawn
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.restore();

        // Boundary circle (drawn in world space, not scaled)
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.imageSmoothingEnabled = false;

        // Show boundary at 20% opacity with current color
        if (colorRgb) {
            ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.2)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line
            ctx.beginPath();
            ctx.arc(0, 0, this.boundaryRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
        }

        // Pixel art style nametag (only render if renderNametag is true)
        if (renderNametag) {
            ctx.restore();
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.imageSmoothingEnabled = false;
            
            // Save current alpha and apply visibility to nameplate only (star remains visible)
            const savedAlpha = ctx.globalAlpha;
            if (!uiVisible) {
                ctx.globalAlpha = 0;
            }

            // Calculate nametag dimensions
            ctx.font = 'bold 14px "Courier New", "Consolas", monospace';
            const textMetrics = ctx.measureText(this.label);
            const textWidth = textMetrics.width;
            const textHeight = 16;
            const padding = 8;
            
            // Calculate modify text width if needed
            let modifyTextWidth = 0;
            let modifyTextHeight = 0;
            if (showModify) {
                ctx.font = 'normal 12px "Courier New", "Consolas", monospace';
                modifyTextWidth = ctx.measureText('modify').width;
                modifyTextHeight = 12; // Font size
            }
            
            // Use the wider of the two texts for tag width
            const tagWidth = Math.max(textWidth, modifyTextWidth) + padding * 2;
            const lineSpacing = showModify ? 4 : 0;
            const tagHeight = textHeight + (showModify ? modifyTextHeight + lineSpacing : 0) + padding * 2;
            const tagY = this.size * 0.5 + 20;

            // Draw nametag background - dark theme to match message bubbles
            const midnight800 = getCSSVar('--color-midnight-800', '#1a1f2e');
            const offwhite200 = getCSSVar('--color-offwhite-200', '#f5f5f0');
            
            // Get star's base color for border
            const starBaseRgb = this.hexToRgb(this.colorBase1);
            
            // Outer shadow/glow - use star's base color
            if (starBaseRgb) {
                ctx.shadowColor = `rgba(${starBaseRgb.r}, ${starBaseRgb.g}, ${starBaseRgb.b}, 0.3)`;
            } else {
                ctx.shadowColor = 'rgba(74, 144, 226, 0.3)'; // Fallback
            }
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Background with slight transparency
            ctx.fillStyle = 'rgba(26, 31, 46, 0.95)';
            ctx.fillRect(-tagWidth / 2, tagY, tagWidth, tagHeight);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
                // Draw nametag border (pixel style) - use star's base color
                const nameplateColorRgb = this.hexToRgb(this.colorBase1);
                if (nameplateColorRgb) {
                    ctx.strokeStyle = `rgb(${nameplateColorRgb.r}, ${nameplateColorRgb.g}, ${nameplateColorRgb.b})`;
                } else {
                    ctx.strokeStyle = getCSSVar('--color-blue-500', '#4a90e2'); // Fallback
                }
            ctx.lineWidth = 2;
            ctx.strokeRect(-tagWidth / 2, tagY, tagWidth, tagHeight);

            // Draw star name text - light color
            ctx.fillStyle = offwhite200;
            ctx.font = 'bold 14px "Courier New", "Consolas", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const nameY = showModify ? tagY + padding + textHeight / 2 : tagY + tagHeight / 2;
            ctx.fillText(this.label, 0, nameY);

            // Draw modify text if needed
            if (showModify) {
                ctx.font = 'normal 12px "Courier New", "Consolas", monospace';
                ctx.textBaseline = 'middle';
                const modifyY = tagY + padding + textHeight + lineSpacing + 6;
                
                // Store entire nameplate bounds for click detection (in world coordinates)
                this.nameplateBounds = {
                    centerX: this.x,
                    centerY: this.y + tagY + tagHeight / 2,
                    width: tagWidth,
                    height: tagHeight,
                    worldY: this.y + tagY
                };
                
                // Also store modify text bounds for reference
                this.modifyTextBounds = {
                    centerX: this.x,
                    centerY: this.y + modifyY,
                    width: modifyTextWidth,
                    height: modifyTextHeight + 4, // Add some padding for easier clicking
                    worldY: this.y + modifyY
                };
                
                // Draw underline
                const underlineY = modifyY + 6;
                ctx.strokeStyle = offwhite200;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-modifyTextWidth / 2, underlineY);
                ctx.lineTo(modifyTextWidth / 2, underlineY);
                ctx.stroke();
                
                // Draw modify text
                ctx.fillStyle = offwhite200;
                ctx.fillText('modify', 0, modifyY);
            } else {
                // Clear bounds when not showing modify
                this.nameplateBounds = null;
                this.modifyTextBounds = null;
            }

            ctx.restore();
            // Restore alpha after rendering nameplate
            ctx.globalAlpha = savedAlpha;
        }
    }

    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    containsModifyTextPoint(x, y) {
        // Check if point is within modify text bounds
        if (!this.modifyTextBounds) {
            return false;
        }
        
        const bounds = this.modifyTextBounds;
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;
        
        // Check if point is within the modify text rectangle
        return x >= bounds.centerX - halfWidth &&
               x <= bounds.centerX + halfWidth &&
               y >= bounds.worldY - halfHeight &&
               y <= bounds.worldY + halfHeight;
    }

    containsNameplatePoint(x, y) {
        // Check if point is within entire nameplate bounds
        if (!this.nameplateBounds) {
            return false;
        }
        
        const bounds = this.nameplateBounds;
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;
        
        // Check if point is within the nameplate rectangle
        return x >= bounds.centerX - halfWidth &&
               x <= bounds.centerX + halfWidth &&
               y >= bounds.worldY &&
               y <= bounds.worldY + bounds.height;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    interact() {
        // Handle project interaction - DISABLED: Star interactions are disabled
        // Interactions are disabled to prevent modal popups
        return;
        
        // Original code (disabled):
        // if (this.config.onClick) {
        //     this.config.onClick();
        // } else if (this.config.url) {
        //     window.open(this.config.url, '_blank');
        // } else if (this.config.modal) {
        //     // Show modal content
        //     this.showModal(this.config.modal);
        // }
    }

    showModal(content) {
        // Create a modal to display project content - Pixel style
        const modal = document.createElement('div');
        const getCSSVar = (varName, fallback) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
        };

        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${getCSSVar('--color-white', '#fff')};
            padding: 1.5rem;
            border-radius: 0;
            box-shadow: 6px 6px 0 ${getCSSVar('--color-shadow-xl', 'rgba(0,0,0,0.2)')};
            border: 3px solid ${getCSSVar('--color-black', '#000')};
            max-width: 500px;
            max-height: 80vh;
            overflow: auto;
            z-index: 1000;
            font-family: 'Courier New', 'Consolas', monospace;
            image-rendering: crisp-edges;
        `;
        modal.innerHTML = content + '<br><button onclick="this.parentElement.remove(); document.getElementById(\'modal-backdrop\').remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: ' + getCSSVar('--color-black', '#000') + '; color: ' + getCSSVar('--color-white', '#fff') + '; border: 2px solid ' + getCSSVar('--color-black', '#000') + '; border-radius: 0; cursor: pointer; font-family: \'Courier New\', \'Consolas\', monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem;">Close</button>';

        const backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${getCSSVar('--color-overlay', 'rgba(0,0,0,0.5)')};
            z-index: 999;
        `;
        backdrop.onclick = () => {
            modal.remove();
            backdrop.remove();
        };

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    }
}
