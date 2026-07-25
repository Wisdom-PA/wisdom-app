import {
  type WifiCredentials,
  WifiProvisionError,
  type WifiProvisioner,
  type WifiProvisionResult,
} from './wifi-provisioner.ts';

export interface MockWifiProvisionerOptions {
  /** SSIDs that always fail transfer. */
  failSsids?: Set<string>;
}

export class MockWifiProvisioner implements WifiProvisioner {
  private lastResult: WifiProvisionResult | null = null;
  private readonly failSsids: Set<string>;

  constructor(options: MockWifiProvisionerOptions = {}) {
    this.failSsids = options.failSsids ?? new Set(['fail-network']);
  }

  async provision(credentials: WifiCredentials): Promise<WifiProvisionResult> {
    const ssid = credentials.ssid.trim();
    if (ssid.length === 0) {
      throw new WifiProvisionError('invalid_ssid', 'SSID is required');
    }
    if (credentials.password.length > 0 && credentials.password.length < 8) {
      throw new WifiProvisionError('invalid_password', 'Password must be at least 8 characters');
    }
    if (this.failSsids.has(ssid)) {
      const failed: WifiProvisionResult = {
        success: false,
        status: 'failed',
        ssid,
        message: `Could not join ${ssid} (mock failure)`,
      };
      this.lastResult = failed;
      throw new WifiProvisionError('transfer_failed', failed.message);
    }
    const result: WifiProvisionResult = {
      success: true,
      status: 'connected',
      ssid,
      message: `Cube joined ${ssid} (mock)`,
    };
    this.lastResult = result;
    return { ...result };
  }

  getLastResult(): WifiProvisionResult | null {
    return this.lastResult ? { ...this.lastResult } : null;
  }
}
