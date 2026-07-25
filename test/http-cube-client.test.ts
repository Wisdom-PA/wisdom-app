import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpCubeClient } from '../src/api/http-cube-client.ts';

describe('HttpCubeClient', () => {
  let client: HttpCubeClient;

  beforeEach(() => {
    client = new HttpCubeClient('http://cube.local:3000');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: '0.1.0' }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls GET /status', async () => {
    const status = await client.getStatus();
    expect(status).toEqual({ version: '0.1.0' });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/status',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });

  it('calls GET /config', async () => {
    await client.getConfig();
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/config', expect.anything());
  });

  it('calls PATCH /config', async () => {
    await client.patchConfig({ timezone: 'US/Pacific' });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/config',
      expect.objectContaining({ method: 'PATCH', body: '{"timezone":"US/Pacific"}' })
    );
  });

  it('calls GET /devices', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);
    const devices = await client.listDevices();
    expect(devices).toEqual([]);
  });

  it('calls GET /devices/:id', async () => {
    await client.getDevice('d-1');
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/devices/d-1', expect.anything());
  });

  it('calls PATCH /devices/:id', async () => {
    await client.patchDevice('d-1', { room: 'Kitchen' });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/devices/d-1',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('rejects setDeviceState until cube exposes control', async () => {
    await expect(client.setDeviceState('d-1', { on: true })).rejects.toThrow('not exposed');
  });

  it('calls DELETE /devices/:id with 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await client.removeDevice('d-1');
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/devices/d-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('calls profile CRUD methods', async () => {
    await client.listProfiles();
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/profiles', expect.anything());

    await client.getProfile('p-1');
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/profiles/p-1', expect.anything());

    await client.createProfile({
      preferredName: 'Bob',
      role: 'adult',
      language: 'en',
      voiceVerbosity: 'normal',
      internetPolicy: 'ask_every_time',
      linkedAdults: [],
    });
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/profiles', expect.objectContaining({ method: 'POST' }));

    await client.patchProfile('p-1', { language: 'cy' });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/profiles/p-1',
      expect.objectContaining({ method: 'PATCH' })
    );

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await client.removeProfile('p-1');
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/profiles/p-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('calls routine CRUD, run, and history', async () => {
    await client.listRoutines();
    await client.getRoutine('r-1');
    await client.createRoutine({
      name: 'Test',
      ownerProfileId: 'p-1',
      triggers: [{ type: 'time', config: { hour: 7 } }],
      conditions: [],
      actions: [{ type: 'notification', config: { message: 'hi' } }],
    });
    await client.runRoutine('r-1', { profileId: 'p-1' });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/routines/r-1/run',
      expect.objectContaining({ method: 'POST' })
    );
    await client.getRoutineHistory('r-1', 5);
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/routines/r-1/history?limit=5', expect.anything());
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await client.removeRoutine('r-1');
  });

  it('calls internet consent methods', async () => {
    await client.grantInternetConsent({ profileId: 'p-1', ttlMs: 1000 });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/internet/consent',
      expect.objectContaining({ method: 'POST' })
    );
    await client.getInternetConsent('p-1');
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/internet/consent/p-1', expect.anything());
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await client.revokeInternetConsent('p-1');
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/internet/consent/p-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('calls log query methods', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);
    await client.queryLogs({ limit: 10, offset: 0 });
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/logs?limit=10&offset=0', expect.anything());

    await client.getChain('chain-1');
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/logs/chain-1', expect.anything());
  });

  it('calls backup methods including getBackup and dry-run restore', async () => {
    await client.getBackupStatus();
    await client.triggerBackup();
    await client.getBackup('b-1');
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/backup/b-1', expect.anything());
    await client.restore({ backupId: 'b-1', mode: 'factory_reset', dryRun: true });
    expect(fetch).toHaveBeenCalledWith(
      'http://cube.local:3000/backup/restore',
      expect.objectContaining({
        method: 'POST',
        body: '{"backupId":"b-1","mode":"factory_reset","dryRun":true}',
      })
    );
  });

  it('calls clearLogs and listMemories', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await client.clearLogs();
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/logs', expect.objectContaining({ method: 'DELETE' }));
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);
    await client.listMemories();
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/memories', expect.anything());
  });

  it('calls chat', async () => {
    await client.chat({ text: 'Hello' });
    expect(fetch).toHaveBeenCalledWith('http://cube.local:3000/chat', expect.objectContaining({ method: 'POST' }));
  });

  it('throws on non-ok responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: { message: 'Profile not found' } }),
    } as Response);
    await expect(client.getProfile('missing')).rejects.toThrow('Cube API 404: Profile not found');
  });

  it('handles error responses without JSON body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('no json')),
    } as Response);
    await expect(client.getStatus()).rejects.toThrow('Cube API 500: Internal Server Error');
  });
});
