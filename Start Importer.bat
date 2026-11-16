@echo off
title EVO RESULTS - Importer JSON ^& Live Monitor
cd /d "%~dp0"
echo ===================================================
echo   AVVIO IMPIANTO ANALISI JSON ^& LIVE MONITOR
echo ===================================================
echo.
:loop
node importer.js
echo.
echo [ATTENZIONE] Lo script importer.js si e' interrotto. Riavvio automatico tra 5 secondi...
timeout /t 5 /nobreak >nul
goto loop
