import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sendText } from '../http/responses.js';

export type StaticOptions = {
  staticDir: string;
  spaFallback: boolean;
};

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sendFile(res: ServerResponse, filePath: string): Promise<void> {
  const data = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader('content-type', contentTypeFromPath(filePath));
  res.setHeader('content-length', data.length);
  res.end(data);
}

export function createStaticHandler(options: StaticOptions) {
  const root = path.resolve(options.staticDir);

  return async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const method = (req.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return false;

    if (!(await exists(root))) {
      sendText(
        res,
        503,
        `Static directory not found: ${root}\n\nRun \"npm run build\" at repository root to generate dist/.\n`
      );
      return true;
    }

    const url = new URL(req.url ?? '/', 'http://local');
    const decodedPath = decodeURIComponent(url.pathname);

    const relative = decodedPath === '/' ? '/index.html' : decodedPath;
    const normalized = path.posix.normalize(relative);

    // Convert URL-like path to OS path safely
    const candidate = path.join(root, normalized.split('/').join(path.sep));
    const resolved = path.resolve(candidate);

    // Prevent directory traversal
    if (!resolved.startsWith(root)) {
      sendText(res, 400, 'invalid_path');
      return true;
    }

    let filePath = resolved;

    if (!(await exists(filePath))) {
      if (options.spaFallback) {
        filePath = path.join(root, 'index.html');
      } else {
        return false;
      }
    }

    if (!(await exists(filePath))) {
      sendText(res, 404, 'not_found');
      return true;
    }

    if (method === 'HEAD') {
      const stat = await fs.stat(filePath);
      res.statusCode = 200;
      res.setHeader('content-type', contentTypeFromPath(filePath));
      res.setHeader('content-length', stat.size);
      res.end();
      return true;
    }

    await sendFile(res, filePath);
    return true;
  };
}
