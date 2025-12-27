import fs from 'node:fs/promises';
import path from 'node:path';

export async function pruneOldSnapshots(clusterDir: string, maxToKeep: number): Promise<void> {
  if (maxToKeep <= 0) return;

  let entries: string[];
  try {
    entries = await fs.readdir(clusterDir);
  } catch {
    return;
  }

  const snapshots = entries
    .filter((name) => name.startsWith('snap-') && name.endsWith('.json'))
    .sort();

  const excess = snapshots.length - maxToKeep;
  if (excess <= 0) return;

  const toDelete = snapshots.slice(0, excess);
  await Promise.all(
    toDelete.map(async (name) => {
      try {
        await fs.unlink(path.join(clusterDir, name));
      } catch {
        // best-effort
      }
    })
  );
}
