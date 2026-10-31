import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

// Helper simulating the middleware logic from vite.config.ts
function createFederationDevMiddleware() {
  return (req: any, res: any, next: any) => {
    const rawUrl = req.url ? req.url.split('?')[0] : '';
    if (rawUrl.startsWith('/assets/')) {
      const filePath = path.resolve(__dirname, '../../dist', rawUrl.slice(1));
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }
        return fs.createReadStream(filePath).pipe(res);
      }
    }
    next();
  };
}

describe('Vite Dev Server Federation Middleware', () => {
  it('handles CORS OPTIONS preflight request with 204 status', () => {
    const middleware = createFederationDevMiddleware();
    const req = { url: '/assets/remoteEntry.js', method: 'OPTIONS' };
    const headers: Record<string, string> = {};
    const res = {
      statusCode: 200,
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      end: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.statusCode).toBe(204);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('sets javascript content-type and CORS headers for remoteEntry.js with query param', () => {
    const middleware = createFederationDevMiddleware();
    const req = { url: '/assets/remoteEntry.js?t=1730361234_1', method: 'GET' };
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      on: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(headers['Content-Type']).toBe('application/javascript');
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(next).not.toHaveBeenCalled();
  });

  it('delegates to next() for non-asset requests', () => {
    const middleware = createFederationDevMiddleware();
    const req = { url: '/index.html', method: 'GET' };
    const res = { setHeader: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

