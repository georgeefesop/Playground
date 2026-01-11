# How to Export Presets from Browser DevTools

Since the local server isn't connecting, you can export presets directly from browser DevTools:

## Method 1: Using Chrome/Edge DevTools

1. **Open Chrome/Edge**
2. **Press F12** to open DevTools
3. **Click the "Application" tab** (or "Storage" in Firefox)
4. **In the left sidebar**, expand "Local Storage"
5. **Click on your local site URL** (it might be `http://127.0.0.1:8000` or `http://localhost:8000` or `file:///...`)
6. **Find the key named `starPresets`** in the table on the right
7. **Double-click the value** (the JSON string) to select it
8. **Copy the entire value** (Ctrl+C)
9. **Paste it here** so I can add it to `data/default-presets.json`

## Method 2: Using Console (if you can access the site)

If you can get the site to load (even briefly):

1. Open the site in your browser
2. Press F12 to open console
3. Paste this command:
   ```javascript
   JSON.stringify(JSON.parse(localStorage.getItem('starPresets') || '[]'), null, 2)
   ```
4. Press Enter
5. Copy the output
6. Paste it here

## Method 3: Try accessing the server differently

Try these URLs in your browser:
- `http://localhost:8000`
- `http://127.0.0.1:8000/index.html`
- `http://localhost:8000/index.html`

If the server is running but not responding, try:
1. Stop the server (Ctrl+C in PowerShell)
2. Restart it: `python -m http.server 8000`
3. Try accessing again
