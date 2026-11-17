@echo off
REM Sesli Not Defteri - sunucuyu gizli baslatir, uygulama penceresini acar, bu pencere kendiliginden kapanir.
cd /d "%~dp0"
title Sesli Not Defteri aciliyor...

if not exist "server.js" (
  echo Uygulama dosyalari bulunamadi.
  echo ZIP'e sag tiklayin ^> Tumunu ayikla, sonra acilan klasorden bu dosyayi acin.
  pause
  exit /b
)

REM Node.js'i bul (kurulumdan sonra bilgisayar yeniden baslatilmasa da bulunur)
set "NODE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE (where node >nul 2>nul && set "NODE=node")
if not defined NODE (
  echo Node.js kurulu degil. https://nodejs.org adresinden LTS - Windows Installer ^(.msi^) indirip kurun.
  start "" "https://nodejs.org/"
  pause
  exit /b
)

echo Sunucu baslatiliyor...
"%NODE%" server.js --arkaplan
if errorlevel 1 (
  echo.
  echo Sunucu baslatilamadi. Hata ayrintisi:
  "%NODE%" server.js
  pause
  exit /b
)

set "URL=http://localhost:8080/Chrome-ile-Kullan.html"
set "TARAYICI="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "TARAYICI=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined TARAYICI if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "TARAYICI=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined TARAYICI if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "TARAYICI=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined TARAYICI if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "TARAYICI=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if defined TARAYICI (
  start "" "%TARAYICI%" --app=%URL% --window-size=1100,750
) else (
  start "" "%URL%"
)
exit
