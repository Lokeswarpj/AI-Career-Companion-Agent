import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
import skillGapRoutes from './routes/skillGapRoutes.js';
import customizationRoutes from './routes/customizationRoutes.js';

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

// Serve static frontend assets if built
const distCandidates = [
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, 'dist')
];
const distPath = distCandidates.find(d => fs.existsSync(path.join(d, 'index.html')));

if (distPath) {
  app.use(express.static(distPath));
}

// Root endpoint & API status dashboard
app.get('/', (req, res) => {
  if (distPath && fs.existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  if (req.accepts('html')) {
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CareerPulse AI - Backend API Server</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body {
      margin: 0;
      padding: 3rem 1.5rem;
      background: #0b0f19;
      color: #f8fafc;
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 640px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    p {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1.75rem;
    }
    .btn {
      text-decoration: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.88rem;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #6366f1;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4f46e5;
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:hover {
      background: #334155;
    }
    .endpoints {
      background: #0f172a;
      border-radius: 10px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .endpoints h3 {
      margin: 0 0 0.75rem 0;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #818cf8;
    }
    .endpoint-item {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      font-size: 0.82rem;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: monospace;
    }
    .endpoint-item:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      <span>API Server Operational & Healthy</span>
    </div>
    <h1>🚀 CareerPulse AI Server</h1>
    <p>
      Backend REST API powering automated resume intelligence, RAG vector similarity matching (180 tech internships), 5-category skill gap roadmaps, and AI mock interview coaching.
    </p>

    <div class="btn-group">
      <a href="http://localhost:5173" class="btn btn-primary">🌐 Open Web Application (Port 5173)</a>
      <a href="/api/health" class="btn btn-secondary">🩺 Health Status JSON</a>
      <a href="/api/internships" class="btn btn-secondary">📋 Internship Catalog</a>
    </div>

    <div class="endpoints">
      <h3>Active Multi-Agent API Routes</h3>
      <div class="endpoint-item"><span>GET /api/health</span><span>Health & System Status</span></div>
      <div class="endpoint-item"><span>POST /api/auth/register</span><span>JWT Authentication</span></div>
      <div class="endpoint-item"><span>POST /api/resume/parse</span><span>Resume & SWOT Agent</span></div>
      <div class="endpoint-item"><span>POST /api/matching/evaluate</span><span>Hybrid Matching & RAG</span></div>
      <div class="endpoint-item"><span>POST /api/skill-gap/analyze</span><span>5-Category Gap Engine</span></div>
      <div class="endpoint-item"><span>POST /api/customization/tailor-resume</span><span>ATS Resume Customizer</span></div>
      <div class="endpoint-item"><span>POST /api/interview/evaluate-answer</span><span>3D Mock Interview Coach</span></div>
      <div class="endpoint-item"><span>POST /api/assistant/chat</span><span>Conversational Assistant</span></div>
    </div>
  </div>
</body>
</html>
    `);
  }

  res.json({
    service: 'CareerPulse AI Backend API Server',
    status: 'operational',
    version: '1.0.0',
    webAppUrl: 'http://localhost:5173',
    healthCheck: 'http://localhost:5000/api/health',
    activeAgents: [
      'Resume Intelligence & SWOT Agent',
      'RAG Vector & Hybrid Matching Agent (180 Postings / 720 Chunks)',
      '5-Category Skill Gap Analysis Agent',
      'Role-Specific ATS Application Customizer',
      'AI Mock Interview Coach & 3D Answer Evaluator',
      'Conversational Career Assistant Orchestrator'
    ]
  });
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

// API index route
app.get('/api', (req, res) => {
  res.json({
    service: 'CareerPulse AI Backend API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/health',
      '/api/auth',
      '/api/profile',
      '/api/resume',
      '/api/internships',
      '/api/matching',
      '/api/skill-gap',
      '/api/customization',
      '/api/interview',
      '/api/assistant'
    ]
  });
});

// Mount Routes (supporting both /api/* and direct subpaths for serverless proxies)
const routes = [
  { path: '/auth', handler: authRoutes },
  { path: '/profile', handler: profileRoutes },
  { path: '/resume', handler: resumeRoutes },
  { path: '/internships', handler: internshipRoutes },
  { path: '/matching', handler: matchingRoutes },
  { path: '/skill-gap', handler: skillGapRoutes },
  { path: '/customization', handler: customizationRoutes },
  { path: '/interview', handler: interviewRoutes },
  { path: '/assistant', handler: assistantRoutes },
];

for (const route of routes) {
  app.use(`/api${route.path}`, route.handler);
  app.use(route.path, route.handler);
}

// SPA Wildcard Fallback for Single-Page React App
if (distPath) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

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
