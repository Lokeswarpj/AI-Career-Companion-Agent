import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDatabase } from './config/database.js';
import { seedInternshipsIfNeeded } from './services/seedData.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';
import matchingRoutes from './routes/matchingRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database bootstrap middleware for serverless cold-starts
let isDbBootstrapped = false;
app.use(async (req, res, next) => {
  if (!isDbBootstrapped) {
    try {
      await getDatabase();
      await seedInternshipsIfNeeded();
      isDbBootstrapped = true;
    } catch (err) {
      console.error('[Server DB Init Error]', err);
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CareerPulse AI Backend API',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/assistant', assistantRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

// Bootstrap Database & Start Server in Standalone Mode
async function startServer() {
  try {
    await getDatabase();
    await seedInternshipsIfNeeded();
    isDbBootstrapped = true;

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 CareerPulse AI Server running on http://localhost:${PORT}`);
      console.log(`📊 SQLite database initialized & seed catalog verified.`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

const isStandalone = !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'test';
if (isStandalone) {
  startServer();
}

export default app;
