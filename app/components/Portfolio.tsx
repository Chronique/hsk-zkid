"use client";
import { useEffect, useState } from "react";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
}

interface ChainData {
  chainId: number;
  chainName: string;
  symbol: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  color: string;
  letter: string;
  explorer: string;
}

interface WalletData {
  address: string;
  chains: ChainData[];
  isPrimary: boolean;
}

interface Props {
  primaryAddress: string;
  linkedWallets: string[];
}

export function Portfolio({ primaryAddress, linkedWallets }: Props) {
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWallet, setExpandedWallet] = useState<number>(0);
  const [copied, setCopied] = useState<string>("");

  const allWallets = [
    { address: primaryAddress, isPrimary: true },
    ...linkedWallets.map((a) => ({ address: a, isPrimary: false })),
  ];

  useEffect(() => {
    if (primaryAddress) fetchAllBalances();
  }, [primaryAddress, linkedWallets.length]);

  const fetchAllBalances = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        allWallets.map(async ({ address, isPrimary }) => {
          const res = await fetch(`/api/portfolio?address=${address}`);
          const data = await res.json();
          return { ...data, isPrimary, address };
        })
      );
      setWalletData(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(""), 1500);
  };

  const hasBalance = (chain: ChainData) =>
    parseFloat(chain.nativeBalance) > 0 || chain.tokens?.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">Multi-Chain Portfolio</p>
        <button
          onClick={fetchAllBalances}
          className="text-xs text-gray-500 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Fetching balances across chains...
        </div>
      ) : (
        <div className="space-y-3">
          {walletData.map((wallet, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden"
            >
              {/* Wallet header — div not button to avoid nesting */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2 flex-1">
                  {wallet.isPrimary && (
                    <span className="text-xs bg-purple-900 text-purple-300 border border-purple-700 rounded-full px-2 py-0.5">
                      Primary
                    </span>
                  )}
                  <span className="font-mono text-xs text-gray-400">
                    {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyAddress(wallet.address)}
                    className="text-xs text-gray-600 hover:text-gray-400"
                  >
                    {copied === wallet.address ? "✓" : "[copy]"}
                  </button>
                </div>
                <button
                  onClick={() => setExpandedWallet(expandedWallet === i ? -1 : i)}
                  className="text-gray-500 text-xs px-2 hover:text-white"
                >
                  {expandedWallet === i ? "▲" : "▼"}
                </button>
              </div>

              {expandedWallet === i && (
                <div className="divide-y divide-gray-800">
                  {wallet.chains?.filter(hasBalance).map((chain, j) => (
                    <div key={j} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 ${chain.color} rounded-full flex items-center justify-center text-xs font-bold text-white`}
                          >
                            {chain.letter}
                          </div>
                          <span className="text-xs font-semibold text-gray-300">
                            {chain.chainName}
                          </span>
                        </div>
                        <a
                          href={`${chain.explorer}/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Explorer
                        </a>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{chain.symbol}</span>
                        <span className="text-sm text-white">{chain.nativeBalance}</span>
                      </div>

                      {chain.tokens?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {chain.tokens.map((token: TokenBalance, k: number) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{token.symbol}</span>
                              <span className="text-xs text-gray-300">
                                {(
                                  Number(token.balance) /
                                  Math.pow(10, token.decimals)
                                ).toFixed(4)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {wallet.chains?.filter(hasBalance).length === 0 && (
                    <div className="px-4 py-4 text-xs text-gray-600 text-center">
                      No balances found across chains
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
