// ============ Configuration ============
let CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let INSURER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const NETWORK_CONFIG = {
    chainId: "0x7a69",  // 31337 in hex (Hardhat chain ID)
    chainName: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
};

// ============ Contract ABI ============
const CONTRACT_ABI = [
    "function insurer() view returns (address)",
    "function policyCounter() view returns (uint256)",
    "function claimCounter() view returns (uint256)",
    "function createPolicy(string memory _holderName, uint8 _policyType) payable returns (uint256)",
    "function cancelPolicy(uint256 _policyId)",
    "function submitClaim(uint256 _policyId, uint256 _amount, string memory _description, string memory _medicalProvider) returns (uint256)",
    "function approveClaim(uint256 _claimId)",
    "function rejectClaim(uint256 _claimId, string memory _reason)",
    "function payClaim(uint256 _claimId)",
    "function depositFunds() payable",
    "function withdrawFunds(uint256 _amount)",
    "function getPolicy(uint256 _policyId) view returns (tuple(uint256 id, address holder, string holderName, uint256 coverageAmount, uint256 premium, uint256 startDate, uint256 endDate, uint8 status, uint8 policyType, uint256 claimsMade, uint256 totalClaimsPaid))",
    "function getClaim(uint256 _claimId) view returns (tuple(uint256 id, uint256 policyId, address claimant, uint256 amount, string description, string medicalProvider, uint256 dateSubmitted, uint256 dateProcessed, uint8 status, string rejectionReason))",
    "function getUserPolicies(address _user) view returns (uint256[])",
    "function getUserClaims(address _user) view returns (uint256[])",
    "function getContractBalance() view returns (uint256)",
    "function getPendingClaimsCount() view returns (uint256)"
];

// ============ Global State ============
let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;
let isAdmin = false;
let cachedEthereumProvider = null; // Cache the detected provider

const POLICY_TYPES = ["Basic", "Standard", "Premium", "Enterprise"];
const POLICY_PREMIUMS = ["0.01", "0.05", "0.1", "0.5"];
const POLICY_COVERAGES = ["1", "5", "10", "50"];
const POLICY_STATUS = ["Active", "Expired", "Cancelled"];
const CLAIM_STATUS = ["Pending", "Approved", "Rejected", "Paid"];

// ============ Provider Detection (EIP-6963 Compatible) ============
let detectedProviders = [];

// Listen for EIP-6963 provider announcements (modern standard)
if (typeof window !== 'undefined') {
    window.addEventListener("eip6963:announceProvider", function (event) {
        console.log("EIP-6963 Provider detected:", event.detail.info.name);
        detectedProviders.push(event.detail);
    });

    // Request providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));
}

// Helper function to wait for ethereum provider with multiple retries
async function waitForEthereum(maxAttempts, delayMs) {
    maxAttempts = maxAttempts || 10;
    delayMs = delayMs || 200;

    for (var i = 0; i < maxAttempts; i++) {
        // Check window.ethereum
        if (window.ethereum) {
            console.log("Found window.ethereum on attempt " + (i + 1));
            return window.ethereum;
        }

        // Check for MetaMask specifically
        if (window.ethereum && window.ethereum.isMetaMask) {
            console.log("Found MetaMask on attempt " + (i + 1));
            return window.ethereum;
        }

        // Check EIP-6963 detected providers
        if (detectedProviders.length > 0) {
            // Prefer MetaMask if available
            var metamaskProvider = detectedProviders.find(function (p) {
                return p.info.name.toLowerCase().includes('metamask');
            });
            if (metamaskProvider) {
                console.log("Found MetaMask via EIP-6963");
                return metamaskProvider.provider;
            }
            // Use first available provider
            console.log("Using first EIP-6963 provider:", detectedProviders[0].info.name);
            return detectedProviders[0].provider;
        }

        // Wait before retrying
        if (i < maxAttempts - 1) {
            console.log("Waiting for provider... attempt " + (i + 1));
            await new Promise(function (resolve) { setTimeout(resolve, delayMs); });
        }
    }

    return null;
}

