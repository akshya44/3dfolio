// Standalone deployment script using ethers directly
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Read compiled artifact
const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "HealthInsurance.sol", "HealthInsurance.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function deploy() {
    console.log("🚀 Deploying HealthInsurance Contract...\n");

    // Connect to Hardhat node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Get the first account (deployer/admin)
    const accounts = await provider.listAccounts();
    const deployer = accounts[0];

    console.log("📍 Deployer address:", deployer.address);

    const balance = await provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    console.log("📦 Deploying contract...");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    // Fund the contract
    console.log("\n💵 Funding contract with 10 ETH...");
    const fundTx = await deployer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("10")
    });
    await fundTx.wait();
    console.log("✅ Contract funded!");

    // Update frontend config
    const appJsPath = path.join(__dirname, "..", "frontend", "js", "app.js");
    let appJs = fs.readFileSync(appJsPath, "utf8");

    // Update CONTRACT_ADDRESS
    appJs = appJs.replace(
        /let CONTRACT_ADDRESS = "[^"]*";/,
        `let CONTRACT_ADDRESS = "${contractAddress}";`
    );

    // Update INSURER_ADDRESS
    appJs = appJs.replace(
        /let INSURER_ADDRESS = "[^"]*";/,
        `let INSURER_ADDRESS = "${deployer.address}";`
    );

    fs.writeFileSync(appJsPath, appJs);
    console.log("\n📝 Frontend config updated!");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(50));
    console.log("\n📋 Contract Address:", contractAddress);
    console.log("👤 Admin Address:", deployer.address);
    console.log("\n🌐 Next Steps:");
    console.log("   1. Open frontend/index.html in browser");
    console.log("   2. Add Hardhat network to MetaMask:");
    console.log("      - RPC URL: http://127.0.0.1:8545");
    console.log("      - Chain ID: 31337");
    console.log("   3. Import a test account private key to MetaMask");
    console.log("=".repeat(50) + "\n");
}

deploy().catch(console.error);
