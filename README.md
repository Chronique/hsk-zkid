# 🛡️ HashKey ZKID

> Privacy-preserving identity infrastructure for HashKeyChain — verified by HashKey, known by none.

[![HashKeyChain](https://img.shields.io/badge/HashKeyChain-Testnet%20%23133-00b4d8?style=flat-square)](https://testnet.hsk.xyz)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![ERC-5192](https://img.shields.io/badge/ERC--5192-Soulbound-purple?style=flat-square)](https://eips.ethereum.org/EIPS/eip-5192)
[![Privy](https://img.shields.io/badge/Wallet-Privy-blueviolet?style=flat-square)](https://privy.io)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

**Live Demo:** https://hsk-zkid-app.vercel.app  
**Contracts:** https://github.com/Chronique/hsk-zkid  
**Frontend:** https://github.com/Chronique/hsk-zkid-app

---

## The Problem

DeFi protocols on HashKeyChain face a fundamental conflict:

- **Regulators** require KYC — protocols must know users are verified
- **Users** demand privacy — nobody wants their identity exposed on-chain
- **Current solutions** (Binance BABT, Coinbase Verification) link wallet directly to identity — **zero privacy**

HashKey Exchange already uses **Sumsub** to KYC 600K+ users. But that verification stays off-chain. There's no privacy-preserving way to bring it on-chain — until now.

---

## The Solution

**HashKey ZKID** is a complete identity infrastructure for HashKeyChain, consisting of:

1. **ZKID Soulbound NFT** — ERC-5192 token that proves KYC verification without revealing identity
2. **Wallet Registry** — Link up to 5 wallets to one verified identity (anti money-laundering)
3. **Smart Wallet** — Privy-powered embedded wallet with social login
4. **Multi-chain Portfolio** — View balances across all EVM chains

```
HashKey Exchange (KYC via Sumsub, 600K+ users)
         ↓ social login via Privy
HashKey Smart Wallet (embedded, gasless UX)
         ↓ backend signs ZK credential
User claims ZKID Soulbound NFT
         ↓ bind up to 5 additional wallets
DeFi Protocol: "verified?" → YES ✅
DeFi Protocol: "who are you?" → UNKNOWN 🔒
```

---

## Key Features

### 🛡️ ZKID Identity
- Soulbound NFT (ERC-5192) — permanently non-transferable
- 1 ZKID per address — prevents identity farming
- 3 tiers: Basic, Verified, Premium
- ZK-inspired credential system via ECDSA signature

### 🔗 Wallet Registry
- Link up to 5 EVM wallets to one verified identity
- All linked wallets recognized as verified by DeFi protocols
- Anti-money laundering: all activity traceable to one KYC identity
- Privacy preserved: connections not visible on-chain

### 💼 Multi-Chain Portfolio
- View native token balances across HashKeyChain, Base, Optimism, Arbitrum, Polygon, BNB Chain
- Aggregates all linked wallets in one dashboard
- ERC-20 token support via Blockscout API

### 🏛️ DeFi Gate Demo
- Live demonstration of ZKID-gated smart contract
- Code snippet for DeFi protocol integration
- One-line verification: `zkid.hasZKID(msg.sender)`

---

## How It Works

### 1. Login with Social Account
User connects via email, Google, or existing wallet using Privy — embedded wallet auto-created, no seed phrase needed.

### 2. Get ZKID
HashKey backend generates a signed credential (simulating ZK proof):
```
sign(keccak256(userAddress + nonce + tier))
```
User submits credential from their own wallet — `claimWithSignature()`.

### 3. Register & Bind Wallets
Primary wallet registers on `WalletRegistry`. Up to 5 additional wallets can be bound to the same identity.

### 4. Access DeFi
Any protocol on HashKeyChain can verify users without knowing their identity:
```solidity
// Option 1: Check ZKID directly
require(zkid.hasZKID(msg.sender), "ZKID required");

// Option 2: Check any linked wallet (1 of 5)
(bool verified,) = registry.isVerifiedWallet(msg.sender);
require(verified, "Not verified");
```

---

## Smart Contracts

Deployed on **HashKeyChain Testnet (Chain ID: 133)**

| Contract | Address |
|---|---|
| `HashKeyZKID` | `0x25a83214f54283929fee3f2e6ef3ba8290ea7201` |
| `ZKIDVerifier` | `0x75e434634532f2f6a8c24d2a8d6f789c1e2bf6fd` |
| `ZKIDGate` | `0x21d0dee0275e230262c3adb4da9e8ee707e3b52e` |
| `WalletRegistry` | `0xcb34f3eba54a58c51566b5f2a56d9af06a17a273` |

### Contract Details

**HashKeyZKID.sol**
- ERC-5192 compliant — permanently locked
- `claimWithSignature(nonce, tier, signature)` — user claims with backend signature
- `hasZKID(address)` — simple check for DeFi protocols
- Nullifier system prevents double-claim

**WalletRegistry.sol**
- `register()` — register primary wallet (requires ZKID)
- `bindWallet(address)` — link secondary wallet (max 5)
- `isVerifiedWallet(address)` — check if any wallet is verified
- `getLinkedWallets(address)` — list all linked wallets

**ZKIDGate.sol**
- Demo DeFi protocol with ZKID access control
- `deposit()` — verified users only
- `claimYield()` — premium tier only

---

## Architecture

```
┌─────────────────────────────────┐
│   HashKey Exchange (Sumsub KYC) │
│   600K+ verified users          │
└────────────┬────────────────────┘
             │ sign credential
             ▼
┌─────────────────────────────────┐
│   Backend API (/api/mint)       │
│   ECDSA signature generation    │
│   Simulates ZK proof            │
└────────────┬────────────────────┘
             │ nonce + tier + signature
             ▼
┌─────────────────────────────────┐
│   User Wallet (Privy Embedded)  │
│   claimWithSignature()          │
└────────────┬────────────────────┘
             │ verified
             ▼
┌─────────────────────────────────┐
│   HashKeyZKID Contract          │
│   Soulbound NFT minted          │
└────────────┬────────────────────┘
             │ register + bind wallets
             ▼
┌─────────────────────────────────┐
│   WalletRegistry Contract       │
│   1 identity = up to 6 wallets  │
└────────────┬────────────────────┘
             │ gate access
             ▼
┌─────────────────────────────────┐
│   DeFi Protocols                │
│   Privacy-preserving KYC gate   │
└─────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.28, Hardhat 3 |
| Chain | HashKeyChain Testnet (Chain 133) |
| Frontend | Next.js 15, Tailwind CSS |
| Wallet | Privy (embedded wallet + social login) |
| Web3 | viem v2 |
| Deploy | Vercel |
| Explorer | testnet-explorer.hsk.xyz |

---

## Comparison

| Feature | Binance BABT | Coinbase Verify | **HashKey ZKID** |
|---|---|---|---|
| Soulbound NFT | ✅ | ✅ | ✅ |
| ZK Privacy | ❌ | ❌ | ✅ |
| Wallet unlinkable | ❌ | ❌ | ✅ |
| Multi-wallet identity | ❌ | ❌ | ✅ (5 wallets) |
| Social login | ❌ | ❌ | ✅ (Privy) |
| Multi-chain portfolio | ❌ | ❌ | ✅ (6 chains) |
| HashKeyChain native | ❌ | ❌ | ✅ |
| Open source | ❌ | ❌ | ✅ |

---

## Getting Started

### Prerequisites
- Node.js 18+

### Run Frontend

```bash
git clone https://github.com/Chronique/hsk-zkid-app
cd hsk-zkid-app
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
DEPLOYER_PRIVATE_KEY=your_deployer_private_key_without_0x
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy Contracts

```bash
git clone https://github.com/Chronique/hsk-zkid
cd hsk-zkid
npm install
```

Create `.env`:
```env
PRIVATE_KEY=your_private_key_without_0x
```

```bash
npx hardhat compile
npx tsx scripts/deploy.ts
```

### Add HashKeyChain to MetaMask

| Field | Value |
|---|---|
| Network Name | HashKey Chain Testnet |
| RPC URL | https://testnet.hsk.xyz |
| Chain ID | 133 |
| Symbol | HSK |
| Explorer | https://testnet-explorer.hsk.xyz |

Get testnet HSK: https://faucet.hsk.xyz

---

## Roadmap

- [x] ERC-5192 Soulbound NFT contract
- [x] ECDSA-based credential verification
- [x] Nullifier system (prevent double-claim)
- [x] WalletRegistry — bind up to 5 wallets
- [x] ZKIDGate — DeFi access control demo
- [x] Privy embedded wallet + social login
- [x] Multi-chain portfolio (6 EVM chains)
- [x] Deploy to HashKeyChain testnet
- [x] Live on Vercel
- [ ] Real ZK circuit (Semaphore / Groth16)
- [ ] Integration with official HashKey KYC SBT
- [ ] Mainnet deployment
- [ ] SDK for DeFi protocol integration
- [ ] Mobile app

---

## Built For

**HashKeyChain On-Chain Horizon Hackathon** — Track: ZKID - 10K Prize Pool

> *"Technology Empowers Finance, Innovation Reconstructs Ecosystem"*

HashKey Group is one of the world's largest regulated crypto exchanges with 600K+ KYC-verified users. HashKey ZKID bridges that institutional trust to the DeFi ecosystem — privately, compliantly, and natively on HashKeyChain.

---

## License

MIT © [Chronique](https://github.com/Chronique)