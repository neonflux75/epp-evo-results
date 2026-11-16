@echo off
title EVO RESULTS - Server Web Next.js
cd /d "%~dp0"
echo ===================================================
echo   COMPILAZIONE E AVVIO SITO EVO RESULTS (NEXT.JS)
echo ===================================================
echo.
echo [1/2] Compilazione del sito in corso (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] La compilazione e' fallita! Controlla gli errori qui sopra.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/2] Avvio del server web in corso (npm run start)...
echo Il sito sara' raggiungibile su http://localhost:3000
echo.
call npm run start
pause
