# Color Palette

This document catalogs all colors used throughout the portfolio playground. All colors are defined as CSS custom properties (variables) in `styles/main.css` for easy reference and maintenance.

## Primary Colors

### Black & White
- **`--color-black`** `#000000` - Primary text, borders, buttons
- **`--color-white`** `#ffffff` - Backgrounds, text on dark
- **`--color-dark-text`** `#1a1a1a` - Dark text variant

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

## Shadow & Overlay Colors

### Shadows
- **`--color-shadow-light`** `rgba(0, 0, 0, 0.1)` - Light shadows
- **`--color-shadow-medium`** `rgba(0, 0, 0, 0.15)` - Medium shadows
- **`--color-shadow-dark`** `rgba(0, 0, 0, 0.2)` - Dark shadows
- **`--color-shadow-darker`** `rgba(0, 0, 0, 0.3)` - Darker shadows

### Overlays
- **`--color-overlay-light`** `rgba(0, 0, 0, 0.08)` - Very light overlay
- **`--color-overlay-medium`** `rgba(0, 0, 0, 0.1)` - Medium overlay
- **`--color-overlay-dark`** `rgba(0, 0, 0, 0.5)` - Dark overlay (modals)

### Grid
- **`--color-grid-line`** `rgba(0, 0, 0, 0.03)` - Grid lines

### Character Shadow
- **`--color-character-shadow`** `rgba(0, 0, 0, 0.2)` - Character shadow

### Project Shadow
- **`--color-project-shadow`** `rgba(0, 0, 0, 0.15)` - Project shadow

## Usage Examples

### In CSS
```css
.my-element {
    background: var(--color-white);
    border: 3px solid var(--color-black);
    color: var(--color-dark-text);
    box-shadow: 4px 4px 0 var(--color-shadow-medium);
}
```

### In JavaScript (Canvas)
```javascript
ctx.fillStyle = '#1a1f2e'; // Use hex directly for canvas
// Or convert from CSS variable if needed
```

## Color Relationships

### Text Hierarchy
- Primary: `--color-black`
- Secondary: `--color-gray-600`
- Tertiary: `--color-gray-700`
- On Dark: `--color-white`

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
