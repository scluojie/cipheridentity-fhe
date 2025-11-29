# 🛡️ Private Identity DApp (Zama FHEVM)

A privacy-preserving on-chain identity verification application built on **Zama FHEVM**.

This project implements a fully private identity authentication system on-chain. Users can securely store encrypted age, credit score, and membership tier on the blockchain. With **Fully Homomorphic Encryption (FHE)**, smart contracts perform access control checks directly on ciphertext (e.g., whether the user is an adult, whether the user is VIP) without ever seeing plaintext data. The frontend uses a Relayer to safely decrypt results, ensuring privacy, security, and verifiability throughout the process.

---

## ✨ Features

- **End-to-End Privacy**

  - User attributes (`age`, `creditScore`, `membershipTier`) are stored as homomorphically encrypted ciphertext on-chain.
  - Smart contracts cannot access plaintext; all logic is executed using `@fhevm/solidity` encrypted types and operations.

- **Encrypted Access Control (ACL)**

  - `checkIsAdult`: verifies `age ≥ 18` → returns encrypted boolean `ebool`
  - `checkIsVIP`: verifies `creditScore > 700` or `membershipTier == 1` → returns encrypted boolean `ebool`

- **Frontend Interaction (Relayer SDK)**
  - Integrates `@zama-fhe/relayer-sdk` for encrypted input and decryption requests.
  - Uses **EIP-712 signatures** to authorize decryption, ensuring only the data owner can view results.
  - Full logging of encryption submission, contract calls, and decryption results.

---

## 🏗️ Tech Stack

- **Core Protocol**: Zama FHEVM
- **Smart Contracts**: Solidity ^0.8.25 + Hardhat
- **Frontend Framework**: React + TypeScript
- **Blockchain Interaction**: ethers.js v6
- **Privacy Service**: Relayer SDK (`createEncryptedInput`, `userDecrypt`)

---

## 🚀 Local Development Guide

### 1. Requirements

- Node.js ≥ 18
- npm or yarn
- MetaMask (connected to local Hardhat network)

### 2. Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd private-identity-dapp

# Install frontend dependencies
npm install

# Install contract dependencies
cd contract
npm install
```

### 3. Start FHEVM Local Node

```bash
cd contract
npx hardhat node
```

Keep this terminal open and note the deployed contract address.

### 4. Deploy Contracts

```bash
cd contract
npx hardhat run deploy/deploy.ts --network localhost
```

### 5. Start Frontend

```bash
cd ..
npm run dev
```

Open browser at:

```
http://localhost:3000
```

---

## 📖 Core Interaction Flow

### 1️⃣ Set Identity (Mint Identity)

Frontend generates encrypted input and submits to contract:

```ts
const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
input.add32(age).add32(credit).add32(tier);
const { handles, inputProof } = await input.encrypt();

await contract.setIdentity(handles[0], inputProof, ...);
```

### 2️⃣ On-Chain Logic

```solidity
function checkIsVIP() public returns (ebool) {
    ebool isHighCredit = creditScore[msg.sender].gt(700);
    ebool isGoldTier   = membershipTier[msg.sender].eq(1);
    ebool isVIP        = isHighCredit | isGoldTier;

    FHE.allow(isVIP, msg.sender);
    return isVIP;
}
```

### 3️⃣ Result Decryption (Relayer)

```ts
const encryptedResult = await contract.checkIsAdult.staticCall();
const isAdult = await fhevmInstance.userDecrypt(
  encryptedResult,
  contractAddress,
  userAddress,
  signature // EIP-712 signature
);

console.log(isAdult ? "ACCESS GRANTED" : "ACCESS DENIED");
```

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx              # Frontend entry
│   ├── components/          # UI components
│   ├── services/            # FHE service layer
│   │   └── fheService.ts    # FHEVM initialization, encryption, decryption logic
│   └── constants.ts         # Contract addresses and ABI config
├── contract/
│   ├── contracts/           # Solidity contracts
│   │   └── PrivateIdentity.sol
│   ├── deploy/              # Deployment scripts
│   └── hardhat.config.ts    # Hardhat configuration
└── README.md
```

---

## 🚧 Roadmap

- [x] Encrypted storage of basic identity attributes (Age, Credit, Tier)
- [x] On-chain privacy checks (Adult, VIP)
- [x] Frontend Relayer decryption integration
- [ ] Support additional identity attributes (education, asset proofs)
- [ ] Add "optional public decryption" (`makePubliclyDecryptable`)
- [ ] Deploy to Zama Devnet/Testnet

---

## 📄 License

MIT License

## 📄 Showcase

<img width="1947" height="1128" alt="image" src="https://github.com/user-attachments/assets/b060cc07-726d-4b70-9242-43a39f4285f8" />

<img width="2240" height="1221" alt="image" src="https://github.com/user-attachments/assets/d1c2e8da-a9c7-44b0-a1aa-f6ace1c1b82c" />

<img width="1974" height="1110" alt="image" src="https://github.com/user-attachments/assets/abd0970f-b9cd-49bb-8f54-0a34d6ca3ec4" />

<img width="1806" height="1002" alt="image" src="https://github.com/user-attachments/assets/5635a85e-61ff-462d-8e29-e1fb04890777" />
