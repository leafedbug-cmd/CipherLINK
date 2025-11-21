# CipherLink — Chat-to-Earn MVP

CipherLink is a lean, on-chain reward loop for chat engagement. An oracle assigns scores, users claim CLINK, and premium features burn tokens.

## What ships in this MVP
- **Solidity**: `contracts/CipherLinkToken.sol` — ERC20 + oracle-managed engagement rewards + burn mechanic.
- **Hardhat**: scripts to deploy, set oracle, and demo engagement updates.
- **Tests**: Mocha/Chai coverage for core flows.
- **Frontend** (`frontend/`): Next.js dApp to connect a wallet, view pending rewards, and claim CLINK. Includes a static chat placeholder.

## Token + Flow
- **Mint**: 1,000,000,000 CLINK minted to owner/treasury at deploy.
- **Oracle**: `engagementOracle` (owner by default) calls `updateEngagementScore(user, score)`.
  - Conversion: 100 score = 1 CLINK → `reward = score * 10^18 / 100`.
  - Rewards accumulate in `pendingRewards`.
- **Claim**: Users call `claimRewards()`; tokens move from owner treasury to the caller; pending resets to 0.
- **Spend**: `purchasePremiumFeature(cost)` burns caller’s tokens to simulate premium unlocks.

## Setup
All commands run from the repo root `CipherLINK/` unless noted.

1) **Install deps**
   ```bash
   npm install
   cd frontend && npm install
   ```

2) **Environment**  
   Create `.env` with:
   ```bash
   ALCHEMY_API_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=0xyourprivkey
   ```

3) **Compile**
   ```bash
   npm run compile
   ```

4) **Test**
   ```bash
   npm test
   ```

5) **Deploy to testnet**
   ```bash
   npm run deploy:testnet --network polygonAmoy
   ```
   The deploy script logs the address and writes `frontend/contracts.json` for the dApp.

6) **Set oracle (optional)**
   ```bash
   TOKEN_ADDRESS=0x... NEW_ORACLE=0xNewOracleAddress npx hardhat run scripts/setOracle.ts --network polygonAmoy
   ```

7) **Post an engagement score (example)**
   ```bash
   TOKEN_ADDRESS=0x... TEST_USER=0xUserAddress TEST_SCORE=450 npx hardhat run scripts/updateEngagementExample.ts --network polygonAmoy
   ```

8) **Run the dApp**
   ```bash
   cd frontend
   npm run dev
   ```
   - Update `frontend/contracts.json` if you deploy again.
   - Open http://localhost:3000, connect MetaMask, view pending rewards, and claim.

## Files to know
- `contracts/CipherLinkToken.sol`: ERC20 + pending rewards + oracle + burn.
- `scripts/deploy.ts`: Deploys the token and saves the address for the frontend.
- `scripts/setOracle.ts`: Changes `engagementOracle`.
- `scripts/updateEngagementExample.ts`: Demo engagement update call.
- `test/CipherLinkToken.test.ts`: Coverage for deployment, oracle guard, rewards, claims, and burns.
- `frontend/app/page.tsx`: Wallet connect, rewards display, claim button, and chat placeholder UI.

## Reward lifecycle (quick bullets)
- **Earn**: Oracle → `updateEngagementScore(user, score)` → `pendingRewards[user]` grows.
- **Pending**: Off-chain engagement stays as on-chain pending balances.
- **Claim**: User clicks Claim in dApp → `claimRewards()` → CLINK moves from treasury to user.
- **Spend**: User calls `purchasePremiumFeature(cost)` to burn tokens for premium perks.

## Notes
- No RPC URLs or keys are committed; fill `.env` per your provider.
- Frontend uses ethers v6 + MetaMask (`window.ethereum`) and reads the address from `frontend/contracts.json`.
