// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthInsurance
 * @dev Decentralized Health Insurance Smart Contract
 * @notice Manages insurance policies and claims on the blockchain
 */
contract HealthInsurance {
    
    // ============ State Variables ============
    address public insurer;
    uint256 public policyCounter;
    uint256 public claimCounter;
    
    // ============ Enums ============
    enum PolicyStatus { Active, Expired, Cancelled }
    enum ClaimStatus { Pending, Approved, Rejected, Paid }
    enum PolicyType { Basic, Standard, Premium, Enterprise }
    
    // ============ Structs ============
    struct Policy {
        uint256 id;
        address holder;
        string holderName;
        uint256 coverageAmount;
        uint256 premium;
        uint256 startDate;
        uint256 endDate;
        PolicyStatus status;
        PolicyType policyType;
        uint256 claimsMade;
        uint256 totalClaimsPaid;
    }
    
    struct Claim {
        uint256 id;
        uint256 policyId;
        address claimant;
        uint256 amount;
        string description;
        string medicalProvider;
        uint256 dateSubmitted;
        uint256 dateProcessed;
        ClaimStatus status;
        string rejectionReason;
    }
    
    // ============ Mappings ============
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userPolicies;
    mapping(address => uint256[]) public userClaims;
    mapping(address => bool) public registeredUsers;
    
    // ============ Events ============
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed holder,
        string holderName,
        uint256 coverageAmount,
        uint256 premium,
        PolicyType policyType
    );
    
    event PolicyCancelled(uint256 indexed policyId, address indexed holder);
    
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        uint256 amount,
        string description
    );
    
    event ClaimApproved(uint256 indexed claimId, uint256 amount);
    event ClaimRejected(uint256 indexed claimId, string reason);
    event ClaimPaid(uint256 indexed claimId, address indexed recipient, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    // ============ Modifiers ============
    modifier onlyInsurer() {
        require(msg.sender == insurer, "Only insurer can perform this action");
        _;
    }
    
    modifier onlyPolicyHolder(uint256 _policyId) {
        require(policies[_policyId].holder == msg.sender, "Only policy holder can perform this action");
        _;
    }
    
    modifier policyExists(uint256 _policyId) {
        require(_policyId > 0 && _policyId <= policyCounter, "Policy does not exist");
        _;
    }
    
    modifier claimExists(uint256 _claimId) {
        require(_claimId > 0 && _claimId <= claimCounter, "Claim does not exist");
        _;
    }
    
    modifier policyActive(uint256 _policyId) {
        require(policies[_policyId].status == PolicyStatus.Active, "Policy is not active");
        require(block.timestamp <= policies[_policyId].endDate, "Policy has expired");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        insurer = msg.sender;
        policyCounter = 0;
        claimCounter = 0;
    }
    
    // ============ Policy Functions ============
    
    /**
     * @dev Create a new insurance policy
     * @param _holderName Name of the policy holder
     * @param _policyType Type of policy (Basic, Standard, Premium, Enterprise)
     */
    function createPolicy(
        string memory _holderName,
        PolicyType _policyType
    ) external payable returns (uint256) {
        require(bytes(_holderName).length > 0, "Holder name is required");
        
        // Calculate coverage and premium based on policy type
        (uint256 coverage, uint256 premium) = _getPolicyDetails(_policyType);
        require(msg.value >= premium, "Insufficient premium payment");
        
        policyCounter++;
        uint256 policyId = policyCounter;
        
        policies[policyId] = Policy({
            id: policyId,
            holder: msg.sender,
            holderName: _holderName,
            coverageAmount: coverage,
            premium: premium,
            startDate: block.timestamp,
            endDate: block.timestamp + 365 days,
            status: PolicyStatus.Active,
            policyType: _policyType,
            claimsMade: 0,
            totalClaimsPaid: 0
        });
        
        userPolicies[msg.sender].push(policyId);
        registeredUsers[msg.sender] = true;
        
        // Refund excess payment
        if (msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }
        
        emit PolicyCreated(policyId, msg.sender, _holderName, coverage, premium, _policyType);
        
        return policyId;
    }
    
    /**
     * @dev Get policy details based on type
     */
    function _getPolicyDetails(PolicyType _type) internal pure returns (uint256 coverage, uint256 premium) {
        if (_type == PolicyType.Basic) {
            return (1 ether, 0.01 ether);
        } else if (_type == PolicyType.Standard) {
            return (5 ether, 0.05 ether);
        } else if (_type == PolicyType.Premium) {
            return (10 ether, 0.1 ether);
        } else {
            return (50 ether, 0.5 ether);
        }
    }
    
    /**
     * @dev Cancel an active policy
     */
    function cancelPolicy(uint256 _policyId) 
        external 
        policyExists(_policyId) 
        onlyPolicyHolder(_policyId) 
        policyActive(_policyId) 
    {
        policies[_policyId].status = PolicyStatus.Cancelled;
        emit PolicyCancelled(_policyId, msg.sender);
    }
    
    /**
     * @dev Renew an existing policy
     */
    function renewPolicy(uint256 _policyId) 
        external 
        payable 
        policyExists(_policyId) 
        onlyPolicyHolder(_policyId) 
    {
        Policy storage policy = policies[_policyId];
        require(policy.status != PolicyStatus.Cancelled, "Cannot renew cancelled policy");
        require(msg.value >= policy.premium, "Insufficient premium payment");
        
        policy.endDate = block.timestamp + 365 days;
        policy.status = PolicyStatus.Active;
        
        if (msg.value > policy.premium) {
            payable(msg.sender).transfer(msg.value - policy.premium);
        }
    }
    
    // ============ Claim Functions ============
    
    /**
     * @dev Submit a new insurance claim
     */
    function submitClaim(
        uint256 _policyId,
        uint256 _amount,
        string memory _description,
        string memory _medicalProvider
    ) external policyExists(_policyId) policyActive(_policyId) onlyPolicyHolder(_policyId) returns (uint256) {
        require(_amount > 0, "Claim amount must be greater than 0");
        require(_amount <= policies[_policyId].coverageAmount, "Claim exceeds coverage amount");
        require(bytes(_description).length > 0, "Description is required");
        require(bytes(_medicalProvider).length > 0, "Medical provider is required");
        
        // Check remaining coverage
        uint256 remainingCoverage = policies[_policyId].coverageAmount - policies[_policyId].totalClaimsPaid;
        require(_amount <= remainingCoverage, "Claim exceeds remaining coverage");
        
        claimCounter++;
        uint256 claimId = claimCounter;
        
        claims[claimId] = Claim({
            id: claimId,
            policyId: _policyId,
            claimant: msg.sender,
            amount: _amount,
            description: _description,
            medicalProvider: _medicalProvider,
            dateSubmitted: block.timestamp,
            dateProcessed: 0,
            status: ClaimStatus.Pending,
            rejectionReason: ""
        });
        
        userClaims[msg.sender].push(claimId);
        policies[_policyId].claimsMade++;
        
        emit ClaimSubmitted(claimId, _policyId, msg.sender, _amount, _description);
        
        return claimId;
    }
    
    /**
     * @dev Approve a pending claim (Insurer only)
     */
    function approveClaim(uint256 _claimId) 
        external 
        onlyInsurer 
        claimExists(_claimId) 
    {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");
        
        claim.status = ClaimStatus.Approved;
        claim.dateProcessed = block.timestamp;
        
        emit ClaimApproved(_claimId, claim.amount);
    }
    
    /**
     * @dev Reject a pending claim (Insurer only)
     */
    function rejectClaim(uint256 _claimId, string memory _reason) 
        external 
        onlyInsurer 
        claimExists(_claimId) 
    {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");
        require(bytes(_reason).length > 0, "Rejection reason is required");
        
        claim.status = ClaimStatus.Rejected;
        claim.dateProcessed = block.timestamp;
        claim.rejectionReason = _reason;
        
        emit ClaimRejected(_claimId, _reason);
    }
    
    /**
     * @dev Pay an approved claim (Insurer only)
     */
    function payClaim(uint256 _claimId) 
        external 
        onlyInsurer 
        claimExists(_claimId) 
    {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Approved, "Claim is not approved");
        require(address(this).balance >= claim.amount, "Insufficient contract balance");
        
        claim.status = ClaimStatus.Paid;
        policies[claim.policyId].totalClaimsPaid += claim.amount;
        
        payable(claim.claimant).transfer(claim.amount);
        
        emit ClaimPaid(_claimId, claim.claimant, claim.amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get policy details
     */
    function getPolicy(uint256 _policyId) 
        external 
        view 
        policyExists(_policyId) 
        returns (Policy memory) 
    {
        return policies[_policyId];
    }
    
    /**
     * @dev Get claim details
     */
    function getClaim(uint256 _claimId) 
        external 
        view 
        claimExists(_claimId) 
        returns (Claim memory) 
    {
        return claims[_claimId];
    }
    
    /**
     * @dev Get all policies for a user
     */
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }
    
    /**
     * @dev Get all claims for a user
     */
    function getUserClaims(address _user) external view returns (uint256[] memory) {
        return userClaims[_user];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get policy type details
     */
    function getPolicyTypeDetails(PolicyType _type) external pure returns (uint256 coverage, uint256 premium) {
        return _getPolicyDetails(_type);
    }
    
    /**
     * @dev Check if a policy is valid
     */
    function isPolicyValid(uint256 _policyId) external view policyExists(_policyId) returns (bool) {
        Policy memory policy = policies[_policyId];
        return policy.status == PolicyStatus.Active && block.timestamp <= policy.endDate;
    }
    
    /**
     * @dev Get remaining coverage for a policy
     */
    function getRemainingCoverage(uint256 _policyId) external view policyExists(_policyId) returns (uint256) {
        Policy memory policy = policies[_policyId];
        return policy.coverageAmount - policy.totalClaimsPaid;
    }
    
    /**
     * @dev Get all pending claims (Insurer only)
     */
    function getPendingClaimsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (claims[i].status == ClaimStatus.Pending) {
                count++;
            }
        }
        return count;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Deposit funds into the contract (Insurer only)
     */
    function depositFunds() external payable onlyInsurer {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw funds from the contract (Insurer only)
     */
    function withdrawFunds(uint256 _amount) external onlyInsurer {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(_amount <= address(this).balance, "Insufficient contract balance");
        
        payable(insurer).transfer(_amount);
        emit FundsWithdrawn(insurer, _amount);
    }
    
    /**
     * @dev Transfer insurer role
     */
    function transferInsurer(address _newInsurer) external onlyInsurer {
        require(_newInsurer != address(0), "Invalid address");
        insurer = _newInsurer;
    }
    
    // ============ Receive Function ============
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
