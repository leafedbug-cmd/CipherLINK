import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("CipherLinkToken", () => {
  async function deployFixture() {
    const [owner, oracle, user, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CipherLinkToken");
    const token = await Factory.deploy();
    await token.waitForDeployment();
    return { token, owner, oracle, user, other };
  }

  const totalSupply = ethers.parseEther("1000000000"); // 1,000,000,000 CLINK

  describe("Deployment", () => {
    it("sets name, symbol, supply, and oracle", async () => {
      const { token, owner } = await loadFixture(deployFixture);
      expect(await token.name()).to.equal("CipherLink");
      expect(await token.symbol()).to.equal("CLINK");
      expect(await token.totalSupply()).to.equal(totalSupply);
      expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await token.engagementOracle()).to.equal(owner.address);
    });
  });

  describe("Oracle Role", () => {
    it("only oracle can update engagement", async () => {
      const { token, other, user } = await loadFixture(deployFixture);
      await expect(
        token.connect(other).updateEngagementScore(user.address, 100)
      ).to.be.revertedWith("Not oracle");
    });

    it("owner can set a new oracle", async () => {
      const { token, owner, oracle } = await loadFixture(deployFixture);
      await expect(token.connect(owner).setEngagementOracle(oracle.address))
        .to.emit(token, "OracleUpdated")
        .withArgs(oracle.address);
      expect(await token.engagementOracle()).to.equal(oracle.address);
    });
  });

  describe("Engagement & Rewards", () => {
    it("accrues pending rewards according to score", async () => {
      const { token, owner, user } = await loadFixture(deployFixture);
      const score = 250; // expected reward = 2.5 CLINK
      const expectedReward = (BigInt(score) * 10n ** 18n) / 100n;
      await token.connect(owner).updateEngagementScore(user.address, score);
      expect(await token.pendingRewards(user.address)).to.equal(expectedReward);
    });
  });

  describe("Claiming Rewards", () => {
    it("transfers rewards to user and clears pending", async () => {
      const { token, owner, user } = await loadFixture(deployFixture);
      const score = 500; // 5 CLINK
      const reward = (BigInt(score) * 10n ** 18n) / 100n;

      await token.connect(owner).updateEngagementScore(user.address, score);

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      await expect(token.connect(user).claimRewards())
        .to.emit(token, "RewardsClaimed")
        .withArgs(user.address, reward);

      expect(await token.pendingRewards(user.address)).to.equal(0n);
      expect(await token.balanceOf(user.address)).to.equal(reward);
      expect(await token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore - reward
      );
    });
  });

  describe("Premium Feature Burn", () => {
    it("burns tokens and reduces total supply", async () => {
      const { token, owner, user } = await loadFixture(deployFixture);
      const cost = ethers.parseEther("10");

      // Fund user then burn
      await token.connect(owner).transfer(user.address, cost);
      const supplyBefore = await token.totalSupply();

      await token.connect(user).purchasePremiumFeature(cost);
      expect(await token.balanceOf(user.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(supplyBefore - cost);
    });
  });
});
