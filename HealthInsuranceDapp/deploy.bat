@echo off
echo ================================================
echo    Deploying HealthChain Smart Contract
echo ================================================
echo.
echo Make sure Ganache is running on http://127.0.0.1:7545
echo.
call npm run deploy
echo.
echo ================================================
echo    Deployment Complete!
echo ================================================
echo.
echo Open frontend/index.html in your browser
echo.
pause
