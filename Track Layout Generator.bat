@echo off
title EVO RESULTS - Genera Tutte le Piste
cd /d "%~dp0"
echo ===================================================
echo   EVO RESULTS - Generazione Mappe Circuiti Kunos
echo ===================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRORE] Python non trovato nel sistema! Installa Python prima di continuare.
    pause
    exit /b 1
)

echo Controllo librerie necessarie (Pillow)...
python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo Installazione Pillow in corso...
    pip install pillow
)

echo.
echo Avvio download e generazione layout piste...
python genera_piste.py

echo.
echo ===================================================
echo   Operazione completata!
echo ===================================================
pause
