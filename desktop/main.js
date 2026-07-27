const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");
const handler = require("serve-handler");

const isDev = !app.isPackaged;
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000;

let backendProcess = null;
let staticServer = null;
let mainWindow = null;

function getBackendExePath() {
  return path.join(process.resourcesPath, "backend", "backend.exe");
}

function getFrontendOutPath() {
  // In dev, load straight from the frontend's exported "out" folder.
  // In a packaged app, it's copied into resources by electron-builder
  // (see the "extraResources" entry in package.json).
  return isDev
    ? path.join(__dirname, "..", "frontend", "out")
    : path.join(process.resourcesPath, "frontend", "out");
}

function startBackend() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // Dev mode assumes you already have `uvicorn main:app --reload`
      // running separately (see backend README). We don't spawn it here
      // so you keep hot-reload while developing.
      console.log("[dev] Skipping backend spawn - start it manually with uvicorn.");
      resolve();
      return;
    }

    const exePath = getBackendExePath();
    if (!fs.existsSync(exePath)) {
      reject(new Error(`Backend executable not found at:\n${exePath}\n\nDid you run build_backend.bat and copy the output before packaging?`));
      return;
    }

    backendProcess = spawn(exePath, [], {
      cwd: path.dirname(exePath), // so backend.exe finds its sibling .env
      windowsHide: true,
    });

    backendProcess.stdout.on("data", (d) => console.log(`[backend] ${d}`));
    backendProcess.stderr.on("data", (d) => console.error(`[backend] ${d}`));
    backendProcess.on("error", reject);

    resolve();
  });
}

function waitForBackend(retries = 40, delayMs = 500) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry(remaining);
        }
      });
      req.on("error", () => retry(remaining));
    };
    const retry = (remaining) => {
      if (remaining <= 0) {
        reject(new Error("Backend did not respond at /api/health in time."));
        return;
      }
      setTimeout(() => attempt(remaining - 1), delayMs);
    };
    attempt(retries);
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const outDir = getFrontendOutPath();
    if (!fs.existsSync(outDir)) {
      reject(new Error(`Frontend build not found at:\n${outDir}\n\nDid you run "npm run build" in frontend/ first?`));
      return;
    }

    staticServer = http.createServer((req, res) => handler(req, res, { public: outDir }));
    staticServer.listen(FRONTEND_PORT, "127.0.0.1", () => resolve());
    staticServer.on("error", reject);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  await mainWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}`);
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    await waitForBackend();
    await startStaticServer();
    await createWindow();
  } catch (err) {
    dialog.showErrorBox("Startup error", String(err && err.message ? err.message : err));
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (_) {}
  }
  if (staticServer) {
    try {
      staticServer.close();
    } catch (_) {}
  }
  if (process.platform !== "darwin") app.quit();
});
