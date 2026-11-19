@echo off
title Estrazione Automatica Mappe Piste da AC EVO
cd /d "%~dp0"
node scripts\extract-tracks.js
pause
