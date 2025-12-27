import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendMethodNotAllowed, sendNotFound } from '../http/responses.js';

export type RequestContext = {
  requestId: string;
  clientIp: string;
};

export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RequestContext
) => void | Promise<void>;

export type Router = {
  register: (method: string, pathname: string, handler: Handler) => void;
  handle: (req: IncomingMessage, res: ServerResponse, ctx: RequestContext) => Promise<boolean>;
};

export function createRouter(): Router {
  const routes = new Map<string, Handler>();

  function register(method: string, pathname: string, handler: Handler): void {
    routes.set(`${method.toUpperCase()} ${pathname}`, handler);
  }

  async function handle(req: IncomingMessage, res: ServerResponse, ctx: RequestContext): Promise<boolean> {
    const method = (req.method ?? 'GET').toUpperCase();
    const url = new URL(req.url ?? '/', 'http://local');
    const pathname = url.pathname;

    const exact = routes.get(`${method} ${pathname}`);
    if (exact) {
      await exact(req, res, ctx);
      return true;
    }

    const anyMethod = routes.get(`* ${pathname}`);
    if (anyMethod) {
      await anyMethod(req, res, ctx);
      return true;
    }

    const hasPath = Array.from(routes.keys()).some((key) => key.endsWith(` ${pathname}`));
    if (hasPath) {
      sendMethodNotAllowed(res);
      return true;
    }

    // Not handled
    return false;
  }

  return { register, handle };
}

export function defaultNotFound(res: ServerResponse): void {
  sendNotFound(res);
}
