# Increase Opacity Maximum and Fix Star Jolting Issue

## Overview

This plan increases the maximum opacity for gradient colors (base and tip) beyond 100% to allow for more intense/brighter effects, and fixes the occasional jolting issue where stars appear to reset their animation state.

## Changes Required

### 1. Increase Maximum Opacity for Base and Tip Colors

**Files**: `index.html`, `js/Game.js`, `js/Project.js`

- Change opacity slider maximum from 100 to 200 (allowing up to 200% opacity)
- Update opacity value display and conversion logic
- Ensure opacity values above 1.0 are handled correctly in rendering (clamp to 1.0 in rgba but allow UI to show higher values)

**Implementation**:
- **HTML**: Update all 4 opacity sliders:
  - `layer1-base-opacity-slider`: Change `max="100"` to `max="200"`
  - `layer1-tip-opacity-slider`: Change `max="100"` to `max="200"`
  - `layer2-base-opacity-slider`: Change `max="100"` to `max="200"`
  - `layer2-tip-opacity-slider`: Change `max="100"` to `max="200"`
- **JS**: Update `getOpacity()` helper in `setupStarControlsPanel()`:
  - Change from `parseFloat(slider.value) / 100` to `parseFloat(slider.value) / 100` (still divide by 100, but slider goes 0-200)
  - This means opacity can be 0.0 to 2.0 (200% = 2.0)
- **JS**: Update opacity value display:
  - Change `Math.round(opacity * 100) + '%'` to `Math.round(parseFloat(slider.value)) + '%'` to show actual slider value
- **JS**: Update `updateControlsFromProject()`:
  - Change `Math.round(project.colorBase1Opacity * 100)` to `Math.round(project.colorBase1Opacity * 100)` but handle values > 1.0
  - If opacity > 1.0, set slider to `Math.round(project.colorBase1Opacity * 100)` (e.g., 1.5 = 150)
- **Project.js**: In rendering, clamp opacity to 1.0 max in rgba() calls:
  - Change `rgba(${r}, ${g}, ${b}, ${baseOpacity})` to `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, baseOpacity)})`
  - This allows UI to show >100% but rendering clamps to valid rgba range

### 2. Fix Star Jolting/State Reset Issue

**Files**: `js/Game.js`, `js/Project.js`

- The jolt is likely caused by `updateControlsFromProject()` being called during animation, which might trigger slider events that update the project mid-frame
- Add flag to prevent slider events from firing when programmatically updating controls
- Ensure animation state (pulseOffset, timeBase) is never reset
- Add smoothing to prevent sudden animationSpeed changes

**Implementation**:
- **JS**: Add `this.updatingControlsFromProject = false;` flag in Game constructor
- **JS**: In `updateControlsFromProject()`, set flag at start and clear at end:
  ```javascript
  this.updatingControlsFromProject = true;
  // ... update all controls ...
  this.updatingControlsFromProject = false;
  ```
- **JS**: In all slider/color picker event listeners, check flag:
  ```javascript
  if (this.updatingControlsFromProject) return; // Skip if programmatic update
  ```
- **JS**: In `updateControlsFromProject()`, update opacity sliders with flag check to prevent event firing
- **Project.js**: Ensure `pulseOffset` is never modified after construction (it's already set once, verify no code changes it)
- **Project.js**: Add smoothing to `animationSpeed` changes if they're causing jolts (interpolate instead of instant change)

## Implementation Notes

- Opacity values > 1.0 will be clamped to 1.0 in rgba() for valid rendering, but UI can show higher percentages
- The flag prevents event cascades when controls are updated programmatically
- Animation continuity is preserved by never resetting pulseOffset or timeBase values
- Smooth transitions prevent visual jolts when properties change

## Technical Considerations

- Opacity sliders should display correct percentage (e.g., 150% for value 150)
- Rendering must clamp opacity to 1.0 max in rgba() calls (browsers may handle >1.0 differently)
- Event listener flag prevents infinite loops or mid-frame updates
- Animation state preservation is critical for smooth visual continuity
