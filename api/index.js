process.env.VERCEL = process.env.VERCEL || '1';

import app from '../backend/server.js';
import { getDatabase } from '../backend/config/database.js';
import { seedInternshipsIfNeeded } from '../backend/services/seedData.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    try {
      await getDatabase();
      await seedInternshipsIfNeeded();
      initialized = true;
    } catch (err) {
      console.error('[Serverless Handler DB Init Error]', err);
    }
  }
  return app(req, res);
}
