import app from '../backend/server.js';

export default async function handler(req, res) {
  // Preserve original request path across Vercel rewrite proxying
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/auth') || matchedPath.startsWith('/profile'))) {
    req.url = matchedPath;
  }
  return app(req, res);
}
