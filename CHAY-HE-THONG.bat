@echo off
title Khoi dong he thong LoyalCine (Backend + Frontend)
cd /d "%~dp0"

echo =================================================================
echo   KHOI DONG HE THONG LOYALCINE (BACKEND API + FRONTEND APP)
echo =================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js.
  pause
  exit /b 1
)

echo [1/2] Dang khoi dong Backend API Server tai port 3000...
start "LoyalCine - Backend Server" cmd /k "cd /d "%~dp0backend" && node src/server.js"

echo [2/2] Dang khoi dong Frontend App tai port 5173...
start "LoyalCine - Frontend App" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --open"

echo.
echo =================================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   - Backend Server: http://localhost:3000/api
echo   - Frontend Web:   http://localhost:5173
echo   (Trinh duyet se tu dong mo giao dien sau vai giay)
echo =================================================================
echo.
pause
