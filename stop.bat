@echo off
cd /d "%~dp0"
call pm2 delete mcreator-translator >nul 2>&1
echo.
echo MCreator Translator stopped.