// ============ Initialize ============
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DApp Initialized!");
    setupEventListeners();

    // Wait for ethereum provider (MetaMask may not inject immediately)
    var ethereum = await waitForEthereum(15, 300);

    if (ethereum) {
        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", function () { window.location.reload(); });
        console.log("MetaMask/Wallet detected and configured!");

        // Check if already connected
        try {
            var accounts = await ethereum.request({ method: "eth_accounts" });
            if (accounts && accounts.length > 0) {
                console.log("Already connected, restoring session...");
                await handleAccountsChanged(accounts);
            }
        } catch (e) {
            console.log("No previous session found");
        }
    } else {
        console.log("No wallet detected after initialization. User needs to connect manually.");
    }
});

function setupEventListeners() {
    // Connect wallet button
    var connectBtn = document.getElementById("connectWallet");
    if (connectBtn) {
        connectBtn.addEventListener("click", connectWallet);
        console.log("Connect wallet listener added");
    }

    // Navigation links
    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            var section = e.target.dataset.section;
            showSection(section);
        });
    });

    // Forms
    var policyForm = document.getElementById("policyForm");
    if (policyForm) policyForm.addEventListener("submit", handleCreatePolicy);

    var claimForm = document.getElementById("claimForm");
    if (claimForm) claimForm.addEventListener("submit", handleSubmitClaim);

    var depositForm = document.getElementById("depositForm");
    if (depositForm) depositForm.addEventListener("submit", handleDeposit);

    var withdrawForm = document.getElementById("withdrawForm");
    if (withdrawForm) withdrawForm.addEventListener("submit", handleWithdraw);

    var rejectForm = document.getElementById("rejectForm");
    if (rejectForm) rejectForm.addEventListener("submit", handleRejectClaim);

    console.log("All event listeners set up");
}

// ============ Wallet Connection ============
async function connectWallet() {
    console.log("Connect wallet clicked!");
    showLoader(true);

    // Try to get ethereum provider with extended wait time on button click
    var ethereum = await waitForEthereum(20, 250);

    // If still not found, provide helpful guidance
    if (!ethereum) {
        showLoader(false);

        // Check if this is being served via file:// protocol
        if (window.location.protocol === 'file:') {
            showToast("⚠️ MetaMask may not work with file:// URLs. Please use a local server!", "error");
            var useServer = confirm(
                "MetaMask often doesn't work when opening HTML files directly.\n\n" +
                "You need to serve this page from a local server.\n\n" +
                "Options:\n" +
                "1. Open terminal in 'frontend' folder\n" +
                "2. Run: npx serve .\n" +
                "3. Open http://localhost:3000\n\n" +
                "Would you like to see the MetaMask troubleshooting page?"
            );
            if (useServer) {
                window.open("https://metamask.io/faqs/", "_blank");
            }
            return;
        }

        showToast("MetaMask not detected! Make sure the extension is installed and enabled.", "error");
        console.log("MetaMask not detected. Troubleshooting tips:");
        console.log("1. Check if MetaMask extension is installed");
        console.log("2. Make sure MetaMask is not disabled");
        console.log("3. Try refreshing the page");
        console.log("4. Check if another wallet is conflicting");

        var shouldOpen = confirm(
            "MetaMask not detected!\n\n" +
            "Troubleshooting:\n" +
            "1. Is MetaMask installed and enabled?\n" +
            "2. Try refreshing the page\n" +
            "3. Disable other wallet extensions\n\n" +
            "Would you like to open the MetaMask download page?"
        );
        if (shouldOpen) {
            window.open("https://metamask.io/download/", "_blank");
        }
        return;
    }

    console.log("MetaMask/Wallet detected:", ethereum.isMetaMask ? "MetaMask" : "Other Wallet");

    // Cache the provider for later use
    cachedEthereumProvider = ethereum;

    try {
        // Try to switch to Ganache network
        await switchNetwork();

        // Request accounts
        var accounts = await ethereum.request({ method: "eth_requestAccounts" });
        console.log("Accounts:", accounts);

        await handleAccountsChanged(accounts);
        showToast("Wallet connected successfully!", "success");
    } catch (error) {
        console.error("Connection error:", error);
        showToast("Failed to connect: " + error.message, "error");
    }

    showLoader(false);
}

