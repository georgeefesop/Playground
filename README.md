# George Efesopoulos - Portfolio Playground

An interactive portfolio experience where visitors explore a 2D world, guided by an AI character called "The Guide."

## Features

- **Interactive 2D World**: Navigate through a minimalist top-down environment
- **The Guide**: An AI character powered by Claude that provides contextual commentary and conversation
- **Project Showcases**: Interactive project displays that visitors can explore
- **Multi-platform Controls**:
  - Desktop: WASD/Arrow keys + mouse click
  - Mobile: Virtual joystick + tap to move
  - Keyboard navigation support
- **AI Chat Interface**: Direct conversation with The Guide about projects and work

## Quick Start

### Option 1: Simple HTTP Server (Python)
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000

### Option 2: Simple HTTP Server (Node.js)
```bash
npx serve .
```

### Option 3: Live Server (VS Code)
Install the "Live Server" extension and click "Go Live"

## Project Structure

```
/
├── index.html              # Main HTML file
├── styles/
│   └── main.css           # Styling
├── js/
│   ├── main.js            # Entry point
│   ├── Game.js            # Game loop and coordination
│   ├── World.js           # World rendering and management
│   ├── Character.js       # The Guide character
│   ├── Camera.js          # Camera follow system
│   ├── Input.js           # Keyboard, mouse, touch controls
│   ├── Guide.js           # AI dialogue system
│   └── Project.js         # Project showcase items
└── README.md
```

## Customization

### Adding Projects

Edit `js/Game.js` in the `setupProjects()` method:

```javascript
const newProject = new Project(x, y, {
    label: 'Project Name',
    shape: 'circle', // or 'square', 'portal'
    color: '#6366f1',
    size: 80,
    modal: '<h2>Project Title</h2><p>Description...</p>'
});

this.world.addProject(newProject);
```

### Connecting Real Claude API

Currently using mock responses. To connect real Claude API:

1. Create a backend API endpoint (never expose API keys in frontend!)
2. Update `js/Guide.js` - uncomment the production API call method
3. Implement `/api/chat` endpoint on your backend

## Technologies

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas
- CSS3 Animations
- Claude API (for AI dialogue)

## Browser Support

Modern browsers with ES6 module support:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## Next Steps

- [ ] Connect real Claude API backend
- [ ] Add more projects
- [ ] Implement voice input (Web Speech API)
- [ ] Add project filtering/navigation
- [ ] Performance optimizations
- [ ] Analytics integration

## License

© 2024 George Efesopoulos. All rights reserved. 
