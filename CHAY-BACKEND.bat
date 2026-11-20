@echo off
title LoyalCine - Backend Server (Yen Linh)
cd /d "%~dp0backend"

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js.
  pause
  exit /b 1
)

echo =================================================================
echo   KHOI DONG BACKEND API SERVER - LOYALCINE (YEN LINH)
echo   Dia chi: http://localhost:3000/api
echo   CSDL: MongoDB CinemaLoyaltyDB (Port 27017)
echo =================================================================
echo.

node src/server.js
pause
