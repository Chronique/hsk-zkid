import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";
import { base, optimism, arbitrum, polygon, bsc } from "viem/chains";
import { hashkeyTestnet } from "@/app/lib/config";

const CHAINS = [
  {
    chain: hashkeyTestnet,
    rpc: "https://testnet.hsk.xyz",
    name: "HashKey Testnet",
    symbol: "HSK",
    explorer: "https://hashkey.blockscout.com",
    color: "bg-blue-900",
    letter: "H",
  },
  {
    chain: base,
    rpc: "https://mainnet.base.org",
    name: "Base",
    symbol: "ETH",
    explorer: "https://basescan.org",
    color: "bg-blue-700",
    letter: "B",
  },
  {
    chain: optimism,
    rpc: "https://mainnet.optimism.io",
    name: "Optimism",
    symbol: "ETH",
    explorer: "https://optimistic.etherscan.io",
    color: "bg-red-900",
    letter: "O",
  },
  {
    chain: arbitrum,
    rpc: "https://arb1.arbitrum.io/rpc",
    name: "Arbitrum",
    symbol: "ETH",
    explorer: "https://arbiscan.io",
    color: "bg-cyan-900",
    letter: "A",
  },
  {
    chain: polygon,
    rpc: "https://polygon-rpc.com",
    name: "Polygon",
    symbol: "POL",
    explorer: "https://polygonscan.com",
    color: "bg-purple-900",
    letter: "P",
  },
  {
    chain: bsc,
    rpc: "https://bsc-dataseed.binance.org",
    name: "BNB Chain",
    symbol: "BNB",
    explorer: "https://bscscan.com",
    color: "bg-yellow-900",
    letter: "B",
  },
];

type ChainResult = {
  chainName: string;
  symbol: string;
  nativeBalance: string;
  tokens: any[];
  hasError?: boolean;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") as `0x${string}`;

  if (!address) {
    return NextResponse.json({ error: "No address" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    CHAINS.map((chainConfig) => fetchChainData(address, chainConfig))
  );

  const chains = results.map((r, i) => {
    const base = {
      chainId: CHAINS[i].chain.id,
      color: CHAINS[i].color,
      letter: CHAINS[i].letter,
      explorer: CHAINS[i].explorer,
    };

    if (r.status === "fulfilled") {
      return { ...base, ...r.value };
    }

    return {
      ...base,
      chainName: CHAINS[i].name,
      symbol: CHAINS[i].symbol,
      nativeBalance: "0.0000",
      tokens: [],
      hasError: true,
    };
  });

  return NextResponse.json({ address, chains });
}

async function fetchChainData(
  address: `0x${string}`,
  chainConfig: (typeof CHAINS)[0]
): Promise<ChainResult> {
  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpc),
  });

  const nativeBalance = await publicClient
    .getBalance({ address })
    .catch(() => BigInt(0));

  let tokens: any[] = [];
  try {
    if (chainConfig.explorer.includes("blockscout")) {
      const res = await fetch(
        `${chainConfig.explorer}/api/v2/addresses/${address}/token-balances`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        tokens = (data || []).map((t: any) => ({
          symbol: t.token?.symbol ?? "???",
          name: t.token?.name ?? "Unknown",
          balance: t.value ?? "0",
          decimals: Number(t.token?.decimals ?? 18),
          contractAddress: t.token?.address,
        }));
      }
    }
  } catch {
    // ignore
  }

  return {
    chainName: chainConfig.name,
    symbol: chainConfig.symbol,
    nativeBalance: parseFloat(formatEther(nativeBalance)).toFixed(4),
    tokens,
  };
}