async function switchNetwork() {
    var eth = cachedEthereumProvider || window.ethereum;
    if (!eth) {
        console.log("No ethereum provider for network switch");
        return;
    }

    try {
        await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: NETWORK_CONFIG.chainId }]
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await eth.request({
                    method: "wallet_addEthereumChain",
                    params: [NETWORK_CONFIG]
                });
            } catch (addError) {
                console.error("Failed to add network:", addError);
            }
        }
    }
}

async function handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
        currentAccount = null;
        updateUI();
        return;
    }

    currentAccount = accounts[0];
    console.log("Connected account:", currentAccount);

    // Setup ethers provider (use cached provider or window.ethereum)
    var eth = cachedEthereumProvider || window.ethereum;
    if (!eth) {
        showToast("No wallet provider found!", "error");
        return;
    }
    provider = new ethers.BrowserProvider(eth);
    signer = await provider.getSigner();

    // Check if contract address is set
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Check if connected account is admin
        try {
            var insurerAddr = await contract.insurer();
            isAdmin = currentAccount.toLowerCase() === insurerAddr.toLowerCase();
            INSURER_ADDRESS = insurerAddr;
            console.log("Is Admin:", isAdmin);
        } catch (e) {
            console.log("Could not check admin status:", e.message);
        }
    } else {
        // Prompt for contract address
        var addr = prompt("Enter the deployed contract address (from deploy.js output):");
        if (addr && addr.startsWith("0x")) {
            CONTRACT_ADDRESS = addr;
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            try {
                var insurerAddr = await contract.insurer();
                isAdmin = currentAccount.toLowerCase() === insurerAddr.toLowerCase();
                INSURER_ADDRESS = insurerAddr;
            } catch (e) {
                showToast("Invalid contract address", "error");
            }
        }
    }

    updateUI();
    await refreshData();
}

// ============ UI Updates ============
function updateUI() {
    var walletBtn = document.getElementById("walletBtnText");
    var networkBadge = document.getElementById("networkBadge");

    if (currentAccount) {
        walletBtn.textContent = currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);
        networkBadge.classList.add("connected");
        networkBadge.querySelector(".network-name").textContent = "Ganache";
    } else {
        walletBtn.textContent = "Connect Wallet";
        networkBadge.classList.remove("connected");
        networkBadge.querySelector(".network-name").textContent = "Not Connected";
    }

    // Show/hide admin section
    document.querySelectorAll(".admin-only").forEach(function (el) {
        if (isAdmin) {
            el.classList.add("visible");
        } else {
            el.classList.remove("visible");
        }
    });
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(function (s) { s.classList.remove("active"); });
    document.querySelectorAll(".nav-link").forEach(function (l) { l.classList.remove("active"); });

    var section = document.getElementById(sectionId);
    if (section) section.classList.add("active");

    var link = document.querySelector('[data-section="' + sectionId + '"]');
    if (link) link.classList.add("active");

    if (sectionId === "claims") loadUserPoliciesForClaim();
    if (sectionId === "admin" && isAdmin) loadAdminData();
}

// ============ Data Loading ============
async function refreshData() {
    if (!contract) return;

    try {
        var balance = await contract.getContractBalance();
        var policyCount = await contract.policyCounter();
        var pendingCount = await contract.getPendingClaimsCount();

        document.getElementById("contractBalance").textContent = ethers.formatEther(balance) + " ETH";
        document.getElementById("totalPolicies").textContent = policyCount.toString();
        document.getElementById("pendingClaims").textContent = pendingCount.toString();

        await loadUserPolicies();
        await loadUserClaims();
    } catch (error) {
        console.error("Error refreshing data:", error);
    }
}

