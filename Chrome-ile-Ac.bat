@echo off
REM Sesli Not Defteri - localhost uzerinden Chrome ile ac (mikrofon icin gerekli)
cd /d "%~dp0"
start "SesliNotDefteri-Sunucu" cmd /c "node server.js"
timeout /t 2 /nobreak >nul
set URL=http://localhost:8080/Chrome-ile-Kullan.html
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%URL%"
  goto :end
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "%URL%"
  goto :end
)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%URL%"
  goto :end
)
start "" "%URL%"
:end
echo Kapatmak icin sunucu penceresini kapatabilirsin.
