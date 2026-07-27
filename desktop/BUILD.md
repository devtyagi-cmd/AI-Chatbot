# Building the Windows desktop app (.exe)

This turns the web app into a standalone Windows app: an Electron window
that starts the FastAPI backend as a hidden background process and serves
the frontend as static files — no browser, no separate terminals needed
once it's built.

**Heads up:** this is a more advanced step than running the dev version.
The tricky part is usually PyInstaller freezing `pandas`/`duckdb` correctly
- if it fails, don't worry, just paste me the exact error and we'll fix it.

## 0. Do this first (one time)

Make sure the regular dev version already works for you (frontend +
backend running via `npm run dev` / `uvicorn`) before packaging it. If dev
mode doesn't work, packaging it won't work either.

## 1. Build the frontend as static files

```powershell
cd ai-data-chatbot\frontend
npm run build
```

This creates a `frontend\out\` folder full of static HTML/CSS/JS - check it
exists:
```powershell
dir out
```

## 2. Freeze the backend into backend.exe

```powershell
cd ..\backend
.venv\Scripts\Activate.ps1
build_backend.bat
```

This takes a minute or two. When it finishes, check:
```powershell
dir dist
```
You should see `backend.exe` in there.

**If this step fails:** copy me the full error text. The most common issue
is a missing hidden import — easy to add once we know which module it is.

**Make sure your `.env` file is filled in** (`backend\.env` with your real
`GEMINI_API_KEY` or `OPENROUTER_API_KEY`) before the next step — it gets
copied alongside `backend.exe` automatically.

## 3. Install Electron tooling and build the .exe

```powershell
cd ..\desktop
npm install
npm run dist
```

`npm install` needs internet access and may take a few minutes the first
time (Electron itself is a fairly large download). `npm run dist` then
packages everything into an installer.

## 4. Find your app

```powershell
dir dist
```

You'll get a `dist\` folder inside `desktop\` containing something like:
```
AI Data Chatbot Setup 0.1.0.exe
```

That's your installer. Run it, and it'll install the app like any normal
Windows program — Start Menu shortcut and all. Opening it starts the
backend invisibly in the background and shows the chat UI in its own
window, no terminal required.

## Rebuilding after code changes

If you change the frontend or backend code later, redo the relevant steps:
- Frontend changed → redo step 1, then step 3
- Backend changed → redo step 2, then step 3
- Nothing changed → just step 3 (it reuses whatever's already built)

## Known trade-offs of this setup

- **Your API key ships inside the installed app.** `backend\.env` gets
  copied straight into the app's resources folder so `backend.exe` can find
  it. That's fine for an app that's just for you on your own PC, but do
  **not** share this built `.exe`/installer with anyone else — your key
  would go with it. If you ever want to distribute this app to other
  people, each person needs their own key entered separately (that's a
  bigger change we haven't built yet).
- No auto-update, no code signing — Windows SmartScreen may warn that the
  app is from an "unknown publisher" the first time you run the installer.
  That's expected for an unsigned app; click "More info" → "Run anyway."
- Uninstalling: since it's an NSIS installer, it'll show up in Windows'
  normal "Add or remove programs" list.
