import { AccessScenario } from "./types";

export const SCENARIOS: AccessScenario[] = [
  {
    id: "club-access",
    title: "Night Club Entry",
    description: "Verify you are over 18 without showing your ID card.",
    requiredCondition: "Age ≥ 18",
    attributeKey: "age",
    threshold: 18,
    operator: ">=",
    icon: "🔞",
  },
  {
    id: "loan-application",
    title: "DeFi Loan Approval",
    description: "Prove credit score is above 700 to qualify for low rates.",
    requiredCondition: "Credit Score > 700",
    attributeKey: "creditScore",
    threshold: 700,
    operator: ">=", // Simplified for demo
    icon: "🏦",
  },
  {
    id: "vip-lounge",
    title: "VIP Lounge",
    description: "Access restricted to Gold Tier members only.",
    requiredCondition: "Tier == 1 (Gold)",
    attributeKey: "membershipTier",
    threshold: 1,
    operator: "==",
    icon: "💎",
  },
];

export const CONTRACT_CONFIG = {
  ADDRESS: "0x4abBBC78d17cEBCE8580c549e9650f34E6615424", // 占位符
  chainId: 11155111, // Sepolia testnet
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com", // Sepolia RPC
  ABI: [
    {
      inputs: [],
      name: "ZamaProtocolUnsupported",
      type: "error",
    },
    {
      inputs: [],
      name: "checkIsAdult",
      outputs: [
        {
          internalType: "ebool",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "checkIsVIP",
      outputs: [
        {
          internalType: "ebool",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "confidentialProtocolId",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getAge",
      outputs: [
        {
          internalType: "euint32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getCreditScore",
      outputs: [
        {
          internalType: "euint32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getTier",
      outputs: [
        {
          internalType: "euint32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "externalEuint32",
          name: "inputAge",
          type: "bytes32",
        },
        {
          internalType: "bytes",
          name: "ageProof",
          type: "bytes",
        },
        {
          internalType: "externalEuint32",
          name: "inputCredit",
          type: "bytes32",
        },
        {
          internalType: "bytes",
          name: "creditProof",
          type: "bytes",
        },
        {
          internalType: "externalEuint32",
          name: "inputTier",
          type: "bytes32",
        },
        {
          internalType: "bytes",
          name: "tierProof",
          type: "bytes",
        },
      ],
      name: "setIdentity",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
};
