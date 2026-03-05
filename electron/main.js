'use strict';

const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const isPackaged = app.isPackaged;

// ---------------------------------------------------------------------------
// Update check via GitHub JSON API
//
// electron-updater's GitHub provider calls GET /releases (the HTML page) with
// Accept: application/json when it cannot resolve /releases/latest to a tag.
// GitHub returns 406 for that combination.  We bypass electron-updater
// entirely and hit api.github.com directly, which always returns JSON and
// never 406s on public repos.
// ---------------------------------------------------------------------------

function isNewerVersion(latest, current) {
  const a = latest.replace(/^v/i, '').split('.').map(Number);
  const b = current.replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

function fetchLatestRelease() {
  const https = require('https');
  const currentVersion = app.getVersion();
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://api.github.com/repos/Tri-Lumen/F1/releases/latest',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': `F1-Dashboard/${currentVersion}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 404) {
            resolve(null); // No releases published yet
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API returned ${res.statusCode}`));
            return;
          }
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Failed to parse release data from GitHub')); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Update check timed out')); });
  });
}

// In production the Next.js standalone build is placed in resources/app/.
// In development we run against the local .next/standalone build.
const serverRoot = isPackaged
  ? path.join(process.resourcesPath, 'app')
  : path.join(__dirname, '..', '.next', 'standalone');

const serverScript = path.join(serverRoot, 'server.js');

let nextServer = null;
let mainWindow = null;
let serverPort = null;

// ---------------------------------------------------------------------------
// Port finder
// ---------------------------------------------------------------------------

function findFreePort(start = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      if (start >= 3020) {
        reject(new Error('No free port found in range 3000-3020'));
      } else {
        resolve(findFreePort(start + 1));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Next.js server lifecycle
// ---------------------------------------------------------------------------

function startNextServer(port) {
  // Validate the standalone server script exists before spawning.
  const fs = require('fs');
  if (!fs.existsSync(serverScript)) {
    const msg = isPackaged
      ? `Bundled server not found at:\n${serverScript}`
      : `Run "npm run build" first.\n\nExpected:\n${serverScript}`;
    dialog.showErrorBox('F1 Dashboard — Startup Error', msg);
    app.quit();
    return;
  }

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    NEXT_TELEMETRY_DISABLED: '1',
    ELECTRON_RUN: '1',
    // When packaged, tell the Electron binary to behave as a plain Node.js
    // runtime so it can run the Next.js standalone server without needing a
    // separately-bundled node binary (which would be platform-specific and
    // would require shipping a large extra resource on every platform).
    ...(isPackaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
  };

  // In packaged mode use the Electron binary itself as the Node.js runtime
  // (works cross-platform via ELECTRON_RUN_AS_NODE).  In dev just use the
  // system `node` so the plain Next.js dev server keeps working.
  const nodeBin = isPackaged ? process.execPath : 'node';

  nextServer = spawn(nodeBin, [serverScript], {
    cwd: serverRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  nextServer.stdout.on('data', (d) => process.stdout.write(`[Next.js] ${d}`));
  nextServer.stderr.on('data', (d) => process.stderr.write(`[Next.js] ${d}`));

  nextServer.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[Next.js] process exited with code ${code} (signal: ${signal})`);
    }
    nextServer = null;
  });
}

function stopNextServer() {
  if (nextServer) {
    nextServer.kill('SIGTERM');
    nextServer = null;
  }
}

// ---------------------------------------------------------------------------
// Server readiness poll
// ---------------------------------------------------------------------------

function waitForServer(port, timeout = 30_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    function check() {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Next.js server did not respond within ${timeout / 1000}s`));
        } else {
          setTimeout(check, 300);
        }
      });
      req.setTimeout(500, () => { req.destroy(); });
    }
    check();
  });
}

// ---------------------------------------------------------------------------
// Application menu
// ---------------------------------------------------------------------------

function buildMenu(port) {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(process.env.NODE_ENV === 'development'
          ? [{ type: 'separator' }, { role: 'toggleDevTools' }]
          : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open in Browser',
          click() {
            shell.openExternal(`http://127.0.0.1:${port}`);
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates…',
          async click() {
            try {
              const release = await fetchLatestRelease();
              if (!release) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'F1 Dashboard is up to date',
                  message: 'No releases have been published yet.',
                });
                return;
              }
              const latestTag = release.tag_name;
              const currentVersion = app.getVersion();
              if (isNewerVersion(latestTag, currentVersion)) {
                const { response } = await dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Update Available',
                  message: `F1 Dashboard ${latestTag} is available`,
                  detail: `You are running v${currentVersion}. Click Download to open the releases page.`,
                  buttons: ['Download', 'Later'],
                  defaultId: 0,
                });
                if (response === 0) shell.openExternal(release.html_url);
              } else {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'F1 Dashboard is up to date',
                  message: `You are running the latest version (v${currentVersion}).`,
                });
              }
            } catch (err) {
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update Check Failed',
                message: err?.message ?? 'Failed to check for updates.',
              });
            }
          },
        },
        {
          label: 'About F1 Dashboard',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'F1 Dashboard',
              message: `F1 Dashboard\nVersion ${app.getVersion()}\n\nRunning on port ${port}`,
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

async function createWindow() {
  try {
    serverPort = await findFreePort(3000);
  } catch (err) {
    dialog.showErrorBox('F1 Dashboard — Startup Error', err.message);
    app.quit();
    return;
  }

  startNextServer(serverPort);

  // Show a simple loading window while the server warms up.
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 220,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  loadingWindow.loadURL(`data:text/html,
    <html>
    <head><style>
      body { margin:0; display:flex; flex-direction:column; align-items:center;
             justify-content:center; height:100vh; font-family:sans-serif;
             background:#1a1a2e; color:#e2e8f0; }
      h2   { font-size:1.4rem; margin-bottom:.5rem; }
      p    { font-size:.85rem; color:#94a3b8; }
    </style></head>
    <body>
      <h2>🏎️ F1 Dashboard</h2>
      <p>Starting server on port ${serverPort}…</p>
    </body>
    </html>`);

  try {
    await waitForServer(serverPort);
  } catch (err) {
    loadingWindow.close();
    dialog.showErrorBox(
      'F1 Dashboard — Startup Error',
      `The embedded server failed to start.\n\n${err.message}\n\nCheck that Node.js is installed and accessible.`
    );
    stopNextServer();
    app.quit();
    return;
  }

  loadingWindow.close();

  buildMenu(serverPort);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'F1 Dashboard',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Open external URLs (F1TV, etc.) in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('check-for-updates', async () => {
  try {
    const release = await fetchLatestRelease();
    if (!release) {
      return { triggered: true, hasUpdate: false, latestVersion: null, releaseUrl: null };
    }
    const latestTag = release.tag_name;
    const currentVersion = app.getVersion();
    const hasUpdate = isNewerVersion(latestTag, currentVersion);
    return { triggered: true, hasUpdate, latestVersion: latestTag, releaseUrl: release.html_url };
  } catch (err) {
    return { triggered: false, error: err?.message ?? 'Failed to check for updates.' };
  }
});

// ---------------------------------------------------------------------------
// App event handlers
// ---------------------------------------------------------------------------

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopNextServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopNextServer);

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
