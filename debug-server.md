# Server Debugging Steps

## Step 1: Verify Server is Actually Running

In your PowerShell window, you should see:
```
Serving HTTP on 127.0.0.1 port 8000 (http://127.0.0.1:8000/) ...
```

If you see errors, note them down.

## Step 2: Test Basic Server Access

Try accessing these URLs in your browser:
1. `http://127.0.0.1:8000/test-server.html` (simple test file)
2. `http://localhost:8000/test-server.html`
3. `http://127.0.0.1:8000/` (should show directory listing or index.html)

## Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to access the site
4. Look for any error messages
5. Share any errors you see

## Step 4: Check Network Tab

1. In DevTools, go to Network tab
2. Try to access the site
3. Look for the request to `127.0.0.1:8000`
4. What status code does it show? (200, 404, ERR_EMPTY_RESPONSE, etc.)

## Step 5: Try Different Port

If port 8000 is blocked, try:
```powershell
python -m http.server 8080
```
Then access: `http://127.0.0.1:8080`

## Step 6: Check Firewall

Windows Firewall might be blocking. Try:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Check if Python is allowed

## Step 7: Alternative - Use Live Server Extension

If Python server doesn't work:
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. This usually works better than Python's http.server
