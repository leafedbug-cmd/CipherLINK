import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

function readSavedAddress(): string | undefined {
  const jsonPath = path.join(__dirname, "..", "frontend", "contracts.json");
  if (!fs.existsSync(jsonPath)) return undefined;
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  return data.CipherLinkToken;
}

async function main() {
  const [oracle, fallbackUser] = await ethers.getSigners();
  const user = process.env.TEST_USER || fallbackUser.address;
  const score = Number(process.env.TEST_SCORE || 420);

  const tokenAddress =
    process.env.TOKEN_ADDRESS || readSavedAddress() || undefined;
  if (!tokenAddress) {
    throw new Error("Set TOKEN_ADDRESS env var or have frontend/contracts.json");
  }

  const token = await ethers.getContractAt("CipherLinkToken", tokenAddress);
  console.log(
    `Updating engagement for ${user} with score ${score} using oracle ${oracle.address}`
  );

  const tx = await token.connect(oracle).updateEngagementScore(user, score);
  await tx.wait();
  console.log("Engagement updated. Pending rewards:", await token.pendingRewards(user));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
