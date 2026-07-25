import { describe, expect, it } from 'vitest';
import { MockWifiProvisioner } from '../src/wifi/mock-wifi-provisioner.ts';
import { WifiProvisionError } from '../src/wifi/wifi-provisioner.ts';

describe('MockWifiProvisioner', () => {
  it('accepts valid credentials', async () => {
    const provisioner = new MockWifiProvisioner();
    const result = await provisioner.provision({ ssid: 'HomeNet', password: 'password1' });
    expect(result.success).toBe(true);
    expect(result.status).toBe('connected');
    expect(provisioner.getLastResult()?.ssid).toBe('HomeNet');
  });

  it('rejects blank SSID and short passwords', async () => {
    const provisioner = new MockWifiProvisioner();
    await expect(provisioner.provision({ ssid: '  ', password: '' })).rejects.toBeInstanceOf(WifiProvisionError);
    await expect(provisioner.provision({ ssid: 'Home', password: 'short' })).rejects.toMatchObject({
      code: 'invalid_password',
    });
  });

  it('simulates transfer failure', async () => {
    const provisioner = new MockWifiProvisioner();
    await expect(provisioner.provision({ ssid: 'fail-network', password: 'password1' })).rejects.toMatchObject({
      code: 'transfer_failed',
    });
    expect(provisioner.getLastResult()?.success).toBe(false);
  });

  it('allows open networks with empty password', async () => {
    const provisioner = new MockWifiProvisioner();
    const result = await provisioner.provision({ ssid: 'Guest', password: '' });
    expect(result.success).toBe(true);
  });

  it('uses default options and empty getLastResult', async () => {
    const provisioner = new MockWifiProvisioner();
    expect(provisioner.getLastResult()).toBeNull();
    await provisioner.provision({ ssid: 'HomeNet', password: 'password1' });
    expect(provisioner.getLastResult()?.success).toBe(true);
  });
});
