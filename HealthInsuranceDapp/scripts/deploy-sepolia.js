const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Health Insurance Contract Deployment to SEPOLIA TESTNET...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    if (parseFloat(hre.ethers.formatEther(balance)) < 0.01) {
        console.log("❌ Insufficient balance! You need at least 0.01 Sepolia ETH");
        console.log("   Get free Sepolia ETH from: https://sepoliafaucet.com/");
        console.log("   Or: https://www.alchemy.com/faucets/ethereum-sepolia");
        process.exit(1);
    }

    // Deploy contract
    console.log("📦 Compiling and deploying HealthInsurance contract...");
    const HealthInsurance = await hre.ethers.getContractFactory("HealthInsurance");
    const healthInsurance = await HealthInsurance.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await healthInsurance.waitForDeployment();
    const contractAddress = await healthInsurance.getAddress();

    console.log("✅ HealthInsurance deployed to:", contractAddress);
    console.log("👤 Insurer (Admin) address:", deployer.address);

    // Wait for a few block confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    const deployTx = healthInsurance.deploymentTransaction();
    if (deployTx) {
        await deployTx.wait(3); // Wait for 3 confirmations
        console.log("✅ Contract confirmed on blockchain!");
    }

    // Fund the contract with a small amount of ETH for testing
    const fundingAmount = hre.ethers.parseEther("0.05");
    console.log("\n💵 Funding contract with", hre.ethers.formatEther(fundingAmount), "ETH for claim payouts...");

    try {
        const fundTx = await deployer.sendTransaction({
            to: contractAddress,
            value: fundingAmount
        });
        await fundTx.wait();
        console.log("✅ Contract funded successfully!");
    } catch (error) {
        console.log("⚠️ Could not fund contract (you can do this later via the DApp)");
    }

    // Get final contract balance
    const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
    console.log("💰 Contract balance:", hre.ethers.formatEther(contractBalance), "ETH");

    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        chainId: 11155111,
        contractAddress: contractAddress,
        insurerAddress: deployer.address,
        deployedAt: new Date().toISOString(),
        contractBalance: hre.ethers.formatEther(contractBalance),
        explorerUrl: `https://sepolia.etherscan.io/address/${contractAddress}`
    };

    // Update frontend app.js with new contract address and network config
    const appJsPath = path.join(__dirname, "..", "frontend", "js", "app.js");
    if (fs.existsSync(appJsPath)) {
        let appContent = fs.readFileSync(appJsPath, "utf8");

        // Update CONTRACT_ADDRESS
        appContent = appContent.replace(
            /let CONTRACT_ADDRESS = "[^"]*";/,
            `let CONTRACT_ADDRESS = "${contractAddress}";`
        );

        // Update INSURER_ADDRESS
        appContent = appContent.replace(
            /let INSURER_ADDRESS = "[^"]*";/,
            `let INSURER_ADDRESS = "${deployer.address}";`
        );

        // Update NETWORK_CONFIG for Sepolia
        appContent = appContent.replace(
            /const NETWORK_CONFIG = \{[\s\S]*?chainId:[\s\S]*?chainName:[\s\S]*?rpcUrls:[\s\S]*?nativeCurrency:[\s\S]*?\};/,
            `const NETWORK_CONFIG = {
    chainId: "0xaa36a7",  // 11155111 in hex (Sepolia chain ID)
    chainName: "Sepolia Testnet",
    rpcUrls: ["https://rpc.sepolia.org"],
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
};`
        );

        fs.writeFileSync(appJsPath, appContent);
        console.log("\n📝 Frontend app.js updated with Sepolia configuration!");
    }

    // Save deployment summary
    const summaryPath = path.join(__dirname, "..", "deployment-sepolia.json");
    fs.writeFileSync(summaryPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📝 Deployment info saved to deployment-sepolia.json");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 SEPOLIA TESTNET DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log("\n📋 Quick Reference:");
    console.log("   Contract Address:", contractAddress);
    console.log("   Admin/Insurer:   ", deployer.address);
    console.log("   Contract Balance:", hre.ethers.formatEther(contractBalance), "ETH");
    console.log("   Network:          Sepolia Testnet (Chain ID: 11155111)");
    console.log("\n🔗 View on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("\n🌐 Next Steps:");
    console.log("   1. Host your frontend on Vercel/Netlify (or use: npx serve frontend)");
    console.log("   2. Connect MetaMask to Sepolia Testnet");
    console.log("   3. Share the URL - anyone can now connect their wallet!");
    console.log("   4. Get free Sepolia ETH: https://sepoliafaucet.com/");
    console.log("=".repeat(70) + "\n");

    // Optional: Verify contract on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("\n🔍 Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: []
            });
            console.log("✅ Contract verified on Etherscan!");
        } catch (error) {
            console.log("⚠️ Verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
