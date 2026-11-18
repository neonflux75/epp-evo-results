@echo off
title Sincronizzazione da GitHub - EVO Results
cd /d "%~dp0"

echo ========================================================
echo   SCARICAMENTO AGGIORNAMENTI DA GITHUB IN CORSO...
echo ========================================================
echo.

git fetch origin
git pull origin main --autostash

if %errorlevel% neq 0 (
    echo.
    echo [ATTENZIONE] Si e' verificato un conflitto o un errore.
    echo Verifica i messaggi sopra prima di procedere.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   CARTELLE LOCALI ALLINEATE CON GITHUB!
echo   Ora puoi modificare i file o usare Aggiorna_Sito.bat
echo ========================================================
pause
