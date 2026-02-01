@echo off
echo ================================================
echo    HealthChain DApp - Setup Script
echo ================================================
echo.

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/3] Compiling smart contracts...
call npx hardhat compile
if errorlevel 1 (
    echo ERROR: Failed to compile contracts
    pause
    exit /b 1
)
echo.

echo ================================================
echo    Setup Complete!
echo ================================================
echo.
echo Next Steps:
echo   1. Start Ganache on http://127.0.0.1:7545
echo   2. Run: npm run deploy
echo   3. Open frontend/index.html in browser
echo   4. Connect MetaMask to Ganache network
echo.
pause
