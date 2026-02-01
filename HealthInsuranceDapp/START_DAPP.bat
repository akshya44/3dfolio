@echo off
title HealthChain DApp - Server
color 0A

echo ========================================
echo    HealthChain DApp - Starting...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Hardhat Blockchain Node...
start "Hardhat Node" cmd /k "npx hardhat node"

echo Waiting for blockchain to start...
timeout /t 5 /nobreak > nul

echo [2/3] Deploying Smart Contract...
node scripts/deploy-standalone.js

echo.
echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "npx serve frontend -l 3000"

timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo    All servers are running!
echo ========================================
echo.
echo    Blockchain: http://127.0.0.1:8545
echo    Frontend:   http://localhost:3000
echo.
echo    Opening browser...
echo ========================================

start firefox http://localhost:3000

echo.
echo Press any key to STOP all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Hardhat Node*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /F > nul 2>&1
echo Done!
