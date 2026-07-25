export type WifiProvisionErrorCode = 'invalid_ssid' | 'invalid_password' | 'transfer_failed';

export class WifiProvisionError extends Error {
  readonly code: WifiProvisionErrorCode;

  constructor(code: WifiProvisionErrorCode, message: string) {
    super(message);
    this.name = 'WifiProvisionError';
    this.code = code;
  }
}

export interface WifiCredentials {
  ssid: string;
  password: string;
}

export type WifiProvisionStatus = 'idle' | 'provisioning' | 'connected' | 'failed';

export interface WifiProvisionResult {
  success: boolean;
  status: WifiProvisionStatus;
  ssid: string;
  message: string;
}

export interface WifiProvisioner {
  provision(credentials: WifiCredentials): Promise<WifiProvisionResult>;
  getLastResult(): WifiProvisionResult | null;
}
