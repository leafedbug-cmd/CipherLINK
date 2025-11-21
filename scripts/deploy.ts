import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const Token = await ethers.getContractFactory("CipherLinkToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`CipherLinkToken deployed to: ${address}`);

  // Persist address for frontend consumption.
  const outPath = path.join(__dirname, "..", "frontend", "contracts.json");
  const payload = { CipherLinkToken: address };
  try {
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Saved contract address to ${outPath}`);
  } catch (err) {
    console.warn("Could not write frontend/contracts.json (optional):", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
