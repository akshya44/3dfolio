const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Health Insurance Contract Deployment...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    console.log("📦 Compiling and deploying HealthInsurance contract...");
    const HealthInsurance = await hre.ethers.getContractFactory("HealthInsurance");
    const healthInsurance = await HealthInsurance.deploy();

    await healthInsurance.waitForDeployment();
    const contractAddress = await healthInsurance.getAddress();

    console.log("✅ HealthInsurance deployed to:", contractAddress);
    console.log("👤 Insurer (Admin) address:", deployer.address);

    // Fund the contract with initial ETH for claim payouts
    const fundingAmount = hre.ethers.parseEther("10");
    console.log("\n💵 Funding contract with", hre.ethers.formatEther(fundingAmount), "ETH for claim payouts...");

    const fundTx = await deployer.sendTransaction({
        to: contractAddress,
        value: fundingAmount
    });
    await fundTx.wait();
    console.log("✅ Contract funded successfully!");

    // Get final contract balance
    const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
    console.log("💰 Contract balance:", hre.ethers.formatEther(contractBalance), "ETH");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        insurerAddress: deployer.address,
        deployedAt: new Date().toISOString(),
        contractBalance: hre.ethers.formatEther(contractBalance)
    };

    // Save to frontend config
    const frontendConfigPath = path.join(__dirname, "..", "frontend", "js", "config.js");
    const configContent = `// Auto-generated deployment configuration
// Deployed at: ${deploymentInfo.deployedAt}
// Network: ${deploymentInfo.network}

const CONTRACT_ADDRESS = "${contractAddress}";
const INSURER_ADDRESS = "${deployer.address}";
const NETWORK_CONFIG = {
  chainId: "0x539", // 1337 in hex
  chainName: "Ganache Local",
  rpcUrls: ["http://127.0.0.1:7545"],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  }
};

export { CONTRACT_ADDRESS, INSURER_ADDRESS, NETWORK_CONFIG };
`;

    fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("\n📝 Configuration saved to frontend/js/config.js");

    // Copy ABI to frontend
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "HealthInsurance.sol", "HealthInsurance.json");
    const abiDestPath = path.join(__dirname, "..", "frontend", "js", "abi.js");

    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiContent = `// Auto-generated ABI file
const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};

export { CONTRACT_ABI };
`;
        fs.writeFileSync(abiDestPath, abiContent);
        console.log("📝 ABI saved to frontend/js/abi.js");
    }

    // Save deployment summary
    const summaryPath = path.join(__dirname, "..", "deployment-info.json");
    fs.writeFileSync(summaryPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📝 Deployment info saved to deployment-info.json");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Quick Reference:");
    console.log("   Contract Address:", contractAddress);
    console.log("   Admin/Insurer:", deployer.address);
    console.log("   Contract Balance:", hre.ethers.formatEther(contractBalance), "ETH");
    console.log("\n🌐 Next Steps:");
    console.log("   1. Open frontend/index.html in your browser");
    console.log("   2. Connect MetaMask to Ganache (http://127.0.0.1:7545)");
    console.log("   3. Import a Ganache account to MetaMask");
    console.log("   4. Start creating policies and claims!");
    console.log("=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
