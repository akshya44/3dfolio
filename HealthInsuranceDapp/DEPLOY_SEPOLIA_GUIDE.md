# 🌐 Deploy to Sepolia Testnet - Complete Guide

This guide will help you deploy your Health Insurance DApp to the **Sepolia public testnet** so anyone can connect their wallet and interact with it.

---

## 📋 Prerequisites

1. **MetaMask wallet** with a private key
2. **Sepolia test ETH** (free from faucet)
3. **Alchemy or Infura account** (free) for RPC access

---

## 🚀 Step-by-Step Deployment

### Step 1: Get a Free Alchemy API Key

1. Go to [Alchemy](https://dashboard.alchemy.com/) and create a free account
2. Click "Create App"
3. Select:
   - **Chain**: Ethereum
   - **Network**: Sepolia
4. Click "Create App"
5. Click on your app, then "API Key" to copy your HTTPS URL

Example URL: `https://eth-sepolia.g.alchemy.com/v2/your-api-key`

---

### Step 2: Get Sepolia Test ETH (Free)

You need some Sepolia ETH to pay for gas fees. Get it free from:

1. **Alchemy Faucet** (Recommended): https://www.alchemy.com/faucets/ethereum-sepolia
2. **Sepolia Faucet**: https://sepoliafaucet.com/
3. **Google Cloud Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia

You'll need approximately **0.05-0.1 Sepolia ETH** for deployment.

---

### Step 3: Get Your Private Key from MetaMask

⚠️ **IMPORTANT**: Never share your private key with anyone!

1. Open MetaMask
2. Click the 3 dots next to your account name
3. Click "Account Details"
4. Click "Show Private Key"
5. Enter your MetaMask password
6. Copy the private key (starts without 0x, just letters and numbers)

---

### Step 4: Create Your .env File

1. In the project root folder, create a file named `.env`
2. Add the following content:

```env
# Your MetaMask private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Your Alchemy Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# (Optional) Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Example `.env` file:**
```env
PRIVATE_KEY=abc123def456789abc123def456789abc123def456789abc123def456789abc1
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/Ab12Cd34Ef56Gh78Ij90
```

---

### Step 5: Deploy the Contract

**Option A: Using the batch file (Easy)**
```
Double-click: deploy-sepolia.bat
```

**Option B: Using command line**
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

Wait 1-2 minutes for deployment. You'll see output like:
```
🎉 SEPOLIA TESTNET DEPLOYMENT SUCCESSFUL!
   Contract Address: 0x1234...5678
   View on Etherscan: https://sepolia.etherscan.io/address/0x1234...5678
```

---

### Step 6: Host Your Frontend

Now that the contract is deployed, you need to host the frontend publicly.

**Option A: Using Vercel (Recommended - Free)**

1. Create account at https://vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Run in the project folder: `vercel --prod`
4. Follow the prompts
5. Share the URL (e.g., `https://your-app.vercel.app`)

**Option B: Using Netlify (Free)**

1. Create account at https://netlify.com
2. Drag & drop the `frontend` folder to Netlify dashboard
3. Share the URL

**Option C: Quick local sharing with ngrok**

1. Install ngrok: https://ngrok.com/download
2. Start a local server: `npx serve frontend -l 3000`
3. In another terminal: `ngrok http 3000`
4. Share the ngrok URL

---

## ✅ After Deployment

### For Users to Connect:

1. Users visit your hosted frontend URL
2. They click "Connect Wallet" 
3. MetaMask prompts to add Sepolia network (automatic)
4. They can now create policies, submit claims, etc.

### For Admin (You):

1. Connect with the SAME wallet you used for deployment
2. You'll automatically have admin privileges
3. You can approve claims, deposit funds, etc.

---

## 🔧 Troubleshooting

### "Insufficient funds" error
- Get more Sepolia ETH from the faucet

### "Invalid private key" error  
- Make sure your private key doesn't have 0x prefix
- Should be exactly 64 characters

### "Network error" 
- Check your SEPOLIA_RPC_URL is correct
- Make sure Alchemy app is configured for Sepolia

### "Contract address not found"
- After deployment, check `deployment-sepolia.json` for the address
- The frontend is updated automatically

---

## 📁 Files Created

After successful deployment:
- `deployment-sepolia.json` - Contains contract address and deployment info
- `frontend/js/app.js` - Updated with Sepolia configuration

---

## 🔗 Useful Links

- [Sepolia Etherscan](https://sepolia.etherscan.io/) - View transactions and contracts
- [Alchemy Dashboard](https://dashboard.alchemy.com/) - Manage your RPC
- [Sepolia Faucet](https://sepoliafaucet.com/) - Get free test ETH
- [MetaMask](https://metamask.io/) - Wallet extension

---

## 🎉 Congratulations!

Your Health Insurance DApp is now publicly accessible on the Sepolia testnet! Anyone with MetaMask can connect and interact with your smart contract.

**Share your frontend URL and users worldwide can:**
- Connect their MetaMask wallet
- Create insurance policies  
- Submit and track claims
- View transactions on Etherscan
