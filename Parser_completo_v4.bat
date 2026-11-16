@echo off
chcp 65001 >nul
echo Scansione dei file in corso...

powershell -NoProfile -Command "$root = (Get-Location).Path; $nl = [Environment]::NewLine; $files = Get-ChildItem -Path $root -Recurse -File | Where-Object { $_.Extension -in @('.ts', '.tsx', '.bat', '.py', '.js') -and $_.FullName -notmatch '\\(node_modules|\.next|\.git)\\' }; $out = foreach ($f in $files) { $rel = $f.FullName.Substring($root.Length + 1); Write-Host ('Aggiunto: ' + $rel) -ForegroundColor Cyan; '=== ' + $rel + ' ===' + $nl + (Get-Content -Path $f.FullName -Raw -Encoding UTF8) + $nl }; $out | Set-Content -Path 'progetto.txt' -Encoding UTF8"

echo.
echo File progetto.txt creato con successo!
pause
