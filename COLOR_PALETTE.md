# Color Palette

This document catalogs all colors used throughout the portfolio playground. All colors are defined as CSS custom properties (variables) in `styles/main.css` for easy reference and maintenance.

## Primary Colors

### Black & White
- **`--color-black`** `#000000` - Primary text, borders, buttons
- **`--color-white`** `#ffffff` - Backgrounds, text on dark
- **`--color-dark-text`** `#1a1a1a` - Dark text variant (used in speech bubbles)

### Grays
- **`--color-gray-100`** `#fafafa` - Body background
- **`--color-gray-200`** `#f8f8f8` - Grid background
- **`--color-gray-300`** `#f0f0f0` - Light backgrounds, inputs
- **`--color-gray-400`** `#e0e0e0` - Hover states
- **`--color-gray-500`** `#333333` - Dark gray, button hover
- **`--color-gray-600`** `#666666` - Secondary text
- **`--color-gray-700`** `#999999` - Tertiary text

## Background Colors

### Space Background
- **`--color-space-bg`** `#0a0a0f` - Dark space background fallback

## Project/Star Colors

### Experiment Alpha (Dark Star)
- **`--color-star-alpha-base`** `#1a1f2e` - Dark midnight bluish charcoal grey (starting color)
- **`--color-star-alpha-glow`** `#ff4444` - Glowing red (when near)

### Experiment Beta (Light Star)
- **`--color-star-beta-base`** `#f5f5f5` - Almost white (starting color)
- **`--color-star-beta-glow`** `#ff8844` - Glowing orange (when near)

## Accent Colors

- **`--color-accent-indigo`** `#6366f1` - Character fallback, hover glow effects

## Shadow & Overlay System

### Unified Shadow Scale
A consolidated shadow system using size-based naming (xs to 2xl):

- **`--color-shadow-xs`** `rgba(0, 0, 0, 0.03)` - Grid lines (lightest)
- **`--color-shadow-sm`** `rgba(0, 0, 0, 0.08)` - Very light overlays (joystick base)
- **`--color-shadow-md`** `rgba(0, 0, 0, 0.1)` - Light shadows/overlays (input focus, selection)
- **`--color-shadow-lg`** `rgba(0, 0, 0, 0.15)` - Medium shadows (project shadows, speech bubbles)
- **`--color-shadow-xl`** `rgba(0, 0, 0, 0.2)` - Dark shadows (character shadows, most UI elements)
- **`--color-shadow-2xl`** `rgba(0, 0, 0, 0.3)` - Darker shadows (hover states, buttons)

### Overlays
- **`--color-overlay`** `rgba(0, 0, 0, 0.5)` - Modal backdrops (semantically different from shadows)

## Usage Examples

### In CSS
```css
.my-element {
    background: var(--color-white);
    border: 3px solid var(--color-black);
    color: var(--color-dark-text);
    box-shadow: 4px 4px 0 var(--color-shadow-lg);
}

.button-hover {
    background: var(--color-gray-500);
    box-shadow: 2px 2px 0 var(--color-shadow-2xl);
}
```

### In JavaScript (Canvas)
```javascript
// Get CSS variable value
const getCSSVar = (varName, fallback) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

ctx.fillStyle = getCSSVar('--color-shadow-xl', 'rgba(0, 0, 0, 0.2)');
ctx.strokeStyle = getCSSVar('--color-shadow-xs', 'rgba(0, 0, 0, 0.03)');
```

## Color Relationships

### Text Hierarchy
- Primary: `--color-black`
- Secondary: `--color-gray-600`
- Tertiary: `--color-gray-700`
- On Dark: `--color-white`
- Subtle: `--color-dark-text` (for softer contrast)

### Background Hierarchy
- Main: `--color-gray-100`
- Grid: `--color-gray-200`
- Space: `--color-space-bg`
- Cards/Panels: `--color-white`
- Inputs: `--color-gray-300`

### Interactive States
- Default: `--color-black`
- Hover: `--color-gray-500`
- Active: `--color-black` (with transform/shadow change)

### Shadow Usage Guide
- **xs** (0.03): Grid lines, very subtle elements
- **sm** (0.08): Light overlays, joystick backgrounds
- **md** (0.1): Input focus states, selection backgrounds
- **lg** (0.15): Project shadows, speech bubbles
- **xl** (0.2): Character shadows, most UI element shadows
- **2xl** (0.3): Hover states, button pressed effects
- **overlay** (0.5): Modal backdrops, full-screen overlays

## Design Principles

1. **Consistency**: All shadows use the same black base with varying opacity
2. **Semantic Naming**: Size-based naming (xs-2xl) makes it easy to choose the right shadow
3. **Minimal Palette**: Reduced from 9 shadow/overlay variables to 7, eliminating duplicates
4. **Maintainability**: Single source of truth in CSS custom properties
