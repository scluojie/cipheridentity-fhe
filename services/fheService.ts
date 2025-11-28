// FHE encryption utilities using Zama's relayer-sdk for Sepolia
import { BrowserProvider, Contract, Signer } from "ethers";
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from "@zama-fhe/relayer-sdk/bundle";
import { CONTRACT_CONFIG } from "../constants";

// Browser polyfills
if (typeof window !== "undefined" && !window.global) {
  (window as any).global = window;
}

type FhevmInstance = any;
let fhevmInstance: FhevmInstance | null = null;
let contract: Contract | null = null;
let signer: Signer | null = null;
let signerAddress: string | null = null;

/**
 * 初始化 FHEVM 实例 (WASM)
 */
export async function initFhevm() {
  console.log("CONTRACT_CONFIG:", CONTRACT_CONFIG);
  if (fhevmInstance) return fhevmInstance;

  try {
    if (typeof window === "undefined")
      throw new Error("FHE initialization must run in the browser context");

    console.log("Using relayer-sdk for Sepolia");
    await initSDK();

    const config = {
      ...SepoliaConfig,
      network: window.ethereum,
      relayerUrl: "http://127.0.0.1:3000/relayer-api",
    };

    console.log("FHE Config:", config);
    fhevmInstance = await createInstance(config);
    console.log("FHEVM instance initialized successfully with relayer-sdk");
    return fhevmInstance;
  } catch (error) {
    console.error("Failed to initialize FHEVM:", error);
    throw error;
  }
}

/**
 * 设置 Ethers provider, signer, 和 contract 实例。
 */
export async function setWeb3Context(address: string) {
  try {
    if (!window.ethereum) throw new Error("Ethereum provider not found.");

    const provider = new BrowserProvider(window.ethereum);
    const currentSigner = await provider.getSigner(address);

    signer = currentSigner;
    signerAddress = address;
    console.log("Signer address =", signerAddress);

    contract = new Contract(
      CONTRACT_CONFIG.ADDRESS,
      CONTRACT_CONFIG.ABI,
      signer
    );
    console.log("Web3 context set. Contract ready.");
  } catch (error) {
    console.error("Failed to set Web3 context:", error);
    throw error;
  }
}

/**
 * Mint FHE Encrypted Identity
 */
export async function mintIdentityOnChain(
  contractAddress: string,
  userAddress: string,
  age: number,
  credit: number,
  tier: number
) {
  if (!contractAddress || !userAddress)
    throw new Error("Contract address and user address are required");
  if (!fhevmInstance) await initFhevm();

  try {
    const ageInput = fhevmInstance.createEncryptedInput(
      contractAddress,
      userAddress
    );
    ageInput.add32(age);
    const encryptedAge = await ageInput.encrypt();

    const creditInput = fhevmInstance.createEncryptedInput(
      contractAddress,
      userAddress
    );
    creditInput.add32(credit);
    const encryptedCredit = await creditInput.encrypt();

    const tierInput = fhevmInstance.createEncryptedInput(
      contractAddress,
      userAddress
    );
    tierInput.add32(tier);
    const encryptedTier = await tierInput.encrypt();

    return {
      handles: [
        encryptedAge.handles[0],
        encryptedCredit.handles[0],
        encryptedTier.handles[0],
      ],
      proofs: [
        encryptedAge.inputProof,
        encryptedCredit.inputProof,
        encryptedTier.inputProof,
      ],
    };
  } catch (error: any) {
    console.error("Failed to encrypt data:", error);
    throw new Error(`Encryption failed: ${error?.message || "Unknown error"}`);
  }
}

export const verifyAccessOnChain = async (
  methodName: "checkIsAdult" | "checkIsVIP"
): Promise<boolean> => {
  if (!fhevmInstance) throw new Error("FHEVM instance not initialized");
  if (!signer) throw new Error("Signer not ready");

  // 1. 发交易执行逻辑（因为里面有 FHE.allow）
  const tx = await contract[methodName]();
  await tx.wait();

  // 2. 用 staticCall 拿返回的加密 handle
  const encryptedHandle: string = await contract[methodName].staticCall();
  console.log("Encrypted handle:", encryptedHandle);

  // 3. 生成 keypair + EIP712 签名
  const keypair = fhevmInstance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "10";

  const contractAddresses = [CONTRACT_CONFIG.ADDRESS];

  const eip712 = fhevmInstance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimestamp,
    durationDays
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification:
        eip712.types.UserDecryptRequestVerification,
    },
    eip712.message
  );

  // 4. 调用 userDecrypt 解密
  const result = await fhevmInstance.userDecrypt(
    [{ handle: encryptedHandle, contractAddress: CONTRACT_CONFIG.ADDRESS }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    await signer.getAddress(),
    startTimestamp,
    durationDays
  );

  const decryptedValue = Object.values(result)[0];
  console.log(`[Decrypted] ${methodName} =`, decryptedValue);

  return decryptedValue === 1n || decryptedValue === true;
};

export { signerAddress };
