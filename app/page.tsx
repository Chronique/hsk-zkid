"use client";
import { Portfolio } from "./components/Portfolio";
import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { CONTRACTS, ZKID_ABI, REGISTRY_ABI, hashkeyTestnet } from "./lib/config";

type Tab = "identity" | "wallets" | "gate" | "portfolio";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [tab, setTab] = useState<Tab>("identity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [linkedWallets, setLinkedWallets] = useState<string[]>([]);
  const [bindInput, setBindInput] = useState("");
  const [zkidInfo, setZkidInfo] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const embeddedWallet = wallets.find(w => w.walletClientType === "privy");
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  useEffect(() => {
  if (authenticated && address) {
    checkStatus();
  }
}, [authenticated, address]);

  const getClients = async () => {
    if (!embeddedWallet) throw new Error("No wallet");
    await embeddedWallet.switchChain(133);
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: address,
      chain: hashkeyTestnet,
      transport: custom(provider),
    });
    const publicClient = createPublicClient({
      chain: hashkeyTestnet,
      transport: http("https://testnet.hsk.xyz"),
    });
    return { walletClient, publicClient };
  };

  const checkStatus = async () => {
    if (!address) return;
    const publicClient = createPublicClient({
      chain: hashkeyTestnet,
      transport: http("https://testnet.hsk.xyz"),
    });
    const hasZKID = await publicClient.readContract({
      address: CONTRACTS.ZKID, abi: ZKID_ABI,
      functionName: "hasZKID", args: [address],
    });
    if (hasZKID) {
      const info = await publicClient.readContract({
        address: CONTRACTS.ZKID, abi: ZKID_ABI,
        functionName: "getZKIDInfo", args: [address],
      });
      setZkidInfo(info);
    }
    const reg = await publicClient.readContract({
      address: CONTRACTS.REGISTRY, abi: REGISTRY_ABI,
      functionName: "isRegistered", args: [address],
    });
    setIsRegistered(reg as boolean);
    if (reg) {
      const linked = await publicClient.readContract({
        address: CONTRACTS.REGISTRY, abi: REGISTRY_ABI,
        functionName: "getLinkedWallets", args: [address],
      });
      setLinkedWallets(linked as string[]);
    }
  };

  const handleMintZKID = async () => {
    if (!address) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const { walletClient } = await getClients();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.ZKID, abi: ZKID_ABI,
        functionName: "claimWithSignature",
        args: [data.nonce, data.tier, data.signature],
        account: address,
      });
      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await checkStatus();
    } catch (e: any) {
      setError(e?.message?.slice(0, 150) ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!address) return;
    setLoading(true); setError("");
    try {
      const { walletClient } = await getClients();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.REGISTRY, abi: REGISTRY_ABI,
        functionName: "register", args: [], account: address,
      });
      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await checkStatus();
    } catch (e: any) {
      setError(e?.message?.slice(0, 150) ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBindWallet = async () => {
    if (!address || !bindInput) return;
    setLoading(true); setError("");
    try {
      const { walletClient } = await getClients();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.REGISTRY, abi: REGISTRY_ABI,
        functionName: "bindWallet",
        args: [bindInput as `0x${string}`],
        account: address,
      });
      setTxHash(hash);
      setBindInput("");
      await new Promise(r => setTimeout(r, 3000));
      await checkStatus();
    } catch (e: any) {
      setError(e?.message?.slice(0, 150) ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async (secondary: string) => {
    if (!address) return;
    setLoading(true);
    try {
      const { walletClient } = await getClients();
      await walletClient.writeContract({
        address: CONTRACTS.REGISTRY, abi: REGISTRY_ABI,
        functionName: "unbindWallet",
        args: [secondary as `0x${string}`],
        account: address,
      });
      await new Promise(r => setTimeout(r, 3000));
      await checkStatus();
    } catch (e: any) {
      setError(e?.message?.slice(0, 150) ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="logo" className="w-8 h-8" />
          <span className="font-bold text-lg">HashKey ZKID</span>
        </div>
        {authenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono hidden md:block">
              <button 
                onClick={() => { navigator.clipboard.writeText(address ?? ""); alert("Copied!"); }}
                className="text-xs text-gray-400 font-mono hover:text-white transition-colors hidden md:flex items-center gap-1"
                title="Copy address">
                {address?.slice(0,6)}...{address?.slice(-4)} 
              </button>
            </span>
            <button onClick={() => { checkStatus(); }} className="text-xs text-gray-400 hover:text-white"></button>
            <button onClick={logout} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={login}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Login
          </button>
        )}
      </div>

      {!authenticated ? (
        /* Landing */
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-3xl font-bold mb-2">HashKey ZKID</h1>
          <p className="text-gray-400 mb-2">Privacy-preserving identity for HashKeyChain</p>
          <p className="text-gray-600 text-sm mb-8 max-w-sm">
            Verify your HashKey identity. Bind up to 5 wallets. Access DeFi without revealing who you are.
          </p>
          <button onClick={login}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-2xl transition-colors text-lg">
            Get Started
          </button>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm text-xs text-gray-500">
            <div className="bg-gray-900 rounded-xl p-3"><br/>ZK Privacy</div>
            <div className="bg-gray-900 rounded-xl p-3"><br/>5 Wallets</div>
            <div className="bg-gray-900 rounded-xl p-3"><br/>HashKeyChain</div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto p-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-4">
            {(["identity", "wallets", "gate", "portfolio"] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); checkStatus(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  tab === t ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}>
                {t === "identity" ? "🛡️ Identity" : t === "wallets" ? "🔗 Wallets" : t === "gate" ? "🏛️ DeFi Gate" : "💼 Portfolio"}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs bg-red-900/20 rounded-lg p-2 mb-3">{error}</p>}

          {/* Identity Tab */}
          {tab === "identity" && (
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">HashKey Wallet</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(address ?? ""); alert("Copied!"); }}
                  className="font-mono text-sm truncate text-left hover:text-purple-300 transition-colors w-full flex items-center gap-1"
                  title="Copy address">
                  {address} 
                </button>
                {user?.email && <p className="text-xs text-gray-500 mt-1">{user.email.address}</p>}
              </div>

              {zkidInfo ? (
                <div className="bg-gray-900 border border-purple-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300"> ZKID Verified</span>
                    <span className="text-xs border border-purple-600 text-purple-400 rounded-full px-2 py-0.5">
                      {["", "Basic", "Verified", "Premium"][Number(zkidInfo[1])]} Tier
                    </span>
                  </div>
                  <div className="text-sm space-y-1.5 text-gray-300">
                    <div className="flex justify-between"><span className="text-gray-500">Token ID</span><span>#{zkidInfo[0].toString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Issued</span><span>{new Date(Number(zkidInfo[2]) * 1000).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Transferable</span><span className="text-red-400">Never</span></div>
                  </div>
                  <div className="bg-green-900/30 border border-green-700 rounded-xl p-2 text-xs text-green-300">
                     DeFi protocols can verify you without knowing who you are
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold">Get your ZKID</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p> KYC verified by HashKey Exchange</p>
                    <p> Age  18  Not sanctioned</p>
                    <p> Identity stays private</p>
                  </div>
                  <button onClick={handleMintZKID} disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    {loading ? "Processing..." : "Verify & Mint ZKID"}
                  </button>
                </div>
              )}

              {txHash && (
                <a href={`https://hashkey.blockscout.com/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline block text-center">
                  View transaction 
                </a>
              )}
            </div>
          )}

          {/* Wallets Tab */}
          {tab === "wallets" && (
            <div className="space-y-3">
              {!zkidInfo ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Get your ZKID first to register wallets</p>
                </div>
              ) : !isRegistered ? (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                  <p className="font-semibold">Register Primary Wallet</p>
                  <p className="text-xs text-gray-400">Register this wallet as your primary identity to start binding additional wallets.</p>
                  <button onClick={handleRegister} disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    {loading ? "Processing..." : "Register Primary Wallet"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Linked Wallets</span>
                      <span className="text-xs text-gray-500">{linkedWallets.length}/5</span>
                    </div>

                    {linkedWallets.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No wallets linked yet</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedWallets.map((w, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                            <span className="font-mono text-xs text-gray-300">{w.slice(0,8)}...{w.slice(-6)}</span>
                            <button onClick={() => handleUnbind(w)}
                              className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {linkedWallets.length < 5 && (
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-2">
                      <p className="text-sm font-semibold">Bind New Wallet</p>
                      <input
                        value={bindInput}
                        onChange={e => setBindInput(e.target.value)}
                        placeholder="0x... wallet address"
                        className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-purple-500"
                      />
                      <button onClick={handleBindWallet} disabled={loading || !bindInput}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                        {loading ? "Processing..." : "Bind Wallet"}
                      </button>
                    </div>
                  )}

                  <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500">
                     All linked wallets are considered part of your verified identity. DeFi protocols will recognize them as verified without knowing the connection.
                  </div>
                </>
              )}
            </div>
          )}

          {/* DeFi Gate Tab */}
          {tab === "gate" && (
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                <p className="font-semibold mb-1">ZKIDGate Demo</p>
                <p className="text-xs text-gray-400 mb-3">This simulates a DeFi protocol that requires ZKID verification.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-300">ZKID Status</span>
                    <span className={zkidInfo ? "text-green-400" : "text-red-400"}>
                      {zkidInfo ? " Verified" : " Not verified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-300">Wallet Registry</span>
                    <span className={isRegistered ? "text-green-400" : "text-yellow-400"}>
                      {isRegistered ? " Registered" : " Not registered"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-300">DeFi Access</span>
                    <span className={zkidInfo ? "text-green-400" : "text-red-400"}>
                      {zkidInfo ? " Allowed" : " Blocked"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-2 font-semibold">How DeFi protocols integrate:</p>
                <pre className="text-xs text-green-400 bg-gray-800 rounded-lg p-3 overflow-x-auto">{`// In your DeFi contract:
                require(
                zkid.hasZKID(msg.sender),
                "ZKID required"
                );

                // Or check registry (5 wallets):
                (bool verified,) = registry
                .isVerifiedWallet(msg.sender);
                require(verified, "Not verified");`}</pre>
              </div>

              <a href={`https://hashkey.blockscout.com/address/${CONTRACTS.GATE}`}
                target="_blank" rel="noopener noreferrer"
                className="block text-center text-xs text-blue-400 hover:underline">
                View ZKIDGate contract on Explorer 
              </a>
            </div>
          )}
          {tab === "portfolio" && (
            <Portfolio
            primaryAddress={address ?? ""}
            linkedWallets={linkedWallets}
            />
      )}
        </div>
      )}
    </main>
  );
}






