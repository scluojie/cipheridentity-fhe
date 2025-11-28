export interface EncryptedAttribute {
  id: string;
  label: string;
  type: 'uint8' | 'uint16' | 'uint32';
  timestamp: number;
  encryptedValue: string; // The hex string representation of the ciphertext
  decryptedMockValue: number; // Stored locally just for simulation proof
}

export interface AccessScenario {
  id: string;
  title: string;
  description: string;
  requiredCondition: string; // e.g., "Age >= 18"
  attributeKey: string;
  threshold: number;
  operator: '>=' | '<=' | '==';
  icon: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'success' | 'pending' | 'error';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MINT = 'MINT',
  ACCESS = 'ACCESS',
  CONTRACT = 'CONTRACT',
  AI_EXPLAINER = 'AI_EXPLAINER'
}