async function loadUserPolicies() {
    if (!contract || !currentAccount) return;

    var container = document.getElementById("myPolicies");

    try {
        var policyIds = await contract.getUserPolicies(currentAccount);

        if (policyIds.length === 0) {
            container.innerHTML = '<div class="empty-state glass">No policies found. Create one above!</div>';
            return;
        }

        var html = "";
        for (var i = 0; i < policyIds.length; i++) {
            var policy = await contract.getPolicy(policyIds[i]);
            html += createPolicyCard(policy);
        }
        container.innerHTML = html;
    } catch (error) {
        console.error("Error loading policies:", error);
    }
}

function createPolicyCard(policy) {
    var statusClass = POLICY_STATUS[Number(policy.status)].toLowerCase();
    var endDate = new Date(Number(policy.endDate) * 1000).toLocaleDateString();

    return '<div class="policy-card glass">' +
        '<div class="card-header">' +
        '<span class="card-id">#' + policy.id + '</span>' +
        '<span class="card-status status-' + statusClass + '">' + POLICY_STATUS[Number(policy.status)] + '</span>' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="card-row"><span class="card-label">Type</span><span class="card-value">' + POLICY_TYPES[Number(policy.policyType)] + '</span></div>' +
        '<div class="card-row"><span class="card-label">Holder</span><span class="card-value">' + policy.holderName + '</span></div>' +
        '<div class="card-row"><span class="card-label">Coverage</span><span class="card-value">' + ethers.formatEther(policy.coverageAmount) + ' ETH</span></div>' +
        '<div class="card-row"><span class="card-label">Expires</span><span class="card-value">' + endDate + '</span></div>' +
        '</div>' +
        '</div>';
}

async function loadUserClaims() {
    if (!contract || !currentAccount) return;

    var container = document.getElementById("myClaims");

    try {
        var claimIds = await contract.getUserClaims(currentAccount);

        if (claimIds.length === 0) {
            container.innerHTML = '<div class="empty-state glass">No claims submitted yet.</div>';
            return;
        }

        var html = "";
        var approvedCount = 0;

        for (var i = 0; i < claimIds.length; i++) {
            var claim = await contract.getClaim(claimIds[i]);
            if (Number(claim.status) === 1 || Number(claim.status) === 3) approvedCount++;
            html += createClaimCard(claim);
        }

        container.innerHTML = html;
        document.getElementById("approvedClaims").textContent = approvedCount;
    } catch (error) {
        console.error("Error loading claims:", error);
    }
}

function createClaimCard(claim) {
    var statusClass = CLAIM_STATUS[Number(claim.status)].toLowerCase();

    return '<div class="claim-card glass">' +
        '<div class="card-header">' +
        '<span class="card-id">Claim #' + claim.id + ' (Policy #' + claim.policyId + ')</span>' +
        '<span class="card-status status-' + statusClass + '">' + CLAIM_STATUS[Number(claim.status)] + '</span>' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="card-row"><span class="card-label">Amount</span><span class="card-value">' + ethers.formatEther(claim.amount) + ' ETH</span></div>' +
        '<div class="card-row"><span class="card-label">Provider</span><span class="card-value">' + claim.medicalProvider + '</span></div>' +
        '<div class="card-row"><span class="card-label">Description</span><span class="card-value">' + claim.description.slice(0, 50) + '...</span></div>' +
        '</div>' +
        '</div>';
}

