import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { SignedPayload, MutationLogEntry } from '../persistence/types.js';

export type JournalStoreConfig = {
  dataDir: string;
};

export type StoredJournalEntry = {
  kind: 'journal';
  storedAt: number;
  digest: string;
  signed: SignedPayload<MutationLogEntry>;
};

function assertSafeId(name: string, value: string): void {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(value)) {
    throw new Error(`${name}_invalid`);
  }
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function createJournalStore(config: JournalStoreConfig) {
  const root = path.resolve(config.dataDir);

  function getJournalFile(worldId: string, clusterId: string): string {
    assertSafeId('worldId', worldId);
    assertSafeId('clusterId', clusterId);
    return path.join(root, 'journals', worldId, `${clusterId}.jsonl`);
  }

  async function appendEntry(signed: SignedPayload<MutationLogEntry>): Promise<void> {
    const worldId = signed.payload.worldId;
    const clusterId = signed.payload.clusterId;

    const journalFile = getJournalFile(worldId, clusterId);
    await fs.mkdir(path.dirname(journalFile), { recursive: true });

    const storedAt = Date.now();
    const digest = sha256Hex(JSON.stringify(signed));

    const entry: StoredJournalEntry = {
      kind: 'journal',
      storedAt,
      digest,
      signed,
    };

    await fs.appendFile(journalFile, JSON.stringify(entry) + '\n', 'utf8');
  }

  return { appendEntry };
}
