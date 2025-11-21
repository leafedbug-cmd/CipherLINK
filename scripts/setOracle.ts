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
  const newOracle = process.argv[2] || process.env.NEW_ORACLE;
  if (!newOracle) {
    throw new Error("Provide new oracle as CLI arg or NEW_ORACLE env var");
  }

  const tokenAddress =
    process.env.TOKEN_ADDRESS || readSavedAddress() || undefined;
  if (!tokenAddress) {
    throw new Error("Set TOKEN_ADDRESS env var or have frontend/contracts.json");
  }

  const token = await ethers.getContractAt("CipherLinkToken", tokenAddress);
  const tx = await token.setEngagementOracle(newOracle);
  await tx.wait();
  console.log(`Oracle updated to ${newOracle} on ${tokenAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
