@echo off
title Backup Completo - EVO Results
cd /d "%~dp0"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set DATESTAMP=%%i
set DEST=C:\Backups_ACE_Results\Backup_%DATESTAMP%

echo ========================================================
echo   CREAZIONE BACKUP LOCALE IN CORSO...
echo   Destinazione: %DEST%
echo ========================================================
echo.

mkdir "%DEST%" 2>nul

robocopy "%~dp0." "%DEST%" /E /XD node_modules .next .git /XF *.log /NFL /NDL /NJH /NJS

echo.
echo ========================================================
echo   BACKUP COMPLETATO CON SUCCESSO!
echo   Percorso: %DEST%
echo ========================================================
pause
