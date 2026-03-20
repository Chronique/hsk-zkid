"use client";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { keccak256, encodePacked, createWalletClient, custom } from "viem";
import { CONTRACTS, ZKID_ABI, hashkeyTestnet } from "./lib/config";

const TIER_LABELS: Record<number, string> = { 1: "Basic", 2: "Verified", 3: "Premium" };
const TIER_COLORS: Record<number, string> = {
  1: "text-blue-400 border-blue-400",
  2: "text-purple-400 border-purple-400",
  3: "text-yellow-400 border-yellow-400",
};

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<"connect" | "verify" | "mint" | "done">("connect");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!isConnected) setStep("connect");
    else if (hasZKID) setStep("done");
    else setStep("verify");
  }, [isConnected, hasZKID]);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: 133 });
  };

  // Simulate ZK proof generation + mint via deployer (demo)
  const handleVerifyAndMint = async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    try {
      setStep("mint");
      // Simulate proof generation delay
      await new Promise(r => setTimeout(r, 2000));

      // For demo: direct mint via ZKID contract (deployer = verifier)
      // In production: call verifyAndMint with real ZK proof
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const hash = data.txHash;

      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await refetch();
      setStep("done");
    } catch (e: any) {
      setError(e?.message?.slice(0, 100) ?? "Transaction failed");
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const wrongNetwork = isConnected && chainId !== 133;

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3"></div>
        <h1 className="text-3xl font-bold text-white">HashKey ZKID</h1>
        <p className="text-gray-400 mt-2">Privacy-preserving identity on HashKeyChain</p>
        {totalSupply !== undefined && (
          <p className="text-xs text-gray-600 mt-1">{totalSupply.toString()} identities minted</p>
        )}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6">

        {/* Step: Connect */}
        {step === "connect" && (
          <div className="text-center space-y-4">
            <p className="text-gray-300">Connect your wallet to get started</p>
            <button onClick={handleConnect}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
              Connect Wallet
            </button>
          </div>
        )}

        {/* Wrong Network */}
        {wrongNetwork && (
          <div className="text-center space-y-4">
            <p className="text-yellow-400"> Switch to HashKeyChain Testnet</p>
            <button onClick={handleSwitchNetwork}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl transition-colors">
              Switch Network
            </button>
          </div>
        )}

        {/* Step: Verify */}
        {step === "verify" && !wrongNetwork && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400">Wallet</p>
              <p className="font-mono text-sm text-white truncate">{address}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white">ZK Proof will verify:</p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-green-400"></span> KYC verified by HashKey
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400"></span> Age  18
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400"></span> Not from sanctioned country
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span></span> Identity stays private
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button onClick={handleVerifyAndMint} disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              Verify Identity & Mint ZKID
            </button>
          </div>
        )}

        {/* Step: Minting */}
        {step === "mint" && (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl animate-spin"></div>
            <p className="text-white font-semibold">Generating ZK Proof...</p>
            <p className="text-gray-400 text-sm">Proving identity without revealing it</p>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{width: "60%"}}/>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && zkidInfo && (
          <div className="text-center space-y-4">
            <div className="text-5xl"></div>
            <p className="text-white font-bold text-xl">ZKID Verified!</p>

            <div className={`inline-block border rounded-full px-4 py-1 text-sm font-semibold ${TIER_COLORS[Number(zkidInfo[1])] ?? "text-gray-400 border-gray-400"}`}>
              {TIER_LABELS[Number(zkidInfo[1])] ?? "Unknown"} Tier
            </div>

            <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
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
               DeFi protocols on HashKeyChain can now verify you without knowing who you are
            </div>
          </div>
        )}

        {/* Connected footer */}
        {isConnected && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-600">
            <span>HashKeyChain Testnet (133)</span>
            <button onClick={() => disconnect()} className="hover:text-gray-400 transition-colors">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="mt-6 text-center text-xs text-gray-600 max-w-md">
        <p>Powered by Zero-Knowledge Proofs  ERC-5192 Soulbound NFT</p>
        <p className="mt-1">Built for HashKeyChain On-Chain Horizon Hackathon</p>
      </div>
    </main>
  );
}

