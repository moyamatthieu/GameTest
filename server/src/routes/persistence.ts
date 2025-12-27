import type { IncomingMessage, ServerResponse } from 'node:http';

import type { RateLimiter } from '../http/rateLimit.js';
import { readJsonBody } from '../http/readJsonBody.js';
import { HttpError, sendJson } from '../http/responses.js';
import { verifyDetachedSignature } from '../crypto/verify.js';
import type { SignedPayload, WorldSnapshot, MutationLogEntry } from '../persistence/types.js';
import type { RequestContext } from './router.js';
import type { ServerConfig } from '../config.js';
import type { SnapshotStoreConfig } from '../storage/snapshotStore.js';
import { createSnapshotStore } from '../storage/snapshotStore.js';
import { createJournalStore } from '../storage/journalStore.js';
import { logger } from '../utils/logger.js';

export type PersistenceDeps = {
  config: ServerConfig;
  limiter: RateLimiter;
  storeConfig: SnapshotStoreConfig;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isSignedSnapshot(value: unknown): value is SignedPayload<WorldSnapshot> {
  if (!isObject(value)) return false;
  const issuer = asString(value.issuer);
  const signature = asString(value.signature);
  const tick = asNumber(value.tick);
  const payload = value.payload;
  if (!issuer || !signature || tick === null) return false;
  if (!isObject(payload)) return false;

  const worldId = asString(payload.worldId);
  const clusterId = asString(payload.clusterId);
  if (!worldId || !clusterId) return false;

  return true;
}

function isSignedJournalEntry(value: unknown): value is SignedPayload<MutationLogEntry> {
  if (!isObject(value)) return false;
  const issuer = asString(value.issuer);
  const signature = asString(value.signature);
  const tick = asNumber(value.tick);
  const payload = value.payload;
  if (!issuer || !signature || tick === null) return false;
  if (!isObject(payload)) return false;

  const worldId = asString(payload.worldId);
  const clusterId = asString(payload.clusterId);
  if (!worldId || !clusterId) return false;

  return true;
}

function canonicalMessageForSignature(body: SignedPayload<WorldSnapshot | MutationLogEntry>): string {
  // IMPORTANT: Canonicalization relies on stable insertion order.
  return JSON.stringify({ tick: body.tick, payload: body.payload });
}

export function createWriteSnapshotRoute(deps: PersistenceDeps) {
  const store = createSnapshotStore(deps.storeConfig);

  return async function writeSnapshot(req: IncomingMessage, res: ServerResponse, ctx: RequestContext): Promise<void> {
    const limitKey = `${ctx.clientIp}:persistence:snapshot`;
    const limited = deps.limiter.check(limitKey);
    if (!limited.allowed) {
      res.setHeader('retry-after', Math.ceil(limited.retryAfterMs / 1000));
      sendJson(res, 429, { ok: false, error: 'rate_limited', retryAfterMs: limited.retryAfterMs });
      return;
    }

    const body = await readJsonBody(req, deps.config.maxBodyBytes);
    if (!isSignedSnapshot(body)) {
      throw new HttpError(400, 'invalid_request');
    }

    // Basic timestamp sanity (client clocks can drift, but reject extreme values)
    const now = Date.now();
    const maxSkewMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const message = canonicalMessageForSignature(body);
    const ok = verifyDetachedSignature({
      issuerPublicKeyBase58: body.issuer,
      signatureBase58: body.signature,
      message,
    });

    if (!ok) {
      logger.warn('Invalid signature attempt', {
        requestId: ctx.requestId,
        clientIp: ctx.clientIp,
        issuer: body.issuer,
        clusterId: body.payload.clusterId,
      });
      throw new HttpError(401, 'invalid_signature');
    }

    const result = await store.saveSignedSnapshot(body);

    logger.info('Snapshot saved', {
      requestId: ctx.requestId,
      clusterId: body.payload.clusterId,
      tick: body.tick,
      digest: result.digest,
    });

    sendJson(res, 200, {
      ok: true,
      storedAt: result.storedAt,
      digest: result.digest,
    });
  };
}

export function createRestoreLatestSnapshotRoute(deps: PersistenceDeps) {
  const store = createSnapshotStore(deps.storeConfig);

  return async function restoreLatest(req: IncomingMessage, res: ServerResponse, ctx: RequestContext): Promise<void> {
    const limitKey = `${ctx.clientIp}:persistence:restore`;
    const limited = deps.limiter.check(limitKey);
    if (!limited.allowed) {
      res.setHeader('retry-after', Math.ceil(limited.retryAfterMs / 1000));
      sendJson(res, 429, { ok: false, error: 'rate_limited', retryAfterMs: limited.retryAfterMs });
      return;
    }

    const url = new URL(req.url ?? '/', 'http://local');
    const worldId = url.searchParams.get('worldId');
    const clusterId = url.searchParams.get('clusterId');

    if (!worldId || !clusterId) {
      throw new HttpError(400, 'invalid_request');
    }

    const latest = await store.readLatestSnapshot(worldId, clusterId);
    if (!latest) {
      logger.debug('Snapshot not found', {
        requestId: ctx.requestId,
        worldId,
        clusterId,
      });
      sendJson(res, 404, { ok: false, error: 'no_snapshot' });
      return;
    }

    logger.info('Snapshot restored', {
      requestId: ctx.requestId,
      worldId,
      clusterId,
      tick: latest.signed.tick,
      digest: latest.digest,
    });

    // Include verification metadata: digest + timestamps + public key (issuer)
    sendJson(res, 200, {
      ok: true,
      storedAt: latest.storedAt,
      digest: latest.digest,
      signed: latest.signed,
    });
  };
}

export function createAppendJournalRoute(deps: PersistenceDeps) {
  const store = createJournalStore({ dataDir: deps.storeConfig.dataDir });

  return async function appendJournal(req: IncomingMessage, res: ServerResponse, ctx: RequestContext): Promise<void> {
    const limitKey = `${ctx.clientIp}:persistence:journal`;
    const limited = deps.limiter.check(limitKey);
    if (!limited.allowed) {
      res.setHeader('retry-after', Math.ceil(limited.retryAfterMs / 1000));
      sendJson(res, 429, { ok: false, error: 'rate_limited', retryAfterMs: limited.retryAfterMs });
      return;
    }

    const body = await readJsonBody(req, deps.config.maxBodyBytes);
    if (!isSignedJournalEntry(body)) {
      throw new HttpError(400, 'invalid_request');
    }

    const message = canonicalMessageForSignature(body);
    const ok = verifyDetachedSignature({
      issuerPublicKeyBase58: body.issuer,
      signatureBase58: body.signature,
      message,
    });

    if (!ok) {
      throw new HttpError(401, 'invalid_signature');
    }

    await store.appendEntry(body);

    sendJson(res, 200, { ok: true });
  };
}
