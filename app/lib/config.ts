import { defineChain } from "viem";

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { decimals: 18, name: "HSK", symbol: "HSK" },
  rpcUrls: {
    default: { http: ["https://testnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "HashKey Testnet Explorer",
      url: "https://hashkeychain-testnet-explorer.alt.technology",
    },
  },
  testnet: true,
});

export const CONTRACTS = {
  ZKID: "0x2ae6966bf1a8a4ad68bca0c70f03f9082fc4a2b0" as `0x${string}`,
  VERIFIER: "0xafb18fe789d46f531c5e89dec8f02f43eba3c5f4" as `0x${string}`,
  GATE: "0x07e1299c41fd2f64726ea55fea3ab64d65ccf73b" as `0x${string}`,
};

export const ZKID_ABI = [
  { name: "hasZKID", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }] },
  { name: "getZKIDInfo", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "userTier", type: "uint8" },
      { name: "timestamp", type: "uint256" },
    ]},
  { name: "totalSupply", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "mint", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "tier", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }] },
] as const;

export const VERIFIER_ABI = [
  { name: "verifyAndMint", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "nullifier", type: "bytes32" },
      { name: "proofHash", type: "bytes32" },
      { name: "tier", type: "uint8" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [] },
  { name: "isNullifierUsed", type: "function", stateMutability: "view",
    inputs: [{ name: "nullifier", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }] },
] as const;
