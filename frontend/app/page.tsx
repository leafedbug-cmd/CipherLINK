'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contracts from "../contracts.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const abi = [
  "function pendingRewards(address) view returns (uint256)",
  "function claimRewards()",
];

const contractAddress =
  (contracts as { CipherLinkToken?: string }).CipherLinkToken ||
  "0xYourDeploymentAddress";

type TxState = "idle" | "pending" | "confirmed" | "error";

const placeholderMessages = [
  "Nova: Just hit a new engagement streak!",
  "CipherBot: Rewards queued. Keep chatting.",
  "Kairo: Loving the CLINK vibes already.",
  "Mila: Who's farming the leaderboard today?",
  "Remy: Dropped a meme, waiting on oracle.",
  "Ada: Coffee + chat = CLINK time.",
  "Edge: Testing claim flow in the dApp.",
  "Lumen: Whispering alpha about premium perks.",
  "Vale: Gas is low, time to claim.",
  "Rune: How fast will oracle post scores?",
  "Nia: UI feels slick for an MVP.",
  "Orrin: Can't wait for chat backend.",
  "Cyra: Dark mode soon? maybe.",
  "Slate: Wallet connected, let's roll.",
  "Ash: Pending rewards looking juicy.",
  "June: Waiting on my score update.",
  "Ives: Thinking about integrations.",
  "Sora: CLINK is the new vibe.",
  "Pax: Refreshing pending rewards...",
  "Ember: Claim confirmed, smooth!",
  "Tala: Oracle set to new address.",
  "Hex: Testing burner account login.",
  "Moss: Imagining premium features.",
  "Rive: Oracle signed my streak!",
  "Echo: Messaged an NFT collector.",
  "Noor: This feed will be live soon.",
  "Grey: How to spend CLINK next?",
  "Lux: Ping me when chat ships.",
  "Vega: Love the gradient backdrop.",
  "Skye: Claiming on mobile works.",
  "Nyx: Rewards reset after claim.",
  "Indy: Deployed on testnet today.",
  "Kael: Building bots for CipherLink.",
  "Rue: Documenting the reward loop.",
  "Dune: Waiting for on-chain chat.",
];

export default function Home() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [pendingRaw, setPendingRaw] = useState<bigint>(0n);
  const [pendingFormatted, setPendingFormatted] = useState<string>("0");
  const [txState, setTxState] = useState<TxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const hasMetaMask = useMemo(
    () => typeof window !== "undefined" && !!window.ethereum,
    []
  );

  useEffect(() => {
    if (!hasMetaMask) return;
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(browserProvider);

    // Auto-populate account if already connected in wallet.
    browserProvider
      .send("eth_accounts", [])
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(ethers.getAddress(accounts[0]));
        }
      })
      .catch(() => {
        /* best-effort */
      });
  }, [hasMetaMask]);

  const fetchPending = useCallback(async () => {
    if (!account || !provider) return;
    const contract = new Contract(contractAddress, abi, provider);
    setIsFetching(true);
    try {
      const value: bigint = await contract.pendingRewards(account);
      setPendingRaw(value);
      setPendingFormatted(ethers.formatUnits(value, 18));
    } catch (err: any) {
      console.error(err);
      setTxError(err?.message || "Failed to fetch rewards");
    } finally {
      setIsFetching(false);
    }
  }, [account, provider]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const connectWallet = async () => {
    setTxError(null);
    if (!hasMetaMask) return;

    try {
      const browserProvider = provider || new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts.length) {
        const normalized = ethers.getAddress(accounts[0]);
        setAccount(normalized);
      }
    } catch (err: any) {
      setTxError(err?.message || "Wallet connection failed");
    }
  };

  const handleClaim = async () => {
    if (!account || !provider) return;
    setTxError(null);
    setTxState("pending");
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);
      const tx = await contract.claimRewards();
      await tx.wait();
      setTxState("confirmed");
      await fetchPending();
    } catch (err: any) {
      console.error(err);
      setTxState("error");
      setTxError(err?.message || "Claim failed");
    }
  };

  const claimDisabled =
    !account || pendingRaw === 0n || txState === "pending" || isFetching;

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">$CLINK</p>
        <h1>CipherLink: Chat-to-Earn MVP</h1>
        <p className="lede">
          Connect your wallet, view pending rewards from the engagement oracle,
          and claim CLINK in one click.
        </p>
      </header>

      <section className="card">
        <div className="row">
          <div>
            <p className="label">Wallet</p>
            <p className="value">{account ?? "Not connected"}</p>
          </div>
          <div>
            {hasMetaMask ? (
              <button onClick={connectWallet} className="btn">
                {account ? "Reconnect" : "Connect Wallet"}
              </button>
            ) : (
              <span className="warning">Install MetaMask to continue.</span>
            )}
          </div>
        </div>

        <div className="row">
          <div>
            <p className="label">Pending Rewards</p>
            <p className="value accent">
              {isFetching ? "Loading..." : `${pendingFormatted} CLINK`}
            </p>
          </div>
          <div className="actions">
            <button className="ghost" onClick={fetchPending} disabled={!account}>
              Refresh
            </button>
            <button
              className="btn primary"
              onClick={handleClaim}
              disabled={claimDisabled}
            >
              {txState === "pending" ? "Claiming..." : "Claim Rewards"}
            </button>
          </div>
        </div>

        <div className="status">
          <p className="label">Status</p>
          <p className="value">
            {txState === "confirmed" && "Claim confirmed."}
            {txState === "pending" && "Transaction sent..."}
            {txState === "error" && txError}
            {txState === "idle" && !txError && "Standing by."}
          </p>
          {txError && <p className="error">Error: {txError}</p>}
        </div>
      </section>

      <section className="card chat">
        <div className="row">
          <div>
            <p className="label">Chat Feed (placeholder)</p>
            <p className="muted">
              Engagement happens off-chain; this static feed is a visual stub for
              future messaging.
            </p>
          </div>
        </div>
        <div className="chat-feed">
          {placeholderMessages.map((msg, idx) => (
            <div key={idx} className="chat-line">
              <span className="bubble">{msg}</span>
            </div>
          ))}
        </div>
        <div className="input-row">
          <input disabled placeholder="Chat coming soon. This MVP focuses on rewards." />
          <button className="btn" disabled>
            Send
          </button>
        </div>
      </section>

      <footer className="footer">
        <p>
          Earn = oracle posts engagement. Claim = you pull CLINK. Spend = burn via
          premium features.
        </p>
      </footer>
    </main>
  );
}
