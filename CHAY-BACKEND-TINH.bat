@echo off
title LoyalCine - Backend cua Trung Tinh (cong 5000)
cd /d "%~dp0backend-tinh"

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dang cai thu vien backend cua Tinh lan dau, vui long doi 1-2 phut...
  call npm install
  if errorlevel 1 (
    echo [LOI] Cai thu vien that bai. Kiem tra ket noi mang roi thu lai.
    pause
    exit /b 1
  )
)

node scripts/tao-env.js
node scripts/tao-csdl.js --neu-trong

echo.
echo =================================================================
echo   BACKEND CUA TRUNG TINH - Express 5 + Mongoose, dang nhap JWT
echo   Dia chi: http://localhost:5000/api
echo   CSDL rieng: CinemaLoyaltyDB_Tinh (khong dung CSDL demo CinemaLoyaltyDB)
echo   Tai khoan thu: admin@cinemaloyalty.test   / AdminDemo!2026
echo                  member1@cinemaloyalty.test / MemberDemo!2026
echo   Giao dien LoyalCine van chay voi backend chinh: CHAY-HE-THONG.bat
echo   Can bat MongoDB Community Server truoc khi chay file nay.
echo =================================================================
echo.

node index.js
pause
