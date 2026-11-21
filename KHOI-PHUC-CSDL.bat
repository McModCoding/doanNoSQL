@echo off
title Quan tri CSDL - Khoi phuc mongorestore (Yen Linh)
cd /d "%~dp0backend"

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dang cai thu vien backend lan dau, vui long doi 1-2 phut...
  call npm install
  if errorlevel 1 (
    echo [LOI] Cai thu vien that bai. Kiem tra ket noi mang roi thu lai.
    pause
    exit /b 1
  )
)

node scripts/restore.js
if errorlevel 2 (
  echo.
  echo Khong chay duoc mongorestore: may chua cai MongoDB Database Tools.
  echo Nap lai du lieu chuan bang scripts\seed.js, ra cung bo du lieu voi ban sao luu chuan...
  echo.
  node scripts/seed.js
)
pause
