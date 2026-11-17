@echo off
title Aggiornamento GitHub e Vercel
cd /d "%~dp0"
git status -s
git add -A
git commit -m "Aggiornamento sito %date% %time%"
git push
pause
