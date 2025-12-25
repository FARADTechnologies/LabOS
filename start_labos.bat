@echo off
setlocal

REM ---- Locate Node.js ----
if not defined NODE_PATH (
  if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
  if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Please install from https://nodejs.org and try again.
  pause
  exit /b 1
)

REM ---- Install dependencies if needed ----
if not exist "node_modules" (
  echo Installing dependencies...
  npm.cmd install
  if errorlevel 1 (
    echo npm install failed. Check errors above.
    pause
    exit /b 1
  )
)

REM ---- Start dev server and open browser ----
start "" http://localhost:8080
echo Starting LabOS dev server...
npm.cmd run dev

endlocal
