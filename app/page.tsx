"use client";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { CONTRACTS, ZKID_ABI } from "./lib/config";

const TIER_LABELS: Record<number, string> = { 1: "Basic", 2: "Verified", 3: "Premium" };
const TIER_COLORS: Record<number, string> = {
  1: "text-blue-400 border-blue-400",
  2: "text-purple-400 border-purple-400",
  3: "text-yellow-400 border-yellow-400",
};

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [minting, setMinting] = useState(false);

  const { data: hasZKID, refetch } = useReadContract({
    address: CONTRACTS.ZKID,
    abi: ZKID_ABI,
    functionName: "hasZKID",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: zkidInfo } = useReadContract({
    address: CONTRACTS.ZKID,
    abi: ZKID_ABI,
    functionName: "getZKIDInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasZKID },
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ZKID,
    abi: ZKID_ABI,
    functionName: "totalSupply",
  });

  const wrongNetwork = isConnected && chainId !== 133;

  const handleVerifyAndMint = async () => {
    if (!address) return;
    setLoading(true);
    setMinting(true);
    setError("");
    try {
      // Step 1: Get signature from HashKey backend
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Backend failed");

      const { nonce, tier, signature } = data;

      // Step 2: User claims from their own wallet
      const hash = await writeContractAsync({
        address: CONTRACTS.ZKID,
        abi: ZKID_ABI,
        functionName: "claimWithSignature",
        args: [nonce, tier, signature],
      });

      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await refetch();
    } catch (e: any) {
      setError(e?.message?.slice(0, 150) ?? "Failed");
    } finally {
      setLoading(false);
      setMinting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3"></div>
        <h1 className="text-3xl font-bold text-white">HashKey ZKID</h1>
        <p className="text-gray-400 mt-2">Privacy-preserving identity on HashKeyChain</p>
        {totalSupply !== undefined && (
          <p className="text-xs text-gray-600 mt-1">{totalSupply.toString()} identities minted</p>
        )}
      </div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">

        {/* Not connected */}
        {!isConnected && (
          <div className="space-y-3">
            <p className="text-gray-300 text-center mb-4">Connect your wallet to get started</p>
            {connectors.map((c) => (
              <button key={c.id} onClick={() => connect({ connector: c })}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
                Connect {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Wrong network */}
        {wrongNetwork && (
          <div className="text-center space-y-3">
            <p className="text-yellow-400"> Switch to HashKeyChain Testnet (133)</p>
            <button onClick={() => switchChain({ chainId: 133 })}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl transition-colors">
              Switch Network
            </button>
          </div>
        )}

        {/* Connected + correct network */}
        {isConnected && !wrongNetwork && (
          <>
            {/* Wallet info */}
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400">Connected Wallet</p>
              <p className="font-mono text-sm text-white truncate">{address}</p>
            </div>

            {/* Already has ZKID */}
            {hasZKID && zkidInfo ? (
              <div className="text-center space-y-4">
                <div className="text-4xl"></div>
                <p className="text-white font-bold text-xl">ZKID Verified!</p>
                <div className={`inline-block border rounded-full px-4 py-1 text-sm font-semibold ${TIER_COLORS[Number(zkidInfo[1])] ?? "text-gray-400 border-gray-400"}`}>
                  {TIER_LABELS[Number(zkidInfo[1])] ?? "Unknown"} Tier
                </div>
                <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token ID</span>
                    <span className="text-white">#{zkidInfo[0].toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Issued</span>
                    <span className="text-white">{new Date(Number(zkidInfo[2]) * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transferable</span>
                    <span className="text-red-400">Never (Soulbound)</span>
                  </div>
                </div>
                {txHash && (
                  <a href={`https://hashkeychain-testnet-explorer.alt.technology/tx/${txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline block">
                    View transaction 
                  </a>
                )}
                <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 text-sm text-green-300">
                   DeFi protocols can verify you without knowing who you are
                </div>
              </div>
            ) : minting ? (
              /* Minting state */
              <div className="text-center space-y-4 py-4">
                <div className="text-4xl animate-spin"></div>
                <p className="text-white font-semibold">Generating ZK Proof...</p>
                <p className="text-gray-400 text-sm">Proving identity without revealing it</p>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full animate-pulse w-3/5"/>
                </div>
              </div>
            ) : (
              /* Verify flow */
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-white">ZK Proof will verify:</p>
                  <div className="space-y-1.5 text-sm text-gray-300 mt-2">
                    <div className="flex items-center gap-2"><span className="text-green-400"></span> KYC verified by HashKey Exchange</div>
                    <div className="flex items-center gap-2"><span className="text-green-400"></span> Age  18</div>
                    <div className="flex items-center gap-2"><span className="text-green-400"></span> Not from sanctioned country</div>
                    <div className="flex items-center gap-2"><span className="text-gray-500"></span> <span className="text-gray-500">Identity stays private</span></div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs bg-red-900/20 rounded-lg p-2">{error}</p>}

                <button onClick={handleVerifyAndMint} disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                  {loading ? "Processing..." : "Verify Identity & Mint ZKID"}
                </button>
              </div>
            )}
          </>
        )}

        {isConnected && (
          <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-800">
            <span>HashKeyChain Testnet (133)</span>
            <button onClick={() => disconnect()} className="hover:text-gray-400">Disconnect</button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-600 text-center">
        Powered by Zero-Knowledge Proofs  ERC-5192 Soulbound NFT<br/>
        Built for HashKeyChain On-Chain Horizon Hackathon
      </p>
    </main>
  );
}
