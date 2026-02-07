# How to run AmanQ

## Quick start (app + controller)

**Terminal 1 – controller (API):**
```bash
npm run dev:controller
```
Leave this running. You should see: `Controller listening on http://localhost:5000` (or 5001, 5002 if 5000 is in use). If you see a different port, set `VITE_CONTROLLER_URL=http://localhost:THAT_PORT` before starting the web app.

**Terminal 2 – web app:**
```bash
npm run dev:web
```
Then open the URL shown (e.g. **http://localhost:5173**) in your browser.

- **Home:** Click "Get Started" or "Workspace" or "Dashboard".
- **Dashboard:** Shows "Controller offline" until the controller is running. When the controller is running, you’ll see live data and speed gauges.
- **Workspace:** Virtual desktop with File Explorer and Editor.

## Optional – server nodes (S1 / S2)

To use server desktops and full demo flows:

**Terminal 3:**
```bash
npm run dev:server
```
Run once for one node, or run twice on different ports (e.g. 5001 and 5002) for S1 and S2.

## Troubleshooting

- **Blank or “Failed to load app”:** Check the browser console (F12) for errors. Ensure you ran `npm install` at the repo root.
- **“Controller offline” on dashboard:** Start the controller in a separate terminal with `npm run dev:controller`.
- **Port in use:** Change the port in the app’s `vite.config` or the controller’s `PORT` env, or stop the process using the port.
