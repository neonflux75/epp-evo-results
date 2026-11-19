@echo off
title Aggiorna Mappa Piste - EVO Results
cd /d "%~dp0"

node scripts\generate-tracks-map.js
echo.
pause
