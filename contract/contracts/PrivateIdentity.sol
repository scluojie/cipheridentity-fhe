// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateIdentity is ZamaEthereumConfig {
    mapping(address => euint32) private age;
    mapping(address => euint32) private creditScore;
    mapping(address => euint32) private membershipTier;

    // ---------------------------
    // Set Encrypted Identity
    // ---------------------------
    function setIdentity(
        externalEuint32 inputAge,
        bytes calldata ageProof,
        externalEuint32 inputCredit,
        bytes calldata creditProof,
        externalEuint32 inputTier,
        bytes calldata tierProof
    ) public {
        // Age
        euint32 ageValue = FHE.fromExternal(inputAge, ageProof);
        age[msg.sender] = ageValue;
        FHE.allowThis(ageValue);
        FHE.allow(ageValue, msg.sender);

        // Credit
        euint32 creditValue = FHE.fromExternal(inputCredit, creditProof);
        creditScore[msg.sender] = creditValue;
        FHE.allowThis(creditValue);
        FHE.allow(creditValue, msg.sender);

        // Tier
        euint32 tierValue = FHE.fromExternal(inputTier, tierProof);
        membershipTier[msg.sender] = tierValue;
        FHE.allowThis(tierValue);
        FHE.allow(tierValue, msg.sender);
    }

    // ---------------------------
    // Get encrypted values (view OK)
    // ---------------------------
    function getAge() public view returns (euint32) {
        return age[msg.sender];
    }

    function getCreditScore() public view returns (euint32) {
        return creditScore[msg.sender];
    }

    function getTier() public view returns (euint32) {
        return membershipTier[msg.sender];
    }

    // ---------------------------
    // Check Adult (must NOT be view)
    // ---------------------------
    function checkIsAdult() public returns (ebool) {
        ebool isAdult = FHE.ge(age[msg.sender], uint32(18));

        // Grant caller access to decrypt result
        FHE.allow(isAdult, msg.sender);
        FHE.allowThis(isAdult);

        return isAdult;
    }

    // ---------------------------
    // Check VIP (must NOT be view)
    // ---------------------------
    function checkIsVIP() public returns (ebool) {
        ebool highCredit = FHE.gt(creditScore[msg.sender], uint32(700));
        ebool isGoldTier = FHE.eq(membershipTier[msg.sender], uint32(1));

        ebool isVIP = FHE.or(highCredit, isGoldTier);

        FHE.allow(isVIP, msg.sender);
        FHE.allowThis(isVIP);

        return isVIP;
    }
}