async function loadUserPoliciesForClaim() {
    if (!contract || !currentAccount) return;

    var select = document.getElementById("claimPolicyId");
    select.innerHTML = '<option value="">Select policy</option>';

    try {
        var policyIds = await contract.getUserPolicies(currentAccount);

        for (var i = 0; i < policyIds.length; i++) {
            var policy = await contract.getPolicy(policyIds[i]);
            if (Number(policy.status) === 0) {
                var option = document.createElement("option");
                option.value = policyIds[i];
                option.textContent = "Policy #" + policyIds[i] + " - " + POLICY_TYPES[Number(policy.policyType)];
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error("Error loading policies for claim:", error);
    }
}

// ============ Admin Functions ============
async function loadAdminData() {
    if (!contract || !isAdmin) return;
    await loadPendingClaims();
    await loadApprovedClaims();
}

async function loadPendingClaims() {
    var container = document.getElementById("adminPendingClaims");

    try {
        var claimCount = await contract.claimCounter();
        var html = "";

        for (var i = 1; i <= Number(claimCount); i++) {
            var claim = await contract.getClaim(i);
            if (Number(claim.status) === 0) {
                html += createAdminClaimCard(claim, "pending");
            }
        }

        container.innerHTML = html || '<div class="empty-state glass">No pending claims.</div>';
    } catch (error) {
        console.error("Error loading pending claims:", error);
    }
}

async function loadApprovedClaims() {
    var container = document.getElementById("adminApprovedClaims");

    try {
        var claimCount = await contract.claimCounter();
        var html = "";

        for (var i = 1; i <= Number(claimCount); i++) {
            var claim = await contract.getClaim(i);
            if (Number(claim.status) === 1) {
                html += createAdminClaimCard(claim, "approved");
            }
        }

        container.innerHTML = html || '<div class="empty-state glass">No approved claims awaiting payment.</div>';
    } catch (error) {
        console.error("Error loading approved claims:", error);
    }
}

function createAdminClaimCard(claim, type) {
    var actions = type === "pending"
        ? '<button class="btn btn-success btn-sm" onclick="approveClaim(' + claim.id + ')">Approve</button>' +
        '<button class="btn btn-danger btn-sm" onclick="showRejectModal(' + claim.id + ')">Reject</button>'
        : '<button class="btn btn-gradient btn-sm" onclick="payClaimAction(' + claim.id + ')">Pay ' + ethers.formatEther(claim.amount) + ' ETH</button>';

    return '<div class="claim-card glass">' +
        '<div class="card-header">' +
        '<span class="card-id">Claim #' + claim.id + '</span>' +
        '<span class="card-status status-' + type + '">' + type.charAt(0).toUpperCase() + type.slice(1) + '</span>' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="card-row"><span class="card-label">Claimant</span><span class="card-value">' + claim.claimant.slice(0, 10) + '...</span></div>' +
        '<div class="card-row"><span class="card-label">Amount</span><span class="card-value">' + ethers.formatEther(claim.amount) + ' ETH</span></div>' +
        '<div class="card-row"><span class="card-label">Provider</span><span class="card-value">' + claim.medicalProvider + '</span></div>' +
        '<div class="card-row"><span class="card-label">Description</span><span class="card-value">' + claim.description + '</span></div>' +
        '</div>' +
        '<div class="card-actions">' + actions + '</div>' +
        '</div>';
}

// ============ Contract Interactions ============
function createPolicy(planId) {
    if (!currentAccount) {
        showToast("Please connect your wallet first!", "error");
        return;
    }

    document.getElementById("selectedPlan").value = planId;
    document.getElementById("modalPlanType").textContent = POLICY_TYPES[planId];
    document.getElementById("modalPlanPremium").textContent = POLICY_PREMIUMS[planId] + " ETH";
    showModal("policyModal");
}

async function handleCreatePolicy(e) {
    e.preventDefault();

    var name = document.getElementById("holderName").value;
    var planId = parseInt(document.getElementById("selectedPlan").value);
    var premium = POLICY_PREMIUMS[planId];

    showLoader(true);
    closeModal("policyModal");

    try {
        var tx = await contract.createPolicy(name, planId, { value: ethers.parseEther(premium) });
        showToast("Transaction submitted. Waiting for confirmation...", "info");
        await tx.wait();
        showToast("Policy created successfully!", "success");
        document.getElementById("policyForm").reset();
        await refreshData();
    } catch (error) {
        console.error(error);
        showToast("Failed to create policy: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

async function handleSubmitClaim(e) {
    e.preventDefault();

    var policyId = document.getElementById("claimPolicyId").value;
    var amount = document.getElementById("claimAmount").value;
    var medProvider = document.getElementById("medicalProvider").value;
    var description = document.getElementById("claimDescription").value;

    if (!policyId) {
        showToast("Please select a policy", "error");
        return;
    }

    showLoader(true);

    try {
        var tx = await contract.submitClaim(policyId, ethers.parseEther(amount), description, medProvider);
        showToast("Submitting claim...", "info");
        await tx.wait();
        showToast("Claim submitted successfully!", "success");
        document.getElementById("claimForm").reset();
        await refreshData();
    } catch (error) {
        console.error(error);
        showToast("Failed to submit claim: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

async function approveClaim(claimId) {
    showLoader(true);

    try {
        var tx = await contract.approveClaim(claimId);
        await tx.wait();
        showToast("Claim approved!", "success");
        await loadAdminData();
        await refreshData();
    } catch (error) {
        showToast("Failed to approve: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

function showRejectModal(claimId) {
    document.getElementById("rejectClaimId").value = claimId;
    showModal("rejectModal");
}

async function handleRejectClaim(e) {
    e.preventDefault();

    var claimId = document.getElementById("rejectClaimId").value;
    var reason = document.getElementById("rejectReason").value;

    showLoader(true);
    closeModal("rejectModal");

    try {
        var tx = await contract.rejectClaim(claimId, reason);
        await tx.wait();
        showToast("Claim rejected!", "success");
        await loadAdminData();
    } catch (error) {
        showToast("Failed to reject: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

async function payClaimAction(claimId) {
    showLoader(true);

    try {
        var tx = await contract.payClaim(claimId);
        await tx.wait();
        showToast("Claim paid successfully!", "success");
        await loadAdminData();
        await refreshData();
    } catch (error) {
        showToast("Failed to pay claim: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

async function handleDeposit(e) {
    e.preventDefault();

    var amount = document.getElementById("depositAmount").value;

    showLoader(true);
    closeModal("depositModal");

    try {
        var tx = await contract.depositFunds({ value: ethers.parseEther(amount) });
        await tx.wait();
        showToast("Funds deposited successfully!", "success");
        await refreshData();
    } catch (error) {
        showToast("Failed to deposit: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

async function handleWithdraw(e) {
    e.preventDefault();

    var amount = document.getElementById("withdrawAmount").value;

    showLoader(true);
    closeModal("withdrawModal");

    try {
        var tx = await contract.withdrawFunds(ethers.parseEther(amount));
        await tx.wait();
        showToast("Funds withdrawn successfully!", "success");
        await refreshData();
    } catch (error) {
        showToast("Failed to withdraw: " + (error.reason || error.message), "error");
    }

    showLoader(false);
}

// ============ UI Helpers ============
function showModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.add("active");
}

function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove("active");
}

function showLoader(show) {
    var loader = document.getElementById("loader");
    if (loader) {
        if (show) {
            loader.classList.add("active");
        } else {
            loader.classList.remove("active");
        }
    }
}

function showToast(message, type) {
    type = type || "info";
    var toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = message;
        toast.className = "toast " + type + " show";
        setTimeout(function () {
            toast.classList.remove("show");
        }, 4000);
    }
}

// Make functions globally available
window.createPolicy = createPolicy;
window.approveClaim = approveClaim;
window.showRejectModal = showRejectModal;
window.payClaimAction = payClaimAction;
window.showModal = showModal;
window.closeModal = closeModal;
