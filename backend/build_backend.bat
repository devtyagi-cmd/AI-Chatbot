@echo off
REM Run this from an activated venv, inside the backend\ folder:
REM   cd backend
REM   .venv\Scripts\Activate.ps1     (if not already active)
REM   build_backend.bat
REM
REM Produces backend\dist\backend.exe
REM duckdb and pandas ship native/compiled pieces that PyInstaller doesn't
REM always find automatically, hence the --collect-all flags below. If the
REM build succeeds but backend.exe crashes on startup with a
REM "ModuleNotFoundError" or similar, add that module to the command with
REM another --hidden-import and rerun.

pip install pyinstaller

pyinstaller --onefile --name backend ^
  --collect-all duckdb ^
  --collect-all pandas ^
  --hidden-import uvicorn.loops.auto ^
  --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.protocols.websockets.auto ^
  --hidden-import uvicorn.lifespan.on ^
  main.py

echo.
echo Done. If it succeeded, backend\dist\backend.exe now exists.
