import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PrivateIdentity", function () {
    let contract: Contract;
    let owner: SignerWithAddress;
    let contractAddress: string;

    // Helper function to set identity for a user
    async function setIdentity(
        user: SignerWithAddress, 
        age: number, 
        credit: number, 
        tier: number
    ) {
        // 获取合约地址
        const contractAddress = await contract.getAddress();
        
        // --- 使用组合式 FHE API: createEncryptedInput().add32().encrypt() ---
        
        // 1. Encrypt Age and generate proof
        const buildAge = fhevm.createEncryptedInput(contractAddress, user.address);
        const encryptedAge = await buildAge.add32(age).encrypt();
        
        // 2. Encrypt Credit Score and generate proof
        const buildCredit = fhevm.createEncryptedInput(contractAddress, user.address);
        const encryptedCredit = await buildCredit.add32(credit).encrypt();

        // 3. Encrypt Membership Tier and generate proof
        const buildTier = fhevm.createEncryptedInput(contractAddress, user.address);
        const encryptedTier = await buildTier.add32(tier).encrypt();

        // 传递句柄 (密文) 和 inputProof (证明) 给合约
        await contract.connect(user).setIdentity(
            encryptedAge.handles[0], 
            encryptedAge.inputProof, 
            encryptedCredit.handles[0], 
            encryptedCredit.inputProof, 
            encryptedTier.handles[0], 
            encryptedTier.inputProof
        );
    }
    
    // Helper function to call and decrypt an ebool result
    async function checkAndDecryptEbool(
        user: SignerWithAddress, 
        funcName: string
    ): Promise<boolean> {
        // 1. 发送交易以执行 FHE 逻辑并更新 ACLs (状态修改)
        const tx = await contract.connect(user)[funcName]();
        await tx.wait();

        // 2. 使用 staticCall (不发送交易) 来获取最新的 ebool 密文 
        //    (此时用户被允许解密该值)
        const encryptedResult = await contract.connect(user)[funcName].staticCall();

        // 3. 解密结果
        const clearResult = await fhevm.userDecryptEbool(
            encryptedResult,
            contractAddress,
            user
        );
        return clearResult;
    }

    before(async function () {
        [owner] = await ethers.getSigners();
        await fhevm.initializeCLIApi();

        // 部署合约
        const PrivateIdentityFactory = await ethers.getContractFactory("PrivateIdentity");
        contract = await PrivateIdentityFactory.deploy();
        contractAddress = await contract.getAddress();
        console.log(`\nDeployed PrivateIdentity to: ${contractAddress}`);
    });

    it("Case 1: Should correctly identify an Adult VIP (Age 25, Credit 750, Tier 1)", async function () {
        // 设置身份
        await setIdentity(owner, 25, 750, 1);

        // 检查是否成年 (25 >= 18) -> TRUE
        const isAdult = await checkAndDecryptEbool(owner, "checkIsAdult");
        expect(isAdult).to.be.true;

        // 检查是否 VIP (750 > 700 OR Tier 1) -> TRUE
        const isVIP = await checkAndDecryptEbool(owner, "checkIsVIP");
        expect(isVIP).to.be.true;
    });

    it("Case 2: Should correctly identify a Non-Adult Non-VIP (Age 17, Credit 600, Tier 0)", async function () {
        const [, user2] = await ethers.getSigners();
        // 设置身份
        await setIdentity(user2, 17, 600, 0);

        // 检查是否成年 (17 >= 18) -> FALSE
        const isAdult = await checkAndDecryptEbool(user2, "checkIsAdult");
        expect(isAdult).to.be.false;

        // 检查是否 VIP (600 > 700 OR Tier 0) -> FALSE
        const isVIP = await checkAndDecryptEbool(user2, "checkIsVIP");
        expect(isVIP).to.be.false;
    });

    it("Case 3: Should correctly identify an Adult Non-VIP (Age 30, Credit 650, Tier 0)", async function () {
        const [, , user3] = await ethers.getSigners();
        // 设置身份
        await setIdentity(user3, 30, 650, 0);

        // 检查是否成年 (30 >= 18) -> TRUE
        const isAdult = await checkAndDecryptEbool(user3, "checkIsAdult");
        expect(isAdult).to.be.true;

        // 检查是否 VIP (650 > 700 OR Tier 0) -> FALSE
        const isVIP = await checkAndDecryptEbool(user3, "checkIsVIP");
        expect(isVIP).to.be.false;
    });
    
    it("Case 4: Should correctly identify an Adult VIP via Tier (Age 18, Credit 500, Tier 1)", async function () {
        const [, , , user4] = await ethers.getSigners();
        // 设置身份
        await setIdentity(user4, 18, 500, 1);

        // 检查是否成年 (18 >= 18) -> TRUE
        const isAdult = await checkAndDecryptEbool(user4, "checkIsAdult");
        expect(isAdult).to.be.true;

        // 检查是否 VIP (500 > 700 [F] OR Tier 1 [T]) -> TRUE
        const isVIP = await checkAndDecryptEbool(user4, "checkIsVIP");
        expect(isVIP).to.be.true;
    });
});