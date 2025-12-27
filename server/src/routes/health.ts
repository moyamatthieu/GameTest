import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../http/responses.js';
import type { RequestContext } from './router.js';

export async function healthRoute(_req: IncomingMessage, res: ServerResponse, _ctx: RequestContext): Promise<void> {
  sendJson(res, 200, {
    ok: true,
    uptimeSec: Math.floor(process.uptime()),
    timestamp: Date.now(),
  });
}
