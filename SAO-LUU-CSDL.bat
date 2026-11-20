@echo off
title Quan tri CSDL - Sao luu mongodump (Yen Linh)
cd /d "%~dp0backend"
node scripts/backup.js
pause
