// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceClient } from '../../../src/core/network/PersistenceClient';
import { createServer } from '../../../server/src/index.js';
import * as nacl from 'tweetnacl';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

describe('Persistence Backup/Restore Integration', () => {
  let server: http.Server;
  let baseUrl: string;
  let dataDir: string;
  let staticDir: string;
  let client: PersistenceClient;
  let keyPair: nacl.SignKeyPair;

  beforeEach(async () => {
    staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jg-static-'));
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jg-data-'));

    server = createServer({ port: 0, host: '127.0.0.1', staticDir, dataDir });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('expected tcp address');
    baseUrl = `http://127.0.0.1:${addr.port}`;

    keyPair = nacl.sign.keyPair();
    client = new PersistenceClient(baseUrl, keyPair);
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await fs.rm(staticDir, { recursive: true, force: true });
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it('should perform a full backup and restore cycle', async () => {
    const worldId = 'test-world';
    const clusterId = 'test-cluster';
    const snapshotData = { entities: [1, 2, 3], state: 'active' };

    // 1. Save Snapshot
    await client.saveSnapshot(worldId, clusterId, snapshotData);

    // 2. Restore Snapshot
    const restored = await client.getLatestSnapshot(worldId, clusterId);

    expect(restored).toBeDefined();
    expect(restored?.worldId).toBe(worldId);
    expect(restored?.clusterId).toBe(clusterId);
    expect(restored?.snapshot).toEqual(snapshotData);
  });
});
