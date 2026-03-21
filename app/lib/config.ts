import { defineChain } from "viem";

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { decimals: 18, name: "HSK", symbol: "HSK" },
  rpcUrls: { default: { http: ["https://testnet.hsk.xyz"] } },
  blockExplorers: {
    default: {
      name: "HashKey Testnet Explorer",
      url: "https://hashkeychain-testnet-explorer.alt.technology",
    },
  },
  testnet: true,
});

export const CONTRACTS = {
  ZKID: "0x25a83214f54283929fee3f2e6ef3ba8290ea7201" as `0x${string}`,
  VERIFIER: "0x75e434634532f2f6a8c24d2a8d6f789c1e2bf6fd" as `0x${string}`,
  GATE: "0x21d0dee0275e230262c3adb4da9e8ee707e3b52e" as `0x${string}`,
  REGISTRY: "0xcb34f3eba54a58c51566b5f2a56d9af06a17a273" as `0x${string}`,
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
  { name: "claimWithSignature", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "nonce", type: "bytes32" },
      { name: "tier", type: "uint8" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [] },
] as const;

export const REGISTRY_ABI = [
  { name: "register", type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: [] },
  { name: "bindWallet", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "secondary", type: "address" }], outputs: [] },
  { name: "unbindWallet", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "secondary", type: "address" }], outputs: [] },
  { name: "isVerifiedWallet", type: "function", stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }, { name: "primary", type: "address" }] },
  { name: "getLinkedWallets", type: "function", stateMutability: "view",
    inputs: [{ name: "primary", type: "address" }],
    outputs: [{ name: "", type: "address[]" }] },
  { name: "isRegistered", type: "function", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }] },
  { name: "linkedCount", type: "function", stateMutability: "view",
    inputs: [{ name: "primary", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { name: "primaryOf", type: "function", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "address" }] },
] as const;
