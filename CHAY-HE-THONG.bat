@echo off
title Khoi dong he thong LoyalCine (Backend + Frontend)
cd /d "%~dp0"

echo =================================================================
echo   KHOI DONG HE THONG LOYALCINE (BACKEND API + FRONTEND APP)
echo   Can bat MongoDB Community Server truoc (port 27017).
echo =================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

rem Lan dau tai tu GitHub ve se chua co node_modules: tu cai thu vien cho backend va frontend
if not exist "backend\node_modules" (
  echo Dang cai thu vien backend lan dau, vui long doi...
  pushd backend
  call npm install
  popd
)
if not exist "frontend\node_modules" (
  echo Dang cai thu vien frontend lan dau, vui long doi 1-3 phut...
  pushd frontend
  call npm install
  popd
) else (
  pushd frontend
  call npm install --prefer-offline --no-audit --no-fund --loglevel=error
  popd
)

echo [1/2] Dang khoi dong Backend API Server tai port 3000...
start "LoyalCine - Backend Server" cmd /k "cd /d "%~dp0backend" && node src/server.js"

echo [2/2] Dang khoi dong Frontend App tai port 5173, che do du lieu that tu backend...
start "LoyalCine - Frontend App" cmd /k "cd /d "%~dp0frontend" && npm run dev:api -- --open"

echo.
echo =================================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   - Backend Server: http://localhost:3000/api
echo   - Frontend Web:   http://localhost:5173
echo   (Trinh duyet se tu dong mo giao dien sau vai giay)
echo   Muon chay frontend voi du lieu gia, khong can MongoDB: dung CHAY-APP.bat
echo =================================================================
echo.
pause
