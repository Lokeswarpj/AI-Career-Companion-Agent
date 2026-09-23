import app from '../backend/server.js';

export default async function handler(req, res) {
  const originalUrl = req.url || '';

  // 1. Explicit query parameter from vercel.json rewrite: ?__path=...
  if (req.query && req.query.__path) {
    const rawPath = req.query.__path.replace(/^\//, '');
    const queryParams = { ...req.query };
    delete queryParams.__path;
    const qs = new URLSearchParams(queryParams).toString();
    req.url = `/api/${rawPath}${qs ? `?${qs}` : ''}`;
  }
  // 2. Vercel dynamic catch-all route: /api/[...path].js
  else if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    const queryParams = { ...req.query };
    delete queryParams.path;
    const qs = new URLSearchParams(queryParams).toString();
    req.url = `/api/${rawPath.replace(/^\//, '')}${qs ? `?${qs}` : ''}`;
  }
  // 3. Vercel regex rewrite capture groups (?1=... or ?0=...)
  else if (originalUrl.startsWith('/api/index.js') && req.query && (req.query['1'] || req.query['0'])) {
    const match = (req.query['1'] || req.query['0']).replace(/^\//, '');
    const queryParams = { ...req.query };
    delete queryParams['1'];
    delete queryParams['0'];
    const qs = new URLSearchParams(queryParams).toString();
    req.url = `/api/${match}${qs ? `?${qs}` : ''}`;
  }
  // 4. Vercel Forwarded Headers
  else if (req.headers['x-forwarded-uri'] && req.headers['x-forwarded-uri'].startsWith('/api') && !req.headers['x-forwarded-uri'].startsWith('/api/index.js')) {
    req.url = req.headers['x-forwarded-uri'];
  } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api') && !req.headers['x-matched-path'].startsWith('/api/index.js')) {
    req.url = req.headers['x-matched-path'];
  }

  // Ensure leading /api for Express router mounting
  if (!req.url.startsWith('/api') && !req.url.startsWith('/')) {
    req.url = `/api/${req.url}`;
  }

  return app(req, res);
}


