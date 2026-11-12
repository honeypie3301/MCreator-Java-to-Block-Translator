@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0localhost.ps1" restart
if errorlevel 1 pause
