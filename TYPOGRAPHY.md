# Typography Guidelines

## Two Design Systems

This portfolio uses **two distinct visual styles** that coexist:

### 1. **Apple UI Style** (Modern, Clean)
For UI chrome, menus, and overlay elements

### 2. **Pixel Style** (Retro, Game-like)
For character interactions, speech bubbles, and game world elements

---

## Apple UI Style

**Font Stack:**
```css
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, 'Helvetica Neue', Arial, sans-serif
```

**Text Rendering:**
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Sizing & Weight:**
- **H1/Hero:** 2rem (32px), 700 weight, -0.02em letter-spacing
- **H2:** 1.5rem (24px), 700 weight, -0.02em letter-spacing
- **H3:** 1.25rem (20px), 600 weight, -0.01em letter-spacing
- **Body:** 1rem (16px), 400-500 weight, normal spacing
- **Small:** 0.875rem (14px), 500 weight
- **Tiny:** 0.75rem (12px), 500 weight

**Line Height:**
- Headings: 1.2
- Body: 1.5-1.6

**Colors:**
- Primary text: `#000` (pure black)
- Secondary text: `#666` (60% gray)
- Tertiary text: `#999` (40% gray)

---

## Pixel Style

**Font Stack:**
```css
'Press Start 2P', 'Courier New', monospace
/* Or for more readable pixel: */
'Silkscreen', 'Courier New', monospace
```

**For now (without web fonts):**
```css
'Courier New', 'Consolas', monospace
font-weight: 700; /* Bold for pixelated look */
letter-spacing: 0.5px; /* Slightly spaced */
```

**Text Rendering:**
```css
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
text-rendering: geometricPrecision;
```

**Sizing:**
- **Speech bubbles:** 0.875rem (14px), 700 weight
- **UI labels:** 0.75rem (12px), 700 weight
- **Buttons:** 1rem (16px), 700 weight

**Line Height:**
- All pixel text: 1.4 (tighter for retro feel)

**Visual Style:**
- **Borders:** 3px solid `#000`
- **Shadows:** Hard drop shadows (4px offset, no blur)
- **Corners:** Small radius (4px) or sharp (0px)
- **Animations:** Use `steps()` instead of ease
- **Colors:** Solid, no gradients within pixel UI

---

## Application Rules

### Apple UI Used For:
- Tutorial modal
- Settings/options panels
- Navigation menus (if added)
- Form inputs and buttons (modern style)
- Project description modals

### Pixel Style Used For:
- Character speech bubbles
- Character interaction menus
- In-world UI elements
- Game-like notifications
- Score/stats displays (if added)

### Mixed:
- Project labels: Apple style (clean, readable)
- Thought bubbles: Pixel style (matches character)
- Message prompts: **Should be pixel style**

---

## Implementation Examples

### Apple Button:
```css
.btn-apple {
    font: 600 1rem -apple-system, sans-serif;
    padding: 0.75rem 1.5rem;
    background: #000;
    color: white;
    border: none;
    border-radius: 10px;
    letter-spacing: -0.01em;
}
```

### Pixel Button:
```css
.btn-pixel {
    font: 700 1rem 'Courier New', monospace;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #000;
    border: 3px solid #000;
    border-radius: 0;
    letter-spacing: 0.5px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
    text-rendering: geometricPrecision;
}
```

### Speech Bubble (Pixel):
```css
.speech-bubble {
    font: 700 0.875rem 'Courier New', monospace;
    padding: 0.75rem 1rem;
    background: white;
    border: 3px solid #000;
    border-radius: 4px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
    letter-spacing: 0.5px;
    line-height: 1.4;
    image-rendering: crisp-edges;
}
```

---

## Accessibility

- **Minimum font size:** 14px (0.875rem) for body text
- **Minimum contrast:** 4.5:1 for body, 3:1 for large text
- **Line length:** Max 65-75 characters
- **Touch targets:** Minimum 44x44px

---

## Don'ts

❌ Don't mix pixel fonts in Apple UI sections
❌ Don't use smooth shadows on pixel elements
❌ Don't use ease/cubic-bezier animations on pixel UI
❌ Don't use gradients within pixel-styled elements
❌ Don't make pixel text too small (<12px)
❌ Don't use thin font weights in pixel style
