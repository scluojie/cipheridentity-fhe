import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// 导入 Zama FHE SDK
import { initFhevm, createInstance, FhevmInstance } from '@zama-fhe/sdk';

// 导入合约 ABI 和地址 (需要替换为实际值)
// 假设这是部署在 Hardhat/Sepolia 上的地址和 ABI
import ConfidentialAccessControl from './ConfidentialAccessControl.json'; 
const CONTRACT_ADDRESS = "0x5FbDB2315678afec154E83a0050e82EAc3B74F3B"; // 示例 Hardhat 地址

// FHEVM 实例和提供者
let fhevmInstance: FhevmInstance | null = null;
let provider: ethers.BrowserProvider | null = null;
let contract: ethers.Contract | null = null;
let signer: ethers.Signer | null = null;

const initFHE = async () => {
    if (fhevmInstance) return;

    await initFhevm();

    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        
        // FHEVM 实例用于加密和解密
        fhevmInstance = await createInstance({
            chainId: (await provider.getNetwork()).chainId, 
        });

        // 合约实例
        contract = new ethers.Contract(CONTRACT_ADDRESS, ConfidentialAccessControl.abi, signer);
    }
};

const AccessControlComponent: React.FC = () => {
    const [status, setStatus] = useState("初始化中...");
    const [userAge, setUserAge] = useState(25);
    const [minAge, setMinAge] = useState(18);
    const [accessResult, setAccessResult] = useState("待检查");
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        initFHE().then(() => {
            setStatus("FHEVM 已初始化，钱包已连接。");
        }).catch(err => {
            console.error("FHEVM 初始化失败:", err);
            setStatus("初始化失败！请检查控制台和钱包。");
        });
    }, []);

    // 1. 注册加密年龄
    const handleRegisterAge = async () => {
        if (!fhevmInstance || !contract || !signer) return;

        try {
            setStatus(`正在加密年龄 ${userAge} 并注册...`);
            
            // a) 获取合约公钥
            const contractPublicKey = fhevmInstance.getPublicKey(CONTRACT_ADDRESS);

            // b) 加密用户的年龄 (euint16)
            const encryptedAge = fhevmInstance.encryptOnChain.euint16(userAge, contractPublicKey);

            // c) 调用合约函数
            const tx = await contract.registerEncryptedAge(encryptedAge);
            await tx.wait();

            setStatus(`年龄 ${userAge} (密文) 注册成功！`);
            setIsRegistered(true);

        } catch (error) {
            console.error("注册失败:", error);
            setStatus(`注册失败: ${error.message}`);
        }
    };

    // 2. 检查访问权限
    const handleCheckAccess = async () => {
        if (!fhevmInstance || !contract || !signer) return;
        setAccessResult("检查中...");

        try {
            setStatus(`正在调用合约检查年龄是否 >= ${minAge}...`);

            // a) 调用合约的 View 函数，传入明文所需年龄
            // 合约在 FHEVM 上执行同态比较，返回加密布尔值 (ebool)
            const encryptedResult = await contract.checkAgeRequirement(minAge);

            setStatus("合约返回加密布尔值。正在客户端解密...");

            // b) 获取解密所需的 EIP-712 签名
            const signature = await fhevmInstance.getSignature(CONTRACT_ADDRESS);

            // c) 使用签名和密文进行解密
            const decryptedValue = fhevmInstance.decrypt.ebool(
                CONTRACT_ADDRESS,
                encryptedResult, // 合约返回的 ebool 密文
                signature
            );

            setAccessResult(decryptedValue ? "✅ 允许访问" : "❌ 拒绝访问");
            setStatus("访问检查完成并解密成功。");

        } catch (error) {
            console.error("访问检查失败:", error);
            setAccessResult("检查失败 (查看控制台)");
            setStatus(`访问检查失败: ${error.message}`);
        }
    };


    return (
        <div style={{ padding: '20px', maxWidth: '600px', border: '1px solid #ccc' }}>
            <h2>🔒 隐私访问控制 (Zama FHE)</h2>
            <p>状态: <strong>{status}</strong></p>
            <hr />

            <h3>身份属性注册</h3>
            <div>
                <label>你的真实年龄 (明文): </label>
                <input 
                    type="number" 
                    value={userAge} 
                    onChange={(e) => setUserAge(Number(e.target.value))} 
                    min="1"
                    disabled={isRegistered}
                />
            </div>
            <button onClick={handleRegisterAge} disabled={isRegistered}>
                {isRegistered ? "已注册 (密文存储)" : "1. 注册加密年龄"}
            </button>
            <p style={{ fontSize: 'small', color: 'gray' }}>
                * 你的年龄会被加密为密文存储到链上。
            </p>
            <hr />

            <h3>🔐 访问权限检查</h3>
            <div>
                <label>所需最小年龄 (明文检查条件): </label>
                <input 
                    type="number" 
                    value={minAge} 
                    onChange={(e) => setMinAge(Number(e.target.value))} 
                    min="1"
                />
            </div>
            <button onClick={handleCheckAccess} disabled={!isRegistered}>
                2. 检查访问权限 (同态计算)
            </button>
            
            <h3 style={{ marginTop: '20px' }}>检查结果:</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: accessResult.startsWith('✅') ? 'green' : 'red' }}>
                {accessResult}
            </p>
        </div>
    );
};

export default AccessControlComponent;