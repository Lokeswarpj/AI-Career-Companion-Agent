import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const frontendDist = path.join(frontendDir, 'dist');
const rootDist = path.join(rootDir, 'dist');

console.log('[Build] 🚀 Starting production frontend build...');

// Execute vite build in frontend
execSync('npm run build --prefix frontend', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Ensure root dist exists and is synchronized
if (fs.existsSync(frontendDist)) {
  console.log(`[Build] 📦 Synchronizing ${frontendDist} -> ${rootDist}...`);
  fs.mkdirSync(rootDist, { recursive: true });
  fs.cpSync(frontendDist, rootDist, { recursive: true });
  console.log('[Build] ✅ Root dist synchronized successfully with index.html verified:', fs.existsSync(path.join(rootDist, 'index.html')));
} else {
  console.error('[Build] ❌ Warning: frontend/dist was not found!');
}
