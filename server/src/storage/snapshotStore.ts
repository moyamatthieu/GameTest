import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { SignedPayload, WorldSnapshot } from '../persistence/types.js';
import { pruneOldSnapshots } from './retention.js';

export type SnapshotStoreConfig = {
  dataDir: string;
  maxSnapshotsPerCluster: number;
};

export type StoredSnapshot = {
  kind: 'snapshot';
  storedAt: number; // server timestamp (ms)
  digest: string; // sha256 hex
  signed: SignedPayload<WorldSnapshot>;
};

export type SaveSnapshotResult = {
  storedAt: number;
  digest: string;
  latestPath: string;
};

export type ReadLatestSnapshotResult = StoredSnapshot | null;

function assertSafeId(name: string, value: string): void {
  // Keep it strict to avoid path traversal / weird files.
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(value)) {
    throw new Error(`${name}_invalid`);
  }
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function createSnapshotStore(config: SnapshotStoreConfig) {
  const root = path.resolve(config.dataDir);

  function getClusterDir(worldId: string, clusterId: string): string {
    assertSafeId('worldId', worldId);
    assertSafeId('clusterId', clusterId);
    return path.join(root, 'snapshots', worldId, clusterId);
  }

  async function saveSignedSnapshot(signed: SignedPayload<WorldSnapshot>): Promise<SaveSnapshotResult> {
    assertSafeId('worldId', signed.payload.worldId);
    assertSafeId('clusterId', signed.payload.clusterId);

    const storedAt = Date.now();
    const digest = sha256Hex(JSON.stringify({ issuer: signed.issuer, signature: signed.signature, tick: signed.tick, payload: signed.payload }));

    const clusterDir = getClusterDir(signed.payload.worldId, signed.payload.clusterId);
    await fs.mkdir(clusterDir, { recursive: true });

    const stored: StoredSnapshot = {
      kind: 'snapshot',
      storedAt,
      digest,
      signed,
    };

    const fileName = `snap-${storedAt}-${digest}.json`;
    const filePath = path.join(clusterDir, fileName);
    const latestPath = path.join(clusterDir, 'latest.json');

    await fs.writeFile(filePath, JSON.stringify(stored), 'utf8');
    await fs.writeFile(latestPath, JSON.stringify(stored), 'utf8');

    await pruneOldSnapshots(clusterDir, config.maxSnapshotsPerCluster);

    return { storedAt, digest, latestPath };
  }

  async function readLatestSnapshot(worldId: string, clusterId: string): Promise<ReadLatestSnapshotResult> {
    const clusterDir = getClusterDir(worldId, clusterId);
    const latestPath = path.join(clusterDir, 'latest.json');

    try {
      const raw = await fs.readFile(latestPath, 'utf8');
      const parsed = JSON.parse(raw) as StoredSnapshot;
      if (!parsed || parsed.kind !== 'snapshot') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  return { saveSignedSnapshot, readLatestSnapshot };
}
