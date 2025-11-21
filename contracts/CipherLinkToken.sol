// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CipherLink Token ($CLINK)
 * @notice ERC20 token with simple engagement-based reward mechanics.
 */
contract CipherLinkToken is ERC20, Ownable {
    /// @notice Pending, unclaimed rewards per user.
    mapping(address => uint256) public pendingRewards;

    /// @notice Address allowed to submit verified engagement.
    address public engagementOracle;

    /// @notice Emitted when a user claims their pending rewards.
    event RewardsClaimed(address indexed user, uint256 amount);

    /// @notice Emitted when the oracle records engagement for a user.
    event EngagementVerified(address indexed user, uint256 score);

    /// @notice Emitted when the oracle address changes.
    event OracleUpdated(address indexed newOracle);

    /// @notice Ensures only the oracle can call.
    modifier onlyOracle() {
        require(msg.sender == engagementOracle, "Not oracle");
        _;
    }

    /**
     * @notice Mint full supply to deployer and set initial oracle.
     * Total supply: 1,000,000,000 * 10^18.
     */
    constructor() ERC20("CipherLink", "CLINK") Ownable() {
        uint256 totalSupply = 1_000_000_000 * 10 ** decimals();
        _mint(msg.sender, totalSupply);
        engagementOracle = msg.sender;
    }

    /**
     * @notice Update the engagement oracle. Owner-only.
     * @param _oracle New oracle address.
     */
    function setEngagementOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        engagementOracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    /**
     * @notice Record engagement and accrue token rewards for a user.
     * @dev Only callable by the oracle. Conversion: 100 score = 1 CLINK.
     * @param _user Address receiving credit.
     * @param _score Engagement score (arbitrary units from oracle).
     */
    function updateEngagementScore(address _user, uint256 _score) external onlyOracle {
        require(_user != address(0), "Invalid user");
        uint256 rewardAmount = (_score * (10 ** decimals())) / 100;
        pendingRewards[_user] += rewardAmount;
        emit EngagementVerified(_user, _score);
    }

    /**
     * @notice Claim accumulated rewards. Transfers from owner/treasury to caller.
     */
    function claimRewards() external {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards");
        pendingRewards[msg.sender] = 0;
        _transfer(owner(), msg.sender, amount);
        emit RewardsClaimed(msg.sender, amount);
    }

    /**
     * @notice Burn tokens to simulate premium feature purchase.
     * @param _cost Amount of tokens to burn.
     */
    function purchasePremiumFeature(uint256 _cost) external {
        _burn(msg.sender, _cost);
    }
}
