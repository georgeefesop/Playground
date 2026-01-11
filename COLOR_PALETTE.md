# Color Palette

This document catalogs all colors used throughout the portfolio playground. All colors are defined as CSS custom properties (variables) in `styles/main.css` for easy reference and maintenance.

## Design Philosophy

A cohesive, restricted palette built around **off-white** and **midnight dark** as the foundation. The palette uses 5 core colors with multiple shades of each, creating a harmonious and sophisticated visual system.

## Core Palette

### 1. Midnight (Dark Base)
The deep, rich dark foundation of the palette.

- **`--color-midnight-900`** `#0a0a0f` - Deepest midnight (space backgrounds, darkest areas)
- **`--color-midnight-800`** `#1a1f2e` - Dark midnight (project bases, dark elements)
- **`--color-midnight-700`** `#2a2f3e` - Medium midnight (hover states, depth)
- **`--color-midnight-600`** `#3a3f4e` - Lighter midnight (borders, accents)

### 2. Off-White (Light Base)
Warm, soft whites that provide contrast and breathing room.

- **`--color-offwhite-50`** `#ffffff` - Pure white (text on dark, highlights)
- **`--color-offwhite-100`** `#fafafa` - Lightest off-white (main backgrounds)
- **`--color-offwhite-200`** `#f5f5f0` - Soft off-white (cards, panels)
- **`--color-offwhite-300`** `#f0f0eb` - Warmer off-white (inputs, subtle backgrounds)

### 3. Cool Blue (Accent)
A cool, calming blue that complements the midnight base.

- **`--color-blue-500`** `#4a90e2` - Primary blue (main accent, interactive elements)
- **`--color-blue-400`** `#6ba3e8` - Lighter blue (hover states, highlights)
- **`--color-blue-600`** `#3a7bc8` - Darker blue (pressed states, depth)
- **`--color-blue-300`** `#8cb5ed` - Light blue (subtle accents, glows)

### 4. Warm Amber (Accent)
A warm, energetic accent that provides contrast to the cool palette.

- **`--color-amber-500`** `#ff8844` - Primary amber (warm accents, highlights)
- **`--color-amber-400`** `#ffa066` - Lighter amber (hover states, glows)
- **`--color-amber-600`** `#e66a22` - Darker amber (pressed states, depth)
- **`--color-amber-300`** `#ffb888` - Light amber (subtle accents)

### 5. Neutral Gray (Utility)
Versatile grays for text, borders, and subtle elements.

- **`--color-gray-900`** `#1a1a1a` - Darkest gray (primary text)
- **`--color-gray-700`** `#4a4a4a` - Medium-dark gray (secondary text)
- **`--color-gray-500`** `#7a7a7a` - Medium gray (tertiary text, borders)
- **`--color-gray-300`** `#b0b0b0` - Light gray (subtle borders, disabled states)
- **`--color-gray-100`** `#e0e0e0` - Lightest gray (dividers, subtle backgrounds)

## Semantic Color Mappings

### Text Colors
- **Primary Text**: `--color-gray-900` (on light backgrounds)
- **Primary Text (Dark)**: `--color-offwhite-50` (on dark backgrounds)
- **Secondary Text**: `--color-gray-700`
- **Tertiary Text**: `--color-gray-500`
- **Accent Text**: `--color-blue-500` or `--color-amber-500`

### Background Colors
- **Main Background**: `--color-offwhite-100`
- **Card/Panel Background**: `--color-offwhite-200`
- **Space/Dark Background**: `--color-midnight-900`
- **Input Background**: `--color-offwhite-300`
- **Hover Background**: `--color-gray-100`

### Interactive Elements
- **Primary Button**: `--color-midnight-800` with `--color-offwhite-50` text
- **Primary Button Hover**: `--color-midnight-700`
- **Accent Button**: `--color-blue-500` with `--color-offwhite-50` text
- **Accent Button Hover**: `--color-blue-400`
- **Warm Accent**: `--color-amber-500` (for special highlights)

