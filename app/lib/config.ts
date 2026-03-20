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
  ZKID: "0xb5141ec572f696947867e2eeefe2e67a2d8b0ae9" as `0x${string}`,
  VERIFIER: "0xf989a2b7989fed273709ec52a2e0ea8863399eb2" as `0x${string}`,
  GATE: "0xa8b37ef69f30d46dedb0c1feff64040a9f8be1da" as `0x${string}`,
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
  { name: "claimWithSignature", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "nonce", type: "bytes32" },
      { name: "tier", type: "uint8" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [] },
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


