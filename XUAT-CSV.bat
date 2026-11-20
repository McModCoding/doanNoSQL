@echo off
title Quan tri CSDL - Xuat danh sach khach hang CSV (Yen Linh)
cd /d "%~dp0backend"
node scripts/export-csv.js
pause