### Borders
- **Primary Border**: `--color-midnight-800` or `--color-gray-900`
- **Subtle Border**: `--color-gray-300`
- **Accent Border**: `--color-blue-500` or `--color-amber-500`

## Shadow & Overlay System

### Unified Shadow Scale
A consolidated shadow system using size-based naming (xs to 2xl):

- **`--color-shadow-xs`** `rgba(10, 10, 15, 0.03)` - Grid lines (lightest)
- **`--color-shadow-sm`** `rgba(10, 10, 15, 0.08)` - Very light overlays (joystick base)
- **`--color-shadow-md`** `rgba(10, 10, 15, 0.1)` - Light shadows/overlays (input focus, selection)
- **`--color-shadow-lg`** `rgba(10, 10, 15, 0.15)` - Medium shadows (project shadows, speech bubbles)
- **`--color-shadow-xl`** `rgba(10, 10, 15, 0.2)` - Dark shadows (character shadows, most UI elements)
- **`--color-shadow-2xl`** `rgba(10, 10, 15, 0.3)` - Darker shadows (hover states, buttons)
- **`--color-overlay`** `rgba(10, 10, 15, 0.5)` - Modal backdrops (semantically different from shadows)

## Project/Star Colors

### Experiment Alpha (Dark Star)
- **`--color-star-alpha-base`** `--color-midnight-800` - Dark midnight base
- **`--color-star-alpha-glow`** `--color-amber-500` - Warm amber glow when near

### Experiment Beta (Light Star)
- **`--color-star-beta-base`** `--color-offwhite-200` - Soft off-white base
- **`--color-star-beta-glow`** `--color-blue-500` - Cool blue glow when near

## Usage Examples

### In CSS
```css
.my-element {
    background: var(--color-offwhite-200);
    border: 3px solid var(--color-midnight-800);
    color: var(--color-gray-900);
    box-shadow: 4px 4px 0 var(--color-shadow-lg);
}

.button-primary {
    background: var(--color-midnight-800);
    color: var(--color-offwhite-50);
}

.button-primary:hover {
    background: var(--color-midnight-700);
    box-shadow: 2px 2px 0 var(--color-shadow-2xl);
}

.accent-element {
    background: var(--color-blue-500);
    color: var(--color-offwhite-50);
}
```

### In JavaScript (Canvas)
```javascript
// Get CSS variable value
const getCSSVar = (varName, fallback) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

ctx.fillStyle = getCSSVar('--color-shadow-xl', 'rgba(10, 10, 15, 0.2)');
ctx.strokeStyle = getCSSVar('--color-midnight-800', '#1a1f2e');
```

## Color Relationships

### Visual Hierarchy
- **Darkest**: Midnight-900 (deepest backgrounds)
- **Dark**: Midnight-800 (primary dark elements)
- **Medium**: Midnight-700, Gray-700 (interactive states, secondary text)
- **Light**: Offwhite-200, Gray-100 (cards, subtle backgrounds)
- **Lightest**: Offwhite-50 (text on dark, highlights)

### Contrast Ratios
- Midnight-900 on Offwhite-50: High contrast (WCAG AAA)
- Midnight-800 on Offwhite-200: High contrast (WCAG AA)
- Gray-900 on Offwhite-100: High contrast (WCAG AAA)
- Blue-500 on Offwhite-50: High contrast (WCAG AA)

## Design Principles

1. **Cohesion**: All colors work harmoniously together, built from the midnight/off-white foundation
2. **Restriction**: Limited palette (5 core colors) ensures visual consistency
3. **Shades**: Multiple shades of each color provide flexibility without expanding the palette
4. **Semantic Naming**: Color names reflect their purpose and relationship to the base palette
5. **Maintainability**: Single source of truth in CSS custom properties
6. **Accessibility**: High contrast ratios for text and interactive elements
