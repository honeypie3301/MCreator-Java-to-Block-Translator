@echo off
cd /d "%~dp0"

REM 1. Auto-install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [MCreator Translator] Installing missing dependencies...
    call npm install
)

REM 2. Build production bundle
call npm run build
if errorlevel 1 (
    echo [MCreator Translator] Build failed. Checking dependencies...
    call npm install
    call npm run build
)

REM 3. Stop any existing instance cleanly, then start fresh
call pm2 delete mcreator-translator >nul 2>&1
set PORT=5173
call pm2 start dist/server.cjs --name mcreator-translator --update-env
echo.
echo MCreator Translator restarted at http://localhost:5173
for /f "tokens=*" %%a in ('git log -1 --oneline') do echo Latest Commit: %%a
