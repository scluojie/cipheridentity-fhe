# 🛡️ Private Identity DApp (Zama FHEVM)

基于 **Zama FHEVM** 的链上隐私身份验证应用。

本项目实现了一个完全隐私化的链上身份认证系统。用户可以在链上安全存储加密后的年龄、信用分数与会员等级。通过 **FHE (Fully Homomorphic Encryption)** 技术，智能合约在密文状态下进行访问控制判断（如：是否成年、是否 VIP），而永远无法看到用户的明文数据。前端通过 Relayer 以安全方式进行解密，确保整个流程隐私、安全且可验证。

---

## ✨ 功能特性

- **隐私保护（端到端）**

  - 用户的 `age`、`creditScore`、`membershipTier` 均以同态加密密文存储在链上。
  - 智能合约无法访问明文，所有逻辑运算均使用 `@fhevm/solidity` 库在密文上完成。

- **加密访问控制 (Encrypted ACL)**

  - `checkIsAdult`: 验证 `age ≥ 18` → 返回加密布尔值 `ebool`
  - `checkIsVIP`: 验证 `creditScore > 700` 或 `membershipTier == 1` → 返回加密布尔值 `ebool`

- **前端交互 (Relayer SDK)**
  - 集成 `@zama-fhe/relayer-sdk` 处理加密输入和解密请求。
  - 使用 **EIP-712 签名**授权，确保只有数据所有者能查看结果。
  - 全流程日志记录加密提交、交易挖掘、合约调用及解密结果。

---

## 🏗️ 技术栈

- **核心协议**：Zama FHEVM
- **智能合约**：Solidity ^0.8.25 + Hardhat
- **前端框架**：React + TypeScript
- **链上交互**：ethers.js v6
- **隐私服务**：Relayer SDK (`createEncryptedInput`, `userDecrypt`)

---

## 🚀 本地运行指南

### 1. 环境要求

- Node.js ≥ 18
- npm 或 yarn
- MetaMask (连接到本地 Hardhat 网络)

### 2. 安装依赖

```bash
# 克隆仓库
git clone <your-repo-url>
cd private-identity-dapp

# 安装根目录依赖 (前端)
npm install

# 安装合约目录依赖
cd contract
npm install
```

### 3. 启动 FHEVM 本地节点

```bash
cd contract
npx hardhat node
```

保持此终端开启，记录下部署的合约地址。

### 4. 部署合约

```bash
cd contract
npx hardhat run deploy/deploy.ts --network localhost
```

### 5. 启动前端

```bash
cd ..
npm run dev
```

打开浏览器访问：

```
http://localhost:3000
```

---

## 📖 核心交互流程

### 1️⃣ 设置身份 (Mint Identity)

前端生成加密输入并提交合约：

```ts
const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
input.add32(age).add32(credit).add32(tier);
const { handles, inputProof } = await input.encrypt();

await contract.setIdentity(handles[0], inputProof, ...);
```

### 2️⃣ 链上逻辑判断

```solidity
function checkIsVIP() public returns (ebool) {
    ebool isHighCredit = creditScore[msg.sender].gt(700);
    ebool isGoldTier   = membershipTier[msg.sender].eq(1);
    ebool isVIP        = isHighCredit | isGoldTier;

    FHE.allow(isVIP, msg.sender);
    return isVIP;
}
```

### 3️⃣ 结果解密 (Relayer)

```ts
const encryptedResult = await contract.checkIsAdult.staticCall();
const isAdult = await fhevmInstance.userDecrypt(
  encryptedResult,
  contractAddress,
  userAddress,
  signature // EIP-712 签名
);

console.log(isAdult ? "ACCESS GRANTED" : "ACCESS DENIED");
```

---

## 📁 项目结构

```
├── src/
│   ├── App.tsx              # 前端入口
│   ├── components/          # UI 组件
│   ├── services/            # FHE 服务层
│   │   └── fheService.ts    # FHEVM 初始化、加密、解密逻辑
│   └── constants.ts         # 合约地址与 ABI 配置
├── contract/
│   ├── contracts/           # Solidity 合约
│   │   └── PrivateIdentity.sol
│   ├── deploy/              # 部署脚本
│   └── hardhat.config.ts    # Hardhat 配置
└── README.md
```

---

## 🚧 路线图 (Roadmap)

- [x] 基础身份属性加密存储 (Age, Credit, Tier)
- [x] 链上隐私逻辑校验 (Adult, VIP)
- [x] 前端 Relayer 解密集成
- [ ] 支持更多身份属性 (学历、资产证明)
- [ ] 增加 "可选公开" 功能 (`makePubliclyDecryptable`)
- [ ] 部署至 Zama Devnet/Testnet

---

## 📄 License

MIT License

---

## 📄 Showcase
<img width="1947" height="1128" alt="image" src="https://github.com/user-attachments/assets/b060cc07-726d-4b70-9242-43a39f4285f8" />

<img width="2240" height="1221" alt="image" src="https://github.com/user-attachments/assets/d1c2e8da-a9c7-44b0-a1aa-f6ace1c1b82c" />

<img width="1974" height="1110" alt="image" src="https://github.com/user-attachments/assets/abd0970f-b9cd-49bb-8f54-0a34d6ca3ec4" />

<img width="1806" height="1002" alt="image" src="https://github.com/user-attachments/assets/5635a85e-61ff-462d-8e29-e1fb04890777" />




