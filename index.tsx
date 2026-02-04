import { createRoot } from "react-dom/client";
import React, { useCallback, useEffect, useState } from "react";
import { capacityOf, generateAccountFromPrivateKey, shannonToCKB, transfer, wait } from "./lib";
import { Script } from "@ckb-ccc/core";

const PRIVATE_KEY_REGEX = /^0x[0-9a-fA-F]{64}$/;
function isValidPrivateKey(value: string): boolean {
  return value === "" || PRIVATE_KEY_REGEX.test(value);
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export function App() {
  const [privKey, setPrivKey] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [fromLock, setFromLock] = useState<Script>();
  const [balance, setBalance] = useState("0");

  const [toAddr, setToAddr] = useState("");
  const [amountInCKB, setAmountInCKB] = useState("62");

  const [isTransferring, setIsTransferring] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const updateFromInfo = useCallback(async () => {
    if (!privKey || !isValidPrivateKey(privKey)) return;
    setError(null);
    try {
      const { lockScript, address } = await generateAccountFromPrivateKey(privKey);
      const capacity = await capacityOf(address);
      setFromAddr(address);
      setFromLock(lockScript);
      setBalance(shannonToCKB(capacity).toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    }
  }, [privKey]);

  useEffect(() => {
    if (privKey) {
      updateFromInfo();
    } else {
      setFromAddr("");
      setFromLock(undefined);
      setBalance("0");
    }
  }, [privKey, updateFromInfo]);

  const onTransfer = async () => {
    if (!isValidPrivateKey(privKey)) {
      setError("Invalid private key: must start with 0x and be 32 bytes (64 hex chars).");
      return;
    }
    setError(null);
    setIsTransferring(true);
    try {
      const hash = await transfer(toAddr, amountInCKB, privKey);
      if (hash) {
        setTxHash(hash);
        await wait(10);
        await updateFromInfo();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  const validPrivKey = isValidPrivateKey(privKey);
  const enabled =
    validPrivKey &&
    +amountInCKB > 61 &&
    +balance >= +amountInCKB &&
    toAddr.length > 0 &&
    !isTransferring;
  const amountTip =
    amountInCKB.length > 0 && +amountInCKB < 61 ? (
      <span>
        Amount must be larger than 61 CKB, see{" "}
        <a href="https://docs.nervos.org/docs/wallets/#requirements-for-ckb-transfers" target="_blank" rel="noopener noreferrer">
          why
        </a>
      </span>
    ) : null;

  return (
    <div style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>View and Transfer Balance</h1>
      {error && (
        <div style={{ padding: "0.75rem", marginBottom: "1rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 6 }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="private-key">Private Key</label>
        <input
          id="private-key"
          type="password"
          autoComplete="off"
          placeholder="0x..."
          value={privKey}
          onChange={(e) => setPrivKey(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem", boxSizing: "border-box" }}
        />
        {privKey && !validPrivKey && (
          <small style={{ color: "#b91c1c" }}>Must start with 0x and be 64 hex characters.</small>
        )}
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>CKB Address: {fromAddr || "—"}</li>
        <li>
          Lock script: <pre style={{ overflow: "auto", background: "#f4f4f4", padding: "0.5rem", borderRadius: 4 }}>{JSON.stringify(fromLock ?? {}, null, 2)}</pre>
        </li>
        <li>Total capacity: {balance} CKB</li>
      </ul>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="to-address">Transfer to Address</label>
        <input
          id="to-address"
          type="text"
          placeholder="ckt1..."
          value={toAddr}
          onChange={(e) => setToAddr(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="amount">Amount (CKB)</label>
        <input
          id="amount"
          type="number"
          min={61}
          value={amountInCKB}
          onChange={(e) => setAmountInCKB(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem", boxSizing: "border-box" }}
        />
        <small style={{ color: "#666" }}>Min 61 CKB. Tx fee ~0.001 CKB.</small>
      </div>
      {amountTip && <small style={{ color: "#b91c1c", display: "block", marginBottom: "1rem" }}>{amountTip}</small>}
      <button
        disabled={!enabled}
        onClick={onTransfer}
        style={{
          padding: "0.5rem 1rem",
          cursor: enabled ? "pointer" : "not-allowed",
          opacity: enabled ? 1 : 0.6,
        }}
      >
        {isTransferring ? "Transferring…" : "Transfer"}
      </button>
      {txHash && (
        <div style={{ marginTop: "1rem", wordBreak: "break-all" }}>
          Tx hash: <code>{txHash}</code>
        </div>
      )}
    </div>
  );
}
