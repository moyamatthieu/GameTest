import http from 'node:http';
import crypto from 'node:crypto';

import { loadConfig, type ServerConfig } from './config.js';
import { createStaticHandler } from './static/serveStatic.js';
import { createRouter } from './routes/router.js';
import { healthRoute } from './routes/health.js';
import { createRateLimiter } from './http/rateLimit.js';
import { HttpError, sendJson } from './http/responses.js';
import {
  createRestoreLatestSnapshotRoute,
  createWriteSnapshotRoute,
  createAppendJournalRoute,
} from './routes/persistence.js';
import { logger } from './utils/logger.js';

export function createServer(overrides?: Partial<ServerConfig>): http.Server {
  const config = loadConfig(overrides);
  const router = createRouter();

  const limiter = createRateLimiter(config.rateLimit.windowMs, config.rateLimit.maxRequests);

  router.register('GET', '/health', healthRoute);
  router.register(
    'POST',
    '/persistence/snapshot',
    createWriteSnapshotRoute({
      config,
      limiter,
      storeConfig: {
        dataDir: config.dataDir,
        maxSnapshotsPerCluster: config.maxSnapshotsPerCluster,
      },
    })
  );

  router.register(
    'GET',
    '/persistence/snapshot/latest',
    createRestoreLatestSnapshotRoute({
      config,
      limiter,
      storeConfig: {
        dataDir: config.dataDir,
        maxSnapshotsPerCluster: config.maxSnapshotsPerCluster,
      },
    })
  );

  router.register(
    'POST',
    '/persistence/journal',
    createAppendJournalRoute({
      config,
      limiter,
      storeConfig: {
        dataDir: config.dataDir,
        maxSnapshotsPerCluster: config.maxSnapshotsPerCluster,
      },
    })
  );

  const serveStatic = createStaticHandler({
    staticDir: config.staticDir,
    spaFallback: true,
  });

  const server = http.createServer(async (req, res) => {
    const requestId = crypto.randomUUID();
    const clientIp = (req.socket.remoteAddress ?? 'unknown').replace('::ffff:', '');
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
        requestId,
        clientIp,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
      });
    });

    try {
      const handled = await router.handle(req, res, { requestId, clientIp });
      if (handled) return;

      const staticHandled = await serveStatic(req, res);
      if (staticHandled) return;

      sendJson(res, 404, { ok: false, error: 'not_found' });
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.statusCode, { ok: false, error: err.message });
        return;
      }

      logger.error('Unhandled request error', {
        requestId,
        clientIp,
        method: req.method,
        url: req.url,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      sendJson(res, 500, { ok: false, error: 'internal_error' });
    }
  });

  return server;
}

export async function startServer(overrides?: Partial<ServerConfig>): Promise<http.Server> {
  const config = loadConfig(overrides);
  const server = createServer(config);

  await new Promise<void>((resolve, reject) => {
    server.listen(config.port, config.host, () => {
      logger.info(`Server listening on ${config.host}:${config.port}`, {
        host: config.host,
        port: config.port,
        staticDir: config.staticDir,
        dataDir: config.dataDir,
      });
      resolve();
    });
    server.on('error', reject);
  });

  return server;
}

// If executed directly: start listening
const isDirectRun = (() => {
  try {
    const entry = process.argv[1];
    if (!entry) return false;
    const normalizedEntry = entry.replace(/\\/g, '/');
    return normalizedEntry.endsWith('/server/dist/index.js');
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  // eslint-disable-next-line no-console
  startServer().then((server) => {
    const addr = server.address();
    const url = typeof addr === 'string' ? addr : `http://${addr?.address}:${addr?.port}`;
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] Server listening at ${url}`);
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
