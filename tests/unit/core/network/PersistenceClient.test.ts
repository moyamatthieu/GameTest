import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistenceClient } from '../../../../src/core/network/PersistenceClient';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

describe('PersistenceClient', () => {
  let client: PersistenceClient;
  let keyPair: nacl.SignKeyPair;
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    keyPair = nacl.sign.keyPair();
    client = new PersistenceClient(baseUrl, keyPair);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should sign and send a snapshot', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ ok: true }) };
    (fetch as any).mockResolvedValue(mockResponse);

    const snapshot = { entities: [] };
    await client.saveSnapshot('world1', 'cluster1', snapshot);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/persistence/snapshot'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );

    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.issuer).toBe(bs58.encode(keyPair.publicKey));
    expect(body.payload.worldId).toBe('world1');
    expect(body.payload.clusterId).toBe('cluster1');
    expect(body.payload.snapshot).toEqual(snapshot);
    expect(body.signature).toBeDefined();
  });

  it('should fetch the latest snapshot', async () => {
    const mockSnapshot = { worldId: 'world1', clusterId: 'cluster1', snapshot: { foo: 'bar' } };
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ signed: { payload: mockSnapshot } }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await client.getLatestSnapshot('world1', 'cluster1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/persistence/snapshot/latest?worldId=world1&clusterId=cluster1')
    );
    expect(result).toEqual(mockSnapshot);
  });

  it('should return null if snapshot not found', async () => {
    const mockResponse = { ok: false, status: 404 };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await client.getLatestSnapshot('world1', 'cluster1');
    expect(result).toBeNull();
  });
});
