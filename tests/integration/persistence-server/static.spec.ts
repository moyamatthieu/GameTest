// @vitest-environment node

import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer } from '../../../server/src/index.js';

async function httpGet(baseUrl: string, pathname: string): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return await new Promise((resolve, reject) => {
    const url = new URL(pathname, baseUrl);
    const req = http.request(
      {
        method: 'GET',
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
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
    req.end();
  });
}

describe('persistence server - static + SPA fallback', () => {
  let server: http.Server;
  let baseUrl: string;
  let staticDir: string;

  beforeEach(async () => {
    staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jg-static-'));
    await fs.writeFile(path.join(staticDir, 'index.html'), '<!doctype html><html><body>index</body></html>', 'utf8');
    await fs.writeFile(path.join(staticDir, 'app.js'), 'console.log("app");', 'utf8');

    server = createServer({ port: 0, host: '127.0.0.1', staticDir });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('expected tcp address');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await fs.rm(staticDir, { recursive: true, force: true });
  });

  it('serves / as index.html', async () => {
    const res = await httpGet(baseUrl, '/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('index');
    expect(String(res.headers['content-type'])).toContain('text/html');
  });

  it('serves a concrete asset', async () => {
    const res = await httpGet(baseUrl, '/app.js');
    expect(res.status).toBe(200);
    expect(res.body).toContain('console.log');
  });

  it('falls back to index.html for unknown path', async () => {
    const res = await httpGet(baseUrl, '/does-not-exist');
    expect(res.status).toBe(200);
    expect(res.body).toContain('index');
  });
});
