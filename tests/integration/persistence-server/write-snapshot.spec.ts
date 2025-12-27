// @vitest-environment node

import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import nacl from 'tweetnacl';
import bs58 from 'bs58';

import { createServer } from '../../../server/src/index.js';

async function httpPostJson(baseUrl: string, pathname: string, body: unknown): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return await new Promise((resolve, reject) => {
    const url = new URL(pathname, baseUrl);
    const payload = JSON.stringify(body);

    const req = http.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

describe('persistence server - write snapshot', () => {
  let server: http.Server;
  let baseUrl: string;
  let staticDir: string;
  let dataDir: string;

  beforeEach(async () => {
    staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jg-static-'));
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jg-data-'));

    await fs.writeFile(path.join(staticDir, 'index.html'), '<!doctype html><html><body>index</body></html>', 'utf8');

    server = createServer({ port: 0, host: '127.0.0.1', staticDir, dataDir, maxSnapshotsPerCluster: 5 });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('expected tcp address');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await fs.rm(staticDir, { recursive: true, force: true });
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it('rejects invalid signatures', async () => {
    const body = {
      issuer: 'not-a-key',
      signature: 'not-a-sig',
      tick: Date.now(),
      payload: {
        worldId: 'world1',
        clusterId: 'cluster1',
        snapshot: { hello: 'world' },
      },
    };

    const res = await httpPostJson(baseUrl, '/persistence/snapshot', body);
    expect(res.status).toBe(401);

    // Should not create snapshot directories
    const snapshotsRoot = path.join(dataDir, 'snapshots');
    const exists = await fs
      .stat(snapshotsRoot)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('accepts a valid signed snapshot and writes latest.json', async () => {
    const keyPair = nacl.sign.keyPair();
    const issuer = bs58.encode(keyPair.publicKey);

    const payload = {
      worldId: 'world1',
      clusterId: 'cluster1',
      snapshot: { units: [{ id: 'u1', x: 1, y: 2 }] },
    };

    const tick = Date.now();
    const message = JSON.stringify({ tick, payload });
    const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey));

    const body = {
      issuer,
      signature,
      tick,
      payload,
    };

    const res = await httpPostJson(baseUrl, '/persistence/snapshot', body);
    expect(res.status).toBe(200);

    const parsed = JSON.parse(res.body);
    expect(parsed.ok).toBe(true);
    expect(typeof parsed.digest).toBe('string');

    const latestPath = path.join(dataDir, 'snapshots', payload.worldId, payload.clusterId, 'latest.json');
    const latestRaw = await fs.readFile(latestPath, 'utf8');
    const latest = JSON.parse(latestRaw);

    expect(latest.kind).toBe('snapshot');
    expect(latest.signed.payload.worldId).toBe('world1');
    expect(latest.signed.payload.clusterId).toBe('cluster1');
    expect(latest.signed.issuer).toBe(issuer);
  });
});
