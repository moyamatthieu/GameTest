import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export type ServerConfig = {
  host: string;
  port: number;
  staticDir: string;
  dataDir: string;
  maxBodyBytes: number;
  maxSnapshotsPerCluster: number;
  rateLimit: RateLimitConfig;
};

function envNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function envString(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function getRepoRootFromThisFile(): string {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  // server/src/config.ts -> server/src -> server -> repo root
  return path.resolve(dirname, '..', '..');
}

export function loadConfig(overrides?: Partial<ServerConfig>): ServerConfig {
  const repoRoot = getRepoRootFromThisFile();

  const config: ServerConfig = {
    host: envString('HOST', '127.0.0.1'),
    port: envNumber('PORT', 3001),
    staticDir: envString('STATIC_DIR', path.join(repoRoot, 'dist')),
    dataDir: envString('DATA_DIR', path.join(repoRoot, 'server', 'data')),
    maxBodyBytes: envNumber('MAX_BODY_BYTES', 1024 * 1024),
    maxSnapshotsPerCluster: envNumber('MAX_SNAPSHOTS_PER_CLUSTER', 10),
    rateLimit: {
      windowMs: envNumber('RATE_LIMIT_WINDOW_MS', 60_000),
      maxRequests: envNumber('RATE_LIMIT_MAX_REQUESTS', 60),
    },
  };

  return {
    ...config,
    ...overrides,
    rateLimit: {
      ...config.rateLimit,
      ...(overrides?.rateLimit ?? {}),
    },
  };
}
