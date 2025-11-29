import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Contract } from "ethers";

// ------------------------------------------------------------------
// Helper function to get the PrivateIdentity contract instance
// ------------------------------------------------------------------
async function getPrivateIdentityContract(hre: any, address?: string): Promise<Contract> {
    const { ethers, deployments } = hre;
    const deployment = address
        ? { address }
        : await deployments.get("PrivateIdentity");
    
    console.log(`PrivateIdentity Contract: ${deployment.address}`);
    return ethers.getContractAt("PrivateIdentity", deployment.address);
}

// ------------------------------------------------------------------
// Task 1: Set a user's encrypted identity (Write operation)
// ------------------------------------------------------------------
task("task:set-identity-data", "Encrypts data, generates proofs, and calls setIdentity()")
    .addOptionalParam("address", "Optionally specify the PrivateIdentity contract address")
    .setAction(async function (taskArguments: TaskArguments, hre) {
        const { fhevm, ethers } = hre;
        await fhevm.initializeCLIApi();

        const contract = await getPrivateIdentityContract(hre, taskArguments.address);
        const [signer] = await ethers.getSigners();
        const contractAddress = await contract.getAddress();
        
        // --- 1. Define Clear Text Data ---
        const TEST_AGE = 15;
        const TEST_CREDIT = 550;
        const TEST_TIER = 1;

        console.log(`\nUsing signer: ${signer.address}`);
        console.log(`\n--- Encrypting and Generating Proofs for: ---`);
        console.log(`Age: ${TEST_AGE}, Credit Score: ${TEST_CREDIT}, Tier: ${TEST_TIER}`);
        console.log(`-------------------------------------------\n`);

        // --- 2. Encrypt Data and Generate Proofs using the combined API ---
        
        // Encrypt Age and generate proof
        const buildAge = fhevm.createEncryptedInput(contractAddress, signer.address);
        const encryptedAge = await buildAge.add32(TEST_AGE).encrypt();
        
        // Encrypt Credit Score and generate proof
        const buildCredit = fhevm.createEncryptedInput(contractAddress, signer.address);
        const encryptedCredit = await buildCredit.add32(TEST_CREDIT).encrypt();

        // Encrypt Membership Tier and generate proof
        const buildTier = fhevm.createEncryptedInput(contractAddress, signer.address);
        const encryptedTier = await buildTier.add32(TEST_TIER).encrypt();
        
        // --- 3. Call setIdentity() ---
        console.log("Sending transaction to setIdentity()...");
        
        try {
            const tx = await contract
                .connect(signer)
                .setIdentity(
                    encryptedAge.handles[0], 
                    encryptedAge.inputProof, 
                    encryptedCredit.handles[0], 
                    encryptedCredit.inputProof, 
                    encryptedTier.handles[0], 
                    encryptedTier.inputProof
                );
            
            await tx.wait(); 
            console.log("✅ Identity data successfully set on chain.");
            console.log(`Transaction Hash: ${tx.hash}`);

            console.log("\nTo check the access control logic, run:");
            console.log(`npx hardhat task:check-identity-logic --address ${contractAddress}`);

        } catch (error) {
            console.error("❌ Failed to call setIdentity() function:", error);
        }
    });

// ------------------------------------------------------------------
// Task 2: Check Identity Logic and Decrypt Results (Read operation)
// ------------------------------------------------------------------
task("task:check-identity-logic", "Calls checkIsAdult() and checkIsVIP() and decrypts the ebool results")
    .addOptionalParam("address", "Optionally specify the PrivateIdentity contract address")
    .setAction(async function (taskArguments: TaskArguments, hre) {
        const { fhevm, ethers } = hre;
        await fhevm.initializeCLIApi();

        const contract = await getPrivateIdentityContract(hre, taskArguments.address);
        const [signer] = await ethers.getSigners();
        const contractAddress = await contract.getAddress();

        console.log(`\n--- Checking Access Control Logic for ${signer.address} ---`);

        // --- A. Check Is Adult ---
        try {
            console.log("\nCalling checkIsAdult()... (Returns ebool)");
            
            // Send transaction to execute FHE logic and update ACLs
            const txAdult = await contract.connect(signer).checkIsAdult();
            await txAdult.wait();

            // Use staticCall to get the encrypted return value (ciphertext)
            const encryptedResultAdult = await contract.checkIsAdult.staticCall();
            
            // Decrypt the ebool result
            const clearResultAdult = await fhevm.userDecryptEbool(
                encryptedResultAdult,
                contractAddress,
                signer
            );

            console.log(`Encrypted 'Is Adult' result: ${encryptedResultAdult.slice(0, 10)}...`);
            console.log(`Decrypted 'Is Adult' result: ${clearResultAdult ? "✅ TRUE" : "❌ FALSE"}`);
        
        } catch (error) {
            console.error("❌ Failed to check Is Adult:", error);
        }

        // --- B. Check Is VIP ---
        try {
            console.log("\nCalling checkIsVIP()... (Returns ebool)");
            
            // Send transaction to execute FHE logic and update ACLs
            const txVIP = await contract.connect(signer).checkIsVIP();
            await txVIP.wait();

            // Use staticCall to get the encrypted return value (ciphertext)
            const encryptedResultVIP = await contract.checkIsVIP.staticCall();
            
            // Decrypt the ebool result
            const clearResultVIP = await fhevm.userDecryptEbool(
                encryptedResultVIP,
                contractAddress,
                signer
            );

            console.log(`Encrypted 'Is VIP' result: ${encryptedResultVIP.slice(0, 10)}...`);
            console.log(`Decrypted 'Is VIP' result: ${clearResultVIP ? "✅ TRUE" : "❌ FALSE"}`);

        } catch (error) {
            console.error("❌ Failed to check Is VIP:", error);
        }
    });