@echo off
title Tao lai CSDL cho backend cua Trung Tinh
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

echo.
echo File nay XOA CSDL rieng cua backend Tinh (mac dinh CinemaLoyaltyDB_Tinh,
echo xem MONGODB_URI trong backend-tinh\.env) roi tao lai tu dau bang database\setup_all.js.
echo CSDL demo CinemaLoyaltyDB cua giao dien khong bi dong toi.
echo Can cai MongoDB Shell (mongosh): https://www.mongodb.com/try/download/shell
echo.
choice /c YN /m "Tiep tuc"
if errorlevel 2 exit /b 0

node scripts/tao-csdl.js --lam-lai
pause
