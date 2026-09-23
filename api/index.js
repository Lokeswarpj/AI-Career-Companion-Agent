import app from '../backend/server.js';

export default async function handler(req, res) {
  try {
    // 1. Extract path parameter forwarded by Vercel rewrite (?__path=$1)
    const urlObj = new URL(req.url, 'http://localhost');
    const pathParam = urlObj.searchParams.get('__path') || req.query?.__path;

    if (pathParam) {
      const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      req.url = `/api${cleanPath}`;
    } else if (req.headers['x-forwarded-uri']) {
      req.url = req.headers['x-forwarded-uri'];
    } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'] !== '/api/index.js') {
      req.url = req.headers['x-matched-path'];
    }

    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Handler Error]', err);
    res.status(500).json({ error: 'Internal Serverless Execution Error: ' + err.message });
  }
}
