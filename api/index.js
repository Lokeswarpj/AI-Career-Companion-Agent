import app from '../backend/server.js';

export default async function handler(req, res) {
  // If Vercel rewrote req.url to /api/index.js, restore the original path from Vercel headers
  if (req.url === '/api/index.js' || req.url === '/api' || req.url === '/api/') {
    const forwardedUri = req.headers['x-forwarded-uri'];
    const nowMatches = req.headers['x-now-route-matches'];
    if (forwardedUri && forwardedUri !== '/api/index.js') {
      req.url = forwardedUri;
    } else if (nowMatches) {
      const match = decodeURIComponent(nowMatches).match(/1=([^&]+)/);
      if (match && match[1]) {
        req.url = match[1].startsWith('/') ? `/api${match[1]}` : `/api/${match[1]}`;
      }
    }
  }

  return app(req, res);
}
