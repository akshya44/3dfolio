@echo off
echo ========================================
echo   DEPLOY TO SEPOLIA TESTNET
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file with:
    echo   1. PRIVATE_KEY=your_wallet_private_key
    echo   2. SEPOLIA_RPC_URL=your_alchemy_or_infura_url
    echo.
    echo See .env.example for reference.
    echo.
    pause
    exit /b 1
)

echo Compiling contracts...
call npx hardhat compile

if errorlevel 1 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo.
echo Deploying to Sepolia Testnet...
echo This may take 1-2 minutes...
echo.

call npx hardhat run scripts/deploy-sepolia.js --network sepolia

if errorlevel 1 (
    echo.
    echo Deployment failed! Check:
    echo   1. Your .env file has correct PRIVATE_KEY
    echo   2. Your wallet has Sepolia ETH (get from faucet)
    echo   3. SEPOLIA_RPC_URL is correct
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your DApp is now live on Sepolia Testnet!
echo Check deployment-sepolia.json for details.
echo.
pause
