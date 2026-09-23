import { onRequest } from 'firebase-functions/v2/https';
import app from '../backend/server.js';

/**
 * CareerPulse AI - Firebase 2nd Gen Cloud Function
 * Wraps the Express REST API and serves all /api/* routes.
 */
export const api = onRequest(
  {
    cors: true,
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  app
);
