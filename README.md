# 🛡️ HashKey ZKID

> Privacy-preserving on-chain identity for HashKeyChain — verified by HashKey, known by none.

[![HashKeyChain](https://img.shields.io/badge/HashKeyChain-Testnet%20%23133-00b4d8?style=flat-square)](https://testnet.hsk.xyz)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![ERC-5192](https://img.shields.io/badge/ERC--5192-Soulbound-purple?style=flat-square)](https://eips.ethereum.org/EIPS/eip-5192)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## The Problem

DeFi protocols on HashKeyChain face a fundamental conflict:

- **Regulators** require KYC — protocols must know users are verified
- **Users** demand privacy — nobody wants their identity exposed on-chain
- **Current solutions** (Binance BABT, Coinbase Verification) link wallet directly to identity — **zero privacy**

HashKey Exchange already uses **Sumsub** to KYC 600K+ users. But that verification stays off-chain. There's no privacy-preserving way to bring it on-chain.

---

## The Solution

**HashKey ZKID** is a Soulbound NFT (ERC-5192) that acts as a privacy-preserving proof of KYC verification.

```
HashKey Exchange KYC (via Sumsub)
         ↓
HashKey backend signs credential
         ↓  (ZK Proof — identity stays hidden)
User claims ZKID Soulbound NFT
         ↓
DeFi Protocol: "verified?" → YES ✅
DeFi Protocol: "who are you?" → UNKNOWN 🔒
```

**What ZKID proves:**
- ✅ KYC verified by HashKey Exchange
- ✅ Age ≥ 18
- ✅ Not from sanctioned country

**What ZKID never reveals:**
- 🔒 Real name
- 🔒 Passport / ID number
- 🔒 Date of birth
- 🔒 Nationality
- 🔒 Email / phone

---

## How It Works

### 1. Request Verification
User connects wallet and requests identity verification from HashKey backend.

### 2. Backend Signs Credential
HashKey backend (trusted issuer) generates a signed credential:
```
sign(keccak256(userAddress + nonce + tier))
```
This simulates the ZK proof generation — in production, this would be a full Groth16 ZK proof.

### 3. User Claims ZKID
User submits the credential to the smart contract **from their own wallet**:
```solidity
zkid.claimWithSignature(nonce, tier, signature)
```
The contract verifies the signature and mints a Soulbound NFT.

### 4. DeFi Protocols Gate Access
Any protocol on HashKeyChain can verify users without knowing their identity:
```solidity
require(zkid.hasZKID(msg.sender), "ZKID required");
```

---

## Smart Contracts

Deployed on **HashKeyChain Testnet (Chain ID: 133)**

| Contract | Address | Description |
|---|---|---|
| `HashKeyZKID` | `0xb5141ec572f696947867e2eeefe2e67a2d8b0ae9` | ERC-5192 Soulbound NFT |
| `ZKIDVerifier` | `0xf989a2b7989fed273709ec52a2e0ea8863399eb2` | Signature verifier |
| `ZKIDGate` | `0xa8b37ef69f30d46dedb0c1feff64040a9f8be1da` | Demo DeFi access control |

### HashKeyZKID.sol
- ERC-5192 compliant — permanently locked (non-transferable)
- 1 ZKID per address — prevents identity farming
- 3 tiers: Basic (1), Verified (2), Premium (3)
- `claimWithSignature()` — user claims with HashKey backend signature
- `hasZKID(address)` — simple boolean check for DeFi protocols

### ZKIDVerifier.sol
- ECDSA signature verification
- Nullifier system — prevents double-claim
- Trusted issuer: HashKey backend signer

### ZKIDGate.sol
- Demo DeFi protocol with ZKID access control
- `deposit()` — only verified users
- `claimYield()` — only premium tier users

---

## Comparison

| Feature | Binance BABT | Coinbase Verify | **HashKey ZKID** |
|---|---|---|---|
| Soulbound | ✅ | ✅ | ✅ |
| ZK Privacy | ❌ | ❌ | ✅ |
| Wallet unlinkable | ❌ | ❌ | ✅ |
| HashKeyChain native | ❌ | ❌ | ✅ |
| DeFi composable | Partial | Partial | ✅ |
| Open source | ❌ | ❌ | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.28, Hardhat 3 |
| Chain | HashKeyChain Testnet (Chain 133) |
| Frontend | Next.js 15, Tailwind CSS |
| Wallet | wagmi v2, viem |
| Deploy | Vercel |
| KYC Backend | HashKey Exchange + Sumsub |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask with HashKeyChain Testnet added
- HSK testnet tokens from [faucet](https://faucet.hsk.xyz)

### Frontend

```bash
git clone https://github.com/Chronique/hsk-zkid
cd hsk-zkid-app
npm install
```

Create `.env.local`:
```env
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
cd hsk-zkid
npm install
```

Create `.env`:
```env
PRIVATE_KEY=your_deployer_private_key
```

```bash
npx hardhat compile
npx tsx scripts/deploy.ts
```

---

## Add HashKeyChain to MetaMask

| Field | Value |
|---|---|
| Network Name | HashKey Chain Testnet |
| RPC URL | https://testnet.hsk.xyz |
| Chain ID | 133 |
| Symbol | HSK |
| Explorer | https://hashkeychain-testnet-explorer.alt.technology |

---

## Roadmap

- [x] ERC-5192 Soulbound NFT contract
- [x] Signature-based credential verification
- [x] DeFi access control demo (ZKIDGate)
- [x] Frontend with wallet connection
- [x] Deploy to HashKeyChain testnet
- [ ] Real ZK circuit (Semaphore / Groth16)
- [ ] Integration with official HashKey KYC SBT
- [ ] Multi-tier credential system
- [ ] Mainnet deployment
- [ ] SDK for DeFi protocol integration

---

## Built For

**HashKeyChain On-Chain Horizon Hackathon** — Track: ZKID - 10K Prize Pool

> *"Technology Empowers Finance, Innovation Reconstructs Ecosystem"*

HashKey Group operates one of the world's largest regulated crypto exchanges with 600K+ KYC-verified users. HashKey ZKID bridges that trust to the DeFi ecosystem — privately.

---

## License

MIT © [Chronique](https://github.com/Chronique)
