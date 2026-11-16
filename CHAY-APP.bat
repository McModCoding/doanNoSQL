@echo off
title LoyalCine - Frontend (do an NoSQL)
rem Nhay dup file nay de chay app. Dat file canh thu muc "frontend" va "docs".

if exist "%~dp0frontend\package.json" (
  cd /d "%~dp0frontend"
) else if exist "%~dp0package.json" (
  cd /d "%~dp0"
) else (
  echo [LOI] Khong tim thay thu muc frontend.
  echo Hay dat file nay cung cho voi thu muc "frontend", "docs" va README.md.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dang cai thu vien lan dau, vui long doi 1-3 phut...
  call npm install
  if errorlevel 1 (
    echo [LOI] Cai thu vien that bai. Kiem tra ket noi mang roi thu lai.
    pause
    exit /b 1
  )
) else (
  rem Ban moi co the them thu vien moi: dong bo lai, may giay neu khong co gi moi
  echo Dang kiem tra thu vien, vai giay...
  call npm install --prefer-offline --no-audit --no-fund --loglevel=error
  if errorlevel 1 echo [CANH BAO] Khong cap nhat duoc thu vien, van thu chay app.
)

echo.
echo Dang khoi dong app, trinh duyet se tu mo...
echo Giu cua so nay mo trong luc dung app. Dong cua so nay de tat app.
echo.
call npm run dev -- --open
pause
